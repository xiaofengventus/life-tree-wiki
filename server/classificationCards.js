import { TAXONOMY_RANK_MAP } from "../shared/taxonomyRanks.js";
import { ApiError } from "./http.js";
import { mediaUrl, validMediaHash } from "./media.js";
import { cleanText } from "./validation.js";

const DEFAULT_COLOR = "#eadf77";
const MAX_CARDS = 8;
const MAX_ROWS = 60;
const CARD_PLACEMENTS = new Set(["body", "outline"]);

function safeColor(value) {
  const color = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : DEFAULT_COLOR;
}

function sourceCards(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.cards)) return value.cards;
  if (value?.type) return [value];
  return [];
}

function sanitizeTaxonomyRows(value) {
  const rows = [];
  for (const source of Array.isArray(value) ? value.slice(0, MAX_ROWS) : []) {
    const rank = TAXONOMY_RANK_MAP.get(String(source?.rankKey || ""));
    if (!rank) continue;
    const text = cleanText(source?.value, `${rank.zh}内容`, { maximum: 240 });
    if (!text) continue;
    rows.push({
      rankKey: rank.key,
      zh: rank.zh,
      en: rank.en,
      note: rank.note,
      value: text,
    });
  }
  return rows;
}

function sanitizeCustomRows(value) {
  const rows = [];
  for (const source of Array.isArray(value) ? value.slice(0, MAX_ROWS) : []) {
    const label = cleanText(source?.label, "自定义字段名称", { maximum: 60 });
    const text = cleanText(source?.value, "自定义字段内容", { maximum: 240 });
    if (!label && !text) continue;
    rows.push({ label: label || "字段", value: text || "—" });
  }
  return rows;
}

export function sanitizeClassificationCards(value) {
  const usedIds = new Set();
  return sourceCards(value).slice(0, MAX_CARDS).map((source, index) => {
    const type = source?.type === "custom" ? "custom" : "taxonomy";
    const requestedId = String(source?.id || "");
    let id = /^[A-Za-z0-9_-]{1,80}$/.test(requestedId) && !usedIds.has(requestedId)
      ? requestedId
      : `card-${index + 1}`;
    while (usedIds.has(id)) id = `${id}-${index + 1}`;
    usedIds.add(id);
    const imageHash = validMediaHash(source?.imageHash);
    const requestedPlacements = Array.isArray(source?.placements)
      ? source.placements
      : ["outline"];
    const placements = [...new Set(
      requestedPlacements
        .map((placement) => String(placement || "").toLowerCase())
        .filter((placement) => CARD_PLACEMENTS.has(placement)),
    )];
    if (!placements.length) placements.push("outline");
    return {
      id,
      type,
      placements,
      title: cleanText(
        source?.title || (type === "taxonomy" ? "科学分类" : "自定义卡片"),
        "卡片标题",
        { minimum: 1, maximum: 80 },
      ),
      color: safeColor(source?.color),
      imageHash: imageHash || "",
      imageCaption: cleanText(source?.imageCaption, "图片说明", { maximum: 120 }),
      rows: type === "taxonomy"
        ? sanitizeTaxonomyRows(source?.rows)
        : sanitizeCustomRows(source?.rows),
    };
  });
}

export function reconcileClassificationCardPlacements(value, contentHtml) {
  const cards = sanitizeClassificationCards(value);
  const knownIds = new Set(cards.map((card) => card.id));
  const markerIds = [...String(contentHtml || "")
    .matchAll(/href=["']#post-card-([A-Za-z0-9_-]{1,80})["']/g)]
    .map((match) => match[1]);
  const usedIds = new Set();
  for (const id of markerIds) {
    if (!knownIds.has(id)) {
      throw new ApiError(400, `正文引用了不存在的卡片：${id}`, "POST_CARD_MISSING");
    }
    if (usedIds.has(id)) {
      throw new ApiError(400, `正文重复插入了卡片：${id}`, "POST_CARD_DUPLICATED");
    }
    usedIds.add(id);
  }
  return cards.map((card) => {
    const placements = new Set(card.placements);
    if (usedIds.has(card.id)) placements.add("body");
    else placements.delete("body");
    if (!placements.size) placements.add("outline");
    return { ...card, placements: [...placements] };
  });
}

export function parseClassificationCards(value) {
  try {
    const source = typeof value === "string" ? JSON.parse(value || "{}") : value;
    return sanitizeClassificationCards(source).map((card) => ({
      ...card,
      imageUrl: card.imageHash ? mediaUrl(card.imageHash) : "",
    }));
  } catch {
    return [];
  }
}

export function classificationCardMediaHashes(cards) {
  return [...new Set(
    sanitizeClassificationCards(cards).map((card) => card.imageHash).filter(Boolean),
  )];
}
