const { test: base } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

exports.test = base.extend({
  page: async ({ page }, use) => {
    await use(page);

    const coverage = await page.evaluate(() => window.__coverage__ || null);
    if (coverage) {
      const dir = path.join(process.cwd(), ".nyc_output");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);

      const file = path.join(dir, `pw-${Date.now()}.json`);
      fs.writeFileSync(file, JSON.stringify(coverage));
    }
  },
});

exports.expect = require("@playwright/test").expect;
