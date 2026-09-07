import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeArticleLinks,
  normalizeContentLinks,
  normalizeMindMapDocument,
} from "../src/utils/evolutionMindMapModel.js";
import { sanitizeTreeDocument } from "../server/trees.js";
import {
  internalPostIdFromUrl,
  internalTreeIdFromUrl,
} from "../src/utils/articleLinks.js";

function documentWith(data) {
  return {
    layout: "logicalStructure",
    root: {
      data: { uid: "root", text: "生命", ...data },
      children: [],
    },
    theme: { config: {} },
  };
}

test("article links only retain unique HTTPS addresses and expose punycode hosts", () => {
  const links = normalizeArticleLinks([
    { title: "伪装标题", url: "https://例子.测试/path" },
    { title: "不安全", url: "http://evil.test/" },
    { title: "重复", url: "https://例子.测试/path" },
    { title: "脚本", url: "javascript:alert(1)" },
    { title: "凭据伪装", url: "https://trusted.example@evil.example/path" },
  ]);

  assert.deepEqual(links, [{
    title: "伪装标题",
    url: "https://xn--fsqu00a.xn--0zwm56d/path",
  }]);
});

test("legacy single links are removed instead of migrated", () => {
  const normalized = normalizeMindMapDocument(documentWith({
    hyperlink: "https://legacy.test/",
    hyperlinkTitle: "旧链接",
  }));

  assert.equal("hyperlink" in normalized.root.data, false);
  assert.equal("hyperlinkTitle" in normalized.root.data, false);
  assert.equal("articleLinks" in normalized.root.data, false);
  assert.deepEqual(normalized.root.data.contentLinks, []);
});

test("server migrates legacy article links into unified content links", () => {
  const { document } = sanitizeTreeDocument(documentWith({
    hyperlink: "https://legacy.test/",
    articleLinks: [
      { title: "", url: "https://safe.example/article" },
      { title: "HTTP", url: "http://unsafe.example/" },
    ],
  }));

  assert.deepEqual(document.root.data.contentLinks, [{
    type: "EXTERNAL",
    targetId: "",
    title: "safe.example",
    url: "https://safe.example/article",
  }]);
  assert.equal("hyperlink" in document.root.data, false);
});

test("content links retain articles, trees and external HTTPS links", () => {
  assert.deepEqual(normalizeContentLinks([
    { type: "ARTICLE", targetId: "P000123", title: "文章" },
    { type: "TREE", targetId: "T000013", title: "树" },
    { type: "EXTERNAL", title: "外部", url: "https://example.org/resource" },
    { type: "TREE", targetId: "T000013", title: "重复树" },
  ]), [
    {
      type: "ARTICLE",
      targetId: "P000123",
      title: "文章",
      url: "https://life-tree.pages.dev/view-post/P000123",
    },
    {
      type: "TREE",
      targetId: "T000013",
      title: "树",
      url: "https://life-tree.pages.dev/life-tree/T000013",
    },
    {
      type: "EXTERNAL",
      targetId: "",
      title: "外部",
      url: "https://example.org/resource",
    },
  ]);
});

test("legacy canonical tree URLs migrate into tree bindings", () => {
  const normalized = normalizeMindMapDocument(documentWith({
    articleLinks: [{
      title: "哺乳动物进化树",
      url: "https://life-tree.pages.dev/view-tree/T000013",
    }],
  }));

  assert.deepEqual(normalized.root.data.contentLinks, [{
    type: "TREE",
    targetId: "T000013",
    title: "哺乳动物进化树",
    url: "https://life-tree.pages.dev/life-tree/T000013",
  }]);
});

test("only genuine life-tree article URLs are parsed as internal posts", () => {
  assert.equal(
    internalPostIdFromUrl("https://life-tree.pages.dev/view-post/P000123"),
    "P000123",
  );
  assert.equal(
    internalPostIdFromUrl(
      "https://preview.local/view-post/P000124",
      "https://preview.local",
    ),
    "P000124",
  );
  assert.equal(
    internalPostIdFromUrl("https://life-tree.pages.dev.evil.test/view-post/P000123"),
    "",
  );
  assert.equal(
    internalPostIdFromUrl("https://life-tree.pages.dev/view-tree/T000013"),
    "",
  );
  assert.equal(
    internalTreeIdFromUrl("https://life-tree.pages.dev/view-tree/T000013"),
    "T000013",
  );
  assert.equal(
    internalTreeIdFromUrl(
      "https://preview.local/view-tree/T000014",
      "https://preview.local",
    ),
    "T000014",
  );
  assert.equal(
    internalTreeIdFromUrl("https://life-tree.pages.dev.evil.test/view-tree/T000013"),
    "",
  );
  assert.equal(
    internalPostIdFromUrl("https://trusted.example@life-tree.pages.dev/view-post/P000123"),
    "",
  );
});
