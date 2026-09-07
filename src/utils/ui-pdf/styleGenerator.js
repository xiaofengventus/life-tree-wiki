/**
 * Style JSON → CSS String / Inline Style Object
 * ------------------------------------------------------------------
 * 纯函数，无副作用。Editor Renderer 和 PDF Renderer 共用这一份，
 * 保证编辑器所见与 PDF 导出 100% 一致。
 *
 * Style JSON 结构（所有字段可选）：
 * {
 *   typography: { fontFamily, fontSize, fontWeight, fontStyle, lineHeight,
 *                 letterSpacing, textAlign, textDecoration, textTransform },
 *   color:      { textColor, backgroundColor, accentColor, opacity },
 *   border:     { type,       // 'none' | 'solid' | 'dashed' | 'dotted' | 'double'
 *                 width,      // number(px) 或 "1px" / "0.5em" / "1mm"
 *                 color,
 *                 borderRadius, // 数字=px 或 "8px"/"50%"
 *                 borderTop, borderRight, borderBottom, borderLeft },
 *   shadow:     { boxShadow,   // 直接写 CSS: "0 2px 8px rgba(0,0,0,.1)"
 *                 textShadow },
 *   spacing:    { marginTop, marginRight, marginBottom, marginLeft,
 *                 paddingTop, paddingRight, paddingBottom, paddingLeft },
 *   shape:      { kind,        // 'rectangle' | 'rounded' | 'circle' | 'custom'
 *                 clipPath, overflow },
 *   position:   { position,    // 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'
 *                 top, right, bottom, left,
 *                 width, height, minWidth, maxWidth, minHeight, maxHeight,
 *                 zIndex },
 *   layout:     { display, flexDirection, justifyContent, alignItems, alignContent,
 *                 flexWrap, gap, flexGrow, flexShrink, flexBasis,
 *                 gridTemplateColumns, gridTemplateRows, gridGap, columnCount,
 *                 columnGap },
 *   custom:     { /* 任意 CSS 属性键值对，最后合并进去 *\/ }
 * }
 */

const CSS_UNIT_NUMBER_FIELDS = new Set([
  // typography
  "fontSize", "lineHeight", "letterSpacing",
  // border
  "borderRadius",
  // spacing
  "marginTop", "marginRight", "marginBottom", "marginLeft",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  // position
  "top", "right", "bottom", "left",
  "width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight",
  // layout
  "gap", "gridGap", "columnGap",
]);

function toCssUnit(value, fallbackUnit = "px") {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") {
    if (value === 0) return "0";
    return `${value}${fallbackUnit}`;
  }
  return String(value);
}

function mergeDeep(base, override) {
  if (!override || typeof override !== "object") return base ?? override;
  if (Array.isArray(base) || Array.isArray(override)) return override;
  const result = { ...(base && typeof base === "object" ? base : {}) };
  for (const key of Object.keys(override)) {
    const a = result[key];
    const b = override[key];
    if (a && typeof a === "object" && b && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
      result[key] = mergeDeep(a, b);
    } else if (b !== undefined) {
      result[key] = b;
    }
  }
  return result;
}

/**
 * 把 Style JSON 拍平成一个 { cssProperty: value } 的对象。
 * 例如 { typography:{fontSize:16} } → { "font-size": "16px" }
 */
