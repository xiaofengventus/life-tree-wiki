/**
 * lifeTreeLayout - 维基百科 cladogram 风格的真实 DOM 生命树布局
 *
 * 规则（见 src/assets/111.txt 需求）：
 * - 文字与树枝都是真实 DOM 元素，树枝为横/竖细长矩形
 * - 非叶节点的名字在树枝上方，叶节点的名字在树枝右侧
 * - 名字 "中文 拉丁文名"：拉丁部分斜体
 * - 树枝长度自适应文本长度；上下节点之间为图片预留高度，不互相挤压
 * - 根节点处于画布左侧，整棵树通过页面滚动查看，不做缩放变换
 */

export const LIFE_TREE_LAYOUT = {
  FONT_SIZE: 14,
  ROOT_FONT_SIZE: 16,
  LINE_HEIGHT: 22,
  LABEL_GAP: 6,
  ROW_HEIGHT: 30,
  SIBLING_GAP: 8,
  LEAF_BRANCH: 26,
  BRANCH_END_PAD: 22,
  IMAGE_HEIGHT: 56,
  IMAGE_WIDTH: 72,
  IMAGE_GAP: 8,
  LABEL_INDENT: 6,
  MIN_BRANCH: 44,
  MARGIN_X: 90,
  MARGIN_Y: 70,
};

const LATIN_TOKEN =
  /^[A-Za-z†][A-Za-zà-öø-ÿĀ-ſ'’·.-]*(?:[ -][A-Za-zà-öø-ÿĀ-ſ'’·.-]+)*$/;

const FONT_STACK =
  '"Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif';
const LATIN_FONT_STACK = 'Georgia, "Times New Roman", serif';

let measureContext = null;

function getMeasureContext() {
  if (!measureContext && typeof document !== "undefined") {
    measureContext = document.createElement("canvas").getContext("2d");
  }
  return measureContext;
}

function measureText(text, { fontSize, italic = false, bold = false }) {
  const context = getMeasureContext();
  if (!context) return String(text).length * fontSize * 0.6;
  context.font = `${italic ? "italic " : ""}${bold ? "bold " : ""}${fontSize}px ${FONT_STACK}`;
  return context.measureText(String(text)).width;
}

/** 把 "中文 拉丁文名" 拆成 正常/斜体 两类片段 */
export function splitNameSegments(text) {
  const segments = [];
  for (const token of String(text || "").trim().split(/\s+/)) {
    if (!token) continue;
    const latin = LATIN_TOKEN.test(token);
    const last = segments[segments.length - 1];
    if (last && last.latin === latin) {
      last.text += ` ${token}`;
    } else {
      segments.push({ text: token, latin });
    }
  }
  return segments;
}

function measureLabel({ segments, age, citationCount, isRoot }) {
  const fontSize = isRoot
    ? LIFE_TREE_LAYOUT.ROOT_FONT_SIZE
    : LIFE_TREE_LAYOUT.FONT_SIZE;
  let width = 0;
  for (const segment of segments) {
    width += measureText(segment.text, {
      fontSize,
      italic: segment.latin,
      bold: isRoot,
    });
    if (segment.latin) width += 2;
  }
  if (age) width += measureText(age, { fontSize: 11 }) + 10;
  if (citationCount) width += 20;
  return width;
}

function nodeImage(data) {
  if (!data?.image) return "";
  if (typeof data.image === "string") return data.image;
  return data.image.url || "";
}

/**
 * 计算整棵树的布局。
 * 返回 { nodes, branches, width, height }：
 * - nodes: 文字/图片的定位信息（kind: "leaf" | "internal"）
 * - branches: 树枝矩形（dir: "h" | "v"，均为真实 DOM 元素）
 */
