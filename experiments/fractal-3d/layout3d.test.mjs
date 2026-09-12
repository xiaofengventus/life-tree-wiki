/**
 * 3D 分形布局的单测。
 *
 * 跑法（项目根目录）：
 *   node --test experiments/fractal-3d/layout3d.test.mjs
 *
 * 重点不是"能跑通"，而是"换一棵树、换一种输入形状也照样对"——
 * 这个布局将来要吃的是用户自己造的树，形状完全不可控。
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  layoutFractalTree3D,
  normalizeTree,
  computeLeafCounts,
  clampToCone,
  descendantUids,
  toggleCollapsed,
  ancestorChain,
  DEFAULT_OPTIONS_3D,
} from "./layout3d.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(HERE, "data");

// ------------------------------------------------------------------ 构造工具
const node = (text, children = [], uid) => ({
  data: { uid: uid || `u-${text}`, text },
  children,
});

/** 链：每个节点只有一个孩子 */
function chain(depth) {
  let cur = node("leaf");
  for (let i = depth - 1; i >= 0; i -= 1) cur = node(`n${i}`, [cur]);
  return cur;
}

/** 扇：一个根挂 count 个叶子 */
function fan(count) {
  return node(
    "root",
    Array.from({ length: count }, (_, i) => node(`leaf${i}`)),
  );
}

/** 完全二叉树 */
function binary(depth) {
  if (depth === 0) return node("leaf");
  return node(`b${depth}`, [binary(depth - 1), binary(depth - 1)]);
}

const lengthOf = (n) => Math.hypot(n.x, n.y, n.z);
const dirLen = (n) => Math.hypot(n.dir[0], n.dir[1], n.dir[2]);

// ------------------------------------------------------------------ 规范化

test("规范化：只有 children、没有 data 的裸节点也能用", () => {
  const tree = normalizeTree({ text: "根", children: [{ text: "子" }] });
  assert.equal(tree.text, "根");
  assert.equal(tree.children.length, 1);
  assert.equal(tree.children[0].text, "子");
});

test("规范化：label / name 能当 text 用", () => {
  const tree = normalizeTree({ label: "甲的", children: [{ name: "乙的" }] });
  assert.equal(tree.text, "甲的");
  assert.equal(tree.children[0].text, "乙的");
});

test("规范化：缺 uid 时按路径补齐，且两次结果一致", () => {
  const raw = () => ({ text: "根", children: [{ text: "a" }, { text: "b" }] });
  const t1 = normalizeTree(raw());
  const t2 = normalizeTree(raw());
  assert.equal(t1.uid, t2.uid);
  assert.equal(t1.children[1].uid, t2.children[1].uid);
  assert.notEqual(t1.children[0].uid, t1.children[1].uid);
});

test("规范化：children 不是数组时当成没有子节点", () => {
  const tree = normalizeTree({ text: "根", children: "oops" });
  assert.equal(tree.children.length, 0);
});

test("规范化：脏数据里的环会被切断，不会死循环", () => {
  const a = { data: { uid: "a", text: "A" }, children: [] };
  const b = { data: { uid: "b", text: "B" }, children: [] };
  a.children.push(b);
  b.children.push(a); // 环
  const tree = normalizeTree(a);
  assert.equal(tree.uid, "a");
  assert.equal(tree.children[0].uid, "b");
  assert.equal(tree.children[0].children.length, 0, "指回 a 的那条边应被切掉");
});

test("规范化：nodeLimit 兜底，超大输入不会拖死页面", () => {
  const tree = normalizeTree(fan(500), { nodeLimit: 40 });
  let count = 0;
  (function walk(n) { count += 1; n.children.forEach(walk); })(tree);
  assert.ok(count <= 40, `应被截断到 40 以内，实际 ${count}`);
  assert.equal(tree.__truncated, true);
});

test("规范化：空输入返回 null", () => {
  assert.equal(normalizeTree(null), null);
  assert.equal(normalizeTree(undefined), null);
  assert.equal(normalizeTree("字符串"), null);
});

// ------------------------------------------------------------------ 边界树

test("只有根：出 1 个节点、0 条枝，不报错", () => {
  const r = layoutFractalTree3D(node("光杆司令"));
  assert.equal(r.nodes.length, 1);
  assert.equal(r.segments.length, 0);
  assert.equal(r.nodes[0].isLeaf, true);
  assert.equal(r.meta.totalLeaves, 1);
});

test("null 输入：返回空结果而不是抛异常", () => {
  const r = layoutFractalTree3D(null);
  assert.equal(r.nodes.length, 0);
  assert.equal(r.meta.count, 0);
});

