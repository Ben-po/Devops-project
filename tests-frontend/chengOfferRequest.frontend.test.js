const path = require("path");

function setupDOM() {
  document.body.innerHTML = `
    <!-- Buttons + modals expected by Cheng.js -->
    <button id="addOfferBtn"></button>
    <button id="addRequestBtn"></button>

    <div id="offerModal" style="display:none"></div>
    <div id="requestModal" style="display:none"></div>

    <span id="closeOffer"></span>
    <span id="closeRequest"></span>

    <!-- Forms expected by Cheng.js -->
    <form id="offerForm">
      <input id="offerName" />
      <input id="offerSkill" />
      <button type="submit">Submit</button>
    </form>

    <form id="requestForm">
      <input id="requestName" />
      <input id="requestSkill" />
      <button type="submit">Submit</button>
    </form>

    <!-- Lists expected by Cheng.js -->
    <ul id="offersList"></ul>
    <ul id="requestsList"></ul>
  `;
}

function mockFetch() {
  global.fetch = jest.fn(async (url, opts) => {
    // GETs triggered by loadData()
    if (url === "/api/offers" && (!opts || opts.method === undefined)) {
      return { ok: true, json: async () => [] };
    }
    if (url === "/api/requests" && (!opts || opts.method === undefined)) {
      return { ok: true, json: async () => [] };
    }

    // POSTs from submitting forms
    return { ok: true, json: async () => ({ message: "ok", post: { id: 1 } }) };
  });
}

beforeEach(() => {
  jest.resetModules(); // important: so Cheng.js runs fresh each test
  setupDOM();
  mockFetch();
});

test("Offer form submit triggers POST /api/offers", async () => {
  require(path.join(__dirname, "../public/js/Cheng.js"));

  // Trigger Cheng.js DOMContentLoaded handler
  document.dispatchEvent(new Event("DOMContentLoaded"));

  document.getElementById("offerName").value = "Cheng";
  document.getElementById("offerSkill").value = "React";

  // Submit form
  document.getElementById("offerForm").dispatchEvent(
    new Event("submit", { bubbles: true, cancelable: true })
  );

  // let pending promises resolve
  await Promise.resolve();

  const offerPostCall = global.fetch.mock.calls.find(
    ([url, opts]) => url === "/api/offers" && opts && opts.method === "POST"
  );

  expect(offerPostCall).toBeTruthy();
  expect(offerPostCall[1].body).toBe(JSON.stringify({ name: "Cheng", skill: "React" }));
});

test("Request form submit triggers POST /api/requests", async () => {
  require(path.join(__dirname, "../public/js/Cheng.js"));

  document.dispatchEvent(new Event("DOMContentLoaded"));

  document.getElementById("requestName").value = "Cheng";
  document.getElementById("requestSkill").value = "Node";

  document.getElementById("requestForm").dispatchEvent(
    new Event("submit", { bubbles: true, cancelable: true })
  );

  await Promise.resolve();

  // ✅ Find the POST call to /api/requests (ignore loadData GETs)
  const requestPostCall = global.fetch.mock.calls.find(
    ([url, opts]) => url === "/api/requests" && opts && opts.method === "POST"
  );

  expect(requestPostCall).toBeTruthy();
  expect(requestPostCall[1].body).toBe(JSON.stringify({ name: "Cheng", skill: "Node" }));
});

test("Offer modal opens and closes correctly", () => {
  require("../public/js/Cheng.js");

  document.dispatchEvent(new Event("DOMContentLoaded"));

  const addOfferBtn = document.getElementById("addOfferBtn");
  const offerModal = document.getElementById("offerModal");
  const closeOffer = document.getElementById("closeOffer");

  // Open modal
  addOfferBtn.click();
  expect(offerModal.style.display).toBe("block");

  // Close modal
  closeOffer.click();
  expect(offerModal.style.display).toBe("none");
});
