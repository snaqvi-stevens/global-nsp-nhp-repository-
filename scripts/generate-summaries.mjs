/**
 * Reads policy rows from index.html, extracts text from each PDF when present,
 * and writes summaries.json (country name -> short summary string).
 *
 * Usage:
 *   npm install
 *   OPENAI_API_KEY=sk-... npm run summaries   # optional: short AI summary per file
 *   npm run summaries                         # smart extractive (TOC / acronym noise reduced)
 *
 * Skips .docx and missing files. Merges into existing summaries.json.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

/** Shown when a PDF is missing, unreadable, or not summarizable extractively. */
const LINK_FALLBACK_SUMMARY =
  'For more information, refer to the attached policy documents in this repository.';

const REPO_ROOT = 'Region-wise NSP-NHP documents [Living Repository';
const SUBFOLDERS = {
  AFRO: 'AFRO',
  EMR: 'EMR NSP-NHP Documents',
  EURO: 'EURO',
  SEARO: 'SEARO',
  WPR: 'WPR NSP-NHP Documents',
};

function extractPolicyDataFromHtml(html) {
  const marker = 'const policyData = ';
  const idx = html.indexOf(marker);
  if (idx === -1) throw new Error('const policyData = not found in index.html');
  let i = idx + marker.length;
  while (i < html.length && (html[i] === ' ' || html[i] === '\n' || html[i] === '\r')) i++;
  if (html[i] !== '[') throw new Error('policyData must start with [');
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
  const literal = html.slice(start, i);
  return new Function(`"use strict"; return ${literal}`)();
}

function docPathOnDisk(entry) {
  const sub = SUBFOLDERS[entry.whoRegion] || entry.whoRegion;
  return path.join(ROOT, REPO_ROOT, sub, entry.file);
}

