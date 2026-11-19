import { normalizeNodeScience, normalizeTreeScience } from "../shared/treeScience.js";

function label(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

function flattenTree(document) {
  const nodes = new Map();
  const walk = (node, parent = null, depth = 0) => {
    if (!node?.data) return;
    const uid = String(node.data.uid || "");
    if (!uid) return;
    const science = normalizeNodeScience(node.data);
    nodes.set(uid, {
      uid,
      text: label(science.text) || "未命名节点",
      parentUid: parent?.uid || "",
      parentText: parent?.text || "",
      depth,
      contentLinks: JSON.stringify(
        Array.isArray(node.data.contentLinks)
          ? node.data.contentLinks
          : Array.isArray(node.data.articleLinks)
            ? node.data.articleLinks
            : [],
      ),
      citationNumbers: JSON.stringify(
        Array.isArray(node.data.citationNumbers) ? node.data.citationNumbers : [],
      ),
      image: String(node.data.image || ""),
      imageTitle: label(node.data.imageTitle),
      taxon: science.taxon,
      branch: science.branch,
    });
    const current = nodes.get(uid);
    for (const child of node.children || []) walk(child, current, depth + 1);
  };
  walk(document?.root);
  return nodes;
}

function changedResourceFields(before, after) {
  const fields = [];
  if (before.contentLinks !== after.contentLinks) fields.push("关联内容");
  if (before.citationNumbers !== after.citationNumbers) fields.push("正文引用");
  if (before.image !== after.image || before.imageTitle !== after.imageTitle) fields.push("图片");
  if (before.taxon.scientificName !== after.taxon.scientificName) fields.push("科学名称");
  if (before.taxon.rankKey !== after.taxon.rankKey) fields.push("分类阶元");
  if (before.taxon.status !== after.taxon.status) fields.push("存续状态");
  if (before.taxon.ageMa !== after.taxon.ageMa) fields.push("年代（Ma）");
  if (before.branch.length !== after.branch.length) fields.push("入边枝长");
  if (before.branch.supportType !== after.branch.supportType || before.branch.support !== after.branch.support) fields.push("入边支持度");
  if (JSON.stringify(before.branch.citationNumbers) !== JSON.stringify(after.branch.citationNumbers)) fields.push("分支引用");
  return fields;
}

export function compareTreeDocuments(baseDocument, proposedDocument) {
  const base = flattenTree(baseDocument);
  const proposed = flattenTree(proposedDocument);
  const added = [];
  const removed = [];
  const renamed = [];
  const moved = [];
  const updated = [];

  for (const [uid, node] of proposed) {
    const previous = base.get(uid);
    if (!previous) {
      added.push(node);
      continue;
    }
    if (previous.text !== node.text) {
      renamed.push({ uid, before: previous.text, after: node.text });
    }
    if (previous.parentUid !== node.parentUid) {
      moved.push({
        uid,
        text: node.text,
        fromParent: previous.parentText || "根节点",
        toParent: node.parentText || "根节点",
      });
    }
    const fields = changedResourceFields(previous, node);
    if (fields.length) updated.push({ uid, text: node.text, fields });
  }

  for (const [uid, node] of base) {
    if (!proposed.has(uid)) removed.push(node);
  }
  const beforeScience = normalizeTreeScience(baseDocument?.scientific);
  const afterScience = normalizeTreeScience(proposedDocument?.scientific);
  const scientificFields = [];
  if (beforeScience.kind !== afterScience.kind) scientificFields.push("科学树类型");
  if (beforeScience.description !== afterScience.description) scientificFields.push("科学含义说明");
  if (beforeScience.branchLengthUnit !== afterScience.branchLengthUnit) scientificFields.push("枝长单位");
  if (scientificFields.length) {
    const uid = String(proposedDocument?.root?.data?.uid || "");
    const rootUpdate = updated.find((item) => item.uid === uid);
    if (rootUpdate) rootUpdate.fields.push(...scientificFields);
    else updated.push({ uid, text: "整树科学信息", fields: scientificFields });
  }

  const byDepthThenText = (first, second) =>
    first.depth - second.depth || first.text.localeCompare(second.text, "zh-CN");
  added.sort(byDepthThenText);
  removed.sort(byDepthThenText);

  return {
    counts: {
      added: added.length,
      removed: removed.length,
      renamed: renamed.length,
      moved: moved.length,
      updated: updated.length,
    },
    added: added.slice(0, 200),
    removed: removed.slice(0, 200),
    renamed: renamed.slice(0, 200),
    moved: moved.slice(0, 200),
    updated: updated.slice(0, 200),
    truncated: [added, removed, renamed, moved, updated].some((items) => items.length > 200),
  };
}