test("单链：半径严格几何增长，方向全程不变", () => {
  const r = layoutFractalTree3D(chain(20), {
    radiusGrowth: 1.1, depthExponent: 1, rootSpread: Math.PI / 2,
  });
  assert.equal(r.nodes.length, 21);
  for (let i = 1; i < r.nodes.length; i += 1) {
    const ratio = lengthOf(r.nodes[i]) / lengthOf(r.nodes[i - 1]);
    assert.ok(Math.abs(ratio - 1.1) < 1e-9, `第 ${i} 层倍率应为 1.1，实际 ${ratio}`);
    const d = r.nodes[i].dir;
    const p = r.nodes[i - 1].dir;
    assert.ok(Math.abs(d[0] - p[0]) + Math.abs(d[1] - p[1]) + Math.abs(d[2] - p[2]) < 1e-12,
      "单链不该拐弯");
  }
});

test("极宽的扇：25 个兄弟全部渲染且方向互不重合", () => {
  const r = layoutFractalTree3D(fan(25));
  assert.equal(r.nodes.length, 26);
  const seen = new Set();
  for (const n of r.nodes.slice(1)) {
    const key = n.dir.map((v) => v.toFixed(6)).join(",");
    seen.add(key);
  }
  assert.equal(seen.size, 25, "25 个叶子应该有 25 个互不相同的方向");
});

test("完全二叉树：节点数与叶子数都对得上", () => {
  const r = layoutFractalTree3D(binary(6));
  assert.equal(r.nodes.length, 2 ** 7 - 1);
  assert.equal(r.meta.totalLeaves, 2 ** 6);
});

// ------------------------------------------------------------------ 几何不变量

test("所有方向都是单位向量", () => {
  const r = layoutFractalTree3D(binary(7));
  for (const n of r.nodes) {
    assert.ok(Math.abs(dirLen(n) - 1) < 1e-9, `方向未归一化：${n.uid}`);
  }
});

test("半球模式：rootSpread = π/2 时没有任何节点掉到地面以下", () => {
  for (const tree of [binary(7), fan(30), chain(40)]) {
    const r = layoutFractalTree3D(tree, { rootSpread: Math.PI / 2 });
    for (const n of r.nodes) {
      assert.ok(n.y >= -1e-9, `节点 ${n.uid} 跑到 y=${n.y}，沉到海面下了`);
    }
  }
});

test("全球模式：rootSpread = π 时方向铺满整个球面", () => {
  const r = layoutFractalTree3D(binary(6), { rootSpread: Math.PI });
  const hasBelow = r.nodes.some((n) => n.y < -1e-6);
  assert.ok(hasBelow, "全球模式应该允许长到下半球");
});

test("等立体角：子锥立体角之和 = 父锥立体角", () => {
  const r = layoutFractalTree3D(fan(5), { rootSpread: Math.PI / 2 });
  const parentSpread = r.nodes[0].spread;
  const solid = (a) => 2 * Math.PI * (1 - Math.cos(a));
  const parentSolid = solid(parentSpread);
  const childrenSolid = r.nodes.slice(1).reduce((s, n) => s + solid(n.spread), 0);
  assert.ok(
    Math.abs(childrenSolid - parentSolid) / parentSolid < 1e-6,
    `立体角不守恒：父 ${parentSolid}，子合计 ${childrenSolid}`,
  );
});

test("depthExponent < 1 会把深层压缩得更紧凑", () => {
  const deep = () => layoutFractalTree3D(chain(60), { radiusGrowth: 1.08 });
  const normal = deep();
  const compressed = layoutFractalTree3D(chain(60), {
    radiusGrowth: 1.08, depthExponent: 0.7,
  });
  const rNormal = lengthOf(normal.nodes.at(-1));
  const rCompressed = lengthOf(compressed.nodes.at(-1));
  assert.ok(rCompressed < rNormal, "压缩后最外层半径应该更小");
  assert.ok(rCompressed > lengthOf(compressed.nodes[0]), "但仍应向外延伸");
});

test("clampToCone：锥内的方向原样返回，锥外的投影到锥面", () => {
  const axis = [0, 1, 0];
  const inside = [0, 1, 0];
  assert.deepEqual(clampToCone(inside, axis, Math.PI / 2), inside);

  const outside = clampToCone([1, -1, 0].map((v) => v / Math.SQRT2), axis, Math.PI / 2);
  assert.ok(Math.abs(outside[1]) < 1e-9, "投影到 90° 锥面后应在水平面上");
  assert.ok(Math.abs(Math.hypot(...outside) - 1) < 1e-9);
});

// ------------------------------------------------------------------ 折叠