function cleanExtract(text) {
  return String(text || '')
    .replace(/\r/g, ' ')
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Drop TOC rows, page chrome, and low-signal lines before extractive / AI summarization. */
function stripTocNoise(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const headerLine = (line) =>
    /^(table of contents|contents|index|índice|indice|sommaire|inhaltsverzeichnis)$/i.test(line) ||
    /^(table des matières|table des matieres)$/i.test(line) ||
    /^liste des (tableaux|figures|acronymes|abréviations|abbreviations)/i.test(line) ||
    /^list of (tables|figures|abbreviations|acronyms)/i.test(line) ||
    /^sigles et acronyms/i.test(line) ||
    /^sigles,?\s+abréviations/i.test(line) ||
    /^abbreviations and acronyms/i.test(line) ||
    /^references?\s+documents?/i.test(line) ||
    /^référence(s)?\s+documents?/i.test(line) ||
    /^carte du /i.test(line) ||
    /^(chapter|part(ie)?|section)\s+\d+/i.test(line);

  const filtered = [];
  for (const line of lines) {
    const L = line.length;
    if (L < 28 && !/[.!?].*[.!?]/.test(line)) continue;
    if (L > 900) continue;
    if (/^\d{1,4}\s*$/.test(line)) continue;
    if (/^page\s+(\d+|\w+\s+\d+)/i.test(line)) continue;
    if (/\|\s*p\s*a\s*g\s*e\s*\|/i.test(line)) continue;
    if (/^i\s*\|\s*p\s*a\s*g\s*e\s*\|/i.test(line)) continue;
    if (/^contents$/i.test(line)) continue;
    // TOC dot leaders + trailing page number
    if (/\.{2,}\s*\d{1,4}\s*$/.test(line)) continue;
    if (/…+\s*\d{1,4}\s*$/.test(line)) continue;
    if (/^[\s.\d·•\-–—_]{4,}\d{1,4}\s*$/.test(line)) continue;
    if (/^\d+\.?\s{0,2}\.\s{0,2}\d+/.test(line) && L < 50) continue;

    if (headerLine(line)) continue;

    const letters = (line.match(/[\p{L}]/gu) || []).length;
    const latinLetters = (line.match(/[A-Za-zÀ-ÿ]/g) || []).length;
    const ratio = letters / Math.max(L, 1);
    const latinRatio = latinLetters / Math.max(L, 1);
    // Keep Arabic/CJK/etc.: enough "letters" overall even if Latin is low
    if (ratio < 0.32 && latinRatio < 0.25) continue;

    const words = line.split(/\s+/).filter(Boolean).length;
    const shortCapsTok = (line.match(/\b[A-Z]{2,5}\b/g) || []).length;
    if (words > 10 && shortCapsTok / words > 0.48) continue;

    const allCapsWordish =
      line === line.toUpperCase() && !/[a-záéíóúàèìòùâêîôûäëïöüçñ]/.test(line);
    if (allCapsWordish && L < 110 && words < 12 && !/[.;]/.test(line)) continue;

    filtered.push(line);
  }

  return filtered.join(' ');
}

function splitIntoSentences(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isLikelyProseSentence(s) {
  const words = s.split(/\s+/).filter(Boolean);
  const n = words.length;
  if (n < 10 || s.length < 72) return false;
  if (/^(tableau|figure|fig\.?|gráfico|graphique|annexe|annex)\b/i.test(s)) return false;
  if (/^list of |^liste des |^sigles |^abbreviations\b/i.test(s)) return false;
  if (/\b(tableau|figure)\s+[ivx\d]+/i.test(s) && n < 28) return false;
  const shortCapsTokens = words.filter((w) =>
    /^[A-Z0-9]{2,6}$/.test(w.replace(/[,;:]/g, '')),
  ).length;
  if (shortCapsTokens / n > 0.4) return false;
  const letters = s.replace(/\s/g, '');
  const lower = (letters.match(/[a-zà-ÿ]/g) || []).length;
  const upper = (letters.match(/[A-ZÀ-Ÿ]/g) || []).length;
  if (lower + upper > 0 && lower / (lower + upper) < 0.22 && n > 22) return false;
  const acronymColon = (s.match(/\b[A-Z]{2,5}\s*:/g) || []).length;
  if (acronymColon >= 3) return false;
  if ((s.match(/\b(Figure|Tableau|Fig\.|Gráfico)\s*[:-]?\s*\d/gi) || []).length >= 2) return false;
  if (/(\b\w+\b)(\s+\1\b){3,}/i.test(s)) return false;
  return true;
}

function acronymTokenRatio(text) {
  const w = String(text).split(/\s+/).filter(Boolean);
  if (!w.length) return 1;
  const caps = w.filter((x) => /^[A-Z]{2,6}$/.test(x.replace(/[,;:.\-]/g, ''))).length;
  return caps / w.length;
}

/** True if text looks like a glossary, figure list, or acronym run-on. */
function isAcronymSoupText(text) {
  if (!text || text.length < 90) return true;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length) {
    const avgLen = words.reduce((a, w) => a + w.length, 0) / words.length;
    if (avgLen > 14) return true;
    const glued = words.filter((w) => w.length > 24).length;
    if (glued >= 2) return true;
    if (words.some((w) => w.length > 48)) return true;
  }
  if (/\bLIST OF TABLES\b/i.test(text) && acronymTokenRatio(text) > 0.2) return true;
  if (acronymTokenRatio(text) > 0.32) return true;
  const colons = (text.match(/:/g) || []).length;
  const periods = (text.match(/\./g) || []).length;
  if (colons >= 8 && periods < colons * 0.55) return true;
  const fig = (text.match(/\b(Figure|Tableau|Table|Fig\.|Gráfico|Tabela|Graphique)\b/gi) || []).length;
  if (fig >= 5) return true;
  const glossaryPairs = (text.match(/\b[A-Z]{2,6}\s+[A-ZÀ-Ÿa-zà-ÿ]/g) || []).length;
  if (glossaryPairs >= 12) return true;
  return false;
}

function sanitizeExtract(text) {
  if (!text) return null;
  const t = text.trim();
  if (t.length < 100 || isAcronymSoupText(t)) return null;
  return t;
}

/** Sliding window: best segment where real prose dominates. */
function bestProseWindow(flat, win = 120) {
  const words = flat.split(/\s+/).filter(Boolean);
  if (words.length < win) return null;
  let best = '';
  let bestScore = -Infinity;
  const step = 12;
  for (let i = 0; i + win <= words.length; i += step) {
    const chunk = words.slice(i, i + win).join(' ');
    const w = chunk.split(/\s+/).filter(Boolean);
    const shortCaps = w.filter((x) => /^[A-Z]{2,6}$/.test(x.replace(/[,;:]/g, ''))).length;
    const lower = (chunk.match(/[a-zà-ÿ]/g) || []).length;
    const upper = (chunk.match(/[A-ZÀ-Ÿ]/g) || []).length;
    const lowerRatio = lower / Math.max(lower + upper, 1);
    const capWordRatio = shortCaps / w.length;
    const periods = (chunk.match(/\./g) || []).length;
    const colons = (chunk.match(/:/g) || []).length;
    const figTab = (chunk.match(/\b(Figure|Tableau|Table|Fig\.|Gráfico|Tabela|Graphique|LIST OF|Liste des)\b/gi) || []).length;
    const glossaryPairs = (chunk.match(/\b[A-Z]{2,6}\s+[A-Za-zÀ-ÿ]/g) || []).length;
    let score =
      lowerRatio * 2.25 - capWordRatio * 3.35 + Math.min(0.5, periods * 0.07) - Math.min(0.9, colons * 0.055);
    score -= figTab * 0.2;
    score -= Math.min(1.05, glossaryPairs * 0.05);
    if (periods < 2) score -= 0.22;
    if (score > bestScore) {
      bestScore = score;
      best = chunk;
    }
  }
  if (bestScore < 0.38 || !best) return null;
  let out = best.slice(0, 840);
  const lp = out.lastIndexOf('.');
  if (lp > 220) out = out.slice(0, lp + 1);
  return out.trim() + (best.length > out.length ? ' …' : '');
}

/** Fix some common PDF text glues (not a full layout engine). */
function normalizePdfSpacing(text) {
  return String(text || '')
    .replace(/\ufeff/g, '')
    .replace(/([a-zà-ÿ])([A-ZÀ-Ÿ])/g, '$1 $2')
    .replace(/(\d)([A-Za-zÀ-Ÿ])/g, '$1 $2')
    .replace(/([A-Za-zÀ-ſ])(\d{3,})/g, '$1 $2')
    .replace(/\)(\d)/g, ') $1');
}

