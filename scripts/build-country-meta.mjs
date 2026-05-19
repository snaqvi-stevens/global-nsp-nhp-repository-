/**
 * Builds country-meta.json — World Bank income + GNI, UN LDC (least developed), development tier.
 * Maps TopoJSON country ids (ISO 3166-1 numeric) and catalogue country names.
 *
 * Usage: npm run country-meta
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

/** UN LDC list (2024) — ISO 3166-1 alpha-3 */
const UN_LDC_ISO3 = new Set([
  'AFG', 'AGO', 'BDI', 'BEN', 'BFA', 'BGD', 'CAF', 'TCD', 'COM', 'COD', 'DJI', 'ERI',
  'ETH', 'GMB', 'GIN', 'GNB', 'HTI', 'KIR', 'LAO', 'LSO', 'LBR', 'MDG', 'MWI', 'MLI',
  'MRT', 'MOZ', 'MMR', 'NPL', 'NER', 'RWA', 'STP', 'SEN', 'SLE', 'SOM', 'SSD', 'SDN',
  'TLS', 'TGO', 'TUV', 'UGA', 'TZA', 'YEM', 'ZMB', 'MRT', 'KHM', 'BTN', 'SLB', 'TMP',
]);

const INCOME_LABELS = {
  LIC: 'Low income',
  LMC: 'Lower middle income',
  UMC: 'Upper middle income',
  HIC: 'High income',
  INX: 'Not classified',
};

const INCOME_COLORS = {
  LIC: '#b45309',
  LMC: '#d97706',
  UMC: '#0d9488',
  HIC: '#1e40af',
  INX: '#94a3b8',
};

/** World Bank SH.XPD.GHED.CH.ZS — domestic general government share of current health spending */
const FUNDING_LABELS = {
  public: 'Public / government',
  mixed: 'Mixed',
  private: 'Private-dominated',
  unknown: 'No data',
};

const FUNDING_COLORS = {
  public: '#1d4ed8',
  mixed: '#6d28d9',
  private: '#c026d3',
  unknown: '#94a3b8',
};

const GOVT_SHARE_PUBLIC_MIN = 55;
const GOVT_SHARE_PRIVATE_MAX = 45;

function classifyFunding(govtSharePct) {
  if (govtSharePct == null || Number.isNaN(govtSharePct)) return 'unknown';
  if (govtSharePct >= GOVT_SHARE_PUBLIC_MIN) return 'public';
  if (govtSharePct <= GOVT_SHARE_PRIVATE_MAX) return 'private';
  return 'mixed';
}

function applyFundingFields(record, govtSharePct, year) {
  const funding = classifyFunding(govtSharePct);
  record.govtHealthSharePct = govtSharePct != null ? Math.round(govtSharePct * 10) / 10 : null;
  record.fundingYear = year || null;
  record.funding = funding;
  record.fundingLabel = FUNDING_LABELS[funding];
  record.fundingColor = FUNDING_COLORS[funding];
}

const CATALOGUE_TO_ISO3 = {
  'Congo (DRC)': 'COD',
  'Czech Republic': 'CZE',
  'Bosnia and Herzegovina': 'BIH',
  'North Macedonia': 'MKD',
  'Republic of Korea': 'KOR',
  'DPR Korea': 'PRK',
  'South Sudan': 'SSD',
  'Central African Republic': 'CAF',
  Eswatini: 'SWZ',
  'Solomon Islands': 'SLB',
  UAE: 'ARE',
  "Côte d'Ivoire": 'CIV',
  'São Tomé and Príncipe': 'STP',
  'United Kingdom': 'GBR',
  'United States': 'USA',
  Russia: 'RUS',
  Turkey: 'TUR',
  Vietnam: 'VNM',
  Laos: 'LAO',
  Iran: 'IRN',
  Syria: 'SYR',
  Venezuela: 'VEN',
  Tanzania: 'TZA',
  Moldova: 'MDA',
  'Cape Verde': 'CPV',
  Egypt: 'EGY',
  Gambia: 'GMB',
  Brunei: 'BRN',
  Slovakia: 'SVK',
  Yemen: 'YEM',
  Micronesia: 'FSM',
  Marshall: 'MHL',
  'Marshall Islands': 'MHL',
  'Northern Ireland': 'GBR',
};

