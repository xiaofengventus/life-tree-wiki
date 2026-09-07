export const DRAFT_SAVE_MODE_KEY = "life-draft-save-mode";

export function normalizeDraftSaveMode(value) {
  return value === "manual" ? "manual" : "auto";
}

function normalizeSnapshotValue(value, ancestors) {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "bigint") return String(value);
  if (typeof value === "undefined" || typeof value === "function" || typeof value === "symbol") {
    return undefined;
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== "object") return value;
  if (ancestors.has(value)) throw new TypeError("草稿内容不能包含循环引用");

  ancestors.add(value);
  let normalized;
  if (Array.isArray(value)) {
    normalized = value.map((item) => {
      const result = normalizeSnapshotValue(item, ancestors);
      return result === undefined ? null : result;
    });
  } else {
    normalized = {};
    for (const key of Object.keys(value).sort()) {
      const result = normalizeSnapshotValue(value[key], ancestors);
      if (result !== undefined) normalized[key] = result;
    }
  }
  ancestors.delete(value);
  return normalized;
}

export function createDraftSnapshot(value) {
  return JSON.stringify(normalizeSnapshotValue(value, new Set()));
}

export function hasDraftSnapshotChanged(currentValue, savedSnapshot) {
  return createDraftSnapshot(currentValue) !== savedSnapshot;
}
