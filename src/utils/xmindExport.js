import JSZip from "jszip";

const DATA_IMAGE_PATTERN = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i;

function plainText(value) {
  const container = document.createElement("div");
  container.innerHTML = String(value ?? "");
  return container.textContent || "";
}

function createId(prefix = "topic") {
  const random = globalThis.crypto?.randomUUID?.()
    || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${random}`;
}

function imageExtension(mimeType) {
  const normalized = String(mimeType).toLowerCase();
  if (normalized === "image/jpeg") return "jpg";
  if (normalized === "image/svg+xml") return "svg";
  if (normalized === "image/x-icon" || normalized === "image/vnd.microsoft.icon") return "ico";
  return normalized.replace(/^image\//, "").replace(/[^a-z0-9]/g, "") || "png";
}

function addImage(topic, nodeData, resources) {
  if (!nodeData.image) return;
  const match = String(nodeData.image).match(DATA_IMAGE_PATTERN);
  if (!match) throw new Error(`节点“${plainText(nodeData.text) || "空节点"}”的图片无法写入 XMind`);

  const extension = imageExtension(match[1]);
  const filename = `image_${resources.length + 1}.${extension}`;
  const path = `resources/${filename}`;
  resources.push({ path, base64: match[2].replace(/\s/g, "") });

  const width = Number(nodeData.imageSize?.width);
  const height = Number(nodeData.imageSize?.height);
  topic.image = {
    src: `xap:${path}`,
    ...(width > 0 ? { width } : {}),
    ...(height > 0 ? { height } : {}),
  };
}

function convertTopic(node, resources, isRoot = false) {
  const nodeData = node?.data || {};
  const topic = {
    id: createId("topic"),
    structureClass: "org.xmind.ui.logic.right",
    title: plainText(nodeData.text),
    children: { attached: [] },
  };

  if (nodeData.note != null && String(nodeData.note).trim()) {
    topic.notes = {
      realHTML: { content: String(nodeData.note) },
      plain: { content: plainText(nodeData.note) },
    };
  }
  if (Array.isArray(nodeData.tag) && nodeData.tag.length) {
    topic.labels = nodeData.tag
      .map((tag) => plainText(typeof tag === "object" && tag ? tag.text : tag))
      .filter(Boolean);
  }
  addImage(topic, nodeData, resources);
  topic.children.attached = (node?.children || []).map((child) =>
    convertTopic(child, resources),
  );
  if (isRoot) topic.class = "topic";
  return topic;
}

export async function createXmindBlob(root, name) {
  const sheetId = createId("sheet");
  const resources = [];
  const rootTopic = convertTopic(root, resources, true);
  const content = [{
    id: sheetId,
    class: "sheet",
    title: String(name || "生命时序"),
    extensions: [],
    topicPositioning: "fixed",
    topicOverlapping: "overlap",
    coreVersion: "2.100.0",
    rootTopic,
  }];
  const metadata = {
    modifier: "",
    dataStructureVersion: "2",
    creator: { name: "生命时序" },
    layoutEngineVersion: "3",
    activeSheetId: sheetId,
  };
  const manifest = {
    "file-entries": {
      "content.json": {},
      "metadata.json": {},
      "manifest.json": {},
    },
  };

  const zip = new JSZip();
  zip.file("content.json", JSON.stringify(content));
  zip.file("metadata.json", JSON.stringify(metadata));
  resources.forEach(({ path, base64 }) => {
    zip.file(path, base64, { base64: true });
    manifest["file-entries"][path] = {};
  });
  zip.file("manifest.json", JSON.stringify(manifest));
  return {
    blob: await zip.generateAsync({ type: "blob", compression: "DEFLATE" }),
    imageCount: resources.length,
  };
}
