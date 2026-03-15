// scraper-private.js
// Downloads the private resume PDF to a temp path for the workflow to zip.
// This file is NEVER committed to the repo directly — only the zip is.

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const TARGET_URL = process.env.OVERLEAF_PRIVATE_URL;
const OVERLEAF_BASE = "https://www.overleaf.com";

// Save to a temp file — workflow will zip this and then delete it
const TEMP_PDF_PATH = path.join(__dirname, "..", "temp_private_resume.pdf");

function downloadFile(url, destPath, cookies) {
  return new Promise((resolve, reject) => {
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const parsedUrl = new URL(url);
    const lib = parsedUrl.protocol === "https:" ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      headers: {
        Cookie: cookieHeader,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: TARGET_URL,
      },
    };

    const file = fs.createWriteStream(destPath);

    const request = lib.request(options, (response) => {
      if (
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        file.close();
        fs.unlinkSync(destPath);
        return downloadFile(response.headers.location, destPath, cookies)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        return reject(new Error(`Download failed — HTTP ${response.statusCode}`));
      }

      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    });

    request.on("error", (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });

    request.end();
  });
}

async function run() {
  console.log(`[${new Date().toISOString()}] 🔍  Scraping private resume…`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  try {
    console.log("   ↳ Loading Overleaf page…");
    await page.goto(TARGET_URL, { waitUntil: "networkidle", timeout: 60_000 });

    console.log("   ↳ Waiting for download link…");
    await page.waitForSelector('a[href^="/download/project"]', {
      state: "attached",
      timeout: 90_000,
    });

    const relativeHref = await page.evaluate(() => {
      const links = Array.from(
        document.querySelectorAll('a[href^="/download/project"]')
      );
      const pdfLink = links.find((el) => el.href.includes("output.pdf"));
      return pdfLink
        ? new URL(pdfLink.href).pathname + new URL(pdfLink.href).search
        : links[0]?.getAttribute("href") ?? null;
    });

    if (!relativeHref) throw new Error("Download link not found.");

    const fullUrl = `${OVERLEAF_BASE}${relativeHref}`;
    console.log(`   ↳ Extracted link: ${fullUrl}`);

    const cookies = await context.cookies();
    await downloadFile(fullUrl, TEMP_PDF_PATH, cookies);
    console.log(`   ✅  Saved to temp: ${TEMP_PDF_PATH}`);

  } catch (err) {
    console.error(`   ❌  Error: ${err.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();