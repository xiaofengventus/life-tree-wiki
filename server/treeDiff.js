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
    nodes.set(uid, {
      uid,
      text: label(node.data.text) || "未命名节点",
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
