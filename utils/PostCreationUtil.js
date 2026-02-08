function validateCreatePayload(body) {
  const { name, skill } = body || {};
  if (!name || !skill) {
    return { ok: false, error: "name and skill required" };
  }
  return { ok: true, name, skill };
}

function buildNewPost(id, name, skill) {
  return { id, username: name, skill, category: "", description: "" };
}

module.exports = { validateCreatePayload, buildNewPost };
