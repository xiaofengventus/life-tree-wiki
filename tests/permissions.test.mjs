import test from "node:test";
import assert from "node:assert/strict";
import { requireRole } from "../server/auth.js";

test("site owner bypasses role restrictions", () => {
  assert.doesNotThrow(() =>
    requireRole({ public_id: 1, role: "USER" }, ["ADMIN"]),
  );
});

test("ordinary users still need an allowed role", () => {
  assert.throws(
    () => requireRole({ public_id: 8, role: "USER" }, ["ADMIN"]),
    (error) => error?.status === 403 && error?.code === "FORBIDDEN",
  );
  assert.doesNotThrow(() =>
    requireRole({ public_id: 8, role: "ADMIN" }, ["ADMIN"]),
  );
});
