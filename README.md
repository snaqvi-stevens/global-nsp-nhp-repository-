# National Surgical & Health Policy Repository

A global library of **National Surgical Plans (NSPs)** and **National Health Policies (NHPs)**. The public sees an interactive map and a table of countries with download links.

**Live atlas (main website):**  
https://globalsurgeryconnect.org/atlas/

**Backup copy:**  
https://snaqvi-stevens.github.io/Global-NSP-NHP-Repository-/

---

## Who this guide is for

This guide is for **regional reviewers and maintainers** who add approved PDFs. You do **not** need to be a programmer. If you can upload a file to a website (like email attachments or Google Drive), you can do this using **GitHub in your web browser**.

**You do not need to edit the website code** to add a new country document.

**Technical setup** (connecting the website to GitHub, Hostinger, etc.) is in [Hostinger_README.md](Hostinger_README.md) — usually done once by whoever manages the domain.

---

## The simple idea

1. Approved PDFs are stored in **GitHub** (our online filing cabinet).
2. When files are added or updated there, the **live map and table update automatically** within a few minutes.
3. You **upload the PDF to the correct regional folder** on GitHub. The system updates the country list for you.

You should **not** log into Hostinger to upload each PDF if GitHub is already connected (see [Hostinger_README.md](Hostinger_README.md)).

---

## How to add a new country PDF (easiest way — in your browser)

You need:

- A **GitHub account** with permission to edit this repository  
- The **approved PDF** on your computer  
- About **10 minutes**

### Step 1 — Open the repository

1. Go to: https://github.com/SNaqvi-Stevens/Global-NSP-NHP-Repository-  
2. Sign in to GitHub if asked.

### Step 2 — Open the right regional folder

Click into this folder (one click at a time):

**`Region-wise NSP-NHP documents [Living Repository]`**

Then open **one** of these folders based on the country’s WHO region:

| If the country is in… | Open this folder |
|------------------------|------------------|
| Africa | **AFRO** |
| Eastern Mediterranean | **EMR NSP-NHP Documents** |
| Europe | **EURO** |
| South-East Asia | **SEARO** |
| Western Pacific | **WPR NSP-NHP Documents** |

### Step 3 — Upload the PDF

1. Click the **Add file** button (near the top right).  
2. Choose **Upload files**.  
3. Drag your PDF into the box, or click **choose your files**.  
4. Wait until the upload finishes.

### Step 4 — Name the file clearly (before you save)

Use a name that includes:

- **Country name** (e.g. Kenya, Benin)  
- Whether it is an **NSP** or **NHP** (or words like *surgical*, *health policy*, *national plan*)  
- **Years** if you know them (e.g. 2018-2022)

**Good examples:**

- `KEN_Kenya_NSP_2024-2030.pdf`  
- `BEN_Benin_NHP_2018-2022.pdf`

**Avoid vague names** like `document.pdf` or `final_version2.pdf`.

### Step 5 — Save on GitHub

1. Scroll down to **Commit changes**.  
2. In the short message box, type something plain, e.g. `Add Kenya NSP 2024`.  
3. Leave **Commit directly to the `main` branch** selected.  
4. Click **Commit changes**.

### Step 6 — Wait, then check the live site

1. Wait **about 5–10 minutes** (the site needs time to refresh).  
2. Open https://globalsurgeryconnect.org/atlas/  
3. Search for the country or find it on the map.  
4. Click the country and try **opening the PDF**.

**Done.** You do not need to upload the same file again on Hostinger.

---

## What happens behind the scenes (you don’t have to do this)

After you upload a PDF, GitHub can **automatically rebuild** the files the website uses (country list, discipline tags). That is normal. You might see one or two extra automatic updates in the repository — no action needed from you.

If the country **still does not appear** after 15 minutes, ask a technical teammate to help (see **When something goes wrong** below).

---

## Updating or replacing a PDF

1. Go to the same regional folder on GitHub.  
2. Click the **existing file** you want to replace.  
3. Click the **pencil (Edit)** icon or **Delete** the old file, then upload the new one using **Add file → Upload files**.  
4. **Commit changes** with a short message (e.g. `Replace Benin NHP with 2024 version`).  
5. Check the live site after a few minutes.

---

## Public submissions (people without GitHub access)

Anyone can suggest a document using the **submission form**:

https://docs.google.com/forms/d/e/1FAIpQLSeLDdphTpkC97SoSObe_IiwPr7bscEgK33IXQ0HI-yHDOo0Fw/viewform

**Workflow:**

1. Someone submits via the form.  
2. Regional reviewers check and approve.  
3. A maintainer (you) uploads the approved PDF to GitHub using the steps above.

---

## When something goes wrong

