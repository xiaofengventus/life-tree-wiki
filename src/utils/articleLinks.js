export const CANONICAL_APP_ORIGIN = "https://life-tree.pages.dev";

function internalIdFromUrl(value, pathnamePattern, currentOrigin) {
  let url;
  try {
    url = new URL(String(value || ""));
  } catch {
    return "";
  }
  if (url.username || url.password) return "";
  const allowedOrigins = new Set([CANONICAL_APP_ORIGIN]);
  if (currentOrigin) {
    try {
      allowedOrigins.add(new URL(currentOrigin).origin);
    } catch {
      // Ignore an invalid development origin.
    }
  }
  if (!allowedOrigins.has(url.origin)) return "";
  const match = url.pathname.match(pathnamePattern);
  return match?.[1] || "";
}

export function internalPostIdFromUrl(
  value,
  currentOrigin = globalThis.location?.origin || "",
) {
  return internalIdFromUrl(
    value,
    /^\/view-post\/([A-Za-z0-9_-]{1,100})\/?$/,
    currentOrigin,
  );
}

export function internalTreeIdFromUrl(
  value,
  currentOrigin = globalThis.location?.origin || "",
) {
  // 兼容存量 view-tree 链接与新 life-tree 链接
  return internalIdFromUrl(
    value,
    /^\/(?:view|life)-tree\/([A-Za-z0-9_-]{1,100})\/?$/,
    currentOrigin,
  );
}

export function internalContentUrl(type, targetId) {
  const id = String(targetId || "").trim();
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) return "";
  const path = type === "TREE" ? "life-tree" : type === "ARTICLE" ? "view-post" : "";
  return path ? `${CANONICAL_APP_ORIGIN}/${path}/${encodeURIComponent(id)}` : "";
}
