# National Surgical & Health Policy Repository

Living catalogue of national surgical plans (NSP) and national health policies (NHP), with an interactive map and download table.

| Site | URL |
|------|-----|
| **Production (Hostinger)** | https://globalsurgeryconnect.org/atlas/ *(after Git deploy is configured)* |
| **Staging / backup (GitHub Pages)** | https://snaqvi-stevens.github.io/Global-NSP-NHP-Repository-/ |

**GitHub is the source of truth.** PDFs and `catalogue.json` live in this repo. With Hostinger Git + auto-deploy, a **push to `main`** updates the live domain. Setup: [Hostinger_README.md](Hostinger_README.md).

---

## Add or update a country PDF (maintainers)

You **do not** edit the country list in `index.html`. Add the PDF to GitHub, refresh the catalogue, and push.

### Step 1 — Add the PDF to the repo

Put the file in the correct WHO region folder:

```
Region-wise NSP-NHP documents [Living Repository]/
├── AFRO/                          ← Africa
├── EMR NSP-NHP Documents/         ← Eastern Mediterranean
├── EURO/                          ← Europe
├── SEARO/                         ← South-East Asia
└── WPR NSP-NHP Documents/         ← Western Pacific
```

**Ways to add the file:**

- **Locally:** copy PDF into the folder → commit (see Step 3).
- **On GitHub:** repo → regional folder → **Add file** → **Upload files** → commit to `main`.

Use a clear filename, for example:

- `KEN_Kenya_NSP_2024-2030.pdf`
- `BEN_Benin_NHP_2018-2022.pdf`

Include the **country name** and **NSP** or **NHP** (or words like *surgical*, *health policy*, *PNDS*) so the build script can classify it.

### Step 2 — Regenerate `catalogue.json`

**On your computer** (Node.js installed):

```bash
npm install
npm run catalogue
```

**Or:** push only the PDF to `main` and let **GitHub Actions** regenerate `catalogue.json` (runs when files under `Region-wise NSP-NHP documents [Living Repository]/` change). Check the **Actions** tab; a follow-up commit may appear on `main`.

Always ensure an up-to-date **`catalogue.json`** is on `main` before expecting the live site to list the country.

### Step 3 — Commit and push to `main`

```bash
git add "Region-wise NSP-NHP documents [Living Repository]/…/YourFile.pdf" catalogue.json
git commit -m "Add PDF and refresh catalogue"
git push origin main
```

**What happens next:**

| Target | Update |
|--------|--------|
| **GitHub Pages** | Rebuilds from `main` (usually within a few minutes) |
| **globalsurgeryconnect.org/atlas/** | Updates automatically if Hostinger Git + auto-deploy is configured ([Hostinger_README.md](Hostinger_README.md)) |

You do **not** need a separate Hostinger upload when auto-deploy is working.

---

## Public submissions (no repo access)

Use the [submission form](https://docs.google.com/forms/d/e/1FAIpQLSeLDdphTpkC97SoSObe_IiwPr7bscEgK33IXQ0HI-yHDOo0Fw/viewform). Regional reviewers validate the document; a maintainer adds the PDF to GitHub and follows the three steps above.

---

## When something looks wrong

| Problem | Fix |
|--------|-----|
| Country or NSP/NHP type guessed wrong | Copy `catalogue-overrides.json.example` to `catalogue-overrides.json`, add your filename, run `npm run catalogue`, push |
| Country missing on the map but in the table | Rare name mismatch — add an entry to `ourToTopo` in `index.html`, push |
| No hover summary on the map | Optional: `npm run summaries`, commit `summaries.json`, push |
| Live domain not updating after push | See [Hostinger_README.md](Hostinger_README.md) — webhook, auto-deploy, deploy path `public_html/atlas` |

---

## Scripts

| Command | What it does |
|---------|----------------|
| `npm run catalogue` | Scan PDF folders → write `catalogue.json` |
| `npm run summaries` | Build `summaries.json` from PDF text (optional) |
| `npm run summaries:translate` | Translate non-English summaries (needs `OPENAI_API_KEY`) |

---

## Repository layout (short)

| Path | Purpose |
|------|---------|
| `index.html` | Site UI (loads `catalogue.json`) |
| `catalogue.json` | Generated country list — **commit after** `npm run catalogue` |
| `scripts/build-catalogue.mjs` | Catalogue generator |
| `summaries.json` | Optional map hover text |
| `countries-110m.json` | Map geography data |
| `Region-wise NSP-NHP documents [Living Repository]/` | Source PDFs by WHO region |
| `Hostinger_README.md` | Connect GitHub → Hostinger, auto-deploy, production URL |
