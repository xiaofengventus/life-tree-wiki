import test from "node:test";
import assert from "node:assert/strict";
import { compareTreeDocuments } from "../server/treeDiff.js";

function node(uid, text, children = [], data = {}) {
  return { data: { uid, text, ...data }, children };
}

test("compares added, removed, renamed, moved and resource changes", () => {
  const base = {
    root: node("root", "生命", [
      node("a", "旧名称", [node("removed", "将删除")]),
      node("b", "另一分支", [node("move", "移动节点")]),
      node("resource", "资料节点", [], {
        contentLinks: [{
          type: "TREE",
          targetId: "T000001",
          title: "旧树",
          url: "https://life-tree.pages.dev/view-tree/T000001",
        }],
        citationNumbers: [1],
      }),
    ]),
  };
  const proposed = {
    root: node("root", "生命", [
      node("a", "新名称", [
        node("move", "移动节点"),
        node("added", "新增节点"),
      ]),
      node("b", "另一分支"),
      node("resource", "资料节点", [], {
        contentLinks: [{
          type: "TREE",
          targetId: "T000002",
          title: "新树",
          url: "https://life-tree.pages.dev/view-tree/T000002",
        }],
        citationNumbers: [2],
      }),
    ]),
  };

  const result = compareTreeDocuments(base, proposed);
  assert.deepEqual(result.counts, {
    added: 1,
    removed: 1,
    renamed: 1,
    moved: 1,
    updated: 1,
  });
  assert.equal(result.renamed[0].before, "旧名称");
  assert.equal(result.renamed[0].after, "新名称");
  assert.equal(result.moved[0].fromParent, "另一分支");
  assert.equal(result.moved[0].toParent, "新名称");
  assert.deepEqual(result.updated[0].fields, ["关联内容", "正文引用"]);
});
