/**
 * Builds who-regions.json from the Our World in Data WHO regions dataset.
 *
 * Usage:
 *   npm run who-regions
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OWID_WHO_REGIONS_CSV =
  'https://ourworldindata.org/grapher/who-regions.csv?v=1&csvType=full&useColumnShortNames=false';

const REGION_META = {
  AFRO: { label: 'Africa', owidLabel: 'Africa', color: '#0f766e' },
  AMRO: { label: 'Americas', owidLabel: 'Americas', color: '#2563eb' },
  EMR: { label: 'Eastern Mediterranean', owidLabel: 'Eastern Mediterranean', color: '#c2410c' },
  EURO: { label: 'Europe', owidLabel: 'Europe', color: '#7c3aed' },
  SEARO: { label: 'South-East Asia', owidLabel: 'South-East Asia', color: '#ca8a04' },
  WPR: { label: 'Western Pacific', owidLabel: 'Western Pacific', color: '#be123c' },
};

function parseCsvLine(line) {
  const cells = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells;
}

function normalizeName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/\bthe\b/gi, '')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase();
}

function regionCodeFromOwidLabel(value) {
  const label = String(value || '').replace(/\s*\(WHO\)\s*$/i, '').trim();
  const hit = Object.entries(REGION_META).find(([, meta]) => meta.owidLabel === label);
  return hit ? hit[0] : null;
}

function readCountryMeta() {
  const p = path.join(ROOT, 'country-meta.json');
  if (!fs.existsSync(p)) {
    throw new Error('country-meta.json missing. Run npm run country-meta first.');
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

async function fetchOwidRows() {
  const res = await fetch(OWID_WHO_REGIONS_CSV);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${OWID_WHO_REGIONS_CSV}`);
  const csv = await res.text();
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
  const headers = parseCsvLine(headerLine);
  return lines.map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] || '']));
  });
}

async function buildWhoRegions() {
  const countryMeta = readCountryMeta();
  const rows = await fetchOwidRows();
  const byIso3 = {};
  const byEntity = {};

  for (const row of rows) {
    const regionCode = regionCodeFromOwidLabel(row['World regions according to WHO']);
    if (!regionCode) continue;
    const item = {
      iso3: row.Code || null,
      entity: row.Entity,
      region: regionCode,
      regionLabel: REGION_META[regionCode].label,
      color: REGION_META[regionCode].color,
      sourceYear: row.Year || '2023',
    };
    if (item.iso3) byIso3[item.iso3] = item;
    byEntity[normalizeName(item.entity)] = item;
  }

  const byTopoName = {};
  for (const [topoName, meta] of Object.entries(countryMeta.byTopoName || {})) {
    const hit = (meta.iso3 && byIso3[meta.iso3]) || byEntity[normalizeName(meta.name)] || byEntity[normalizeName(topoName)];
    if (hit) {
      byTopoName[topoName] = {
        ...hit,
        topoName,
        countryName: meta.name || hit.entity,
      };
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    sources: {
      whoRegions:
        'World Health Organization countries/areas by WHO region, processed by Our World in Data',
      dataUrl: OWID_WHO_REGIONS_CSV,
    },
    legend: Object.entries(REGION_META).map(([id, meta]) => ({
      id,
      label: meta.label,
      color: meta.color,
    })),
    byIso3,
    byTopoName,
  };
}

buildWhoRegions()
  .then((out) => {
    const outPath = path.join(ROOT, 'who-regions.json');
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
    console.log(`Wrote ${outPath}`);
    console.log(`  Topo countries mapped: ${Object.keys(out.byTopoName).length}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
