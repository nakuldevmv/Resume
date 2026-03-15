# Nakul Dev M V — Resume

> Always up-to-date resume, auto-synced from Overleaf via GitHub Actions.

📄 **[Download Latest Resume](https://nakuldevmv.github.io/Resume/Nakul_Dev_M_V_Resume.pdf)**  
🌐 **[Portfolio](https://nakuldev.vercel.app)**

---

## How it works

A GitHub Actions workflow runs every hour. It opens the Overleaf project in a headless Chromium browser, grabs the compiled PDF, and pushes it back to this repo automatically.

| File / Folder | Purpose |
|---|---|
| `Nakul_Dev_M_V_Resume.pdf` | Always the latest version |
| `scrapped/` | Numbered daily archive, auto-deleted after 7 days |
| `linkHistory.json` | Log of every download with timestamp and link |

---

## Use this for your own Overleaf project

**1. Clone and install**
```bash
git clone https://github.com/nakuldevmv/Resume.git
cd Resume
npm install
npx playwright install chromium
```

**2. Set your Overleaf share link** — `scraper.js` line 8
```js
const TARGET_URL = "https://www.overleaf.com/read/YOUR_PROJECT_ID";
```
Make sure your project is set to **"Anyone with the link can view"** in Overleaf's Share settings.

**3. Set your PDF filename** — `scraper.js` line 14
```js
const ROOT_PDF_NAME = "Your_Name_Resume.pdf";
```

**4. Enable Actions write permissions**  
Go to **Settings → Actions → General → Workflow permissions** and select **Read and write permissions**.

**5. Test it**  
Go to **Actions → Overleaf PDF Scraper → Run workflow** and confirm a PDF gets committed.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Timeout error | Overleaf was slow to compile — re-run the workflow |
| No commit made | PDF hasn't changed since last run — this is normal |
| Permission denied on push | Re-check Step 4 |

---

## Built with

[Playwright](https://playwright.dev) · [GitHub Actions](https://github.com/features/actions) · Node.js

---

## Changing the schedule

Edit the `cron` line in `.github/workflows/scrape.yml`:

```yaml
on:
  schedule:
    - cron: "0 * * * *"  # change this
```

Cron format: `minute hour day month weekday`  
Use **[crontab.guru](https://crontab.guru)** to build and test your expression.

| Cron | Schedule |
|---|---|
| `0 * * * *` | Every hour *(current)* |
| `0 6 * * *` | Once a day at 06:00 UTC |
| `0 6 * * 1` | Every Monday at 06:00 UTC |
| `0 6,18 * * *` | Twice a day at 06:00 and 18:00 UTC |
| `*/30 * * * *` | Every 30 minutes *(may be delayed by GitHub)* |

> **Note:** GitHub's minimum supported interval is 5 minutes, but anything under 30 minutes is unreliable on free accounts. Hourly and above is recommended.
