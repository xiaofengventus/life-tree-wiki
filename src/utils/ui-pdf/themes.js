/**
 * Theme（主题）系统
 * ------------------------------------------------------------------
 * 一个 Theme 是一个可序列化的 JSON 对象，统一定义：
 *   1. 全局变量（颜色 / 字体 / 字号层级）
 *   2. 每种组件的默认 Style JSON
 *
 * 合并优先级（从高到低）：
 *   组件自定义 style  >  主题的 componentDefaults[componentType]  >  主题 typography/color 全局
 *
 * 切换主题时：
 *   如果组件没有手动改过 style（styleOverridden=false），整个 style 被新主题替换。
 *   如果组件标记了 styleOverridden=true，只把新主题没有的字段补上，手动改过的保留。
 */

import { mergeStyles, presetStyle } from "./styleGenerator.js";

// ---------- 通用字体栈 ----------
const SANS_CN = ['"Noto Sans SC"', '"Source Han Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', "sans-serif"];
const SERIF_CN = ['"Noto Serif SC"', '"Source Han Serif SC"', '"SimSun"', "serif"];
const MONO = ['ui-monospace', '"Cascadia Mono"', '"JetBrains Mono"', '"Consolas"', "monospace"];

function baseComponentDefaults(themeVars) {
  const accent = themeVars.primaryColor;
  const paper = themeVars.paperColor;
  const ink = themeVars.inkColor;
  const muted = themeVars.mutedColor;
  const rule = themeVars.ruleColor;

  return {
    // ---- 基础组件 ----
    text: {
      typography: {
        fontFamily: themeVars.bodyFont,
        fontSize: themeVars.baseFontSize,
        lineHeight: themeVars.bodyLineHeight,
        color: { textColor: ink },
      },
    },
    heading: {
      typography: {
        fontFamily: themeVars.headingFont,
        fontSize: themeVars.h1Size,
        fontWeight: 800,
        lineHeight: 1.25,
        color: { textColor: ink },
      },
      spacing: { marginTop: 0, marginBottom: 14 },
    },
    image: {
      border: { type: "solid", width: 1, color: rule, borderRadius: 4 },
      spacing: { marginTop: 6, marginBottom: 12 },
    },
    divider: {
      border: { type: "solid", width: 1, color: rule },
      spacing: { marginTop: 18, marginBottom: 18 },
    },
    spacer: {},

    // ---- 内容组件 ----
    paragraph: {
      typography: {
        fontFamily: themeVars.bodyFont,
        fontSize: themeVars.baseFontSize,
        lineHeight: themeVars.bodyLineHeight,
      },
      color: { textColor: ink },
      spacing: { marginTop: 0, marginBottom: 14 },
    },
    quote: mergeStyles(
      presetStyle("quote", {
        border: { color: accent },
        color: { textColor: muted },
      }),
      {},
    ),
    list: {
      typography: {
        fontFamily: themeVars.bodyFont,
        fontSize: themeVars.baseFontSize,
        lineHeight: themeVars.bodyLineHeight,
      },
      color: { textColor: ink },
      spacing: { paddingLeft: 24, marginTop: 0, marginBottom: 12 },
    },
    table: {
      layout: { width: "100%" },
      border: { type: "solid", width: 1, color: rule },
      shape: { overflow: "hidden" },
      spacing: { marginTop: 8, marginBottom: 14 },
    },
    code: presetStyle("codeBlock"),
    link: {
      color: { textColor: accent },
      typography: { textDecoration: "underline" },
    },

    // ---- 文章组件 ----
    articleTitle: {
      typography: {
        fontFamily: themeVars.headingFont,
        fontSize: themeVars.h1Size * 1.2,
        fontWeight: 850,
        lineHeight: 1.15,
        letterSpacing: 0.01,
      },
      color: { textColor: ink },
      spacing: { marginTop: 0, marginBottom: 10 },
    },
    subtitle: {
      typography: {
        fontFamily: themeVars.bodyFont,
        fontSize: themeVars.baseFontSize * 1.1,
        lineHeight: 1.5,
      },
      color: { textColor: muted },
      spacing: { marginTop: 0, marginBottom: 14 },
    },
    author: {
      typography: {
        fontFamily: themeVars.bodyFont,
        fontSize: themeVars.baseFontSize,
        fontWeight: 600,
      },
      color: { textColor: ink },
    },
    date: {
      typography: {
        fontFamily: themeVars.bodyFont,
        fontSize: themeVars.baseFontSize * 0.92,
      },
      color: { textColor: muted },
    },
    toc: {
      border: { type: "solid", width: 1, color: rule, borderRadius: 6 },
      color: { backgroundColor: paper },
      spacing: { paddingTop: 10, paddingRight: 14, paddingBottom: 10, paddingLeft: 14, marginTop: 8, marginBottom: 14 },
    },
    footnote: {
      typography: { fontSize: themeVars.baseFontSize * 0.85 },
      color: { textColor: muted },
      spacing: { marginTop: 4, marginBottom: 4 },
    },
    pageNumber: {
      typography: { fontSize: themeVars.baseFontSize * 0.82 },
      color: { textColor: muted },
    },

    // ---- 信息组件 ----
    callout: presetStyle("card", {
      border: { color: accent },
    }),
    warning: presetStyle("warningBox"),
    tip: presetStyle("tipBox"),
    info: presetStyle("infoBox"),
    notice: presetStyle("noticeBox"),

    // ---- 布局组件 ----
    container: {},
    columns: { layout: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } },
    sidebar: {
      color: { backgroundColor: "#FAFCFA" },
      border: { type: "solid", width: 1, color: rule, borderRadius: 6 },
      spacing: { paddingTop: 10, paddingRight: 12, paddingBottom: 10, paddingLeft: 12 },
    },
    card: presetStyle("card"),
    grid: { layout: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridGap: 10 } },

    // ---- 图片组件 ----
    picture: {
      border: { type: "solid", width: 1, color: rule, borderRadius: 4 },
      spacing: { marginTop: 6, marginBottom: 12 },
    },
  };
}

