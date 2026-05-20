/**
 * Scans Region-wise NSP-NHP PDF folders and writes catalogue.json for the atlas.
 * Preserves entries from index.html policyData when filenames match (country names, dual files).
 * New PDFs are classified from filename keywords (NSP vs NHP) and grouped by country.
 *
 * Usage:
 *   npm run catalogue
 *   node scripts/build-catalogue.mjs
 *
 * Optional: catalogue-overrides.json — { "byFilename": { "file.pdf": { "country": "…", "kind": "nsp"|"nhp" } } }
 * Optional: catalogue-web-resources.json — entries for countries represented by curated web resource lists instead of PDFs.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const REPO_ROOT = 'Region-wise NSP-NHP documents [Living Repository';
const FOLDERS = {
  AFRO: { whoRegion: 'AFRO', region: 'Africa', sub: 'AFRO' },
  'AMRO Policy Documents': { whoRegion: 'AMRO', region: 'Americas', sub: 'AMRO Policy Documents' },
  'EMR NSP-NHP Documents': { whoRegion: 'EMR', region: 'Eastern Mediterranean', sub: 'EMR NSP-NHP Documents' },
  EURO: { whoRegion: 'EURO', region: 'Europe', sub: 'EURO' },
  SEARO: { whoRegion: 'SEARO', region: 'South-East Asia', sub: 'SEARO' },
  'WPR NSP-NHP Documents': { whoRegion: 'WPR', region: 'Western Pacific', sub: 'WPR NSP-NHP Documents' },
};

const ISO3_TO_COUNTRY = {
  AFG: 'Afghanistan', AGO: 'Angola', ALB: 'Albania', DZA: 'Algeria', AND: 'Andorra',
  ARM: 'Armenia', AUS: 'Australia', AUT: 'Austria', AZE: 'Azerbaijan', BHR: 'Bahrain',
  BGD: 'Bangladesh', BLR: 'Belarus', BEL: 'Belgium', BEN: 'Benin', BFA: 'Burkina Faso',
  BOS: 'Botswana', BIH: 'Bosnia and Herzegovina', BGR: 'Bulgaria', BDI: 'Burundi',
  CPV: 'Cape Verde', CAV: 'Cape Verde', KHM: 'Cambodia', CMR: 'Cameroon', CAN: 'Canada',
  CAF: 'Central African Republic', TCD: 'Chad', CHN: 'China', COL: 'Colombia', COM: 'Comoros',
  COG: 'Congo', COD: 'Congo (DRC)', CIV: "Côte d'Ivoire", HRV: 'Croatia', CUB: 'Cuba',
  CYP: 'Cyprus', CZE: 'Czech Republic', DNK: 'Denmark', DJI: 'Djibouti', DOM: 'Dominican Republic',
  ECU: 'Ecuador', EGY: 'Egypt', SLV: 'El Salvador', ERI: 'Eritrea', EST: 'Estonia',
  ETH: 'Ethiopia', FJI: 'Fiji', FIN: 'Finland', FRA: 'France', GAB: 'Gabon', GMB: 'Gambia',
  GEO: 'Georgia', DEU: 'Germany', GHA: 'Ghana', GRC: 'Greece', GIN: 'Guinea',
  GNB: 'Guinea-Bissau', GUY: 'Guyana', HTI: 'Haiti', HND: 'Honduras', HUN: 'Hungary',
  ISL: 'Iceland', IND: 'India', IDN: 'Indonesia', IRN: 'Iran', IRQ: 'Iraq', IRL: 'Ireland',
  ISR: 'Israel', ITA: 'Italy', JAM: 'Jamaica', JPN: 'Japan', JOR: 'Jordan', KAZ: 'Kazakhstan',
  KEN: 'Kenya', KWT: 'Kuwait', KGZ: 'Kyrgyzstan', LAO: 'Laos', LVA: 'Latvia', LBN: 'Lebanon',
  LSO: 'Lesotho', LBR: 'Liberia', LBY: 'Libya', LTU: 'Lithuania', LUX: 'Luxembourg',
  MDG: 'Madagascar', MWI: 'Malawi', MYS: 'Malaysia', MLI: 'Mali', MRT: 'Mauritania',
  MUS: 'Mauritius', MEX: 'Mexico', MDA: 'Moldova', MNG: 'Mongolia', MNE: 'Montenegro',
  MAR: 'Morocco', MOZ: 'Mozambique', MMR: 'Myanmar', NAM: 'Namibia', NPL: 'Nepal',
  NLD: 'Netherlands', NZL: 'New Zealand', NIC: 'Nicaragua', NER: 'Niger', NGA: 'Nigeria',
  PRK: 'DPR Korea', MKD: 'North Macedonia', NOR: 'Norway', OMN: 'Oman', PAK: 'Pakistan',
  PAN: 'Panama', PNG: 'Papua New Guinea', PRY: 'Paraguay', PER: 'Peru', PHL: 'Philippines',
  POL: 'Poland', PRT: 'Portugal', QAT: 'Qatar', ROU: 'Romania', RUS: 'Russia', RWA: 'Rwanda',
  STP: 'São Tomé and Príncipe', SAU: 'Saudi Arabia', SEN: 'Senegal', SRB: 'Serbia',
  SLE: 'Sierra Leone', SGP: 'Singapore', SVK: 'Slovakia', SVN: 'Slovenia', SOM: 'Somalia',
  ZAF: 'South Africa', KOR: 'Republic of Korea', SSD: 'South Sudan', ESP: 'Spain',
  LKA: 'Sri Lanka', SDN: 'Sudan', SUR: 'Suriname', SWE: 'Sweden', CHE: 'Switzerland',
  SYR: 'Syria', TJK: 'Tajikistan', TZA: 'Tanzania', THA: 'Thailand', TLS: 'Timor-Leste',
  TGO: 'Togo', TUN: 'Tunisia', TUR: 'Turkey', TKM: 'Turkmenistan', UGA: 'Uganda',
  UKR: 'Ukraine', ARE: 'UAE', GBR: 'United Kingdom', USA: 'United States', URY: 'Uruguay',
  UZB: 'Uzbekistan', VEN: 'Venezuela', VNM: 'Vietnam', YEM: 'Yemen', ZMB: 'Zambia',
  ZWE: 'Zimbabwe', ZAF: 'South Africa', MSU: 'Mauritius', MAL: 'Malawi', GMB: 'Gambia',
  GNB: 'Guinea-Bissau', STP: 'São Tomé and Príncipe', SYC: 'Seychelles', LSO: 'Lesotho',
  SWZ: 'Eswatini', RWA: 'Rwanda', NAM: 'Namibia', GHA: 'Ghana', SEN: 'Senegal',
  GIN: 'Guinea', GAB: 'Gabon', CMR: 'Cameroon', TCD: 'Chad', NER: 'Niger', MLI: 'Mali',
  BFA: 'Burkina Faso', BEN: 'Benin', TGO: 'Togo', CIV: "Côte d'Ivoire", LBR: 'Liberia',
  SLE: 'Sierra Leone', GMB: 'Gambia', GNB: 'Guinea-Bissau', CPV: 'Cape Verde',
  COM: 'Comoros', MDG: 'Madagascar', MUS: 'Mauritius', SYC: 'Seychelles', DJI: 'Djibouti',
  ERI: 'Eritrea', SDN: 'Sudan', SSD: 'South Sudan', ETH: 'Ethiopia', KEN: 'Kenya',
  UGA: 'Uganda', RWA: 'Rwanda', BDI: 'Burundi', TZA: 'Tanzania', MOZ: 'Mozambique',
  ZMB: 'Zambia', ZWE: 'Zimbabwe', BWA: 'Botswana', NAM: 'Namibia', ZAF: 'South Africa',
  LSO: 'Lesotho', SWZ: 'Eswatini', AGO: 'Angola', COG: 'Congo', COD: 'Congo (DRC)',
  GAB: 'Gabon', GNQ: 'Equatorial Guinea', STP: 'São Tomé and Príncipe',
};

const NSP_HINTS = [
  /\bnsoap\b/i, /\bnsoanp\b/i, /\bnsoap\b/i, /\bsalts\b/i, /\bsurgical\b/i, /\bsurgery\b/i,
  /\boperative\b/i, /\bobstetric(s)?\b/i, /\banaesth/i, /\banesthes/i, /\bkirurgi\b/i,
  /\bsafe surgery\b/i, /\bsurgical (hubs|action|guidelines)\b/i, /\bnsap\b/i,
  /\bnational surgical\b/i, /\bsurgical care\b/i, /\bsurgical plan\b/i, /\bns\s*o\s*a\s*p/i,
  /\bnsap\b/i, /\bone day surgery\b/i, /\bday surgery\b/i,
];

const NHP_HINTS = [
  /\bnhp\b/i, /\bnhsp\b/i, /\bhssp\b/i, /\bpnds\b/i, /\bpnss\b/i, /\bpndss\b/i,
  /\bhealth policy\b/i, /\bnational health\b/i, /\bhealth sector\b/i, /\bhealth plan\b/i,
  /\bhealth strategy\b/i, /\bstrategic plan\b/i, /\bsector transformation\b/i,
  /\blong term plan\b/i, /\blong-term plan\b/i, /\bpolitique nationale\b/i,
  /\bplan national\b/i, /\bpolitique de sant/i, /\bdevelopment sanitaire\b/i,
  /\bhealth reform\b/i, /\bnhs\b/i, /\bminister(y)? of health\b/i, /\bhsspi/i,
];

const SKIP_FILE = [
  /\.docx$/i,
  /\(1\)/i,
  /\(2\)/i,
  /\bcopy\b/i,
  /duplicate/i,
  /^~\$/,
];

function extractPolicyDataFromHtml(html) {
  const marker = 'const policyData = ';
  const idx = html.indexOf(marker);
  if (idx === -1) return null;
  let i = idx + marker.length;
  while (i < html.length && (html[i] === ' ' || html[i] === '\n' || html[i] === '\r')) i++;
  if (html[i] !== '[') return null;
  let depth = 0;
  const start = i;
  for (; i < html.length; i++) {
    const c = html[i];
    if (c === '[') depth++;
    else if (c === ']') {
      depth--;
      if (depth === 0) {
        i++;
        break;
      }
    }
  }
  return new Function(`"use strict"; return ${html.slice(start, i)}`)();
}

function loadOverrides() {
  const p = path.join(ROOT, 'catalogue-overrides.json');
  if (!fs.existsSync(p)) return { byFilename: {} };
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return { byFilename: {} };
  }
}

function loadWebResourceEntries() {
  const p = path.join(ROOT, 'catalogue-web-resources.json');
  if (!fs.existsSync(p)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    return Array.isArray(data.entries) ? data.entries : [];
  } catch (err) {
    throw new Error(`Could not parse catalogue-web-resources.json: ${err.message}`);
  }
}

function normalizeWebResourceEntry(entry) {
  if (!entry || !entry.country) {
    throw new Error('Each web resource entry needs at least a country.');
  }
  if (!Array.isArray(entry.webResources) || !entry.webResources.length) {
    throw new Error(`Web resource entry for ${entry.country} needs a non-empty webResources array.`);
  }
  return {
    country: entry.country,
    region: entry.region || '',
    whoRegion: entry.whoRegion || '',
    status: entry.status || 'nhp',
    docType: entry.docType || 'NHP (Web-based, no single PDF)',
    accessType: 'webResources',
    webResources: entry.webResources.map((resource) => {
      if (!resource?.label || !resource?.url) {
        throw new Error(`Each web resource for ${entry.country} needs a label and url.`);
      }
      return {
        label: resource.label,
        url: resource.url,
      };
    }),
    year: entry.year || '',
    sourceNote: entry.sourceNote || '',
  };
}

function extractYears(name) {
  const years = [];
  const re = /(?:19|20)\d{2}/g;
  let m;
  while ((m = re.exec(name))) years.push(parseInt(m[0], 10));
  return years;
}

function primaryYear(name) {
  const ys = extractYears(name);
  if (!ys.length) return '';
  return String(Math.max(...ys));
}

function classifyKind(filename) {
  const n = filename.toLowerCase();
  let nsp = 0;
  let nhp = 0;
  for (const re of NSP_HINTS) if (re.test(n)) nsp++;
  for (const re of NHP_HINTS) if (re.test(n)) nhp++;
  if (nsp > nhp && nsp > 0) return 'nsp';
  if (nhp > nsp && nhp > 0) return 'nhp';
  if (nsp > 0) return 'nsp';
  return 'nhp';
}

function titleCase(s) {
  return s
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function inferCountryFromFilename(filename) {
  const base = path.basename(filename, path.extname(filename));
  const docTypeMatch = base.match(/^(.+?)\s+(?:NSP|NHP|NSOAP|NSOANP)\b/i);
  if (docTypeMatch) {
    const raw = docTypeMatch[1].trim().replace(/\s+/g, ' ');
    const lower = raw.toLowerCase();
    if (lower === 'united states of america') return 'United States';
    if (lower === 'usa') return 'United States';
    return titleCase(raw);
  }
  const mIso = base.match(/^([A-Z]{3})[_\s-]/);
  if (mIso && ISO3_TO_COUNTRY[mIso[1]]) return ISO3_TO_COUNTRY[mIso[1]];

  const lower = base.toLowerCase();
  const byName = [
    ['democratic-republic-of-congo', 'Congo (DRC)'],
    ['democratic republic of congo', 'Congo (DRC)'],
    ['cote-d-ivoire', "Côte d'Ivoire"],
    ['cote d ivoire', "Côte d'Ivoire"],
    ['guinea-bissau', 'Guinea-Bissau'],
    ['south africa', 'South Africa'],
    ['south sudan', 'South Sudan'],
    ['south korea', 'Republic of Korea'],
    ['north korea', 'DPR Korea'],
    ['dpr korea', 'DPR Korea'],
    ['republic of korea', 'Republic of Korea'],
    ['sao tome', 'São Tomé and Príncipe'],
    ['sierra leone', 'Sierra Leone'],
    ['burkina faso', 'Burkina Faso'],
    ['cape verde', 'Cape Verde'],
    ['central african', 'Central African Republic'],
    ['papua new guinea', 'Papua New Guinea'],
    ['solomon islands', 'Solomon Islands'],
    ['timor-leste', 'Timor-Leste'],
    ['timor leste', 'Timor-Leste'],
    ['bosnia', 'Bosnia and Herzegovina'],
    ['north macedonia', 'North Macedonia'],
    ['united kingdom', 'United Kingdom'],
    ['northern ireland', 'Northern Ireland'],
    ['united arab emirates', 'UAE'],
    ['uae', 'UAE'],
    ['morocco', 'Morocco'],
    ['eswatini', 'Eswatini'],
    ['czech', 'Czech Republic'],
    ['new zealand', 'New Zealand'],
    ['sri lanka', 'Sri Lanka'],
    ['saudi arabia', 'Saudi Arabia'],
  ];
  for (const [needle, country] of byName) {
    if (lower.includes(needle)) return country;
  }

  for (const [iso, country] of Object.entries(ISO3_TO_COUNTRY)) {
    if (lower.includes(country.toLowerCase().replace(/[()]/g, ''))) return country;
  }

  const tokens = base.split(/[_\s-]+/).filter((t) => t.length > 2);
  if (tokens.length) {
    const first = tokens.find((t) => /^[A-Za-z]{4,}$/.test(t) && !/^(plan|national|health|final|version)$/i.test(t));
    if (first) return titleCase(first);
  }
  return titleCase(tokens[0] || 'Unknown');
}

function shouldSkipFile(name) {
  return SKIP_FILE.some((re) => re.test(name));
}

function fileScore(name) {
  let score = extractYears(name).reduce((a, y) => Math.max(a, y), 0) * 10;
  if (/\(1\)/.test(name)) score -= 50;
  if (/vol\.?\s*2/i.test(name)) score -= 5;
  return score;
}

function scanPdfFiles() {
  const root = path.join(ROOT, REPO_ROOT);
  const out = [];
  if (!fs.existsSync(root)) return out;
  for (const [folderName, meta] of Object.entries(FOLDERS)) {
    const dir = path.join(root, folderName);
    if (!fs.existsSync(dir)) continue;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!ent.isFile()) continue;
      const name = ent.name;
      if (!/\.pdf$/i.test(name)) continue;
      if (shouldSkipFile(name)) continue;
      out.push({
        file: name,
        docSubfolder: meta.sub,
        whoRegion: meta.whoRegion,
        region: meta.region,
        folderName,
      });
    }
  }
  return out;
}

function legacyFileMap(legacyRows) {
  const map = new Map();
  if (!legacyRows) return map;
  for (const row of legacyRows) {
    if (row.file) {
      map.set(row.file, {
        country: row.country,
        kind: row.status === 'nsp' ? 'nsp' : 'nhp',
        whoRegion: row.whoRegion,
        region: row.region,
        docSubfolder: row.docSubfolder,
        year: row.year,
      });
    }
    if (row.fileNsp) {
      map.set(row.fileNsp, {
        country: row.country,
        kind: 'nsp',
        whoRegion: row.whoRegion,
        region: row.region,
        docSubfolder: row.docSubfolder,
        year: row.yearNsp || row.year,
      });
    }
    if (row.fileNhp) {
      map.set(row.fileNhp, {
        country: row.country,
        kind: 'nhp',
        whoRegion: row.whoRegion,
        region: row.region,
        docSubfolder: row.docSubfolder,
        year: row.yearNhp || row.year,
      });
    }
  }
  return map;
}

function buildCatalogue() {
  const overrides = loadOverrides();
  const webResourceEntries = loadWebResourceEntries();
  const htmlPath = path.join(ROOT, 'index.html');
  const legacy =
    fs.existsSync(htmlPath) ? extractPolicyDataFromHtml(fs.readFileSync(htmlPath, 'utf8')) : null;
  const legacyMap = legacyFileMap(legacy);
  const scanned = scanPdfFiles();
  const byCountry = new Map();

  for (const item of scanned) {
    const ovFile = overrides.byFilename?.[item.file];
    const leg = legacyMap.get(item.file);
    let country = ovFile?.country || leg?.country;
    let kind = ovFile?.kind || leg?.kind;
    const whoRegion = leg?.whoRegion || item.whoRegion;
    const region = leg?.region || item.region;
    const docSubfolder = leg?.docSubfolder || item.docSubfolder;

    if (!country) country = inferCountryFromFilename(item.file);
    if (!kind) kind = classifyKind(item.file);

    const key = country.toLowerCase();
    if (!byCountry.has(key)) {
      byCountry.set(key, {
        country,
        whoRegion,
        region,
        docSubfolder,
        nsp: [],
        nhp: [],
      });
    }
    const bucket = byCountry.get(key);
    bucket.country = country;
    bucket.whoRegion = whoRegion;
    bucket.region = region;
    if (docSubfolder) bucket.docSubfolder = docSubfolder;
    bucket[kind].push(item.file);
  }

  const catalogue = [];
  for (const bucket of byCountry.values()) {
    const pick = (arr) => {
      if (!arr.length) return null;
      return [...arr].sort((a, b) => fileScore(b) - fileScore(a))[0];
    };
    const fileNsp = pick(bucket.nsp);
    const fileNhp = pick(bucket.nhp);
    let status;
    let docType;
    if (fileNsp && fileNhp) {
      status = 'both';
      docType = 'NSP + NHP';
    } else if (fileNsp) {
      status = 'nsp';
      docType = 'NSP';
    } else {
      status = 'nhp';
      docType = 'NHP';
    }

    const entry = {
      country: bucket.country,
      region: bucket.region,
      whoRegion: bucket.whoRegion,
      status,
      docType,
    };
    if (bucket.docSubfolder) entry.docSubfolder = bucket.docSubfolder;

    if (status === 'both') {
      entry.yearNhp = primaryYear(fileNhp) || primaryYear(fileNsp) || '';
      entry.yearNsp = primaryYear(fileNsp) || '';
      entry.year = entry.yearNhp || entry.yearNsp || '';
      entry.fileNhp = fileNhp;
      entry.fileNsp = fileNsp;
    } else {
      const f = fileNsp || fileNhp;
      entry.file = f;
      entry.year = primaryYear(f) || '';
    }

    const legRow = legacy?.find((r) => r.country === bucket.country);
    if (legRow) {
      if (legRow.year && status !== 'both') entry.year = String(legRow.year);
      if (status === 'both') {
        if (legRow.yearNhp) entry.yearNhp = String(legRow.yearNhp);
        if (legRow.yearNsp) entry.yearNsp = String(legRow.yearNsp);
        entry.year = String(legRow.year || entry.yearNhp || entry.yearNsp);
      }
    }

    catalogue.push(entry);
  }

  for (const entry of webResourceEntries) {
    const normalized = normalizeWebResourceEntry(entry);
    const idx = catalogue.findIndex((row) => row.country.toLowerCase() === normalized.country.toLowerCase());
    if (idx >= 0) catalogue[idx] = normalized;
    else catalogue.push(normalized);
  }

  catalogue.sort((a, b) => a.country.localeCompare(b.country, 'en', { sensitivity: 'base' }));
  return catalogue;
}

function main() {
  const catalogue = buildCatalogue();
  const outPath = path.join(ROOT, 'catalogue.json');
  fs.writeFileSync(outPath, JSON.stringify(catalogue, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${outPath} — ${catalogue.length} countries from PDF scan.`);
  const both = catalogue.filter((c) => c.status === 'both').length;
  const nsp = catalogue.filter((c) => c.status === 'nsp').length;
  const nhp = catalogue.filter((c) => c.status === 'nhp').length;
  console.log(`  NSP only: ${nsp}, NHP only: ${nhp}, both: ${both}`);
}

main();
