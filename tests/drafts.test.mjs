import assert from "node:assert/strict";
import test from "node:test";

import { draftEditorLocation } from "../src/services/drafts.js";
import {
  createDraftSnapshot,
  hasDraftSnapshotChanged,
  normalizeDraftSaveMode,
} from "../src/utils/draftSnapshots.js";

test("article drafts reopen in the article editor", () => {
  assert.deepEqual(
    draftEditorLocation({
      id: "draft-article",
      contentType: "ARTICLE",
      mode: "CREATE",
      targetId: "",
    }),
    {
      path: "/create-post",
      query: { draft: "draft-article" },
    },
  );
});

test("tree edit drafts retain their published target", () => {
  assert.deepEqual(
    draftEditorLocation({
      id: "draft-tree",
      contentType: "TREE",
      mode: "EDIT",
      targetId: "T000123",
    }),
    {
      path: "/evolution-tree",
      query: { draft: "draft-tree", edit: "T000123" },
    },
  );
});

test("tree collaboration drafts retain the appropriate route mode", () => {
  assert.deepEqual(
    draftEditorLocation({
      id: "draft-fork",
      contentType: "TREE",
      mode: "FORK",
      targetId: "T000001",
    }),
    {
      path: "/evolution-tree",
      query: { draft: "draft-fork", fork: "T000001" },
    },
  );
  assert.deepEqual(
    draftEditorLocation({
      id: "draft-contribution",
      contentType: "TREE",
      mode: "CONTRIBUTION",
      targetId: "T000002",
    }),
    {
      path: "/evolution-tree",
      query: { draft: "draft-contribution", contribute: "T000002" },
    },
  );
});

test("draft snapshots ignore object key insertion order", () => {
  const saved = createDraftSnapshot({
    title: "生命演化",
    payload: { content: "<p>正文</p>", tags: ["寒武纪", "节肢动物"] },
  });

  assert.equal(
    hasDraftSnapshotChanged({
      payload: { tags: ["寒武纪", "节肢动物"], content: "<p>正文</p>" },
      title: "生命演化",
    }, saved),
    false,
  );
});

test("draft snapshots detect meaningful article and tree changes", () => {
  const articleSnapshot = createDraftSnapshot({
    title: "标题",
    content: "<p>正文</p>",
  });
  assert.equal(
    hasDraftSnapshotChanged({
      title: "标题",
      content: "<p>修改后的正文</p>",
    }, articleSnapshot),
    true,
  );

  const treeSnapshot = createDraftSnapshot({
    document: { root: { uid: "root", text: "生命" } },
  });
  assert.equal(
    hasDraftSnapshotChanged({
      document: { root: { uid: "root", text: "真核生物" } },
    }, treeSnapshot),
    true,
  );
});

test("draft save mode defaults to auto and accepts manual", () => {
  assert.equal(normalizeDraftSaveMode("manual"), "manual");
  assert.equal(normalizeDraftSaveMode("auto"), "auto");
  assert.equal(normalizeDraftSaveMode("unexpected"), "auto");
  assert.equal(normalizeDraftSaveMode(null), "auto");
});