const TOPO_TO_ISO3_EXTRA = {
  'United States of America': 'USA',
  'Dem. Rep. Congo': 'COD',
  'Congo': 'COG',
  'Dominican Rep.': 'DOM',
  'Central African Rep.': 'CAF',
  'S. Sudan': 'SSD',
  'Bosnia and Herz.': 'BIH',
  Macedonia: 'MKD',
  'North Korea': 'PRK',
  'South Korea': 'KOR',
  'Czechia': 'CZE',
  'eSwatini': 'SWZ',
  'Solomon Is.': 'SLB',
  'United Arab Emirates': 'ARE',
  "Côte d'Ivoire": 'CIV',
  'São Tomé and Príncipe': 'STP',
  'W. Sahara': null,
};

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

/** World Bank indicator endpoints paginate; collect all rows. */
async function fetchIndicatorAllRows(indicatorId, dateRange) {
  const rows = [];
  let page = 1;
  let pages = 1;
  do {
    const url =
      `https://api.worldbank.org/v2/country/all/indicator/${indicatorId}` +
      `?format=json&per_page=2000&page=${page}&date=${dateRange}`;
    const [meta, batch] = await fetchJson(url);
    pages = meta?.pages || 1;
    if (batch?.length) rows.push(...batch);
    page += 1;
  } while (page <= pages);
  return rows;
}

function developmentTier(iso3, incomeId) {
  if (!iso3) return 'unknown';
  if (UN_LDC_ISO3.has(iso3)) return 'undeveloped';
  if (incomeId === 'HIC') return 'developed';
  if (incomeId === 'INX' || !incomeId) return 'unknown';
  return 'developing';
}

function developmentLabel(tier) {
  if (tier === 'developed') return 'Developed';
  if (tier === 'undeveloped') return 'Least developed';
  if (tier === 'developing') return 'Developing';
  return 'Unknown';
}

