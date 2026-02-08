const { validateCreatePayload, buildNewPost } = require("../utils/PostCreationUtil");

describe("Post creation unit tests", () => {
  test("validateCreatePayload returns ok for valid body", () => {
    const res = validateCreatePayload({ name: "Cheng", skill: "React" });
    expect(res.ok).toBe(true);
    expect(res.name).toBe("Cheng");
    expect(res.skill).toBe("React");
  });

  test("validateCreatePayload fails if name missing", () => {
    const res = validateCreatePayload({ skill: "React" });
    expect(res.ok).toBe(false);
    expect(res.error).toBe("name and skill required");
  });

  test("buildNewPost formats post object correctly", () => {
    const post = buildNewPost(1, "Cheng", "Node");
    expect(post).toEqual({
      id: 1,
      username: "Cheng",
      skill: "Node",
      category: "",
      description: ""
    });
  });
});