export function computeLifeTreeLayout(root) {
  const nodes = [];
  const branches = [];
  let fallbackId = 0;
  let maxRight = 0;

  const M = LIFE_TREE_LAYOUT;

  function layoutNode(node, depth, x, yStart) {
    const data = node?.data || {};
    const isRoot = depth === 0;
    const children = (Array.isArray(node?.children) ? node.children : []).filter(
      Boolean,
    );
    const id = data.uid || `life-node-${fallbackId++}`;
    const segments = splitNameSegments(data.text || "");
    const age = String(data.age || "").trim();
    const imageUrl = nodeImage(data);
    const hasImage = Boolean(imageUrl);
    const contentLinks = Array.isArray(data.contentLinks) ? data.contentLinks : [];
    const citationNumbers = Array.isArray(data.citationNumbers)
      ? data.citationNumbers
      : [];
    const labelWidth = measureLabel({
      segments,
      age,
      citationCount: citationNumbers.length,
      isRoot,
    });

    if (children.length === 0) {
      // 叶节点：名字与图片都在树枝右侧
      const band = Math.max(M.ROW_HEIGHT, hasImage ? M.IMAGE_HEIGHT + 10 : 0);
      const branchY = yStart + band / 2;
      const labelLeft = x + M.LEAF_BRANCH + M.IMAGE_GAP;
      const nodeInfo = {
        id,
        kind: "leaf",
        depth,
        x,
        branchY,
        branchLength: M.LEAF_BRANCH,
        labelLeft,
        labelTop: branchY - M.LINE_HEIGHT / 2,
        labelWidth,
        segments,
        age,
        imageUrl,
        hasImage,
        imageBox: hasImage
          ? {
              left: labelLeft + labelWidth + M.IMAGE_GAP,
              top: branchY - M.IMAGE_HEIGHT / 2,
            }
          : null,
        contentLinks,
        citationNumbers,
        isRoot,
      };
      nodes.push(nodeInfo);
      branches.push({
        id: `${id}-h`,
        dir: "h",
        x,
        y: branchY,
        length: M.LEAF_BRANCH,
      });
      maxRight = Math.max(
        maxRight,
        nodeInfo.imageBox
          ? nodeInfo.imageBox.left + M.IMAGE_WIDTH
          : labelLeft + labelWidth,
      );
      return { branchY, band };
    }

    // 内部节点：名字（和图片）在树枝上方；无名节点不预留文字高度
    const hasLabel =
      segments.length > 0 || Boolean(age) || citationNumbers.length > 0;
    const reserve =
      (hasLabel ? M.LINE_HEIGHT + M.LABEL_GAP : 0) +
      (hasImage ? M.IMAGE_HEIGHT + M.LABEL_GAP : 0);
    const branchLength = Math.max(
      M.MIN_BRANCH,
      M.LABEL_INDENT + labelWidth + M.BRANCH_END_PAD,
    );
    const childX = x + branchLength;

    let cursorY = yStart + reserve;
    const childResults = [];
    children.forEach((child, index) => {
      const result = layoutNode(child, depth + 1, childX, cursorY);
      childResults.push(result);
      cursorY += result.band;
      if (index < children.length - 1) cursorY += M.SIBLING_GAP;
    });

    const first = childResults[0];
    const last = childResults[childResults.length - 1];
    const branchY = (first.branchY + last.branchY) / 2;
    const labelTop = branchY - reserve;

    nodes.push({
      id,
      kind: "internal",
      depth,
      x,
      branchY,
      branchLength,
      labelLeft: x + M.LABEL_INDENT,
      labelTop,
      labelWidth,
      segments,
      age,
      imageUrl,
      hasImage,
      imageBox: hasImage
        ? {
            left: x + M.LABEL_INDENT,
            top: labelTop + (hasLabel ? M.LINE_HEIGHT + M.LABEL_GAP : 0),
          }
        : null,
      contentLinks,
      citationNumbers,
      isRoot,
    });

    branches.push({ id: `${id}-h`, dir: "h", x, y: branchY, length: branchLength });
    const verticalX = x + branchLength;
    const verticalTop = Math.min(first.branchY, branchY);
    const verticalBottom = Math.max(last.branchY, branchY);
    if (verticalBottom - verticalTop > 1.5) {
      branches.push({
        id: `${id}-v`,
        dir: "v",
        x: verticalX,
        y: verticalTop,
        length: verticalBottom - verticalTop,
      });
    }

    maxRight = Math.max(maxRight, x + branchLength);
    if (hasImage) {
      maxRight = Math.max(maxRight, x + M.LABEL_INDENT + M.IMAGE_WIDTH);
    }
    return { branchY, band: cursorY - yStart };
  }

  const rootResult = layoutNode(root || {}, 0, M.MARGIN_X, M.MARGIN_Y);

  return {
    nodes,
    branches,
    width: Math.ceil(maxRight + M.MARGIN_X),
    height: Math.ceil(rootResult.band + M.MARGIN_Y * 2),
  };
}
