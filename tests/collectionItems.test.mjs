import test from "node:test";
import assert from "node:assert/strict";
import {
  candidateWorks,
  displayEntries,
  entryDisplay,
  entryKey,
  moveEntry,
  orderPayload,
} from "../src/utils/collectionItems.js";

test("文章条目：公开文章走标题链接", () => {
  const display = entryDisplay({
    targetType: "POST",
    targetId: "p1",
    post: { id: "p1", uid: "P000001", title: "顺序表", type: "", excerpt: "摘要" },
  });
  assert.equal(display.key, "POST:p1");
  assert.equal(display.kindLabel, "文章");
  assert.equal(display.href, "/wiki/%E9%A1%BA%E5%BA%8F%E8%A1%A8");
  assert.equal(display.isPrivate, false);
});

test("文章条目：类型映射成中文标签", () => {
  const news = entryDisplay({ targetType: "POST", targetId: "p1", post: { title: "x", type: "news" } });
  const science = entryDisplay({
    targetType: "POST",
    targetId: "p2",
    post: { title: "y", type: "science" },
  });
  assert.equal(news.kindLabel, "新闻");
  assert.equal(science.kindLabel, "科普");
});

test("文章条目：私密文章不暴露标题链接，改走 id", () => {
  const display = entryDisplay({
    targetType: "POST",
    targetId: "p1",
    post: { id: "p1", uid: "P000009", title: "草稿", isPrivate: true },
  });
  assert.equal(display.isPrivate, true);
  assert.equal(display.href, "/view-post/P000009");
});

test("树条目：走 life-tree 链接并给默认标题", () => {
  const display = entryDisplay({ targetType: "TREE", targetId: "t1", tree: { id: "t1", uid: "T000003" } });
  assert.equal(display.kindLabel, "进化树");
  assert.equal(display.title, "未命名进化树");
  assert.equal(display.href, "/life-tree/T000003");
});

test("displayEntries 跳过空条目", () => {
  const list = displayEntries([
    { targetType: "POST", targetId: "p1", post: { title: "a" } },
    null,
  ]);
  assert.equal(list.length, 1);
  assert.equal(list[0].targetId, "p1");
});

test("moveEntry 向后移动", () => {
  const entries = [{ targetId: "a" }, { targetId: "b" }, { targetId: "c" }];
  const moved = moveEntry(entries, 0, 2);
  assert.deepEqual(moved.map((item) => item.targetId), ["b", "c", "a"]);
  // 不修改原数组
  assert.deepEqual(entries.map((item) => item.targetId), ["a", "b", "c"]);
});

test("moveEntry 向前移动并夹住越界目标", () => {
  const entries = [{ targetId: "a" }, { targetId: "b" }, { targetId: "c" }];
  assert.deepEqual(moveEntry(entries, 2, 0).map((item) => item.targetId), ["c", "a", "b"]);
  assert.deepEqual(moveEntry(entries, 2, 99).map((item) => item.targetId), ["a", "b", "c"]);
  assert.deepEqual(moveEntry(entries, -1, 0).map((item) => item.targetId), ["a", "b", "c"]);
});

test("moveEntry 目标就是自身时保持顺序", () => {
  const entries = [{ targetId: "a" }, { targetId: "b" }];
  assert.deepEqual(moveEntry(entries, 1, 1).map((item) => item.targetId), ["a", "b"]);
});

test("orderPayload 只保留类型与标识，顺序即最终顺序", () => {
  const payload = orderPayload([
    { targetType: "TREE", targetId: "t1", sortOrder: 9 },
    { targetType: "POST", targetId: "p1", title: "忽略我" },
  ]);
  assert.deepEqual(payload, [
    { targetType: "TREE", targetId: "t1" },
    { targetType: "POST", targetId: "p1" },
  ]);
});

test("entryKey 区分类型，同名 id 不会互相顶掉", () => {
  assert.notEqual(entryKey({ targetType: "POST", targetId: "x" }), entryKey({ targetType: "TREE", targetId: "x" }));
});

test("candidateWorks：排除已收录，并合并文章与树", () => {
  const entries = [{ targetType: "POST", targetId: "p1" }];
  const options = candidateWorks(
    entries,
    [{ id: "p1", title: "已收录" }, { id: "p2", title: "新文章", type: "news" }],
    [{ id: "t1", title: "一棵树" }],
  );
  assert.deepEqual(options.map((item) => item.key), ["POST:p2", "TREE:t1"]);
  assert.equal(options[0].kindLabel, "新闻");
});

test("candidateWorks：没有已收录条目时返回全部", () => {
  const options = candidateWorks([], [{ id: "p1", title: "a" }], [{ id: "t1", title: "b" }]);
  assert.equal(options.length, 2);
  assert.equal(options[1].isPrivate, false);
});
