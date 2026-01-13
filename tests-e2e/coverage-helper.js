const fs = require("fs");
const path = require("path");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function safeFileName(name) {
  return name.replace(/[^a-z0-9-_]/gi, "_");
}

async function saveCoverage(page, testInfo) {
  // Grab browser coverage object (Istanbul)
  const coverage = await page.evaluate(() => window.__coverage__ || null);

  if (!coverage) return; // if page never loaded instrumented JS

  const outDir = path.join(process.cwd(), ".nyc_output");
  ensureDir(outDir);

  const file = path.join(
    outDir,
    `${Date.now()}_${safeFileName(testInfo.title)}.json`
  );

  fs.writeFileSync(file, JSON.stringify(coverage), "utf8");
}

module.exports = { saveCoverage };