// ========== 7 套预设主题 ==========

const THEME_PRESETS = {
  // ---- ① 学术（Academic）：衬线正文，清晰层级 ----
  academic: {
    id: "academic",
    name: "学术",
    description: "衬线正文、清晰层级，适合论文与研究笔记",
    version: 1,
    variables: {
      primaryColor: "#33691E",
      secondaryColor: "#558B2F",
      paperColor: "#FFFFFF",
      inkColor: "#1F2A25",
      mutedColor: "#5D6D64",
      ruleColor: "#D8DFD8",
      font: SERIF_CN,
      headingFont: SANS_CN,
      bodyFont: SERIF_CN,
      baseFontSize: 10.5,
      bodyLineHeight: 1.7,
      h1Size: 22,
      h2Size: 16,
      h3Size: 13,
    },
  },

  // ---- ② 极简（Minimal）：大量留白、细线 ----
  minimal: {
    id: "minimal",
    name: "极简",
    description: "大量留白、细线分隔，适合说明和公告",
    version: 1,
    variables: {
      primaryColor: "#111111",
      secondaryColor: "#555555",
      paperColor: "#FFFFFF",
      inkColor: "#111111",
      mutedColor: "#777777",
      ruleColor: "#E5E5E5",
      font: SANS_CN,
      headingFont: SANS_CN,
      bodyFont: SANS_CN,
      baseFontSize: 10.5,
      bodyLineHeight: 1.85,
      h1Size: 24,
      h2Size: 16,
      h3Size: 13,
    },
  },

  // ---- ③ 微信公众号：大字号、宽行高、清爽白 ----
  wechat: {
    id: "wechat",
    name: "微信公众号",
    description: "大字号、宽行高、清爽排版，适合公众号图文",
    version: 1,
    variables: {
      primaryColor: "#07C160",
      secondaryColor: "#FF8A00",
      paperColor: "#FFFFFF",
      inkColor: "#222222",
      mutedColor: "#888888",
      ruleColor: "#ECECEC",
      font: ['-apple-system', "BlinkMacSystemFont", '"Helvetica Neue"', ...SANS_CN],
      headingFont: ['-apple-system', ...SANS_CN],
      bodyFont: ['-apple-system', ...SANS_CN],
      baseFontSize: 14,  // 公众号正文偏大
      bodyLineHeight: 1.9,
      h1Size: 28,
      h2Size: 20,
      h3Size: 17,
    },
  },

  // ---- ④ 科技（Tech）：等宽 + 深色强调 ----
  tech: {
    id: "tech",
    name: "科技",
    description: "现代等宽强调、深色主色，适合技术文档与白皮书",
    version: 1,
    variables: {
      primaryColor: "#2563EB",
      secondaryColor: "#7C3AED",
      paperColor: "#FFFFFF",
      inkColor: "#0F172A",
      mutedColor: "#64748B",
      ruleColor: "#E2E8F0",
      font: [...SANS_CN],
      headingFont: [...SANS_CN],
      bodyFont: [...SANS_CN],
      baseFontSize: 10.5,
      bodyLineHeight: 1.65,
      h1Size: 24,
      h2Size: 17,
      h3Size: 14,
    },
  },

  // ---- ⑤ 杂志（Magazine）：紧凑标题、现代字距、图文混排 ----
  magazine: {
    id: "magazine",
    name: "杂志图文",
    description: "现代字距、紧凑标题和图文展示，适合电子杂志",
    version: 1,
    variables: {
      primaryColor: "#E11D48",
      secondaryColor: "#A21CAF",
      paperColor: "#FFFFFF",
      inkColor: "#111827",
      mutedColor: "#6B7280",
      ruleColor: "#E5E7EB",
      font: [...SANS_CN],
      headingFont: [...SANS_CN],
      bodyFont: [...SANS_CN],
      baseFontSize: 10,
      bodyLineHeight: 1.62,
      h1Size: 28,
      h2Size: 18,
      h3Size: 14,
    },
  },

  // ---- ⑥ 商务（Business）：稳重、正规 ----
  business: {
    id: "business",
    name: "商务",
    description: "稳重配色、正规排版，适合商务报告与提案",
    version: 1,
    variables: {
      primaryColor: "#1E3A8A",
      secondaryColor: "#0F766E",
      paperColor: "#FFFFFF",
      inkColor: "#111827",
      mutedColor: "#4B5563",
      ruleColor: "#D1D5DB",
      font: [...SANS_CN],
      headingFont: [...SANS_CN],
      bodyFont: [...SANS_CN],
      baseFontSize: 10.5,
      bodyLineHeight: 1.65,
      h1Size: 22,
      h2Size: 16,
      h3Size: 13,
    },
  },

  // ---- ⑦ 自定义（Custom）：以用户输入为准 ----
  custom: {
    id: "custom",
    name: "自定义",
    description: "所有变量和组件默认样式都可以自己配",
    version: 1,
    variables: {
      primaryColor: "#33691E",
      secondaryColor: "#558B2F",
      paperColor: "#FFFFFF",
      inkColor: "#22302A",
      mutedColor: "#6B7C74",
      ruleColor: "#D8DFD8",
      font: SANS_CN,
      headingFont: SANS_CN,
      bodyFont: SANS_CN,
      baseFontSize: 10.5,
      bodyLineHeight: 1.7,
      h1Size: 22,
      h2Size: 16,
      h3Size: 13,
    },
    // 自定义主题可以在这里存用户手动改的 componentDefaults 覆盖
    overrides: {},
  },
};

