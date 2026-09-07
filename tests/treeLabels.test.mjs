import test from "node:test";
import assert from "node:assert/strict";
import { treeSummary } from "../server/trees.js";
import { platformTreeLabel } from "../src/utils/treeLabels.js";

function summaryRow(overrides = {}) {
  return {
    id: "tree-id",
    public_id: 1,
    kind: "USER",
    platform_recommended: 1,
    creator_name: "作者",
    creator_public_id: 1,
    creator_role: "USER",
    title: "测试树",
    node_count: 2,
    license: "CC BY 4.0",
    tags_json: "[]",
    ...overrides,
  };
}

test("recommended trees created by administrators are platform maintained", () => {
  const tree = treeSummary(summaryRow({ creator_role: "ADMIN" }));
  assert.equal(tree.platformManaged, true);
  assert.equal(tree.platformLabel, "平台维护");
  assert.equal(platformTreeLabel(tree), "平台维护");
});

test("recommended trees from other creators remain platform recommended", () => {
  const tree = treeSummary(summaryRow({ creator_public_id: 2 }));
  assert.equal(tree.platformManaged, false);
  assert.equal(tree.platformLabel, "平台推荐");
  assert.equal(platformTreeLabel(tree), "平台推荐");
});

test("the site owner's platform trees are platform maintained", () => {
  const tree = treeSummary(summaryRow({
    creator_public_id: 1,
    creator_role: "USER",
  }));
  assert.equal(tree.platformLabel, "平台维护");
});

test("ordinary trees do not receive a platform label", () => {
  assert.equal(platformTreeLabel({
    kind: "USER",
    platformRecommended: false,
    platformManaged: false,
  }), "");
});

test("legacy official trees are treated as platform maintained", () => {
  assert.equal(platformTreeLabel({
    kind: "OFFICIAL",
    platformRecommended: false,
  }), "平台维护");
});