export function styleToCssMap(styleInput, options = {}) {
  const style = styleInput && typeof styleInput === "object" ? styleInput : {};
  const css = {};
  const unit = options.defaultUnit || "px";

  // ---- typography ----
  const t = style.typography || {};
  if (t.fontFamily) css["font-family"] = Array.isArray(t.fontFamily) ? t.fontFamily.join(", ") : t.fontFamily;
  if (t.fontSize !== undefined && t.fontSize !== null && t.fontSize !== "") css["font-size"] = toCssUnit(t.fontSize, unit);
  if (t.fontWeight !== undefined && t.fontWeight !== null && t.fontWeight !== "") css["font-weight"] = String(t.fontWeight);
  if (t.fontStyle) css["font-style"] = t.fontStyle;
  if (t.lineHeight !== undefined && t.lineHeight !== null && t.lineHeight !== "") {
    css["line-height"] = typeof t.lineHeight === "number" ? String(t.lineHeight) : toCssUnit(t.lineHeight, unit);
  }
  if (t.letterSpacing !== undefined && t.letterSpacing !== null && t.letterSpacing !== "") css["letter-spacing"] = toCssUnit(t.letterSpacing, unit);
  if (t.textAlign) css["text-align"] = t.textAlign;
  if (t.textDecoration) css["text-decoration"] = t.textDecoration;
  if (t.textTransform) css["text-transform"] = t.textTransform;

  // ---- color ----
  const c = style.color || {};
  if (c.textColor) css["color"] = c.textColor;
  if (c.backgroundColor) css["background-color"] = c.backgroundColor;
  if (c.opacity !== undefined && c.opacity !== null && c.opacity !== "") css["opacity"] = String(c.opacity);

  // ---- border ----
  const b = style.border || {};
  let hasSideOverride = false;
  ["Top", "Right", "Bottom", "Left"].forEach((side) => {
    const sideKey = `border${side}`;
    if (b[sideKey] !== undefined && b[sideKey] !== null && b[sideKey] !== "") {
      css[`border-${side.toLowerCase()}`] = String(b[sideKey]);
      hasSideOverride = true;
    }
  });
  if (!hasSideOverride && b.type && b.type !== "none") {
    const w = toCssUnit(b.width ?? 1, unit);
    css["border-style"] = b.type;
    css["border-width"] = w;
    if (b.color) css["border-color"] = b.color;
  } else if (b.type === "none" && !hasSideOverride) {
    css["border"] = "none";
  }
  if (b.borderRadius !== undefined && b.borderRadius !== null && b.borderRadius !== "") {
    css["border-radius"] = toCssUnit(b.borderRadius, unit);
  }

  // ---- shadow ----
  const s = style.shadow || {};
  if (s.boxShadow) css["box-shadow"] = s.boxShadow;
  if (s.textShadow) css["text-shadow"] = s.textShadow;

  // ---- spacing ----
  const sp = style.spacing || {};
  ["marginTop", "marginRight", "marginBottom", "marginLeft"].forEach((key) => {
    if (sp[key] !== undefined && sp[key] !== null && sp[key] !== "") {
      css[key.replace(/^margin([A-Z])/, (_, ch) => `margin-${ch.toLowerCase()}`)] = toCssUnit(sp[key], unit);
    }
  });
  ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"].forEach((key) => {
    if (sp[key] !== undefined && sp[key] !== null && sp[key] !== "") {
      css[key.replace(/^padding([A-Z])/, (_, ch) => `padding-${ch.toLowerCase()}`)] = toCssUnit(sp[key], unit);
    }
  });

  // ---- shape ----
  const sh = style.shape || {};
  if (sh.kind === "circle") css["border-radius"] = css["border-radius"] || "50%";
  else if (sh.kind === "rounded" && !css["border-radius"]) css["border-radius"] = "8px";
  if (sh.clipPath) css["clip-path"] = sh.clipPath;
  if (sh.overflow) css["overflow"] = sh.overflow;

  // ---- position ----
  const p = style.position || {};
  if (p.position) css["position"] = p.position;
  ["top", "right", "bottom", "left", "width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight"].forEach((key) => {
    if (p[key] !== undefined && p[key] !== null && p[key] !== "") {
      css[key.replace(/([A-Z])/g, (_, ch) => `-${ch.toLowerCase()}`)] = toCssUnit(p[key], unit);
    }
  });
  if (p.zIndex !== undefined && p.zIndex !== null && p.zIndex !== "") css["z-index"] = String(p.zIndex);

  // ---- layout ----
  const l = style.layout || {};
  if (l.display) css["display"] = l.display;
  if (l.flexDirection) css["flex-direction"] = l.flexDirection;
  if (l.justifyContent) css["justify-content"] = l.justifyContent;
  if (l.alignItems) css["align-items"] = l.alignItems;
  if (l.alignContent) css["align-content"] = l.alignContent;
  if (l.flexWrap) css["flex-wrap"] = l.flexWrap;
  if (l.gap !== undefined && l.gap !== null && l.gap !== "") css["gap"] = toCssUnit(l.gap, unit);
  if (l.flexGrow !== undefined && l.flexGrow !== null && l.flexGrow !== "") css["flex-grow"] = String(l.flexGrow);
  if (l.flexShrink !== undefined && l.flexShrink !== null && l.flexShrink !== "") css["flex-shrink"] = String(l.flexShrink);
  if (l.flexBasis !== undefined && l.flexBasis !== null && l.flexBasis !== "") css["flex-basis"] = toCssUnit(l.flexBasis, unit);
  if (l.gridTemplateColumns) css["grid-template-columns"] = l.gridTemplateColumns;
  if (l.gridTemplateRows) css["grid-template-rows"] = l.gridTemplateRows;
  if (l.gridGap !== undefined && l.gridGap !== null && l.gridGap !== "") css["grid-gap"] = toCssUnit(l.gridGap, unit);
  if (l.columnCount) css["column-count"] = String(l.columnCount);
  if (l.columnGap !== undefined && l.columnGap !== null && l.columnGap !== "") css["column-gap"] = toCssUnit(l.columnGap, unit);

  // ---- custom 兜底 ----
  if (style.custom && typeof style.custom === "object") {
    for (const key of Object.keys(style.custom)) {
      css[key] = style.custom[key];
    }
  }

  return css;
}

/**
 * 把 Style JSON 变成 Vue 模板里可用的 :style 对象（驼峰键名）。
 * 例如 { "font-size":"16px" } → { fontSize: "16px" }
 */
