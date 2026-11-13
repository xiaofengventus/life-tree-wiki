/**
 * wangEditor 的 HTML 解析补丁层 —— 让标准 HTML / Markdown 的产物**别在解析时被吃掉**。
 *
 * 这个模块处理两类同源问题：都出在 wangEditor 按标签分发的那个 `Lc`
 * 与它的「文本分支」`Mc`（`node_modules/@wangeditor/editor/dist/index.js`），
 * 结果是**预览（阅读管线）正确、编辑器里却变成一串裸文本**。
 *
 * ---
 *
 * ## 问题一：文本型标签里的元素节点被拍平
 *
 * `Lc` 的分发规则：
 *
 *     span  → 有 data-w-e-type ? 元素分支 : 文本分支
 *     code  → 父级是 pre ? 元素分支 : 文本分支
 *     b / strong / i / em / s / strike / u / font / sub / sup → 文本分支
 *     其余  → 元素分支
 *
 * 而**文本分支直接取 `textContent`**（同文件的 `Mc`）：
 *
 *     var n = e[0].textContent || "";
 *
 * 只有元素分支（`Nc`）才会递归子节点、按 selector 去查 `parseElemsHtml`。
 *
 * 于是这种结构里的公式会被拍成裸文本 —— 公式节点连同 `data-latex` 一起没了：
 *
 *     <strong>初始位置 <span data-life-math="inline" data-latex="\vec{r}(0)"></span></strong>
 *   → 文本「初始位置 \vec{r}(0)」
 *
 * micromark 会把 `**初始位置 $\vec{r}(0)$**` 生成为上面那种嵌套结构，
 * 所以「**加粗里的行内公式**」全军覆没，加粗外面的同一段公式却好好的 ——
 * 现象看着毫无规律，判据只有一条：**公式有没有被文本型标签包住**。
 *
 * 做法：解析前把公式从文本型标签里提出来、变成它的兄弟（必要时把标签拆成两半）：
 *
 *     <strong>初始位置 <span …></span></strong>
 *   → <strong>初始位置 </strong><span …></span>
 *
 * ## 问题二：引用块 / 列表项里的 `<p>` 让整块被拍平
 *
 * `blockquote` 与 `list-item` 在 wangEditor 里**只装行内 / 文本子节点**：
 * 它们的 `parseElemHtml` 会 `children.filter(x => Text.isText(x) || editor.isInline(x))`，
 * 段落两头不沾 → **被过滤掉**；过滤空了就退化成 `[{ text: elem.text() }]`。
 *
 * 而标准 Markdown 生成的是 `<blockquote><p>…</p></blockquote>`、
 * 松散列表生成 `<li><p>…</p></li>` —— 于是引用块与松散列表里的
 * 公式、加粗、链接**全部**被拍平（不只是公式）。
 *
 * 做法：解析前拆掉这些容器**直接子级**的 `<p>`，多个段落之间补 `<br>` 保住换行。
 *
 * ---
 *
 * 两类修补都是**纯解析期**的：文档语义不变（公式本来就不吃粗体，
 * 引用块里也没有真的嵌套段落），**存储格式一个字节不变**。
 *
 * 修补点选在 `preParseHtml` —— 它在元素分发**之前**跑、且能拿到真实节点树，
 * 所以导入 / 粘贴 / 打开旧文（`setHtml`）三条路一起覆盖
 * （`setHtml` 内部正是走 `Rc → Lc` 这条分发链）。
 */
import { Boot } from "@wangeditor/editor";

/**
 * 会被 wangEditor 走「文本分支」的标签。
 * 对齐 `dist/index.js` 的 `Yu = ["span","b","strong","i","em","s","strike","u","font","sub","sup"]`，
 * 外加 `code`（它在 `pre` 外也走文本分支）。
 */
const TEXT_ONLY_TAGS = new Set([
  "SPAN", "B", "STRONG", "I", "EM", "S", "STRIKE", "U", "FONT", "SUB", "SUP", "CODE",
]);

/**
 * 需要活下来的元素节点。
 *
 * ⚠️ 必须**同时认 `data-life-math`**，不能只认 `data-w-e-type`：
 * 公式模块的 `preParseHtml`（`tagInlineFormulaForParse`）要等**分发到那个 span 自己**
 * 才会补上 `data-w-e-type`，而本模块是在**外层容器**上跑的 —— 那时里层还是裸的
 * `data-life-math`。只认 `data-w-e-type` 会一个都匹配不到（踩过）。
 */
