/**
 * 合集的纯展示逻辑：把接口返回的条目转成可渲染的行、支持上下移动、
 * 以及算出「还有哪些作品可以加进来」。
 *
 * 这里刻意不依赖 DOM 和 Vue，方便用 `node --test` 直接覆盖。
 */

const POST_KIND_LABELS = { news: "新闻", science: "科普" };

export function entryKey(entry) {
  if (!entry) return "";
  return `${entry.targetType}:${entry.targetId}`;
}

/** 单条合集条目 → 展示用对象（标题、摘要、链接、类型标签）。 */
export function entryDisplay(entry) {
  if (!entry) return null;
  if (entry.targetType === "TREE") {
    const tree = entry.tree || {};
    const isPrivate = Boolean(tree.isPrivate);
    return {
      key: entryKey(entry),
      targetType: "TREE",
      targetId: entry.targetId,
      kindLabel: "进化树",
      title: tree.title || "未命名进化树",
      summary: tree.description || "",
      coverUrl: "",
      isPrivate,
      href: `/life-tree/${tree.uid || tree.id || entry.targetId}`,
      updatedAt: tree.updatedAt || tree.submittedAt || "",
    };
  }
  const post = entry.post || {};
  const isPrivate = Boolean(post.isPrivate);
  const title = post.title || "未命名文章";
  return {
    key: entryKey(entry),
    targetType: "POST",
    targetId: entry.targetId,
    kindLabel: POST_KIND_LABELS[post.type] || "文章",
    title,
    summary: post.excerpt || "",
    coverUrl: post.coverUrl || "",
    isPrivate,
    // 公开文章走标题链接（和站内其它列表一致），私密文章只有作者能看，走 id 链接
    href: isPrivate
      ? `/view-post/${encodeURIComponent(post.uid || post.id || entry.targetId)}`
      : `/wiki/${encodeURIComponent(title)}`,
    updatedAt: post.updatedAt || post.submittedAt || "",
  };
}

export function displayEntries(entries) {
  return (entries || []).map(entryDisplay).filter(Boolean);
}

/** 把 fromIndex 的条目移动到 toIndex，越界自动夹到合法范围；不修改原数组。 */
export function moveEntry(entries, fromIndex, toIndex) {
  const list = [...(entries || [])];
  if (!Number.isInteger(fromIndex) || fromIndex < 0 || fromIndex >= list.length) {
    return list;
  }
  const target = Math.max(0, Math.min(list.length - 1, Number(toIndex)));
  if (!Number.isInteger(target) || target === fromIndex) return list;
  const [moved] = list.splice(fromIndex, 1);
  list.splice(target, 0, moved);
  return list;
}

/** 排序接口需要的载荷：只保留类型和标识，顺序即最终顺序。 */
export function orderPayload(entries) {
  return (entries || []).map((entry) => ({
    targetType: entry.targetType,
    targetId: entry.targetId,
  }));
}

/**
 * 可加入合集的候选作品：作者自己的文章 + 进化树，去掉已经在合集里的。
 * posts / trees 直接传接口返回的摘要数组（公开的和私密的都可以传）。
 */
export function candidateWorks(entries, posts = [], trees = []) {
  const existing = new Set((entries || []).map(entryKey));
  const options = [
    ...(posts || []).map((post) => ({
      key: `POST:${post.id}`,
      targetType: "POST",
      targetId: post.id,
      kindLabel: POST_KIND_LABELS[post.type] || "文章",
      title: post.title || "未命名文章",
      isPrivate: Boolean(post.isPrivate),
    })),
    ...(trees || []).map((tree) => ({
      key: `TREE:${tree.id}`,
      targetType: "TREE",
      targetId: tree.id,
      kindLabel: "进化树",
      title: tree.title || "未命名进化树",
      isPrivate: Boolean(tree.isPrivate),
    })),
  ];
  return options.filter((option) => !existing.has(option.key));
}
