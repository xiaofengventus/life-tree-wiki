// 格式按钮的**唯一一份**元数据 + 两套排布。
//
// 为什么要有这个文件：同一批按钮要出现在两个地方 ——
//   ① 浮动工具栏（选中文字后出现，editor/fbar.js）
//   ② 固定工具栏（一直挂着，editor.js 填进 #toolbar）
// 两处各写一份"图标 + 提示 + 顺序"必然会对不上（用户的原话就是
// 「将浮动工具栏的图标也放在固定工具栏」）。所以图标/提示只在这里写一次，
// 两个工具栏各自只声明「按什么顺序排」。
//
// 排布的依据（**迁移源，不要凭手感改**）：
//   浮动那条沿用上一轮定下的分组；
//   固定那条照 生命时序-wiki 的 `src/components/EditorToolbar.vue` 里
//   `toolbarConfig.toolbarKeys` 的顺序与分组来 —— 那边的顺序是：
//     标题 │ 粗 斜 下划线 删除线 字号 文字色 背景色 │ 无序 有序 待办 引用 │
//     代码块 语言 链接 图片 …（插入类）│ 撤销 重做
//   本项目没有的（导入导出 / 代码语言 / Markdown 单元格 / 卡片）就不迁，
//   也就是用户说的「有的话」。

export const ITEMS = {
  bold: { i: 'bold', t: '粗体（Ctrl+B）' },
  italic: { i: 'italic', t: '斜体（Ctrl+I）' },
  underline: { i: 'underline', t: '下划线（Ctrl+U）' },
  strike: { i: 'strike', t: '删除线' },
  // 行内码 / 行间码刻意用两个图标（行间那个多一道斜杠），挨着放
  code: { i: 'code', t: '行内代码 —— `字`' },
  codeblock: { i: 'codeblock', t: '行间代码 —— ``` 围栏块' },
  link: { i: 'link', t: '链接' },
  // 段内换行：渲染成 <br>，不切块。原项目没有对应按钮（它是 md 换行语义），
  // 属于"Laup 有、原项目没有"，一起放进来不算越界。
  linebreak: { txt: '⏎', t: '段内换行 —— 渲染成 <br>，不切块' },
  fontcolor: { i: 'fontColor', t: '文字颜色', pop: 'fg' },
  bgcolor: { i: 'bgColor', t: '背景色', pop: 'bg' },
  clear: { i: 'eraser', t: '清除格式（链接与公式会留着）' },
  heading: { i: 'header', t: '标题级别', pop: 'head' },
  quote: { i: 'quote', t: '引用' },
  ul: { i: 'ul', t: '无序列表' },
  ol: { i: 'ol', t: '有序列表' },
  todo: { i: 'todo', t: '待办' },

  // 字号：原项目是 wangEditor 的 `fontSize` 菜单（下拉选档位）。
  // Laup 这边只有"插一个 18px 骨架"，属于**插入类**（走 data-ins，见 editor.js 的 SNIPPETS），
  // 所以标 `ins: true`，建的是 `.tb-btn[data-ins]` 而不是格式按钮。
  'fontsize-18': { ins: true, txt: '18', t: '字号 18px —— 插入 \\fontsize{18}{…}' },
};

// ① 浮动工具栏那一排（选中文字后出现）。分隔符由 fbar 按"每一行之间"自动插。
export const FBAR_ROWS = [
  ['bold', 'italic', 'underline', 'strike'],
  ['code', 'codeblock', 'link'],
  ['fontcolor', 'bgcolor', 'clear'],
  ['heading', 'quote', 'ul', 'ol', 'todo', 'linebreak'],
];

// ② 固定工具栏。每一行 = 一个 `.tb-group`（组之间用竖线分隔）。
// 顺序与分组对着 生命时序-wiki 的 toolbarKeys 来（见文件头）：
//   标题 │ 粗 斜 下划线 删除线 **字号** 文字色 背景色 │ 无序 有序 待办 引用 │ 行内码 行间码 链接
// `ins:` 前缀 = 插入骨架类（原项目的 fontSize 就夹在删除线与文字色之间，这里保持原位）。
export const FIXED_ROWS = [
  ['heading'],
  ['bold', 'italic', 'underline', 'strike', 'fontsize-18', 'fontcolor', 'bgcolor', 'clear'],
  ['ul', 'ol', 'todo', 'quote'],
  ['code', 'codeblock', 'link', 'linebreak'],
];

// 标题级别弹层里的档位。0 = 正文（把 `# ` 摘掉）
export const HEAD_LEVELS = [
  [0, '正文'], [1, 'H1'], [2, 'H2'], [3, 'H3'], [4, 'H4'],
];
