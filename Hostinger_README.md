# Hosting on Hostinger — globalsurgeryconnect.org

Full guide to connect this repository to **https://globalsurgeryconnect.org/**, upload PDFs, and keep the site updated on Hostinger.

**Related:** general maintainer workflow (GitHub / catalogue build) is in [README.md](README.md).

---

## What you are hosting

This project is a **static website** (HTML + JSON + images + PDFs). Hostinger serves files from disk; visitors’ browsers run the map and table. You do **not** need Node.js on Hostinger for the live site.

| Needed on Hostinger | Not needed on Hostinger |
|---------------------|-------------------------|
| `index.html` | `node_modules/` |
| `catalogue.json` | `scripts/` (unless you want them for reference) |
| `summaries.json` (optional, for map excerpts) | `.git/` |
| `countries-110m.json` (world map data) | Running `npm run catalogue` on the server |
| `logo.png` | |
| Folder `Region-wise NSP-NHP documents [Living Repository]/` and all PDFs inside | |

---

## Recommended URL layout

Because **globalsurgeryconnect.org** is likely already your main Global Surgery Connect site, host the atlas in a **subfolder** (safest):

| Public URL | Folder on server |
|------------|------------------|
| **https://globalsurgeryconnect.org/atlas/** | `public_html/atlas/` |

If the atlas should be the **only** thing on the domain (no separate GSC homepage), use `public_html/` as the root instead of `public_html/atlas/`. The steps below use **`/atlas/`**; for root hosting, replace `atlas` with `public_html` everywhere.

---

## Part 1 — One-time setup on Hostinger

### 1. Log in

