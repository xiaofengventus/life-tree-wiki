function citationNumbers(citations) {
  return new Set(
    (Array.isArray(citations) ? citations : [])
      .map((citation) => Number(citation?.number))
      .filter((number) => Number.isSafeInteger(number) && number > 0 && number <= 9_999),
  );
}

export function countCitationMarkers(rawHtml) {
  const counts = new Map();
  const pattern = /href\s*=\s*(["'])#post-citation-([1-9]\d{0,3})\1/gi;
  let match;
  while ((match = pattern.exec(String(rawHtml || "")))) {
    const number = Number(match[2]);
    counts.set(number, (counts.get(number) || 0) + 1);
  }
  return counts;
}

export function normalizeCitationLinks(rawHtml, citations) {
  const html = String(rawHtml || "");
  if (typeof DOMParser === "undefined") return html;
  const available = citationNumbers(citations);
  if (!available.size) return html;

  const documentNode = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  documentNode.body.querySelectorAll("sup").forEach((sup) => {
    const match = sup.textContent?.trim().match(/^\[([1-9]\d{0,3})\]$/);
    const number = Number(match?.[1]);
    if (!available.has(number)) return;

    let anchor = sup.parentElement?.matches("a") ? sup.parentElement : sup.querySelector("a");
    if (!anchor) {
      anchor = documentNode.createElement("a");
      sup.replaceWith(anchor);
      anchor.append(sup);
    }
    anchor.setAttribute("href", `#post-citation-${number}`);
    anchor.removeAttribute("target");
    anchor.removeAttribute("rel");
    anchor.setAttribute("title", `跳转到参考文献 [${number}]`);
  });

  return documentNode.body.innerHTML;
}
