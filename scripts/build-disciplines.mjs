/**
 * Scans policy PDFs from catalogue.json for surgical discipline keywords.
 * Writes discipline-tags.json for atlas filters (Phase 3).
 *
 * Usage: npm run disciplines
 *
 * Optional: discipline-overrides.json
 * {
 *   "byCountry": { "India": { "add": ["cardio"], "remove": ["gensurg"] } },
 *   "byFilename": { "file.pdf": { "set": ["nursing", "obgyn"] } }
 * }
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const REPO_ROOT = 'Region-wise NSP-NHP documents [Living Repository';
const MAX_PDF_PAGES = 50;
const MAX_TEXT_CHARS = 220000;

/** Surgical disciplines — id, label, keyword patterns (EN + common variants). */
const DISCIPLINE_DEFS = [
  {
    id: 'anesthesia',
    label: 'Anesthesia',
    patterns: [
      /\banaesth/i,
      /\banesthes/i,
      /\banaesthesia\b/i,
      /\banesthésie/i,
      /\bperioperative\b/i,
      /\bperi-operative\b/i,
      /\bsoaan\b/i,
      /\bnsoa+n?p\b/i,
    ],
  },
  {
    id: 'nursing',
    label: 'Nursing',
    patterns: [
      /\bnursing\b/i,
      /\bnurse(s)?\b/i,
      /\bmidwif/i,
      /\bsage-femme/i,
      /\bsoins infirmiers/i,
      /\bprofessional nurse/i,
    ],
  },
  {
    id: 'obgyn',
    label: 'OBGYN',
    patterns: [
      /\bobstetric/i,
      /\bgynecol/i,
      /\bgynaecol/i,
      /\bob-gyn/i,
      /\bmaternal health\b/i,
      /\bmaternal mortality\b/i,
      /\bperinatal\b/i,
      /\breproductive health\b/i,
      /\bcaesarean/i,
      /\bcesarean/i,
      /\bc-section\b/i,
      /\bsoaan\b/i,
    ],
  },
  {
    id: 'gensurg',
    label: 'General surgery',
    patterns: [
      /\bgeneral surgery\b/i,
      /\bnational surgical\b/i,
      /\bsurgical plan\b/i,
      /\bsurgical care\b/i,
      /\bsafe surgery\b/i,
      /\bsurgical workforce\b/i,
      /\bsurgical hub/i,
      /\bnsap\b/i,
      /\bnsoap\b/i,
      /\bnsoanp\b/i,
      /\bsurgical obstetric/i,
      /\bday surgery\b/i,
      /\boperating theatre/i,
      /\boperating room\b/i,
    ],
  },
  {
    id: 'trauma',
    label: 'Trauma',
    patterns: [
      /\btrauma\b/i,
      /\btraumatolog/i,
      /\bemergency surgery\b/i,
      /\bacute care surgery\b/i,
      /\binjury prevention\b/i,
      /\broad traffic injury\b/i,
      /\borthopaedic trauma/i,
    ],
  },
  {
    id: 'cardio',
    label: 'Cardio',
    patterns: [
      /\bcardiac surgery\b/i,
      /\bcardiovascular surgery\b/i,
      /\bheart surgery\b/i,
      /\bcardiac care\b/i,
      /\bcardiothoracic/i,
      /\bcardio-thoracic/i,
    ],
  },
  {
    id: 'vascular',
    label: 'Vascular',
    patterns: [
      /\bvascular surgery\b/i,
      /\bvascular surgical\b/i,
      /\bvasculaire\b/i,
      /\bperipheral vascular\b/i,
    ],
  },
  {
    id: 'ortho',
    label: 'Orthopedics',
    patterns: [
      /\borthop(a)?edic/i,
      /\borthopaedic/i,
      /\bbone fracture\b/i,
      /\bmusculoskeletal\b/i,
    ],
  },
  {
    id: 'ent',
    label: 'ENT',
    patterns: [
      /\botolaryngol/i,
      /\botorhinolaryngol/i,
      /\bear[\s-]nose[\s-]throat\b/i,
      /\bENT surgery\b/i,
      /\bENT department\b/i,
      /\bhead and neck surgery\b/i,
    ],
  },
  {
    id: 'gi',
    label: 'GI',
    patterns: [
      /\bgastrointestinal\b/i,
      /\bgastro-intestinal\b/i,
      /\bdigestive surgery\b/i,
      /\bcolorectal\b/i,
      /\bhepatobiliary\b/i,
      /\bupper gi\b/i,
      /\bbariatric surgery\b/i,
    ],
  },
];

const FILENAME_HINTS = {
  anesthesia: [/anaesth/i, /anesthes/i, /soaan/i, /nsoap/i, /nsoanp/i],
  obgyn: [/obstetric/i, /ob-gyn/i, /maternal/i, /soaan/i],
  gensurg: [/surgical/i, /nsoap/i, /nsap/i, /nsoanp/i, /salts/i],
  nursing: [/nursing/i, /midwif/i],
  trauma: [/trauma/i],
  cardio: [/cardiac/i, /cardio/i, /heart/i],
  vascular: [/vascular/i],
  ortho: [/orthop/i],
  ent: [/otolaryng/i, /\bent\b/i],
  gi: [/gastro/i, /colorectal/i],
};

