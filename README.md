# 📄 Overleaf Resume Auto-Scraper

Automatically downloads your compiled resume PDF from an Overleaf shared link every day and pushes it to this repository — both as a versioned archive and as a single always-fresh copy with a fixed filename.

---

## 📁 Repository Structure

```
your-repo/
├── .github/
│   └── workflows/
│       └── scrape.yml          # GitHub Actions workflow
├── scrapped/
│   ├── resume01.pdf            # Versioned daily copies (auto-deleted after 7 days)
│   ├── resume02.pdf
│   └── ...
├── scraper.js                  # The scraper script
├── package.json
├── package-lock.json
├── linkHistory.json            # Auto-generated log of every download
└── Nakul_Dev_M_V_Resume.pdf    # ← Always the latest resume (fixed filename)
```

---

## ⚙️ How It Works

1. A GitHub Actions workflow triggers every day at **06:00 UTC**
2. It launches a headless Chromium browser and opens your Overleaf share link
3. It waits for Overleaf to finish compiling your project
4. It finds the PDF download link and downloads the compiled PDF
5. The PDF is saved in two places:
   - `scrapped/resumeXX.pdf` — a numbered archive copy
   - `Nakul_Dev_M_V_Resume.pdf` — always overwritten with the latest version
6. Any archive copies in `scrapped/` older than **7 days** are automatically deleted
7. All changes are committed and pushed back to the repository

---

## 🚀 Setup Guide

### Prerequisites

- A GitHub account
- Node.js **v18 or higher** installed on your machine
- The Overleaf project must be shared with **"Anyone with the link can view"**

---

### Step 1 — Fork or clone this repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

---

### Step 2 — Install dependencies locally (one-time setup)

```bash
npm install
npx playwright install chromium
```

> This installs Playwright and downloads the Chromium browser used for scraping.

---

### Step 3 — Update the Overleaf URL

Open `scraper.js` and change the `TARGET_URL` on **line 8** to your own Overleaf share link:

```js
// scraper.js — line 8
const TARGET_URL = "https://www.overleaf.com/read/YOUR_PROJECT_ID#HASH";
```

To get your share link from Overleaf:
1. Open your project in Overleaf
2. Click **Share** (top right)
3. Turn on **"Anyone with the link can view"**
4. Copy the link — it looks like `https://www.overleaf.com/read/xxxxxxxxxxxx`

---

### Step 4 — (Optional) Change the root PDF filename

If you want a different filename for the fixed root copy, update **line 14** in `scraper.js`:

```js
// scraper.js — line 14
const ROOT_PDF_NAME = "Your_Name_Resume.pdf";
```

---

### Step 5 — Push your changes to GitHub

```bash
git add .
git commit -m "chore: configure scraper"
git push
```

---

### Step 6 — Enable write permissions for GitHub Actions

This is required so the workflow can commit and push PDFs back to the repo.

1. Go to your repository on GitHub
2. Click **Settings** → **Actions** → **General**
3. Scroll down to **Workflow permissions**
4. Select **"Read and write permissions"**
5. Click **Save**

---

### Step 7 — Verify it works

Trigger the workflow manually to confirm everything is set up correctly:

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Select **"Overleaf PDF Scraper"** from the left sidebar
4. Click **"Run workflow"** → **"Run workflow"**
5. Watch the run — it should complete in under 3 minutes
6. Check that `Nakul_Dev_M_V_Resume.pdf` and a new `scrapped/resumeXX.pdf` appear in your repo

---

## 🕕 Schedule

The workflow runs automatically every day at **06:00 UTC**.

| UTC | IST | EST | PST |
|-----|-----|-----|-----|
| 06:00 | 11:30 | 01:00 | 22:00 (prev. day) |

To change the schedule, edit the `cron` line in `.github/workflows/scrape.yml`:

```yaml
# Runs every day at 06:00 UTC — edit this to change the time
- cron: "0 6 * * *"
```

Cron format: `minute hour day month weekday`  
Use [crontab.guru](https://crontab.guru) to easily build a custom schedule.

---

## 📋 linkHistory.json

Every successful download is logged here automatically. Each entry looks like:

```json
{
  "timestamp": "2026-03-15T06:02:41.000Z",
  "scrappedFile": "scrapped/resume01.pdf",
  "rootFile": "Nakul_Dev_M_V_Resume.pdf",
  "link": "https://www.overleaf.com/download/project/abc123.../output.pdf?..."
}
```

---

## 🗑️ Automatic Cleanup

Archive copies in `scrapped/` are **automatically deleted after 7 days** on each run.  
`Nakul_Dev_M_V_Resume.pdf` in the root is **never deleted** — it is only overwritten.

---

## 🔧 Running Locally

You can also run the scraper manually on your own machine:

```bash
node scraper.js
```

The PDF will be saved to `scrapped/` and `Nakul_Dev_M_V_Resume.pdf` in the same folder as the script.

---

## ❓ Troubleshooting

| Problem | Fix |
|---------|-----|
| Workflow fails with **Timeout 90000ms exceeded** | Overleaf took too long to compile. Try running the workflow again, or open the share link in your browser first to trigger a compile. |
| **"Download link not found"** error | Your Overleaf project may not be set to public. Double-check the share settings (Step 3). |
| Workflow runs but **no commit is made** | The PDF content hasn't changed since the last run — this is expected and not an error. |
| **Permission denied** when pushing | Re-check Step 6 to ensure write permissions are enabled for Actions. |
| Node.js version warnings in Actions | Already handled — the workflow uses `actions/checkout@v4.2.2` and `actions/setup-node@v4.4.0`. |

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `playwright` | Headless browser automation to load the Overleaf page and find the download link |

No other third-party packages are required.

---

## 📝 License

MIT — do whatever you want with it.
