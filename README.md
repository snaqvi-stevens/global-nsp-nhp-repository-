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

After you upload a PDF, GitHub can **automatically rebuild the country list** file the website uses. That is normal. You might see an extra automatic update in the repository — no action needed from you.

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

## For technical teammates only

These items are **not** required for everyday PDF uploads:

| Topic | Where to read |
|--------|----------------|
| Connect GitHub to Hostinger, auto-deploy, webhooks | [Hostinger_README.md](Hostinger_README.md) |
| Refresh country list manually on a computer | Run `npm run catalogue` in the project folder |
| Refresh World Bank income / GNI data (yearly) | Run `npm run country-meta` and commit `country-meta.json` |
| Optional map hover text from PDFs | Run `npm run summaries` |
| Fix rare map name mismatches | Edit `index.html` (`ourToTopo`) |

Repository link for developers: https://github.com/SNaqvi-Stevens/Global-NSP-NHP-Repository-