function loadOverrides() {
  const p = path.join(ROOT, 'discipline-overrides.json');
  if (!fs.existsSync(p)) return { byCountry: {}, byFilename: {} };
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function docPathOnDisk(entry, fileName) {
  const sub = entry.docSubfolder || entry.whoRegion;
  return path.join(ROOT, REPO_ROOT, sub, fileName);
}

function normalizeText(text) {
  return String(text || '')
    .replace(/\r/g, ' ')
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchDisciplinesInText(text) {
  const hay = normalizeText(text);
  if (!hay) return [];
  const found = new Set();
  for (const def of DISCIPLINE_DEFS) {
    if (def.patterns.some((re) => re.test(hay))) found.add(def.id);
  }
  return [...found].sort();
}

function matchDisciplinesInFilename(fileName) {
  const found = new Set();
  for (const [id, patterns] of Object.entries(FILENAME_HINTS)) {
    if (patterns.some((re) => re.test(fileName))) found.add(id);
  }
  return [...found];
}

async function extractPdfText(filePath) {
  if (!fs.existsSync(filePath)) return '';
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const buf = fs.readFileSync(filePath);
    const data = await pdfParse(buf, { max: MAX_PDF_PAGES });
    let text = data.text || '';
    if (text.length > MAX_TEXT_CHARS) text = text.slice(0, MAX_TEXT_CHARS);
    return text;
  } catch (err) {
    console.warn('  PDF read failed:', path.basename(filePath), err.message);
    return '';
  }
}

function applyOverride(tags, override) {
  if (!override) return tags;
  const set = new Set(tags);
  if (Array.isArray(override.set)) {
    return [...new Set(override.set)].sort();
  }
  if (Array.isArray(override.add)) override.add.forEach((id) => set.add(id));
  if (Array.isArray(override.remove)) override.remove.forEach((id) => set.delete(id));
  return [...set].sort();
}

function filesForEntry(entry) {
  const files = [];
  if (entry.file) files.push(entry.file);
  if (entry.fileNsp) files.push(entry.fileNsp);
  if (entry.fileNhp) files.push(entry.fileNhp);
  return [...new Set(files)];
}

async function tagsForFile(entry, fileName, overrides) {
  const filePath = docPathOnDisk(entry, fileName);
  let tags = [];
  const text = await extractPdfText(filePath);
  if (text.length >= 80) {
    tags = matchDisciplinesInText(text);
  }
  if (!tags.length) {
    tags = matchDisciplinesInFilename(fileName);
  }
  return applyOverride(tags, overrides.byFilename?.[fileName]);
}

async function buildDisciplineTags() {
  const cataloguePath = path.join(ROOT, 'catalogue.json');
  if (!fs.existsSync(cataloguePath)) {
    throw new Error('catalogue.json missing — run npm run catalogue first');
  }
  const catalogue = JSON.parse(fs.readFileSync(cataloguePath, 'utf8'));
  const overrides = loadOverrides();

  const byCountry = {};
  let scanned = 0;
  let pdfOk = 0;

  for (const entry of catalogue) {
    const country = entry.country;
    const byFile = {};
    const union = new Set();

    for (const file of filesForEntry(entry)) {
      scanned += 1;
      process.stdout.write(`  ${country}: ${file.slice(0, 48)}…\r`);
      const tags = await tagsForFile(entry, file, overrides);
      if (tags.length) byFile[file] = tags;
      tags.forEach((t) => union.add(t));
    }

    let disciplines = [...union].sort();
    disciplines = applyOverride(disciplines, overrides.byCountry?.[country]);
    byCountry[country] = { disciplines, byFile };
    if (Object.keys(byFile).length) pdfOk += 1;
  }

  console.log(`\n  Scanned ${scanned} files across ${catalogue.length} catalogue entries.`);

  return {
    generatedAt: new Date().toISOString(),
    method:
      'Keyword scan of PDF text (pdf-parse, first ' +
      MAX_PDF_PAGES +
      ' pages) with filename fallback; optional discipline-overrides.json',
    disciplines: DISCIPLINE_DEFS.map(({ id, label }) => ({ id, label })),
    byCountry,
  };
}

async function main() {
  console.log('Building discipline-tags.json…');
  const out = await buildDisciplineTags();
  const outPath = path.join(ROOT, 'discipline-tags.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
  const withTags = Object.values(out.byCountry).filter((c) => c.disciplines?.length).length;
  console.log(`Wrote ${outPath}`);
  console.log(`  Countries with ≥1 discipline tag: ${withTags} / ${Object.keys(out.byCountry).length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
