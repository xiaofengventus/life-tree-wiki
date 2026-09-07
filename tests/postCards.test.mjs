import test from "node:test";
import assert from "node:assert/strict";
import {
  reconcileClassificationCardPlacements,
  sanitizeClassificationCards,
} from "../server/classificationCards.js";
import { postCardIdFromHref } from "../src/utils/postCardMarkers.js";

function customCard(overrides = {}) {
  return {
    id: "card-one",
    type: "custom",
    title: "观察记录",
    rows: [{ label: "地点", value: "湿地" }],
    ...overrides,
  };
}

test("legacy directory cards default to outline placement", () => {
  const [card] = sanitizeClassificationCards([customCard()]);
  assert.deepEqual(card.placements, ["outline"]);
});

test("cards can render in body and below the outline from one record", () => {
  const [card] = sanitizeClassificationCards([
    customCard({ placements: ["body", "outline", "body"] }),
  ]);
  assert.deepEqual(card.placements, ["body", "outline"]);
});

test("invalid or empty card placements fall back to outline", () => {
  const [card] = sanitizeClassificationCards([
    customCard({ placements: ["unknown"] }),
  ]);
  assert.deepEqual(card.placements, ["outline"]);
});

test("post card markers accept safe card ids only", () => {
  assert.equal(postCardIdFromHref("#post-card-card-one"), "card-one");
  assert.equal(postCardIdFromHref("#post-card-../../secret"), "");
  assert.equal(postCardIdFromHref("https://example.com/#post-card-card-one"), "");
});

test("body markers and outline placement are reconciled on publication", () => {
  const [card] = reconcileClassificationCardPlacements(
    [customCard({ placements: ["outline"] })],
    '<p><a href="#post-card-card-one">卡片</a></p>',
  );
  assert.deepEqual(card.placements, ["outline", "body"]);
});

test("publication rejects missing or duplicated card markers", () => {
  assert.throws(
    () => reconcileClassificationCardPlacements(
      [customCard()],
      '<p><a href="#post-card-missing">卡片</a></p>',
    ),
    (error) => error.code === "POST_CARD_MISSING",
  );
  assert.throws(
    () => reconcileClassificationCardPlacements(
      [customCard()],
      '<p><a href="#post-card-card-one">卡片</a></p><p><a href="#post-card-card-one">卡片</a></p>',
    ),
    (error) => error.code === "POST_CARD_DUPLICATED",
  );
});