function extractiveSummary(raw) {
  const rawN = normalizePdfSpacing(raw);
  const cleaned = cleanExtract(stripTocNoise(rawN));
  const fallbackFull = cleanExtract(rawN);
  const t = cleaned.length >= 150 ? cleaned : fallbackFull;
  if (t.length < 120) return null;

  const flat = t.replace(/\s+/g, ' ');
  const sentences = splitIntoSentences(flat);
  const good = sentences.filter((s) => {
    if (/\.{3,}/.test(s)) return false;
    if (/^(figure|table|annex|appendix|fig\.?|tab\.?)\s+\d+/i.test(s)) return false;
    return isLikelyProseSentence(s);
  });

  let out = '';
  for (const s of good) {
    if (out.length >= 680) break;
    out += (out ? ' ' : '') + s;
  }

  if (out.length >= 200) {
    const assembled = out + (flat.length > out.length + 120 ? ' …' : '');
    const ok = sanitizeExtract(assembled);
    if (ok) return ok;
  }

  for (const win of [118, 96, 78]) {
    const windowed = bestProseWindow(flat, win);
    const ok = sanitizeExtract(windowed);
    if (ok) return ok;
  }

  const skip = Math.min(Math.floor(flat.length * 0.12), 520);
  const max = 780;
  let slice = flat.slice(skip, skip + max);
  let lastPeriod = slice.lastIndexOf('.');
  if (lastPeriod > 220) slice = slice.slice(0, lastPeriod + 1);
  if (slice.length < 100) {
    slice = flat.slice(0, max);
    lastPeriod = slice.lastIndexOf('.');
    if (lastPeriod > 200) slice = slice.slice(0, lastPeriod + 1);
  }
  return sanitizeExtract(slice.trim() + (flat.length > skip + max ? ' …' : ''));
}

async function summarizeWithOpenAI(excerpt, meta) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const body = {
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You summarize national health policy and surgical plan documents for a global public atlas. Be factual, neutral, and concise. Do not invent statistics or commitments not implied by the excerpt.',
      },
      {
        role: 'user',
        content: `Country: ${meta.country}\nDocument type (catalogue): ${meta.docType}\nYear (catalogue): ${meta.year}\nWHO region: ${meta.whoRegion}\n\nExcerpt from the policy PDF (may be partial):\n\n${excerpt.slice(0, 12000)}\n\nWrite 2–4 clear sentences summarizing what this policy emphasizes (goals, time horizon, main health/surgery themes). If the excerpt is boilerplate only, say what little can be inferred and note that the source text was limited.`,
      },
    ],
    max_tokens: 320,
    temperature: 0.35,
  };
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    console.warn(`OpenAI error for ${meta.country}: ${res.status} ${err.slice(0, 200)}`);
    return null;
  }
  const data = await res.json();
  const out = data?.choices?.[0]?.message?.content?.trim();
  return out || null;
}

async function main() {
  const pdfParse = (await import('pdf-parse')).default;
  const htmlPath = path.join(ROOT, 'index.html');
  const outPath = path.join(ROOT, 'summaries.json');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const policyData = extractPolicyDataFromHtml(html);

  let existing = {};
  try {
    existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  } catch {}

  const useAI = Boolean(process.env.OPENAI_API_KEY);
  console.log(
    useAI
      ? 'Using OpenAI for narrative summaries.'
      : 'Extractive mode only (set OPENAI_API_KEY for richer summaries).',
  );

  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (const entry of policyData) {
    const fp = docPathOnDisk(entry);
    const ext = path.extname(fp).toLowerCase();

    if (ext !== '.pdf' || !fs.existsSync(fp)) {
      skipped++;
      existing[entry.country] = LINK_FALLBACK_SUMMARY;
      continue;
    }

    try {
      const buf = fs.readFileSync(fp);
      const parsed = await pdfParse(buf);
      const raw = parsed.text || '';
      const rawN = normalizePdfSpacing(raw);
      const forModel =
        cleanExtract(stripTocNoise(rawN)) || cleanExtract(rawN);
      let summary = null;
      if (useAI && forModel.length > 200) {
        summary = await summarizeWithOpenAI(forModel, entry);
      }
      if (!summary) {
        summary = extractiveSummary(rawN);
      }
      if (!summary) {
        summary = LINK_FALLBACK_SUMMARY;
      }
      existing[entry.country] = summary;
      done++;
      if (done % 25 === 0) console.log(`Processed ${done} PDFs…`);
    } catch (e) {
      console.warn(`Skip ${entry.country} (${entry.file}): ${e.message}`);
      failed++;
      existing[entry.country] = LINK_FALLBACK_SUMMARY;
    }
  }

  fs.writeFileSync(outPath, JSON.stringify(existing, null, 2), 'utf8');
  console.log(`Wrote ${outPath} — updated PDFs: ${done}, skipped/missing: ${skipped}, parse errors: ${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
