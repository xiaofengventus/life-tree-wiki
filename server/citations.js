import { ApiError } from "./http.js";
import { cleanText } from "./validation.js";

const MAX_CITATIONS = 200;
const MAX_CITATION_NUMBER = 9_999;
const MAX_CITATION_TEXT = 4_000;
const MAX_TOTAL_TEXT = 100_000;
const CITATION_HREF_PATTERN = /href\s*=\s*(["'])#post-citation-(\d{1,4})\1/gi;

export function sanitizeCitations(value, { ownerLabel = "一篇文章" } = {}) {
  if (!Array.isArray(value)) return [];
  if (value.length > MAX_CITATIONS) {
    throw new ApiError(400, `${ownerLabel}最多添加 ${MAX_CITATIONS} 条正文引用`, "TOO_MANY_CITATIONS");
  }
  const result = [];
  const numbers = new Set();
  let totalLength = 0;
  for (const item of value) {
    const number = Number(item?.number);
    if (!Number.isSafeInteger(number) || number < 1 || number > MAX_CITATION_NUMBER) {
      throw new ApiError(400, "正文引用编号无效", "INVALID_CITATION");
    }
    if (numbers.has(number)) {
      throw new ApiError(400, `正文引用编号 [${number}] 重复`, "DUPLICATE_CITATION");
    }
    const text = cleanText(item?.text, `引用 [${number}]`, {
      minimum: 1,
      maximum: MAX_CITATION_TEXT,
    });
    totalLength += text.length;
    if (totalLength > MAX_TOTAL_TEXT) {
      throw new ApiError(400, "正文引用文本总长度不能超过 10 万个字符", "CITATIONS_TOO_LARGE");
    }
    numbers.add(number);
    result.push({ number, text });
  }
  return result.sort((first, second) => first.number - second.number);
}

export function parseCitations(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) =>
        Number.isSafeInteger(Number(item?.number)) &&
        Number(item.number) >= 1 &&
        Number(item.number) <= MAX_CITATION_NUMBER &&
        typeof item?.text === "string" &&
        item.text.trim(),
      )
      .map((item) => ({ number: Number(item.number), text: item.text.trim() }))
      .sort((first, second) => first.number - second.number);
  } catch {
    return [];
  }
}

export function validateCitationMarkers(html, citations) {
  const available = new Set(citations.map((citation) => citation.number));
  const missing = new Set();
  const source = String(html || "");
  let match;
  CITATION_HREF_PATTERN.lastIndex = 0;
  while ((match = CITATION_HREF_PATTERN.exec(source))) {
    const number = Number(match[2]);
    if (!available.has(number)) missing.add(number);
  }
  if (missing.size) {
    throw new ApiError(
      400,
      `正文引用 [${[...missing].sort((a, b) => a - b).join("]、[")}] 缺少对应的引用文本`,
      "CITATION_TEXT_MISSING",
    );
  }
}