1. Go to [https://www.hostinger.com](https://www.hostinger.com) and sign in.
2. Open **hPanel**.
3. Under **Websites**, select **globalsurgeryconnect.org**.

### 2. Confirm hosting is active

- You should see **File Manager**, **FTP**, and **SSL** for this domain.
- If you only bought the domain and have no hosting plan, add **Web Hosting** in hPanel and attach **globalsurgeryconnect.org** to it.

### 3. Turn on HTTPS (SSL)

1. In hPanel → **SSL** (or **Security** → SSL).
2. Enable **Free SSL** (Let’s Encrypt) for **globalsurgeryconnect.org**.
3. Wait a few minutes, then test **https://globalsurgeryconnect.org** (not `http://`).

### 4. Create the atlas folder

1. **Files** → **File Manager**.
2. Open **`public_html`**.
3. Click **New folder** → name it **`atlas`**.
4. Open the **`atlas`** folder. All repository files go **inside** this folder.

Your structure should look like:

```
public_html/
├── (existing GSC site files — index.php, WordPress, etc. — if any)
└── atlas/
    ├── index.html
    ├── catalogue.json
    ├── summaries.json
    ├── countries-110m.json
    ├── logo.png
    └── Region-wise NSP-NHP documents [Living Repository]/
        ├── AFRO/
        ├── EMR NSP-NHP Documents/
        ├── EURO/
        ├── SEARO/
        └── WPR NSP-NHP Documents/
```

---

## Part 2 — Connect / upload the repository (first time)

You are **copying files** from your computer (or GitHub) to Hostinger. The domain does not “clone” Git automatically unless you set up Hostinger’s Git feature (optional, see Part 5).

### Option A — File Manager (good for first try, smaller uploads)

1. On your computer, open the project folder (clone from GitHub or use your Desktop copy).
2. In hPanel → **File Manager** → `public_html/atlas/`.
3. Click **Upload** and upload:
   - `index.html`
   - `catalogue.json`
   - `summaries.json`
   - `countries-110m.json`
   - `logo.png`
4. Upload the entire folder **`Region-wise NSP-NHP documents [Living Repository]`** (keep the **exact name**).
   - If the uploader struggles, zip the folder on your Mac/PC, upload the `.zip`, then **Extract** in File Manager inside `atlas/`.

5. Visit **https://globalsurgeryconnect.org/atlas/** and hard-refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`).

### Option B — FTP (recommended for many or large PDFs)

1. hPanel → **Files** → **FTP Accounts**.
2. Create an FTP account (or use the main account). Note:
   - **Host:** often `ftp.globalsurgeryconnect.org` (shown in hPanel)
   - **Username** / **Password**
   - **Directory:** should point at `public_html` or `public_html/atlas`
3. Install **FileZilla** (free): [https://filezilla-project.org](https://filezilla-project.org)
4. Connect (try **SFTP** on port **22** if FTP is slow; Hostinger shows which to use).
5. On the **remote** side, go to `public_html/atlas/`.
6. On the **local** side, open your repo folder.
7. Drag these to `atlas/`:
   - `index.html`, `catalogue.json`, `summaries.json`, `countries-110m.json`, `logo.png`
   - The whole `Region-wise NSP-NHP documents [Living Repository]` folder
8. Wait until all transfers finish (PDFs can take a while).
9. Test **https://globalsurgeryconnect.org/atlas/**

### Option C — Download from GitHub, then upload

1. Open: `https://github.com/SNaqvi-Stevens/Global-NSP-NHP-Repository-`
2. **Code** → **Download ZIP**.
3. Unzip on your computer.
4. Upload the files listed above into `public_html/atlas/` (File Manager or FTP).

### Link from your main GSC site

Add a menu or button on globalsurgeryconnect.org, for example:

- **Label:** National Surgical & Health Policy Atlas  
- **URL:** `https://globalsurgeryconnect.org/atlas/`

**Embed on one page** (optional):

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

## Part 3 — How to upload new PDFs (ongoing)

PDFs are **not** uploaded through the website UI. Maintainers add files to the server (or Git), then refresh the catalogue.

### Step 1 — Choose the WHO region folder

| Region | Upload into this folder (inside `atlas/`) |
|--------|-------------------------------------------|
| Africa | `Region-wise NSP-NHP documents [Living Repository]/AFRO/` |
| Eastern Mediterranean | `.../EMR NSP-NHP Documents/` |
| Europe | `.../EURO/` |
| South-East Asia | `.../SEARO/` |
| Western Pacific | `.../WPR NSP-NHP Documents/` |

Use a clear filename, e.g. `KEN_Kenya_NSP_2024-2030.pdf` or `BEN_Benin_NHP_2018-2022.pdf`. Include **country name** and **NSP** or **NHP** (or words like *surgical*, *health policy*) in the name.

### Step 2 — Upload the PDF to Hostinger

**File Manager:** `public_html/atlas/` → open the correct regional folder → **Upload** → select the PDF.

**FTP:** Connect → navigate to the same regional folder on the server → upload the file.

### Step 3 — Regenerate `catalogue.json` on your computer

Hostinger does not run the build for you. On a Mac/PC with [Node.js](https://nodejs.org) installed:

```bash
cd /path/to/Global-NSP-NHP-Repository-
npm run catalogue
```

This rewrites **`catalogue.json`** from all PDFs in the regional folders.

### Step 4 — Upload the new `catalogue.json`

Upload **only** the updated `catalogue.json` to:

`public_html/atlas/catalogue.json`

(overwrite the old file).

### Step 5 — Verify

Open **https://globalsurgeryconnect.org/atlas/** → check the country appears in the table and map → test the PDF download link.

### Optional — Also update GitHub

If you use GitHub as the source of truth:

1. Add the PDF to the repo in the correct regional folder.
2. Run `npm run catalogue`.
3. Commit and push the PDF + `catalogue.json`.
4. Still upload the same PDF + `catalogue.json` to Hostinger (unless you automate sync later).

---

## Part 4 — How to make other updates on Hostinger

| What changed | What to upload to `public_html/atlas/` |
|--------------|----------------------------------------|
| New or replaced PDF | PDF file(s) + updated `catalogue.json` (after `npm run catalogue`) |
| Site design / map behaviour | `index.html` (and any changed assets) |
| Map hover excerpts | `summaries.json` (after `npm run summaries` on your computer) |
| Logo | `logo.png` — then in `index.html` bump `logo.png?v=2` to `?v=3` and upload `index.html` too |
| Wrong country/type from filename | Fix via `catalogue-overrides.json` locally, `npm run catalogue`, upload `catalogue.json` |

You only need to re-upload **files that changed**, not the whole site every time.

### Typical “monthly update” workflow

1. Receive approved PDF(s) from the submission form / reviewers.
2. Upload PDF(s) to the correct regional folder on Hostinger (FTP is fastest).
3. On your computer: pull latest repo (if using Git) → add same PDF(s) → `npm run catalogue`.
4. Upload new `catalogue.json` to Hostinger.
5. Spot-check the live site.

---

## Part 5 — Optional: Git on Hostinger

Some Hostinger plans support **Git** in hPanel (**Advanced** → **Git**):

- You can connect the GitHub repository and deploy into a directory.
- After setup, a **push to GitHub** might deploy automatically.

If Git is not available on your plan, use **FTP/File Manager** as above. GitHub can remain the backup; Hostinger is the live copy for **globalsurgeryconnect.org**.

---

## Part 6 — Troubleshooting

| Problem | What to check |
|---------|----------------|
| **404** on `catalogue.json` | File must sit next to `index.html` in `atlas/` |
| **404** on PDF download | Folder name must be exactly `Region-wise NSP-NHP documents [Living Repository]`; PDF must be in the correct subfolder |
| Map is empty | Upload `countries-110m.json` into `atlas/` |
| Country missing after PDF upload | Run `npm run catalogue` locally; upload new `catalogue.json` |
| Old content after update | Hard refresh; clear browser cache |
| Upload fails / times out | Use FTP; or zip folder, upload, extract in File Manager |
| Main site works, `/atlas/` does not | Confirm files are in `public_html/atlas/`, not only in `public_html/` root |
| WordPress / builder on main site | Keep atlas in **`/atlas/`** subfolder; do not replace root `index.php` unless intentional |

---

## Part 7 — Checklist

### First-time go-live

- [ ] SSL enabled for globalsurgeryconnect.org  
- [ ] Folder `public_html/atlas/` created  
- [ ] `index.html`, `catalogue.json`, `summaries.json`, `countries-110m.json`, `logo.png` uploaded  
- [ ] Full `Region-wise NSP-NHP documents [Living Repository]` tree uploaded  
- [ ] **https://globalsurgeryconnect.org/atlas/** loads map and table  
- [ ] Sample PDF download works  
- [ ] Link or iframe added on main GSC site  

### Each new country PDF

- [ ] PDF in correct WHO regional folder on Hostinger  
- [ ] `npm run catalogue` run locally  
- [ ] Updated `catalogue.json` uploaded to Hostinger  
- [ ] Country visible on live site  

---

## Quick reference

| Item | Value |
|------|--------|
| Domain | **globalsurgeryconnect.org** |
| Recommended atlas URL | **https://globalsurgeryconnect.org/atlas/** |
| Server folder | `public_html/atlas/` |
| Regenerate country list | `npm run catalogue` (on your computer) |
| Public submission form | [Google Form](https://docs.google.com/forms/d/e/1FAIpQLSeLDdphTpkC97SoSObe_IiwPr7bscEgK33IXQ0HI-yHDOo0Fw/viewform) |
| GitHub repo (backup / source) | [Global-NSP-NHP-Repository-](https://github.com/SNaqvi-Stevens/Global-NSP-NHP-Repository-) |

---

## Who does what

| Role | Action |
|------|--------|
| **Public contributor** | Submission form only |
| **Regional reviewer** | Approves document |
| **Maintainer** | Upload PDF → `npm run catalogue` → upload `catalogue.json` to Hostinger (and optionally push to GitHub) |
| **GSC web lead** | Hostinger access, SSL, menu link or iframe on main site |

For catalogue overrides, scripts, and GitHub Actions, see [README.md](README.md).
