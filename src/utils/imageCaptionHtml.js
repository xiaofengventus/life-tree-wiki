export function normalizeLegacyImageCaptionHtml(rawHtml) {
  const html = String(rawHtml || "");
  if (typeof DOMParser === "undefined") return html;

  const documentNode = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const paragraphs = [...documentNode.body.querySelectorAll("p")];

  for (const imageParagraph of paragraphs) {
    if (!imageParagraph.isConnected || imageParagraph.children.length !== 1) continue;
    const image = imageParagraph.firstElementChild;
    if (!image?.matches("img") || imageParagraph.textContent.trim()) continue;

    const captionParagraph = imageParagraph.nextElementSibling;
    if (!captionParagraph?.matches("p") || captionParagraph.children.length !== 1) continue;
    const emphasis = captionParagraph.firstElementChild;
    if (!emphasis?.matches("em")) continue;

    const caption = emphasis.textContent.trim().replace(/^图[：:]\s*/, "").trim();
    if (!caption || emphasis.textContent.trim() === caption) continue;

    const figure = documentNode.createElement("figure");
    const figcaption = documentNode.createElement("figcaption");
    figcaption.textContent = caption;
    figure.append(image, figcaption);
    imageParagraph.replaceWith(figure);
    captionParagraph.remove();
  }

  return documentNode.body.innerHTML;
}
