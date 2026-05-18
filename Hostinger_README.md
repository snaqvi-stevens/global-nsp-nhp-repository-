# Hosting on Hostinger — globalsurgeryconnect.org

Deploy the atlas to **https://globalsurgeryconnect.org/atlas/** by connecting this GitHub repo to Hostinger with **auto-deploy** enabled.

**Related:** day-to-day PDF and catalogue steps are in [README.md](README.md).

---

## Recommended approach: GitHub → Hostinger (auto-deploy)

| Layer | Role |
|-------|------|
| **GitHub** (`main` branch) | Single source of truth — PDFs, `catalogue.json`, `index.html`, all site files |
| **GitHub Actions** | Optionally regenerates `catalogue.json` when PDFs change (see [build-catalogue.yml](.github/workflows/build-catalogue.yml)) |
| **Hostinger Git** | Pulls from GitHub on each push and deploys to `public_html/atlas/` |
| **Live site** | **https://globalsurgeryconnect.org/atlas/** |

You **do not** upload each file to Hostinger by hand after setup. You **commit and push to GitHub**; Hostinger updates the live site.

```
Maintainer → push to GitHub (main)
                ↓
     GitHub Actions (optional) → updates catalogue.json
                ↓
     Hostinger webhook / auto-deploy → public_html/atlas/
                ↓
     https://globalsurgeryconnect.org/atlas/
```

---

## What gets deployed

Hostinger copies the repo into **`public_html/atlas/`**. Required for the site:

- `index.html`
- `catalogue.json`
- `countries-110m.json`
- `summaries.json` (optional)
- `logo.png`
- `Region-wise NSP-NHP documents [Living Repository]/` (all PDFs)

Not required on the server: `node_modules/`, `.git/` (Hostinger usually omits these automatically).

Hostinger does **not** run `npm run catalogue` — that runs on your computer or in GitHub Actions. The deployed site only needs the committed **`catalogue.json`**.

---

## Part 1 — One-time Hostinger setup

### 1. Log in and open the site