| What you see | What to do |
|--------------|------------|
| Country **not on the map** after 15 minutes | Wait a bit longer, hard-refresh the page (Ctrl+Shift+R or Cmd+Shift+R). If still missing, contact someone with “technical” access — the country list file may need a manual refresh. |
| **Wrong label** (NSP shown as NHP or vice versa) | Rename the file to include **NSP** or **NHP** clearly, re-upload, or ask a technical teammate to fix the filename rules file. |
| **Wrong surgical discipline tags** on the table (e.g. missing Nursing) | Ask a technical teammate to fix `discipline-overrides.json` and run `npm run disciplines` (see **For technical teammates only**). |
| **PDF won’t open** | Check the file uploaded fully on GitHub (open it there and try to view). Re-upload if needed. |
| **Live site never changes** | GitHub may not be connected to the website yet — see [Hostinger_README.md](Hostinger_README.md) or ask your web lead. |
| You **don’t have GitHub access** | Ask your team lead for access, or send the approved PDF to whoever maintains the repository. |

---

## Quick checklist (print-friendly)

- [ ] PDF is reviewed and approved  
- [ ] Logged into GitHub  
- [ ] Opened correct **WHO region** folder  
- [ ] Uploaded PDF with a **clear filename**  
- [ ] Clicked **Commit changes** to **main**  
- [ ] Waited 5–10 minutes  
- [ ] Checked https://globalsurgeryconnect.org/atlas/  

---

## What the atlas shows (for reference)

Besides NSP/NHP status, the live map and table can show:

| Feature | What it means |
|---------|----------------|
| **World Bank income level** | Income group and GNI per capita for every country (not only countries with a PDF). |
| **Development status** | Developed / developing / least developed (from World Bank + UN lists). |
| **Health financing** | Whether health spending is mostly **public**, **private**, or **mixed** (World Bank data). |
| **Surgical disciplines** | Which topics (anesthesia, nursing, OBGYN, general surgery, trauma, pediatrics, plastics, etc.) appear in the **PDF text** — used for filters on the table and map. |

Striped countries on the map = a document is in this repository. Light borders on all countries.

---

## For technical teammates only

These items are **not** required for everyday PDF uploads.

### One-time setup on your computer

1. Install [Node.js](https://nodejs.org/) (LTS version).  
2. Open a terminal in this project folder.  
3. Run: `npm install`

### Commands (run in the project folder)

| What you need | Command | What to commit |
|---------------|---------|----------------|
| Refresh country list after PDF changes | `npm run catalogue` | `catalogue.json` |
| Refresh surgical discipline tags from PDFs | `npm run disciplines` | `discipline-tags.json` |
| Refresh World Bank income, GNI, health financing (yearly) | `npm run country-meta` | `country-meta.json` |
| Optional map hover summaries from PDFs | `npm run summaries` | `summaries.json` |

**Typical workflow after adding or replacing PDFs:**

```bash
npm install
npm run catalogue
npm run disciplines
git add catalogue.json discipline-tags.json
git commit -m "Refresh catalogue and discipline tags after new PDFs"
git push
```

GitHub Actions may run `catalogue` and `disciplines` for you when PDFs are pushed to `main`; if the live site looks stale, run the commands locally and push the JSON files.

### Fix wrong country or NSP/NHP type

Edit **`catalogue-overrides.json`** (optional), then run `npm run catalogue` and commit `catalogue.json`.

Example:

```json
{
  "byFilename": {
    "MyCountry_NSP_2024.pdf": { "country": "My Country", "kind": "nsp" }
  }
}
```

### Fix wrong surgical discipline tags

Disciplines are detected by scanning PDF text for keywords (anesthesia, nursing, OBGYN, general surgery, trauma, cardio, vascular, ortho, ENT, GI, pediatrics, plastics). Automated scans are not perfect.

1. Edit **`discipline-overrides.json`** in the project root.  
2. Run `npm run disciplines`.  
3. Commit and push **`discipline-tags.json`**.

**By country** — add or remove tags for every file for that country:

```json
{
  "byCountry": {
    "India": {
      "add": ["cardio"],
      "remove": ["gensurg"]
    }
  },
  "byFilename": {}
}
```

**By file** — set exact tags for one PDF (overrides the scan for that file):

```json
{
  "byCountry": {},
  "byFilename": {
    "India_NSP_2024.pdf": {
      "set": ["nursing", "obgyn", "gensurg", "anesthesia"]
    }
  }
}
```

Use `"set"` to replace all tags for that file, or `"add"` / `"remove"` on a country to adjust the merged list.

Valid discipline ids: `anesthesia`, `nursing`, `obgyn`, `gensurg`, `trauma`, `cardio`, `vascular`, `ortho`, `ent`, `gi`, `pediatrics`, `plastics`.

### Other technical notes

| Topic | Where to read |
|--------|----------------|
| Connect GitHub to Hostinger, auto-deploy, webhooks | [Hostinger_README.md](Hostinger_README.md) |
| Fix rare map name mismatches | Edit `index.html` (`ourToTopo`) |

Repository link for developers: https://github.com/SNaqvi-Stevens/Global-NSP-NHP-Repository-
