export function postCardIdFromHref(value) {
  return String(value || "")
    .match(/^#post-card-([A-Za-z0-9_-]{1,80})$/)?.[1] || "";
}