// ---------- 导出：主题 → 完整 Component Defaults（自动把 variables 注入） ----------
export function buildTheme(themeInput) {
  const preset = typeof themeInput === "string"
    ? THEME_PRESETS[themeInput]
    : themeInput;
  if (!preset) throw new Error(`未知主题：${themeInput}`);

  const vars = preset.variables || {};
  const defaults = baseComponentDefaults(vars);

  // 自定义主题的 overrides 覆盖
  if (preset.overrides && typeof preset.overrides === "object") {
    for (const compType of Object.keys(preset.overrides)) {
      defaults[compType] = mergeStyles(defaults[compType] || {}, preset.overrides[compType]);
    }
  }

  return {
    id: preset.id,
    name: preset.name,
    description: preset.description,
    version: preset.version,
    variables: { ...vars },
    componentDefaults: defaults,
    // 自定义主题才允许写 overrides
    overrides: preset.id === "custom" ? { ...(preset.overrides || {}) } : undefined,
  };
}

export function listThemePresets() {
  return Object.values(THEME_PRESETS).map(({ id, name, description }) => ({
    id, name, description,
  }));
}

export const DEFAULT_THEME_ID = "academic";

/**
 * 根据主题计算出某个组件的最终默认 Style JSON。
 * 用户选中组件时，先用这个值作为它的 style 起点。
 */