export function styleToInlineObject(styleInput, options = {}) {
  const cssMap = styleToCssMap(styleInput, options);
  const result = {};
  for (const key of Object.keys(cssMap)) {
    const camelKey = key.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
    result[camelKey] = cssMap[key];
  }
  return result;
}

/**
 * 把 Style JSON 变成一行 CSS 字符串（用于 PDF 导出时写入 <style> 或 style 属性）。
 */
export function styleToCssString(styleInput, options = {}) {
  const cssMap = styleToCssMap(styleInput, options);
  const pairs = Object.keys(cssMap)
    .filter((k) => cssMap[k] !== undefined && cssMap[k] !== null && cssMap[k] !== "")
    .map((k) => `${k}:${cssMap[k]}`);
  return pairs.join(";");
}

/**
 * 浅合并两个 style：override 里出现的字段覆盖 base。
 * 用于「主题默认 style」+「组件自定义 style」。
 */
export function mergeStyles(baseStyle, overrideStyle) {
  return mergeDeep(baseStyle, overrideStyle);
}

/**
 * 快捷：生成常见的 style preset。
 * 供组件的 createDefaultStyle() 使用。
 */
export function presetStyle(presetName, extras = {}) {
  const presets = {
    plainText: {
      typography: {
        fontFamily: ['"Noto Sans SC"', '"Source Han Sans SC"', "sans-serif"],
        fontSize: 10.5,
        lineHeight: 1.65,
        color: { textColor: "#22302A" },
      },
    },
    heading1: {
      typography: {
        fontFamily: ['"Noto Sans SC"', '"Source Han Sans SC"', "sans-serif"],
        fontSize: 26,
        fontWeight: 800,
        lineHeight: 1.25,
        letterSpacing: 0,
      },
      spacing: { marginTop: 0, marginBottom: 14 },
    },
    quote: {
      color: { textColor: "#5D6D64", backgroundColor: "#F4F8F4" },
      border: { type: "solid", width: 2, color: "#33691E", borderRadius: 4 },
      spacing: { paddingTop: 10, paddingRight: 14, paddingBottom: 10, paddingLeft: 14, marginTop: 8, marginBottom: 12 },
    },
    card: {
      color: { backgroundColor: "#FFFFFF" },
      border: { type: "solid", width: 1, color: "#E5EBE5", borderRadius: 8 },
      shadow: { boxShadow: "0 1px 2px rgba(0,0,0,.04)" },
      spacing: { paddingTop: 12, paddingRight: 14, paddingBottom: 12, paddingLeft: 14, marginTop: 6, marginBottom: 10 },
    },
    infoBox: {
      color: { textColor: "#1B3A58", backgroundColor: "#EAF3FB" },
      border: { type: "solid", width: 1, color: "#9FC5E8", borderRadius: 6 },
      spacing: { paddingTop: 10, paddingRight: 14, paddingBottom: 10, paddingLeft: 14 },
    },
    warningBox: {
      color: { textColor: "#664500", backgroundColor: "#FFF6E0" },
      border: { type: "solid", width: 1, color: "#E6C77A", borderRadius: 6 },
      spacing: { paddingTop: 10, paddingRight: 14, paddingBottom: 10, paddingLeft: 14 },
    },
    tipBox: {
      color: { textColor: "#1E4822", backgroundColor: "#E7F4EA" },
      border: { type: "solid", width: 1, color: "#A2D0AC", borderRadius: 6 },
      spacing: { paddingTop: 10, paddingRight: 14, paddingBottom: 10, paddingLeft: 14 },
    },
    noticeBox: {
      color: { textColor: "#691C1C", backgroundColor: "#FBEAEA" },
      border: { type: "solid", width: 1, color: "#E8A8A8", borderRadius: 6 },
      spacing: { paddingTop: 10, paddingRight: 14, paddingBottom: 10, paddingLeft: 14 },
    },
    codeBlock: {
      typography: {
        fontFamily: ['ui-monospace', '"Cascadia Mono"', '"JetBrains Mono"', "Consolas", "monospace"],
        fontSize: 9.5,
        lineHeight: 1.5,
      },
      color: { backgroundColor: "#F6F8F6", textColor: "#2A3530" },
      border: { type: "solid", width: 1, color: "#D8DFD8", borderRadius: 5 },
      spacing: { paddingTop: 10, paddingRight: 12, paddingBottom: 10, paddingLeft: 12, marginTop: 6, marginBottom: 10 },
    },
    tableCell: {
      typography: { fontSize: 9.5, lineHeight: 1.45 },
      border: { type: "solid", width: 1, color: "#D8DFD8" },
      spacing: { paddingTop: 5, paddingRight: 7, paddingBottom: 5, paddingLeft: 7 },
      shape: { overflow: "hidden" },
    },
  };
  const base = presets[presetName] || {};
  return mergeStyles(base, extras);
}
