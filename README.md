# Nakul Dev M V — Resume

Latest resume always available at:
**[nakuldevmv.github.io/Resume/Nakul_Dev_M_V_Resume.pdf](https://nakuldevmv.github.io/Resume/Nakul_Dev_M_V_Resume.pdf)**

---

## How it works

A GitHub Actions workflow runs daily at 06:00 UTC. It opens the Overleaf project in a headless browser, grabs the compiled PDF, and pushes it here automatically.

- `Nakul_Dev_M_V_Resume.pdf` — always the latest version
- `scrapped/` — daily numbered archive, auto-deleted after 7 days
- `linkHistory.json` — log of every download with timestamp and link

---

## Setting this up for your own Overleaf project

**1. Clone and install**
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
npm install
npx playwright install chromium
```

**2. Set your Overleaf share link**

In `scraper.js` line 8, replace the URL with your own:
```js
const TARGET_URL = "https://www.overleaf.com/read/YOUR_PROJECT_ID";
```
Make sure your Overleaf project is set to **"Anyone with the link can view"**.

**3. Set your PDF filename** *(optional)*

In `scraper.js` line 14:
```js
const ROOT_PDF_NAME = "Your_Name_Resume.pdf";
```

**4. Push to GitHub, then enable Actions write permissions**

Go to **Settings → Actions → General → Workflow permissions** and select **Read and write permissions**.

**5. Test it**

Go to **Actions → Overleaf PDF Scraper → Run workflow** and confirm a PDF gets committed.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Timeout error | Overleaf was slow to compile — just re-run the workflow |
| No commit made | PDF hasn't changed since last run — this is normal |
| Permission denied on push | Check Step 4 above |

---

## Stack

[Playwright](https://playwright.dev) · GitHub Actions · Node.js