export function getComponentDefaultStyle(theme, componentType, level) {
  const built = theme?.componentDefaults ? theme : buildTheme(theme || DEFAULT_THEME_ID);
  const base = built.componentDefaults?.[componentType] || {};
  // 标题按 level 缩放
  if (componentType === "heading" && typeof level === "number") {
    const ratio = [0, 1.0, 0.82, 0.68, 0.58, 0.52, 0.48][Math.min(6, Math.max(1, level))] || 0.7;
    const baseH1 = built.variables?.h1Size ?? 22;
    return mergeStyles(base, {
      typography: { fontSize: Math.round(baseH1 * ratio * 100) / 100 },
    });
  }
  return base;
}

/**
 * 给组件计算最终 style：
 *   组件自定义 style  +  主题默认（补齐缺的字段）
 * 如果 styleOverridden=false，直接返回主题默认。
 */
export function resolveComponentStyle(theme, component) {
  if (!component) return {};
  const themeDefault = getComponentDefaultStyle(theme, component.type, component.level);
  if (!component.styleOverridden) return themeDefault;
  return mergeStyles(themeDefault, component.style || {});
}

// 把主题的 variables 变成一组可直接注入 CSS 的 :root 变量
export function themeToCssVariables(themeInput, scope = ":root") {
  const built = themeInput?.componentDefaults ? themeInput : buildTheme(themeInput || DEFAULT_THEME_ID);
  const v = built.variables || {};
  const lines = [
    `${scope} {`,
    `  --ui-pdf-primary: ${v.primaryColor || "#33691E"};`,
    `  --ui-pdf-secondary: ${v.secondaryColor || "#558B2F"};`,
    `  --ui-pdf-paper: ${v.paperColor || "#FFFFFF"};`,
    `  --ui-pdf-ink: ${v.inkColor || "#22302A"};`,
    `  --ui-pdf-muted: ${v.mutedColor || "#6B7C74"};`,
    `  --ui-pdf-rule: ${v.ruleColor || "#D8DFD8"};`,
    `  --ui-pdf-font: ${Array.isArray(v.font) ? v.font.join(", ") : (v.font || "sans-serif")};`,
    `  --ui-pdf-heading-font: ${Array.isArray(v.headingFont) ? v.headingFont.join(", ") : (v.headingFont || "sans-serif")};`,
    `  --ui-pdf-body-font: ${Array.isArray(v.bodyFont) ? v.bodyFont.join(", ") : (v.bodyFont || "sans-serif")};`,
    `  --ui-pdf-base-size: ${v.baseFontSize || 10.5}pt;`,
    `  --ui-pdf-line-height: ${v.bodyLineHeight || 1.7};`,
    `}`,
  ];
  return lines.join("\n");
}

export { MONO, SANS_CN, SERIF_CN };
