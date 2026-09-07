import test from "node:test";
import assert from "node:assert/strict";
import { requireSameOrigin } from "../server/http.js";

function request(path, headers = {}) {
  return new Request(`https://life-tree.pages.dev${path}`, {
    method: "POST",
    headers,
  });
}

test("native mobile exchange accepts its explicit client header", () => {
  assert.doesNotThrow(() =>
    requireSameOrigin(request("/api/auth/mobile-exchange", {
      "x-life-client": "life-sequence-android",
    })),
  );
});

test("native authenticated writes require a valid bearer token", () => {
  assert.doesNotThrow(() =>
    requireSameOrigin(request("/api/posts", {
      "x-life-client": "life-sequence-android",
      authorization: `Bearer ${"a".repeat(32)}`,
    })),
  );
  assert.throws(
    () => requireSameOrigin(request("/api/posts", {
      "x-life-client": "life-sequence-android",
    })),
    (error) => error.code === "INVALID_ORIGIN",
  );
});

test("browser writes still require the deployed site origin", () => {
  assert.doesNotThrow(() =>
    requireSameOrigin(request("/api/posts", { origin: "https://life-tree.pages.dev" })),
  );
  assert.throws(
    () => requireSameOrigin(request("/api/posts", { origin: "https://attacker.example" })),
    (error) => error.code === "INVALID_ORIGIN",
  );
});
