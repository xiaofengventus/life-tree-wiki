// lifetree 时序图的**全部样式令牌**（纯数据/纯函数，Node 与浏览器共用）。
//
// 设计目标：Laup 作者不写 CSS，只写「全局一次 + 节点局部覆盖」。
// 这里也是唯一默认值来源；解析器只负责收键值，渲染器统一在这里规范化。
// 所有颜色/数字/枚举都收紧：输出 SVG 不经过 style 属性，拒绝 url()、事件等注入面。

export const CHRONO_GLOBAL_DEFAULTS = Object.freeze({
  样式: '列表',
  配色: '单色',
  刻度: 50,
  网格: '开',
  轴: '开',
  年代带: '关',
  比例: '线性',
  图宽: 1100,
  行高: 28,
  线色: '#596052',
  线宽: 1.7,
  线型: '直角',
  分叉宽: 1.35,
  点: '圆点',
  内点: '关',
  点色: '跟随',
  点半径: 3,
  现存点: '圆点',
  条色: '#ad8a4c',
  条高: 7,
  条型: '色带',
  条端: '圆角',
  字色: '#20251f',
  字号: 13,
  字重: '常规',
  内标签: '开',
  标签: '跟随',
  标签年龄: '关',
  背景: '透明',
  网格色: '#d8d2c2',
  轴色: '#7d8178',
  字体: '无衬线',
  拉丁字体: '宋体',
  色环: '橄榄+青绿+紫红+灰紫+赭石+青蓝',
})

export const CHRONO_GLOBAL_KEYS = Object.freeze(Object.keys(CHRONO_GLOBAL_DEFAULTS))

// 行内允许覆盖的样式键。它们沿子树继承，所以在一个内节点写一次即可给整支换肤。
export const CHRONO_LOCAL_KEYS = Object.freeze([
  '色', '线色', '线宽', '点', '内点', '点色', '点半径',
  '条色', '条高', '条型', '字色', '字号', '字重', '标签',
])

export const CHRONO_COLOR_NAMES = Object.freeze({
  墨: '#444441', 黑: '#20251f', 灰: '#737a70', 白: '#ffffff', 透明: 'transparent',
  橄榄: '#858744', 青绿: '#4d9f92', 紫红: '#c262ae', 灰紫: '#a078b2',
  赭石: '#ad8a4c', 青蓝: '#4d8fa8', 红: '#b4544c', 橙: '#bd783d',
  黄: '#b59a3f', 绿: '#64834f', 青: '#4d9f92', 蓝: '#4d7fa8', 紫: '#9a72ad', 棕: '#98734e',
})

export const CHRONO_PALETTES = Object.freeze({
  橄榄: '#858744', 青绿: '#4d9f92', 紫红: '#c262ae', 灰紫: '#a078b2',
  赭石: '#ad8a4c', 青蓝: '#4d8fa8',
})

const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const SAFE_NAMED_RE = /^(?:black|white|gray|grey|red|orange|yellow|green|teal|blue|navy|purple|brown|olive|transparent)$/i

export function chronoColor(value, fallback) {
  const raw = String(value ?? '').trim()
  if (!raw) return fallback
  const named = CHRONO_COLOR_NAMES[raw]
  const color = named || raw
  if (HEX_RE.test(color) || SAFE_NAMED_RE.test(color)) return color
  return fallback
}

export function chronoNumber(value, fallback, min, max) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
}

export function chronoOn(value, fallback = true) {
  if (value == null) return fallback
  return !['关', '否', '无', 'false', '0', 'off'].includes(String(value).trim().toLowerCase())
}

export const CHRONO_FONT_STACKS = Object.freeze({
  无衬线: '"Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif',
  宋体: 'Georgia, "Times New Roman", "Noto Serif SC", serif',
  等宽: '"Cascadia Mono", Consolas, monospace',
})

function enumValue(value, allowed, fallback) {
  const v = String(value ?? '').trim()
  return allowed.includes(v) ? v : fallback
}

/** 把全局配置行解析出的原始值规范化成渲染器使用的样式表。 */
export function normalizeChronoStyle(raw = {}) {
  const d = CHRONO_GLOBAL_DEFAULTS
  const r = { ...d, ...raw }
  const paletteText = String(r.色环 || d.色环)
  const palette = paletteText.split(/[+|;；]/).map((v) => chronoColor(v, null)).filter(Boolean)
  return {
    配色: enumValue(r.配色, ['单色', '分支'], d.配色),
    刻度: chronoNumber(r.刻度, d.刻度, 1, 1000),
    网格: chronoOn(r.网格, true),
    轴: chronoOn(r.轴, true),
    年代带: chronoOn(r.年代带, false),
    比例: enumValue(r.比例, ['线性', '根号'], d.比例),
    图宽: chronoNumber(r.图宽, d.图宽, 520, 3200),
    行高: chronoNumber(r.行高, d.行高, 18, 72),
    线色: chronoColor(r.线色, d.线色),
    线宽: chronoNumber(r.线宽, d.线宽, 0.4, 12),
    线型: enumValue(r.线型, ['直角', '斜线'], d.线型),
    分叉宽: chronoNumber(r.分叉宽, d.分叉宽, 0.4, 12),
    点: enumValue(r.点, ['圆点', '方点', '无'], d.点),
    内点: enumValue(r.内点, ['关', '圆点', '方点'], d.内点),
    点色: r.点色 === '跟随' ? '跟随' : chronoColor(r.点色, '跟随'),
    点半径: chronoNumber(r.点半径, d.点半径, 0.8, 12),
    现存点: enumValue(r.现存点, ['圆点', '方点', '无'], d.现存点),
    条色: chronoColor(r.条色, d.条色),
    条高: chronoNumber(r.条高, d.条高, 1, 24),
    条型: enumValue(r.条型, ['色带', '细线', '无'], d.条型),
    条端: enumValue(r.条端, ['圆角', '方角'], d.条端),
    字色: chronoColor(r.字色, d.字色),
    字号: chronoNumber(r.字号, d.字号, 9, 32),
    字重: enumValue(r.字重, ['常规', '粗体'], d.字重),
    内标签: chronoOn(r.内标签, true),
    标签: enumValue(r.标签, ['跟随', '右对齐', '隐藏'], d.标签),
    标签年龄: chronoOn(r.标签年龄, false),
    背景: chronoColor(r.背景, 'transparent'),
    网格色: chronoColor(r.网格色, d.网格色),
    轴色: chronoColor(r.轴色, d.轴色),
    字体: CHRONO_FONT_STACKS[r.字体] || CHRONO_FONT_STACKS[d.字体],
    拉丁字体: CHRONO_FONT_STACKS[r.拉丁字体] || CHRONO_FONT_STACKS[d.拉丁字体],
    色环: palette.length ? palette : Object.values(CHRONO_PALETTES),
  }
}

/** 全局配置 → 渲染 opts；保留原有 renderChrono(tree, opts) 的兼容入口。 */
export function chronoStyleOptions(raw = {}) {
  const s = normalizeChronoStyle(raw)
  return { ...s, style: s }
}