async function main() {
  const [wbCountriesRaw, gniRaw, govtHealthRows, isoSlim, topoLocal] = await Promise.all([
    fetchJson('https://api.worldbank.org/v2/country?format=json&per_page=400'),
    fetchJson(
      'https://api.worldbank.org/v2/country/all/indicator/NY.GNP.PCAP.CD?format=json&per_page=400&date=2020:2024&MRV=1',
    ),
    fetchIndicatorAllRows('SH.XPD.GHED.CH.ZS', '2010:2024'),
    fetchJson(
      'https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/slim-3/slim-3.json',
    ),
    fs.promises.readFile(path.join(ROOT, 'countries-110m.json'), 'utf8').then(JSON.parse),
  ]);

  const wbCountries = wbCountriesRaw[1] || [];
  const gniRows = gniRaw[1] || [];

  const numericToIso3 = {};
  for (const row of isoSlim) {
    const num = String(row['country-code']).padStart(3, '0');
    numericToIso3[num] = row['alpha-3'];
  }

  const byIso3 = {};

  for (const c of wbCountries) {
    const iso3 = c.iso2Code === 'ZH' ? null : c.id?.length === 3 ? c.id : null;
    if (!iso3 || iso3 === 'AFE' || iso3 === 'ARB' || iso3 === 'EAP' || iso3 === 'EMU' || iso3 === 'HIC' || iso3 === 'LIC' || iso3 === 'LMC' || iso3 === 'UMC' || iso3 === 'INX') continue;
    const incomeId = c.incomeLevel?.id || 'INX';
    byIso3[iso3] = {
      iso3,
      name: c.name,
      income: incomeId,
      incomeLabel: INCOME_LABELS[incomeId] || INCOME_LABELS.INX,
      incomeColor: INCOME_COLORS[incomeId] || INCOME_COLORS.INX,
      gniPerCapita: null,
      gniYear: null,
      development: null,
      developmentLabel: null,
      govtHealthSharePct: null,
      fundingYear: null,
      funding: 'unknown',
      fundingLabel: FUNDING_LABELS.unknown,
      fundingColor: FUNDING_COLORS.unknown,
    };
  }

  const latestGovtShare = {};
  for (const row of govtHealthRows) {
    const iso3 = row.countryiso3code;
    if (!iso3 || row.value == null) continue;
    const year = Number.parseInt(row.date, 10);
    if (Number.isNaN(year)) continue;
    const prev = latestGovtShare[iso3];
    if (!prev || year > prev.year) latestGovtShare[iso3] = { value: row.value, year: row.date };
  }
  for (const [iso3, hit] of Object.entries(latestGovtShare)) {
    if (byIso3[iso3]) applyFundingFields(byIso3[iso3], hit.value, hit.year);
  }

  for (const row of gniRows) {
    const iso3 = row.countryiso3code;
    if (!iso3 || !byIso3[iso3]) continue;
    const val = row.value;
    if (val != null) {
      byIso3[iso3].gniPerCapita = Math.round(val);
      byIso3[iso3].gniYear = row.date;
    }
  }

  for (const iso3 of Object.keys(byIso3)) {
    const m = byIso3[iso3];
    m.development = developmentTier(iso3, m.income);
    m.developmentLabel = developmentLabel(m.development);
  }

  const byTopoName = {};
  const geoms = topoLocal.objects?.countries?.geometries || [];
  for (const g of geoms) {
    const topoName = g.properties?.name;
    if (!topoName) continue;
    let iso3 = TOPO_TO_ISO3_EXTRA[topoName];
    if (!iso3 && g.id != null) {
      const num = String(g.id).padStart(3, '0');
      iso3 = numericToIso3[num] || null;
    }
    if (iso3 && byIso3[iso3]) {
      byTopoName[topoName] = { ...byIso3[iso3], topoName };
    } else {
      byTopoName[topoName] = {
        iso3: iso3 || null,
        topoName,
        name: topoName,
        income: 'INX',
        incomeLabel: INCOME_LABELS.INX,
        incomeColor: INCOME_COLORS.INX,
        gniPerCapita: null,
        gniYear: null,
        development: 'unknown',
        developmentLabel: developmentLabel('unknown'),
        govtHealthSharePct: null,
        fundingYear: null,
        funding: 'unknown',
        fundingLabel: FUNDING_LABELS.unknown,
        fundingColor: FUNDING_COLORS.unknown,
      };
    }
  }

  const byCatalogueCountry = {};
  let catalogue = [];
  try {
    catalogue = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalogue.json'), 'utf8'));
  } catch {
    /* optional */
  }
  for (const entry of catalogue) {
    const country = entry.country;
    let iso3 = CATALOGUE_TO_ISO3[country];
    if (!iso3) {
      const topo = Object.entries(TOPO_TO_ISO3_EXTRA).find(([t]) => t === country)?.[1];
      if (topo) iso3 = topo;
    }
    if (!iso3) {
      for (const [topo, meta] of Object.entries(byTopoName)) {
        if (meta.name === country || topo === country) {
          iso3 = meta.iso3;
          break;
        }
      }
    }
    if (!iso3 && byIso3) {
      const hit = Object.values(byIso3).find(
        (m) =>
          m.name === country ||
          m.name?.toLowerCase() === country.toLowerCase() ||
          country.toLowerCase().includes(m.name?.toLowerCase()) ||
          m.name?.toLowerCase().includes(country.toLowerCase()),
      );
      if (hit) iso3 = hit.iso3;
    }
    if (!iso3) {
      const topoKey = Object.keys(TOPO_TO_ISO3_EXTRA).find(
        (t) => t.toLowerCase() === country.toLowerCase(),
      );
      if (topoKey) iso3 = TOPO_TO_ISO3_EXTRA[topoKey];
    }
    if (iso3 && byIso3[iso3]) {
      byCatalogueCountry[country] = { ...byIso3[iso3], catalogueCountry: country };
    }
  }

  const out = {
    generatedAt: new Date().toISOString(),
    sources: {
      worldBankIncome: 'World Bank country API (incomeLevel)',
      gniIndicator: 'NY.GNP.PCAP.CD (Atlas method, current US$), most recent 2020–2024',
      ldc: 'UN Least Developed Countries list (2024)',
      developmentRules:
        'Developed = high income; Least developed = UN LDC; Developing = all other classified incomes',
      healthFinancing:
        'World Bank SH.XPD.GHED.CH.ZS (domestic general government health expenditure % of current health expenditure), latest available year 2010–2024',
      fundingRules:
        'Public = government share ≥55%; Private-dominated = ≤45%; Mixed = between; based on country-level financing, not document text',
    },
    fundingLegend: Object.entries(FUNDING_LABELS).map(([id, label]) => ({
      id,
      label,
      color: FUNDING_COLORS[id],
    })),
    incomeLegend: Object.entries(INCOME_LABELS).map(([id, label]) => ({
      id,
      label,
      color: INCOME_COLORS[id],
    })),
    developmentLegend: [
      { id: 'developed', label: 'Developed' },
      { id: 'developing', label: 'Developing' },
      { id: 'undeveloped', label: 'Least developed' },
    ],
    byIso3,
    byTopoName,
    byCatalogueCountry,
  };

  const outPath = path.join(ROOT, 'country-meta.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  console.log('Wrote', outPath);
  console.log('  ISO countries:', Object.keys(byIso3).length);
  console.log('  Topo mapped:', Object.keys(byTopoName).length);
  console.log('  Catalogue matched:', Object.keys(byCatalogueCountry).length, '/', catalogue.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