test("折叠：节点变叶子，省下的叶子数还给兄弟", () => {
  const tree = node("root", [
    node("big", [node("a"), node("b"), node("c")]),
    node("small", [node("d")]),
  ]);
  const open = layoutFractalTree3D(tree);
  const closed = layoutFractalTree3D(tree, { collapsedIds: new Set(["u-big"]) });
  assert.equal(open.meta.totalLeaves, 4);
  assert.equal(closed.meta.totalLeaves, 2, "big 折叠后只算 1 个叶子");
  // root + big（折叠，a/b/c 不展开）+ small + d
  assert.equal(closed.nodes.length, 4);
  const big = closed.nodes.find((n) => n.uid === "u-big");
  assert.equal(big.collapsed, true);
  // 这才是折叠"免费重排"的实质：big 收起来之后，它在父节点眼里只算 1 个叶子，
  // 腾出来的角度份额自动落到兄弟 small 头上，small 的锥角因此变大。
  const bigOpen = open.nodes.find((n) => n.uid === "u-big");
  const smallOpen = open.nodes.find((n) => n.uid === "u-small");
  const small = closed.nodes.find((n) => n.uid === "u-small");
  assert.ok(big.spread < bigOpen.spread, "big 折叠后占的份额变小，锥角应随之收窄");
  assert.ok(small.spread > smallOpen.spread, "腾出来的角度应该分给了兄弟 small");
});

test("折叠：toggleCollapsed 不修改原集合，并清掉后代的折叠标记", () => {
  const original = new Set(["u-child"]);
  const next = toggleCollapsed(original, "u-parent", ["u-child"]);
  assert.equal(original.has("u-child"), true, "原集合不该被改");
  assert.equal(next.has("u-parent"), true);
  assert.equal(next.has("u-child"), false, "父节点折叠后，后代的标记应被清掉");

  const again = toggleCollapsed(next, "u-parent");
  assert.equal(again.has("u-parent"), false, "再切一次应展开");
});

test("descendantUids / ancestorChain 都能正确回溯", () => {
  const tree = node("root", [node("a", [node("a1"), node("a2")]), node("b")]);
  const uids = descendantUids(tree, "u-a").sort();
  assert.deepEqual(uids, ["u-a1", "u-a2"]);

  const r = layoutFractalTree3D(tree);
  const leafIdx = r.nodes.findIndex((n) => n.uid === "u-a1");
  const chain2 = ancestorChain(r.nodes, leafIdx).map((i) => r.nodes[i].uid);
  assert.deepEqual(chain2, ["u-root", "u-a", "u-a1"]);
});

// ------------------------------------------------------------------ 截断

test("maxDepth 会截断，并把 truncated 标出来", () => {
  const r = layoutFractalTree3D(chain(30), { maxDepth: 5 });
  assert.equal(r.nodes.length, 6);
  assert.equal(r.meta.truncated, true);
  assert.equal(r.meta.maxDepth, 5);
});

test("nodeLimit 会截断", () => {
  const r = layoutFractalTree3D(binary(8), { nodeLimit: 100 });
  assert.equal(r.nodes.length, 100);
  assert.equal(r.meta.truncated, true);
});

// ------------------------------------------------------------------ 真实数据泛化

const dataFiles = fs.existsSync(DATA_DIR)
  ? fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json") && f !== "index.json")
  : [];

test("真实数据：data/ 下的每一棵树都能布局", { skip: !dataFiles.length && "没有 data/ 目录" }, () => {
  for (const file of dataFiles) {
    const payload = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8"));
    const r = layoutFractalTree3D(payload.document.root, { rootSpread: Math.PI / 2 });
    assert.ok(r.nodes.length > 0, `${file} 布局出 0 个节点`);
    assert.equal(r.nodes.length, payload.nodeCount, `${file} 节点数对不上`);
    for (const n of r.nodes) {
      assert.ok(Number.isFinite(n.x) && Number.isFinite(n.y) && Number.isFinite(n.z),
        `${file} 出现 NaN 坐标`);
      assert.ok(n.y >= -1e-9, `${file} 有节点沉到海面下：y=${n.y}`);
      assert.ok(Math.abs(dirLen(n) - 1) < 1e-9, `${file} 方向未归一化`);
    }
  }
});

test("真实数据：叶子总数等于树自身最深分支的叶子数", { skip: !dataFiles.length && "没有 data/ 目录" }, () => {
  const payload = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "T000021.json"), "utf8"));
  const tree = normalizeTree(payload.document.root);
  const counts = computeLeafCounts(tree);
  const r = layoutFractalTree3D(payload.document.root);
  assert.equal(r.meta.totalLeaves, counts.get(tree));
});

test("默认参数是自洽的", () => {
  assert.ok(DEFAULT_OPTIONS_3D.radiusGrowth > 1);
  assert.ok(DEFAULT_OPTIONS_3D.depthExponent > 0 && DEFAULT_OPTIONS_3D.depthExponent <= 1);
  assert.ok(DEFAULT_OPTIONS_3D.rootSpread > 0 && DEFAULT_OPTIONS_3D.rootSpread <= Math.PI);
  assert.equal(DEFAULT_OPTIONS_3D.rootDir.length, 3);
});
