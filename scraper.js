const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

// ─── Config ───────────────────────────────────────────────────────────────────
const TARGET_URL = "https://www.overleaf.com/read/tjkyqztqyctw#de5d03";
const OVERLEAF_BASE = "https://www.overleaf.com";
const OUTPUT_DIR = path.join(__dirname, "scrapped");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
const HISTORY_FILE = path.join(OUTPUT_DIR, "linkHistory.json");
const PDF_BASE_NAME = "resume";
// ──────────────────────────────────────────────────────────────────────────────

function loadHistory() {
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
    } catch {
      console.warn("⚠️  linkHistory.json was corrupted — starting fresh.");
    }
  }
  return [];
}

function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf-8");
}

function nextPdfName() {
  const existing = fs
    .readdirSync(OUTPUT_DIR)
    .filter((f) => /^resume\d+\.pdf$/i.test(f))
    .map((f) => parseInt(f.replace(/\D/g, ""), 10))
    .filter((n) => !isNaN(n));

  const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  return `${PDF_BASE_NAME}${String(nextNum).padStart(2, "0")}.pdf`;
}

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
  console.log(`\n[${new Date().toISOString()}] 🔍  Starting scrape…`);

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

    console.log("   ↳ Waiting for download link to appear in DOM…");
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

    if (!relativeHref) throw new Error("Download link not found on the page.");

    const fullUrl = `${OVERLEAF_BASE}${relativeHref}`;
    console.log(`   ↳ Extracted link: ${fullUrl}`);

    const cookies = await context.cookies();
    const pdfName = nextPdfName();
    const destPath = path.join(OUTPUT_DIR, pdfName);

    console.log(`   ↳ Downloading → ${pdfName}`);
    await downloadFile(fullUrl, destPath, cookies);
    console.log(`   ✅  Saved: ${pdfName}`);

    const history = loadHistory();
    history.push({
      timestamp: new Date().toISOString(),
      filename: pdfName,
      link: fullUrl,
    });
    saveHistory(history);
    console.log(`   📝  History updated (${history.length} entries).`);

    // Output the filename so the workflow step can read it
    // console.log(`::set-output name=pdf_name::${pdfName}`);

  } catch (err) {
    console.error(`   ❌  Error: ${err.message}`);
    process.exit(1); // non-zero exit so the workflow marks it as failed
  } finally {
    await browser.close();
  }
}

run();
