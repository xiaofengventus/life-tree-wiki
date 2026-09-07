import assert from "node:assert/strict";
import test from "node:test";
import {
  parseCitations,
  sanitizeCitations,
  validateCitationMarkers,
} from "../server/citations.js";
import { countCitationMarkers } from "../src/utils/citationHtml.js";

test("citation numbers stay fixed and are returned in numeric order", () => {
  const citations = sanitizeCitations([
    { number: 7, text: "Seventh reference" },
    { number: 2, text: "Second reference" },
  ]);
  assert.deepEqual(citations, [
    { number: 2, text: "Second reference" },
    { number: 7, text: "Seventh reference" },
  ]);
  assert.deepEqual(parseCitations(JSON.stringify(citations)), citations);
});

test("duplicate citation numbers are rejected", () => {
  assert.throws(
    () => sanitizeCitations([
      { number: 1, text: "First" },
      { number: 1, text: "Duplicate" },
    ]),
    (error) => error?.code === "DUPLICATE_CITATION",
  );
});

test("body markers must have matching citation text", () => {
  assert.doesNotThrow(() =>
    validateCitationMarkers(
      '<p>Text<sup><a href="#post-citation-3">[3]</a></sup></p>',
      [{ number: 3, text: "Reference" }],
    ),
  );
  assert.throws(
    () =>
      validateCitationMarkers(
        '<p>Text<sup><a href="#post-citation-4">[4]</a></sup></p>',
        [{ number: 3, text: "Reference" }],
      ),
    (error) => error?.code === "CITATION_TEXT_MISSING",
  );
});

test("citation usage counts every body marker before safe deletion", () => {
  const counts = countCitationMarkers(`
    <p>First <a href="#post-citation-2"><sup>[2]</sup></a></p>
    <p>Again <a href='#post-citation-2'><sup>[2]</sup></a></p>
    <p>Other <a href="#post-citation-7"><sup>[7]</sup></a></p>
  `);
  assert.equal(counts.get(2), 2);
  assert.equal(counts.get(7), 1);
  assert.equal(counts.get(9), undefined);
});
