# National Surgical & Health Policy Repository

Living catalogue of national surgical plans (NSP) and national health policies (NHP), with an interactive map and download table.

**Live site:** [Global NSP-NHP Repository](https://snaqvi-stevens.github.io/Global-NSP-NHP-Repository-/)

---

## Add or update a country PDF (maintainers)

You **do not** edit the country list in `index.html`. Add the file, refresh the catalogue, and push.

### Step 1 — Put the PDF in the right folder

```
Region-wise NSP-NHP documents [Living Repository]/
├── AFRO/                          ← Africa
├── EMR NSP-NHP Documents/         ← Eastern Mediterranean
├── EURO/                          ← Europe
├── SEARO/                         ← South-East Asia
└── WPR NSP-NHP Documents/         ← Western Pacific
```

Use a clear filename, for example:

- `KEN_Kenya_NSP_2024-2030.pdf`
- `BEN_Benin_NHP_2018-2022.pdf`

Include the **country name** and whether it is **NSP** or **NHP** (or words like *surgical*, *health policy*, *PNDS*) in the name so the build script can classify it.

### Step 2 — Regenerate `catalogue.json`

**On your computer** (Node.js installed):

```bash
npm run catalogue
```

**Or:** merge your PDF to the `main` branch on GitHub — a workflow runs the same command and commits `catalogue.json` for you.

### Step 3 — Commit and push

Commit the PDF and the updated `catalogue.json`, then push. GitHub Pages will show the new entry after deploy (usually within a few minutes).

---

## Public submissions (no repo access)

Use the [submission form](https://docs.google.com/forms/d/e/1FAIpQLSeLDdphTpkC97SoSObe_IiwPr7bscEgK33IXQ0HI-yHDOo0Fw/viewform). Regional reviewers validate the document; a maintainer then follows the three steps above.

---

## When something looks wrong

| Problem | Fix |
|--------|-----|
| Country or NSP/NHP type guessed wrong | Copy `catalogue-overrides.json.example` to `catalogue-overrides.json`, add your filename, run `npm run catalogue` again. |
| Country missing on the map but listed in the table | Rare name mismatch — add an entry to `ourToTopo` in `index.html`. |
| No hover summary on the map | Optional: run `npm run summaries` (needs PDF text extraction; OpenAI key only for translation). |


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
| `catalogue.json` | Generated list of countries and files — **commit this** after `npm run catalogue` |
| `scripts/build-catalogue.mjs` | Catalogue generator |
| `summaries.json` | Optional map hover text |
| `Region-wise NSP-NHP documents [Living Repository]/` | Source PDFs by WHO region |
