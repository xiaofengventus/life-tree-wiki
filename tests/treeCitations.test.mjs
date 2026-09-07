import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeTreeDocument } from "../server/trees.js";
import { normalizeMindMapDocument } from "../src/utils/evolutionMindMapModel.js";

function node(uid, text, children = [], extra = {}) {
  return {
    data: {
      uid,
      text,
      ...extra,
    },
    children,
  };
}

function documentWith(root, citations = []) {
  return {
    citations,
    layout: "logicalStructure",
    root,
  };
}

test("tree citations stay attached to nodes with fixed numbers", () => {
  const { document } = sanitizeTreeDocument(documentWith(
    node("root", "Root", [
      node("child", "Child", [], { citationNumbers: [7, 2, 7] }),
    ]),
    [
      { number: 7, text: "Seventh source" },
      { number: 2, text: "Second source" },
    ],
  ));

  assert.deepEqual(document.citations, [
    { number: 2, text: "Second source" },
    { number: 7, text: "Seventh source" },
  ]);
  assert.deepEqual(document.root.children[0].data.citationNumbers, [2, 7]);
});

test("client normalization preserves valid node citation bindings", () => {
  const document = normalizeMindMapDocument(documentWith(
    node("root", "Root", [], { citationNumbers: [4] }),
    [{ number: 4, text: "Fourth source" }],
  ));
  assert.deepEqual(document.citations, [{ number: 4, text: "Fourth source" }]);
  assert.deepEqual(document.root.data.citationNumbers, [4]);
});

test("tree nodes cannot reference a missing citation", () => {
  assert.throws(
    () => sanitizeTreeDocument(documentWith(
      node("root", "Root", [], { citationNumbers: [3] }),
      [{ number: 2, text: "Only source" }],
    )),
    (error) => error?.code === "TREE_CITATION_TEXT_MISSING",
  );
});

test("trees larger than the former 2000-node limit are accepted", () => {
  const children = Array.from(
    { length: 2_100 },
    (_, index) => node(`child-${index}`, `Child ${index}`),
  );
  const result = sanitizeTreeDocument(documentWith(node("root", "Root", children)));
  assert.equal(result.nodeCount, 2_101);
});
