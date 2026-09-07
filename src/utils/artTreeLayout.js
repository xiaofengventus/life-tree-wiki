const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 760;
export const ART_TREE_NODE_LIMIT = 420;

function hashText(value) {
  let hash = 2166136261;
  for (const character of String(value || "")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function unitNoise(value) {
  return (hashText(value) % 10_000) / 10_000;
}

function sourceRoot(document) {
  if (document?.format === "life-tree.xur") return document.document?.root || null;
  return document?.root || null;
}

function collectTree(document, limit = ART_TREE_NODE_LIMIT) {
  const root = sourceRoot(document);
  if (!root) return { records: [], truncated: false, maxDepth: 0 };
  const records = [];
  let truncated = false;

  function visit(source, parent = null, depth = 0, path = "0") {
    if (records.length >= limit) {
      truncated = true;
      return null;
    }
    const data = source?.data || {};
    const record = {
      id: String(data.uid || `art-node-${path}`),
      label: String(data.text || "").trim() || "未命名节点",
      image: String(data.image || ""),
      imageTitle: String(data.imageTitle || ""),
      contentLinks: Array.isArray(data.contentLinks)
        ? data.contentLinks
        : Array.isArray(data.articleLinks)
          ? data.articleLinks
          : [],
      citationNumbers: Array.isArray(data.citationNumbers) ? data.citationNumbers : [],
      parent,
      children: [],
      depth,
      path,
      index: records.length,
    };
    records.push(record);
    const children = Array.isArray(source?.children) ? source.children : [];
    children.forEach((child, index) => {
      const childRecord = visit(child, record, depth + 1, `${path}-${index}`);
      if (childRecord) record.children.push(childRecord);
    });
    return record;
  }

  visit(root);
  return {
    records,
    truncated,
    maxDepth: records.reduce((maximum, record) => Math.max(maximum, record.depth), 0),
  };
}

function edgeRecord(parent, child, path) {
  return {
    id: `${parent.id}:${child.id}`,
    from: parent,
    to: child,
    path,
    delay: Math.max(0, child.depth * 0.11 + child.index * 0.012),
  };
}

export function buildBotanicalArtLayout(
  document,
  {
    width: baseWidth = DEFAULT_WIDTH,
    height: baseHeight = DEFAULT_HEIGHT,
    limit = ART_TREE_NODE_LIMIT,
    spacing = 1,
  } = {},
) {
  const collected = collectTree(document, limit);
  const { records, maxDepth } = collected;
  if (!records.length) {
    return { ...collected, nodes: [], edges: [], width: baseWidth, height: baseHeight };
  }

  let leafCursor = 0;
  function assignLeafPosition(record) {
    if (!record.children.length) {
      record.leafPosition = leafCursor;
      leafCursor += 1;
      return record.leafPosition;
    }
    const positions = record.children.map(assignLeafPosition);
    record.leafPosition =
      positions.reduce((total, position) => total + position, 0) / positions.length;
    return record.leafPosition;
  }
  assignLeafPosition(records[0]);

  const leafCount = Math.max(1, leafCursor);
  const spacingFactor = Math.max(0.8, Math.min(2.2, Number(spacing) || 1));
  const horizontalMargin = 95;
  const verticalMargin = 75;
  const width = Math.min(
    9000,
    Math.max(baseWidth, horizontalMargin * 2 + Math.max(1, leafCount - 1) * 68 * spacingFactor),
  );
  const height = Math.min(
    6000,
    Math.max(baseHeight, verticalMargin * 2 + Math.max(1, maxDepth) * 112 * spacingFactor),
  );
  const usableWidth = width - horizontalMargin * 2;
  const usableHeight = height - verticalMargin * 2;
  for (const record of records) {
    const baseX = leafCount === 1
      ? width / 2
      : horizontalMargin + (record.leafPosition / (leafCount - 1)) * usableWidth;
    const depthProgress = maxDepth ? record.depth / maxDepth : 0;
    const jitter = record.depth
      ? (unitNoise(`${record.id}:botanical`) - 0.5) * Math.min(42, usableWidth / leafCount)
      : 0;
    record.x = Math.max(42, Math.min(width - 42, baseX + jitter));
    record.y = height - verticalMargin - depthProgress * usableHeight;
    record.isLeaf = record.children.length === 0;
    record.delay = record.depth * 0.12 + record.index * 0.015;
    record.scale = record.isLeaf ? 1 : Math.max(0.58, 1 - record.depth * 0.035);
  }

  const edges = records
    .filter((record) => record.parent)
    .map((record) => {
      const parent = record.parent;
      const middleY = parent.y - Math.max(24, (parent.y - record.y) * 0.52);
      return edgeRecord(
        parent,
        record,
        `M ${parent.x} ${parent.y} C ${parent.x} ${middleY}, ${record.x} ${middleY}, ${record.x} ${record.y}`,
      );
    });
  return { ...collected, nodes: records, edges, width, height };
}

function assignAngularSpan(record, start, end) {
  record.angle = (start + end) / 2;
  if (!record.children.length) return;
  const span = end - start;
  const step = span / record.children.length;
  record.children.forEach((child, index) => {
    assignAngularSpan(child, start + step * index, start + step * (index + 1));
  });
}

export function buildCrystalArtLayout(
  document,
  {
    width: baseWidth = DEFAULT_WIDTH,
    height: baseHeight = DEFAULT_HEIGHT,
    limit = ART_TREE_NODE_LIMIT,
    spacing = 1,
  } = {},
) {
  const collected = collectTree(document, limit);
  const { records, maxDepth } = collected;
  if (!records.length) {
    return { ...collected, nodes: [], edges: [], width: baseWidth, height: baseHeight };
  }

  assignAngularSpan(records[0], -Math.PI / 2, Math.PI * 1.5);
  const spacingFactor = Math.max(0.8, Math.min(2.2, Number(spacing) || 1));
  const depthCounts = new Map();
  records.forEach((record) => {
    depthCounts.set(record.depth, (depthCounts.get(record.depth) || 0) + 1);
  });
  const mostCrowdedDepth = Math.max(1, ...depthCounts.values());
  const requiredDiameter = (mostCrowdedDepth * 48 * spacingFactor) / Math.PI;
  const height = Math.min(
    6000,
    Math.max(baseHeight, 220 + maxDepth * 180 * spacingFactor, requiredDiameter + 170),
  );
  const width = Math.min(9000, Math.max(baseWidth, height * 1.45));
  const centerX = width / 2;
  const centerY = height / 2;
  const maximumRadius = Math.min(width, height) * 0.405;
  for (const record of records) {
    const depthProgress = maxDepth ? record.depth / maxDepth : 0;
    const angularNoise = record.depth
      ? (unitNoise(`${record.id}:crystal`) - 0.5) * 0.09
      : 0;
    const angle = record.angle + angularNoise;
    const radius = depthProgress * maximumRadius;
    record.x = centerX + Math.cos(angle) * radius;
    record.y = centerY + Math.sin(angle) * radius;
    record.isLeaf = record.children.length === 0;
    record.delay = record.depth * 0.1 + record.index * 0.012;
    record.rotation = (angle * 180) / Math.PI + 30;
    record.scale = record.isLeaf ? 1 : Math.max(0.6, 1 - record.depth * 0.025);
  }

  const edges = records
    .filter((record) => record.parent)
    .map((record) =>
      edgeRecord(
        record.parent,
        record,
        `M ${record.parent.x} ${record.parent.y} L ${record.x} ${record.y}`,
      ),
    );
  return { ...collected, nodes: records, edges, width, height };
}

export function buildLineageArtLayout(
  document,
  {
    width: baseWidth = DEFAULT_WIDTH,
    height: baseHeight = DEFAULT_HEIGHT,
    limit = ART_TREE_NODE_LIMIT,
    spacing = 1,
  } = {},
) {
  const collected = collectTree(document, limit);
  const { records, maxDepth } = collected;
  if (!records.length) {
    return { ...collected, nodes: [], edges: [], width: baseWidth, height: baseHeight };
  }

  let leafCursor = 0;
  function assignLeafPosition(record) {
    if (!record.children.length) {
      record.leafPosition = leafCursor;
      leafCursor += 1;
      return record.leafPosition;
    }
    const childPositions = record.children.map(assignLeafPosition);
    record.leafPosition =
      childPositions.reduce((total, position) => total + position, 0) / childPositions.length;
    return record.leafPosition;
  }
  assignLeafPosition(records[0]);

  records[0].lineageIndex = -1;
  function assignLineage(record, lineageIndex) {
    record.lineageIndex = lineageIndex;
    record.children.forEach((child) => assignLineage(child, lineageIndex));
  }
  records[0].children.forEach((child, index) => assignLineage(child, index));

  const leafCount = Math.max(1, leafCursor);
  const spacingFactor = Math.max(0.8, Math.min(2.2, Number(spacing) || 1));
  const horizontalMargin = 125;
  const verticalMargin = 92;
  const width = Math.min(
    9000,
    Math.max(baseWidth, horizontalMargin * 2 + Math.max(1, leafCount - 1) * 86 * spacingFactor),
  );
  const height = Math.min(
    6000,
    Math.max(baseHeight, verticalMargin * 2 + Math.max(1, maxDepth) * 128 * spacingFactor),
  );
  const usableWidth = width - horizontalMargin * 2;
  const usableHeight = height - verticalMargin * 2;

  for (const record of records) {
    const baseX = leafCount === 1
      ? width / 2
      : horizontalMargin + (record.leafPosition / (leafCount - 1)) * usableWidth;
    const depthProgress = maxDepth ? record.depth / maxDepth : 0;
    record.x = record.depth === 0 ? width / 2 : baseX;
    record.y = height - verticalMargin - depthProgress * usableHeight;
    record.isLeaf = record.children.length === 0;
    record.delay = record.depth * 0.11 + record.index * 0.014;
    record.scale = 1;
  }

  const edges = records
    .filter((record) => record.parent)
    .map((record) => ({
      ...edgeRecord(
        record.parent,
        record,
        `M ${record.parent.x} ${record.parent.y} L ${record.x} ${record.y}`,
      ),
      lineageIndex: record.lineageIndex,
    }));

  return { ...collected, nodes: records, edges, width, height };
}

export function buildNebulaArtLayout(
  document,
  { limit = ART_TREE_NODE_LIMIT, spacing = 1 } = {},
) {
  const collected = collectTree(document, limit);
  const { records, maxDepth } = collected;
  if (!records.length) {
    return { ...collected, nodes: [], edges: [], extent: 1 };
  }

  function assignSubtreeWeight(record) {
    record.subtreeWeight = record.children.length
      ? record.children.reduce((total, child) => total + assignSubtreeWeight(child), 0)
      : 1;
    return record.subtreeWeight;
  }

  function assignSector(record, start, end) {
    record.sectorStart = start;
    record.sectorEnd = end;
    record.angle = (start + end) / 2;
    if (!record.children.length) return;
    let cursor = start;
    const span = end - start;
    record.children.forEach((child) => {
      const childSpan = span * (child.subtreeWeight / record.subtreeWeight);
      assignSector(child, cursor, cursor + childSpan);
      cursor += childSpan;
    });
  }

  assignSubtreeWeight(records[0]);
  assignSector(records[0], -Math.PI, Math.PI);
  records[0].lineageIndex = -1;

  function assignLineage(record, lineageIndex) {
    record.lineageIndex = lineageIndex;
    record.children.forEach((child) => assignLineage(child, lineageIndex));
  }
  records[0].children.forEach((child, index) => assignLineage(child, index));

  const spacingFactor = Math.max(0.8, Math.min(2.2, Number(spacing) || 1));
  const extent = Math.max(
    440,
    Math.min(1800, Math.sqrt(records.length) * 72 * spacingFactor),
  );

  for (const record of records) {
    const depthProgress = maxDepth ? record.depth / maxDepth : 0;
    const radius = extent * Math.pow(depthProgress, 0.88);
    const elevation = record.depth
      ? (unitNoise(`${record.id}:nebula:elevation`) - 0.5) *
        Math.min(1.05, 0.34 + record.depth * 0.055)
      : 0;
    const horizontalRadius = Math.cos(elevation) * radius;
    record.x = Math.cos(record.angle) * horizontalRadius;
    record.y = Math.sin(elevation) * radius;
    record.z = Math.sin(record.angle) * horizontalRadius;
    record.radius = radius;
    record.isLeaf = record.children.length === 0;
    record.delay = record.depth * 0.09 + record.index * 0.01;
    record.scale = record.depth === 0 ? 1.65 : record.isLeaf ? 1 : 0.82;
  }

  const edges = records
    .filter((record) => record.parent)
    .map((record) => ({
      id: `${record.parent.id}:${record.id}`,
      from: record.parent,
      to: record,
      lineageIndex: record.lineageIndex,
      delay: Math.max(0, record.depth * 0.09 + record.index * 0.01),
    }));

  return { ...collected, nodes: records, edges, extent };
}

export function artTreePalette(style, seed = "") {
  const offset = hashText(seed) % 3;
  const botanical = [
    { background: "#071a15", branch: "#8fbf74", accent: "#f6c177", bloom: "#f29db2", glow: "#9be7c4" },
    { background: "#10180f", branch: "#b0c878", accent: "#ffd47d", bloom: "#e7a6d8", glow: "#b8e986" },
    { background: "#0b1b1b", branch: "#74b99c", accent: "#f2bd6b", bloom: "#f39a86", glow: "#92e2d0" },
  ];
  const crystal = [
    { background: "#090d22", branch: "#688ee8", accent: "#a6c8ff", bloom: "#91e5ff", glow: "#806df2" },
    { background: "#101027", branch: "#9d76e8", accent: "#e2bdff", bloom: "#7ee7d7", glow: "#d37de8" },
    { background: "#07151f", branch: "#4eb4cc", accent: "#b6f4ff", bloom: "#77a3ff", glow: "#5be0bd" },
  ];
  const lineage = [
    { background: "#fbfcfd", branch: "#7d8993", accent: "#59656f", bloom: "#ef5350", glow: "#55a9dc" },
    { background: "#fffdfb", branch: "#858079", accent: "#57534e", bloom: "#e85d75", glow: "#4c9ed4" },
    { background: "#f8fbfa", branch: "#75847e", accent: "#4f5f59", bloom: "#e95f55", glow: "#4ca7bd" },
  ];
  const nebula = [
    { background: "#050817", branch: "#7188bd", accent: "#f5d98a", bloom: "#9f8cff", glow: "#63d9ff" },
    { background: "#090617", branch: "#8b76ba", accent: "#ffd19a", bloom: "#ea8bcb", glow: "#7bdfe1" },
    { background: "#041017", branch: "#5f95aa", accent: "#f1ca7a", bloom: "#7da8ff", glow: "#69e1bd" },
  ];
  if (style === "crystal") return crystal[offset];
  if (style === "lineage") return lineage[offset];
  if (style === "nebula") return nebula[offset];
  return botanical[offset];
}