1. [hostinger.com](https://www.hostinger.com) → **hPanel**.
2. **Websites** → **globalsurgeryconnect.org**.

### 2. Enable SSL

1. **SSL** → enable free SSL (Let’s Encrypt) for **globalsurgeryconnect.org**.
2. Use **https://** when testing.

### 3. Create the atlas folder (before first deploy)

1. **Files** → **File Manager** → **`public_html`**.
2. Create folder **`atlas`** if it does not exist.
3. If an old manual upload is inside `atlas/`, you can clear it before the first Git deploy (optional; Git deploy will overwrite/add files).

**Deploy target path:** `public_html/atlas/`  
**Public URL:** `https://globalsurgeryconnect.org/atlas/`

---

## Part 2 — Connect GitHub and turn on auto-deploy

Exact menu names can vary slightly by Hostinger plan. Look for **Git** under the website or **Advanced**.

### Step A — Open Git in hPanel

1. **Websites** → **globalsurgeryconnect.org** → **Manage**.
2. Open **Git** (or **Advanced** → **Git**).

### Step B — Create / import the repository

1. Choose **Create a new repository** or **Import Git Repository**.
2. Connect your **GitHub** account when prompted (authorize Hostinger).
3. Select repository:  
   **`SNaqvi-Stevens/Global-NSP-NHP-Repository-`**
4. **Branch:** `main`

### Step C — Set the deployment directory

Set the directory where files should land (critical):

| Setting | Value |
|---------|--------|
| **Repository path / Deploy directory** | `domains/globalsurgeryconnect.org/public_html/atlas` |
| Or relative path | `public_html/atlas` |

The repo root (including `index.html`) must end up **inside** `atlas/`, not in `public_html/` root, so you do not overwrite the main GSC homepage.

### Step D — Enable auto-deployment

1. Turn **Auto Deployment** **ON** (toggle or checkbox).
2. Hostinger shows a **Webhook URL** — copy it.

### Step E — Add the webhook on GitHub

1. Open [github.com/SNaqvi-Stevens/Global-NSP-NHP-Repository-/settings/hooks](https://github.com/SNaqvi-Stevens/Global-NSP-NHP-Repository-/settings/hooks).
2. **Add webhook**.
3. **Payload URL:** paste Hostinger’s webhook URL.
4. **Content type:** `application/json`.
5. **Events:** “Just the push event” (or “Let me select” → **Pushes** only).
6. **Active:** checked → **Add webhook**.

### Step F — First deploy

1. In Hostinger Git, click **Deploy** (or **Pull** / **Deploy now**) once manually.
2. Wait until the deploy finishes (first run can take **several minutes** because of many PDFs).
3. Open **https://globalsurgeryconnect.org/atlas/** — map, table, and a sample PDF download should work.

### Step G — Link from the main GSC site

Add a menu item or button:

- **URL:** `https://globalsurgeryconnect.org/atlas/`

**Embed on one page (optional):**

```html
<iframe
  src="https://globalsurgeryconnect.org/atlas/"
  title="National Surgical & Health Policy Atlas"
  width="100%"
  height="900"
  style="border:0"
></iframe>
```

---

## Part 3 — How to add or update PDFs (ongoing, via GitHub)

PDFs must be **in the GitHub repository** (not only on your laptop). After auto-deploy is on, Hostinger mirrors GitHub.

### Option 1 — On your computer (recommended)

1. **Clone** (first time only):
   ```bash
   git clone https://github.com/SNaqvi-Stevens/Global-NSP-NHP-Repository-.git
   cd Global-NSP-NHP-Repository-
   npm install
   ```
2. **Add the PDF** to the correct WHO folder, e.g.  
   `Region-wise NSP-NHP documents [Living Repository]/AFRO/`
3. **Regenerate the catalogue:**
   ```bash
   npm run catalogue
   ```
4. **Commit and push:**
   ```bash
   git add "Region-wise NSP-NHP documents [Living Repository]/AFRO/YourFile.pdf" catalogue.json
   git commit -m "Add country PDF and refresh catalogue"
   git push origin main
   ```
5. **Wait 2–5 minutes** — GitHub Actions may commit `catalogue.json` again if you only pushed the PDF; Hostinger may deploy twice. That is normal.
6. **Check** https://globalsurgeryconnect.org/atlas/

### Option 2 — GitHub website (no local Git)

1. Open the repo on GitHub → navigate to the correct regional folder (e.g. `AFRO/`).
2. **Add file** → **Upload files** → upload the PDF → **Commit directly to `main`**.
3. GitHub Actions runs `npm run catalogue` and commits an updated **`catalogue.json`** (if the workflow is enabled).
4. If Actions does not run (e.g. path filter), a maintainer must run `npm run catalogue` locally and push `catalogue.json` separately.
5. Hostinger auto-deploys after each push to `main`.

### Filename tips

- Include **country name** and **NSP** or **NHP** (or *surgical*, *health policy*, *PNDS*).
- Examples: `KEN_Kenya_NSP_2024-2030.pdf`, `BEN_Benin_NHP_2018-2022.pdf`

### Regional folders

| Region | Path in repo |
|--------|----------------|
| Africa | `Region-wise NSP-NHP documents [Living Repository]/AFRO/` |
| Eastern Mediterranean | `.../EMR NSP-NHP Documents/` |
| Europe | `.../EURO/` |
| South-East Asia | `.../SEARO/` |
| Western Pacific | `.../WPR NSP-NHP Documents/` |

---

## Part 4 — Other updates (also via GitHub)

| Change | What to do |
|--------|------------|
| Site UI / map | Edit `index.html` → commit → push → Hostinger deploys |
| Country list / years | Run `npm run catalogue` → commit `catalogue.json` → push |
| Map hover excerpts | Run `npm run summaries` → commit `summaries.json` → push |
| Logo | Replace `logo.png`, bump `?v=` in `index.html` → push |
| Wrong NSP/NHP guess | `catalogue-overrides.json` → `npm run catalogue` → push |

No separate Hostinger upload needed when auto-deploy is working.

---

## Part 5 — Fallback: manual upload (FTP / File Manager)

Use only if Git deploy is unavailable, webhook failed, or you need an emergency fix.

1. Upload files to **`public_html/atlas/`** (same layout as the repo).
2. After adding PDFs, still run **`npm run catalogue`** locally and upload **`catalogue.json`**.
3. Re-enable Git deploy when possible so GitHub and Hostinger match again.

See [Hostinger File Manager / FTP](https://support.hostinger.com/en/articles/1580985-how-to-upload-files-using-file-manager) in Hostinger help docs.

---

## Part 6 — Troubleshooting

| Problem | What to check |
|---------|----------------|
| Push to GitHub but site unchanged | Auto-deploy ON? Webhook active in GitHub → Recent Deliveries? Manual **Deploy** in hPanel Git |
| Webhook 404 / failed | Re-copy webhook URL from Hostinger; ensure repo is `Global-NSP-NHP-Repository-` |
| Site at wrong path | Deploy directory must be `public_html/atlas`, not `public_html` alone |
| Country missing after PDF push | Is **`catalogue.json`** on `main`? Run `npm run catalogue` and push, or check Actions tab |
| PDF 404 on live site | PDF committed to GitHub? Deploy finished? Folder name spelled exactly `Region-wise NSP-NHP documents [Living Repository]` |
| Deploy very slow / timeout | Large PDF batch — retry deploy; or use FTP once, then fix Git |
| `catalogue.json` 404 | File must be at `atlas/catalogue.json` next to `index.html` |
| Map blank | `countries-110m.json` missing from deploy — confirm it is in the repo and deployed |
| Old page in browser | Hard refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`) |

---

## Part 7 — Checklists

### One-time go-live (GitHub + Hostinger)

- [ ] SSL on for globalsurgeryconnect.org  
- [ ] Folder `public_html/atlas/` exists  
- [ ] Hostinger Git connected to `SNaqvi-Stevens/Global-NSP-NHP-Repository-`, branch `main`  
- [ ] Deploy path = `public_html/atlas`  
- [ ] **Auto-deployment ON**  
- [ ] GitHub webhook added and delivering  
- [ ] First manual deploy succeeded  
- [ ] https://globalsurgeryconnect.org/atlas/ works (map, table, PDF)  
- [ ] Link or iframe on main GSC site  

### Each new country PDF

- [ ] PDF added under correct regional folder **in GitHub**  
- [ ] `catalogue.json` updated (`npm run catalogue` or GitHub Action)  
- [ ] Changes **pushed to `main`**  
- [ ] Hostinger deploy completed (hPanel Git log / webhook)  
- [ ] Country visible on https://globalsurgeryconnect.org/atlas/  

---

## Quick reference

| Item | Value |
|------|--------|
| Production URL | **https://globalsurgeryconnect.org/atlas/** |
| GitHub repo | [Global-NSP-NHP-Repository-](https://github.com/SNaqvi-Stevens/Global-NSP-NHP-Repository-) |
| Branch to deploy | **`main`** |
| Server folder | `public_html/atlas/` |
| Regenerate country list | `npm run catalogue` (local or GitHub Actions) |
| Backup / staging URL | [GitHub Pages](https://snaqvi-stevens.github.io/Global-NSP-NHP-Repository-/) |
| Submission form | [Google Form](https://docs.google.com/forms/d/e/1FAIpQLSeLDdphTpkC97SoSObe_IiwPr7bscEgK33IXQ0HI-yHDOo0Fw/viewform) |

---

## Who does what

| Role | Action |
|------|--------|
| **Public contributor** | Submission form only |
| **Regional reviewer** | Approves document |
| **Maintainer** | Add PDF to GitHub → `npm run catalogue` (or rely on Action) → **push to `main`** → Hostinger updates automatically |
| **GSC web lead** | Hostinger Git setup, SSL, webhook, menu link |
