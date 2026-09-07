import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_VISIBILITY,
  PRIVATE_WORK_LIMIT,
  PUBLIC_VISIBILITY,
  normalizeVisibility,
  releasePrivateWorkSlotStatement,
  reservePrivateWorkSlotStatement,
  throwPrivateWorkDatabaseError,
} from "../server/privateWorks.js";

test("private work visibility defaults to public and normalizes input", () => {
  assert.equal(normalizeVisibility(undefined), PUBLIC_VISIBILITY);
  assert.equal(normalizeVisibility("private"), PRIVATE_VISIBILITY);
  assert.equal(
    normalizeVisibility(undefined, PRIVATE_VISIBILITY),
    PRIVATE_VISIBILITY,
  );
});

test("invalid visibility is rejected", () => {
  assert.throws(
    () => normalizeVisibility("friends"),
    (error) => error?.status === 400 && error?.code === "INVALID_VISIBILITY",
  );
});

test("database private quota errors have a stable API response", () => {
  assert.equal(PRIVATE_WORK_LIMIT, 5);
  assert.throws(
    () =>
      throwPrivateWorkDatabaseError(
        new Error(
          "D1_ERROR: NOT NULL constraint failed: private_work_slots.slot_number",
        ),
      ),
    (error) =>
      error?.status === 409 &&
      error?.code === "PRIVATE_WORK_LIMIT" &&
      error?.message.includes("5"),
  );
});

test("slot statements reserve one of five shared slots and release only after state changes", () => {
  const DB = {
    prepare(sql) {
      return {
        bind(...bindings) {
          return { sql, bindings };
        },
      };
    },
  };
  const reserve = reservePrivateWorkSlotStatement(
    DB,
    "user-1",
    "POST",
    "post-1",
    "2026-07-29T00:00:00.000Z",
  );
  assert.match(reserve.sql, /UNION ALL SELECT 5/);
  assert.match(reserve.sql, /NOT EXISTS/);
  assert.deepEqual(reserve.bindings.slice(0, 4), [
    "user-1",
    "user-1",
    "POST",
    "post-1",
  ]);

  const release = releasePrivateWorkSlotStatement(DB, "TREE", "tree-1");
  assert.match(release.sql, /published_trees/);
  assert.match(release.sql, /visibility = 'PUBLIC' OR deleted_at IS NOT NULL/);
  assert.deepEqual(release.bindings, ["TREE", "tree-1", "tree-1"]);
});

test("public works cannot be changed back to private", () => {
  assert.throws(
    () =>
      throwPrivateWorkDatabaseError(
        new Error("D1: PUBLIC_WORK_CANNOT_BECOME_PRIVATE"),
      ),
    (error) =>
      error?.status === 409 &&
      error?.code === "PUBLIC_WORK_CANNOT_BECOME_PRIVATE",
  );
});