const VOID_SELECTOR = "[data-w-e-type], [data-life-math]";

function isVoidInlineNode(element) {
  return (
    element?.nodeType === 1 &&
    (element.hasAttribute("data-w-e-type") || element.hasAttribute("data-life-math"))
  );
}

const TEXT_ONLY_SELECTOR = [
  "span", "b", "strong", "i", "em", "s", "strike", "u", "font", "sub", "sup", "code",
].join(",");

/**
 * 触发 `preParseHtml` 的选择器。
 *
 * 必须**同时包含块级容器和文本型标签**：
 *   - 块级容器（p / li / td…）：在它这一层就能把整棵子树规整好，一步到位；
 *   - 文本型标签本身：万一下面某层是通过 `Nc` 递归进来的，也还能兜住。
 * 只有真正含 `data-w-e-type` 后代时才动手，所以多匹配是安全的。
 */
export const INLINE_HOIST_TRIGGER_SELECTOR = [
  "p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "li", "td", "th",
  "div", "section", "article", "figure", "figcaption", "dd", "dt",
  "span", "b", "strong", "i", "em", "s", "strike", "u", "font", "sub", "sup", "code",
].join(",");

function isTextOnlyContainer(element) {
  if (!element || element.nodeType !== 1) return false;
  if (!TEXT_ONLY_TAGS.has(element.tagName)) return false;
  // 已经带 data-w-e-type 的 span 天然进元素分支，不用管
  if (element.hasAttribute("data-w-e-type")) return false;
  // 代码块里的 code 也进元素分支
  if (element.tagName === "CODE" && element.closest("pre")) return false;
  return true;
}

/**
 * 把 `container`（文本型标签）的子节点切成「单元序列」。
 *
 * 每个单元要么是需要提到外面去的元素节点，要么是一组应当继续留在容器里的节点。
 * 嵌套的文本型标签（`<strong><em>…</em></strong>`）会被**摊平**到同一层，
 * 否则内层的公式提不出来。
 */
function splitUnits(container) {
  const units = [];
  let run = [];

  const flush = () => {
    if (!run.length) return;
    units.push({ keep: run });
    run = [];
  };

  for (const child of Array.from(container.childNodes)) {
    if (isVoidInlineNode(child)) {
      flush();
      units.push({ hoist: child });
      continue;
    }

    if (isTextOnlyContainer(child) && child.querySelector(VOID_SELECTOR)) {
      const inner = splitUnits(child);
      for (const unit of inner) {
        if (unit.hoist) {
          flush();
          units.push(unit);
        } else {
          // 用子容器的一个浅克隆包住这一段，层级不变、样式不丢
          const clone = child.cloneNode(false);
          unit.keep.forEach((node) => clone.appendChild(node));
          run.push(clone);
        }
      }
      continue;
    }

    run.push(child);
  }

  flush();
  return units;
}

/**
 * 把 `container` 拆开：元素节点成为它的兄弟，其余内容留在原地。
 * 返回是否真的改动过。
 */
function splitContainer(container) {
  const units = splitUnits(container);
  if (!units.some((unit) => unit.hoist)) return false;

  const parent = container.parentNode;
  if (!parent) return false;

  const documentNode = container.ownerDocument;
  const fragment = documentNode.createDocumentFragment();
  for (const unit of units) {
    if (unit.hoist) {
      fragment.appendChild(unit.hoist);
      continue;
    }
    const clone = container.cloneNode(false);
    unit.keep.forEach((node) => clone.appendChild(node));
    fragment.appendChild(clone);
  }
  parent.replaceChild(fragment, container);
  return true;
}

/**
 * 把 `root` **子树里**所有文本型标签中的元素节点提出来。
 *
 * ⚠️ 刻意**不动 root 自己**：`preParseHtml` 的返回值会被拿去继续分发，
 * 若在 root 这一层把它拆成多个兄弟，调用方（`Rc` 遍历的是拆之前快照的
 * 顶层子节点）就看不到新生成的兄弟，内容会静默丢失。
 * 现实中 root 都是块级容器，文本型标签一定在更深处，所以没有损失。
 *
 * @returns {number} 修补的容器个数
 */
