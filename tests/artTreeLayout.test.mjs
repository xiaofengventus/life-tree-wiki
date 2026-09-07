import assert from "node:assert/strict";
import test from "node:test";

import {
  ART_TREE_NODE_LIMIT,
  artTreePalette,
  buildBotanicalArtLayout,
  buildCrystalArtLayout,
  buildLineageArtLayout,
  buildNebulaArtLayout,
} from "../src/utils/artTreeLayout.js";

const document = {
  root: {
    data: { uid: "root", text: "生命" },
    children: [
      {
        data: { uid: "plant", text: "植物" },
        children: [
          { data: { uid: "flower", text: "被子植物" }, children: [] },
        ],
      },
      { data: { uid: "animal", text: "动物" }, children: [] },
    ],
  },
};

test("botanical layout grows from the bottom and preserves every edge", () => {
  const layout = buildBotanicalArtLayout(document);
  assert.equal(layout.nodes.length, 4);
  assert.equal(layout.edges.length, 3);
  assert.ok(layout.nodes[0].y > layout.nodes[1].y);
  assert.equal(layout.nodes.find((node) => node.id === "flower").isLeaf, true);
});

test("crystal layout grows radially from a central nucleus", () => {
  const layout = buildCrystalArtLayout(document);
  const root = layout.nodes[0];
  assert.equal(root.x, 600);
  assert.equal(root.y, 380);
  assert.equal(layout.edges.length, layout.nodes.length - 1);
});

test("lineage layout grows upward and preserves top-level clade colors", () => {
  const layout = buildLineageArtLayout(document);
  const root = layout.nodes[0];
  const plant = layout.nodes.find((node) => node.id === "plant");
  const flower = layout.nodes.find((node) => node.id === "flower");
  const animal = layout.nodes.find((node) => node.id === "animal");

  assert.equal(root.x, 600);
  assert.ok(root.y > plant.y);
  assert.equal(plant.lineageIndex, flower.lineageIndex);
  assert.notEqual(plant.lineageIndex, animal.lineageIndex);
  assert.equal(layout.edges.length, layout.nodes.length - 1);
});

test("nebula layout keeps hierarchy on stable three-dimensional depth shells", () => {
  const layout = buildNebulaArtLayout(document);
  const repeated = buildNebulaArtLayout(document);
  const root = layout.nodes[0];
  const plant = layout.nodes.find((node) => node.id === "plant");
  const flower = layout.nodes.find((node) => node.id === "flower");

  assert.deepEqual([root.x, root.y, root.z], [0, 0, 0]);
  assert.ok(flower.radius > plant.radius);
  assert.equal(plant.lineageIndex, flower.lineageIndex);
  assert.equal(layout.edges.length, layout.nodes.length - 1);
  assert.deepEqual(
    layout.nodes.map(({ id, x, y, z }) => ({ id, x, y, z })),
    repeated.nodes.map(({ id, x, y, z }) => ({ id, x, y, z })),
  );
});

test("art layouts cap pathological trees and palettes remain deterministic", () => {
  const root = { data: { uid: "root", text: "根" }, children: [] };
  for (let index = 0; index < ART_TREE_NODE_LIMIT + 20; index += 1) {
    root.children.push({
      data: { uid: `leaf-${index}`, text: `节点 ${index}` },
      children: [],
    });
  }
  const layout = buildBotanicalArtLayout({ root });
  assert.equal(layout.nodes.length, ART_TREE_NODE_LIMIT);
  assert.equal(layout.truncated, true);
  assert.ok(layout.width > 1200);
  assert.deepEqual(artTreePalette("crystal", "T000001"), artTreePalette("crystal", "T000001"));
});

test("spacing expands crowded art layouts without changing their node count", () => {
  const root = { data: { uid: "root", text: "root" }, children: [] };
  for (let index = 0; index < 24; index += 1) {
    root.children.push({
      data: { uid: `leaf-${index}`, text: `leaf ${index}` },
      children: [],
    });
  }

  const compactBotanical = buildBotanicalArtLayout({ root }, { spacing: 1 });
  const expandedBotanical = buildBotanicalArtLayout({ root }, { spacing: 1.8 });
  const compactCrystal = buildCrystalArtLayout({ root }, { spacing: 1 });
  const expandedCrystal = buildCrystalArtLayout({ root }, { spacing: 1.8 });

  assert.equal(expandedBotanical.nodes.length, compactBotanical.nodes.length);
  assert.ok(expandedBotanical.width > compactBotanical.width);
  assert.ok(expandedCrystal.height > compactCrystal.height);
});
