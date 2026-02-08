const request = require("supertest");
const app = require("../server");

describe("Offers & Requests API tests", () => {
  test("POST /api/offers returns 201 and created post", async () => {
    const res = await request(app)
      .post("/api/offers")
      .send({ name: "Cheng", skill: "React" });

    expect(res.status).toBe(201);
    expect(res.body.post.username).toBe("Cheng");
    expect(res.body.post.skill).toBe("React");
    expect(res.body.post.id).toBeDefined();
  });

  test("POST /api/requests returns 201 and created post", async () => {
    const res = await request(app)
      .post("/api/requests")
      .send({ name: "Cheng", skill: "Node" });

    expect(res.status).toBe(201);
    expect(res.body.post.username).toBe("Cheng");
    expect(res.body.post.skill).toBe("Node");
  });

  test("POST /api/offers returns 400 for missing fields", async () => {
    const res = await request(app)
      .post("/api/offers")
      .send({ name: "Cheng" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("POST /api/offers persists data and is retrievable via GET", async () => {
    const newOffer = { name: "ChengPersist", skill: "Testing" };

    const postRes = await request(app)
        .post("/api/offers")
        .send(newOffer);

    expect(postRes.status).toBe(201);

    const getRes = await request(app).get("/api/offers");

    expect(getRes.status).toBe(200);

    const found = getRes.body.some(
        o => o.username === "ChengPersist" && o.skill === "Testing"
    );

    expect(found).toBe(true);
    });

});