export function hoistNestedVoidInlines(root) {
  if (!root?.querySelectorAll) return 0;

  const containers = [...root.querySelectorAll(TEXT_ONLY_SELECTOR)]
    .filter(isTextOnlyContainer)
    .filter((element) => element.querySelector(VOID_SELECTOR));
  if (!containers.length) return 0;

  // 从最深处的开始：拆外层会把内层节点搬走，先处理内层最稳
  let fixed = 0;
  for (const container of containers.reverse()) {
    if (!container.parentNode) continue;
    if (splitContainer(container)) fixed += 1;
  }
  return fixed;
}

/**
 * 这些元素在 wangEditor 里**只装行内 / 文本子节点**，不装嵌套段落。
 *
 * 证据（同一份 `dist/index.js`）：
 *   - `blockquote` 的 `parseElemHtml` 会先
 *     `children.filter(x => Text.isText(x) || editor.isInline(x))`，
 *     段落既不是文本也不是行内 → **被过滤掉**；过滤空了就退化成
 *     `[{ text: elem.text() }]`，整段拍平成一行裸文本。
 *   - 它的 `elemToHtml` 是 `"<blockquote>" + children + "</blockquote>"`，
 *     说明模型里本来就没有嵌套 `<p>`。
 *   - `list-item` 同理。
 *
 * 而标准 Markdown / HTML 偏偏生成 `<blockquote><p>…</p></blockquote>`、
 * 松散列表生成 `<li><p>…</p></li>` —— 于是引用块与松散列表里的公式、
 * 加粗、链接**全部**被拍平。
 *
 * 做法：解析前把这些**直接子级**的 `<p>` 拆掉（子节点提到上级），
 * 有多个段落时补一个 `<br>` 保住换行。
 */
const INLINE_CHILD_CONTAINERS = new Set(["BLOCKQUOTE", "LI"]);

/**
 * 拆掉「只装行内子节点」的容器里那些**直接子级** `<p>`。
 * @returns {number} 拆掉的段落数
 */
function unwrapInlineChildParagraphs(container) {
  if (!INLINE_CHILD_CONTAINERS.has(container.tagName)) return 0;

  const paragraphs = Array.from(container.children).filter((child) => child.tagName === "P");
  if (!paragraphs.length) return 0;

  const documentNode = container.ownerDocument;
  let unwrapped = 0;
  for (const paragraph of paragraphs) {
    // 段落之间补 <br> 保住换行（容器里放不下第二个段落）
    const parts = [...paragraph.childNodes];
    const isLast = paragraph === paragraphs[paragraphs.length - 1];
    if (!isLast) parts.push(documentNode.createElement("br"));
    paragraph.replaceWith(...parts);
    unwrapped += 1;
  }
  return unwrapped;
}

/** 触发拆段的选择器 */
const UNWRAP_TRIGGER_SELECTOR = [...INLINE_CHILD_CONTAINERS].map((tag) => tag.toLowerCase()).join(",");

export function hoistInlineChildParagraphs(root) {
  if (!root?.querySelectorAll) return 0;
  const targets = [root, ...root.querySelectorAll(UNWRAP_TRIGGER_SELECTOR)];
  let changed = 0;
  for (const target of targets) changed += unwrapInlineChildParagraphs(target);
  return changed;
}

const REGISTRATION_FLAG = "__lifeInlineHoistModuleRegistered";

const inlineHoistModule = {
  preParseHtml: [
    {
      selector: INLINE_HOIST_TRIGGER_SELECTOR,
      preParseHtml(element) {
        hoistNestedVoidInlines(element);
        return element;
      },
    },
    {
      // 引用块 / 列表项：先把直接子级 <p> 拆掉，否则整块会被拍平（连加粗都保不住）
      selector: UNWRAP_TRIGGER_SELECTOR,
      preParseHtml(element) {
        // 拆完段落，原本藏在段落里的公式/加粗才浮到这一层，再规整一次
        if (hoistInlineChildParagraphs(element)) hoistNestedVoidInlines(element);
        return element;
      },
    },
  ],
};

/**
 * 注册到 wangEditor。与其它模块一样在编辑器组件里调用一次即可（Boot 会去重）。
 */
export function registerInlineHoistModule() {
  if (globalThis[REGISTRATION_FLAG]) return;
  Boot.registerModule(inlineHoistModule);
  globalThis[REGISTRATION_FLAG] = true;
}
