const { test, expect } = require("./coverage.fixture");
const fs = require("fs");
const path = require("path");
const { saveCoverage } = require("./coverage-helper");

// Adjust if your paths differ
const offersFile = path.join(__dirname, "..", "data", "offers.json");
const requestsFile = path.join(__dirname, "..", "data", "requests.json");
const usersFile = path.join(__dirname, "..", "utils", "skilllink.json");

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

function makeToken(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

test.describe("SkillLink UI (edit/delete)", () => {
  test.beforeEach(async ({ page }) => {
    // Seed backend data files BEFORE page loads
    const myUser = { id: "u1", username: "pavian", passwordHash: "x" };
    const otherUser = { id: "u2", username: "alex", passwordHash: "x" };

    writeJson(usersFile, [myUser, otherUser]);

    writeJson(offersFile, [
      {
        id: 11,
        userId: myUser.id,
        username: myUser.username,
        skill: "OldSkill",
        category: "OldCat",
        description: "Old description text",
      },
    ]);

    writeJson(requestsFile, [
      {
        id: 33,
        userId: otherUser.id,
        username: otherUser.username,
        skill: "ReqSkill",
        category: "ReqCat",
        description: "Req description long enough",
      },
    ]);

    // Auto-accept alerts/confirms
    page.on("dialog", (d) => d.accept());
  });

  test("Edit offer: opens modal and saves changes", async ({ page }) => {
    const token = makeToken({ id: "u1", username: "pavian" });

    // Must set both, because your code reads both
    await page.addInitScript(({ token }) => {
      localStorage.setItem("sl_token", token);
      localStorage.setItem("loggedInUser", "pavian");
    }, { token });

    await page.goto("/index.html");

    // Wait for posts to render and for action buttons to appear
    await expect(page.getByText("I can teach OldSkill")).toBeVisible();

    // Click Edit (only one offer seeded)
    await page.getByRole("button", { name: "Edit" }).click();

    await expect(page.locator("#editModal")).toBeVisible();

    await page.fill("#editSkillInput", "NewSkill");
    await page.fill("#editCategoryInput", "NewCat");
    await page.fill("#editDescriptionInput", "New description text");

    await page.getByRole("button", { name: "Save Changes" }).click();

    // After save, UI should refresh
    await expect(page.getByText("I can teach NewSkill")).toBeVisible();
  });

  test("Delete request: confirm + removes post", async ({ page }) => {
    const token = makeToken({ id: "u2", username: "alex" });

    await page.addInitScript(({ token }) => {
      localStorage.setItem("sl_token", token);
      localStorage.setItem("loggedInUser", "alex");
    }, { token });

    await page.goto("/index.html");

    await expect(page.getByText("I want to learn ReqSkill")).toBeVisible();

    // Click Delete (for the request)
    await page.getByRole("button", { name: "Delete" }).click();

    // Should be gone after reload
    await expect(page.getByText("I want to learn ReqSkill")).toHaveCount(0);
  });

  test("Not logged in: edit blocked with alert", async ({ page }) => {
    // No token set
    await page.goto("/index.html");

    // With no token, buttons usually won't show (because currentUserId is null).
    // So we directly call handleEdit to test the guard.
    await page.evaluate(() => {
      window.handleEdit({
        id: 11,
        skill: "OldSkill",
        category: "OldCat",
        description: "Old description text",
      });
    });

    // Alert auto-accepted; just confirm modal did not open
    await expect(page.locator("#editModal")).toBeHidden();
  });

  test.afterEach(async ({ page }, testInfo) => {
    await saveCoverage(page, testInfo);
  });
});
