// Laup 自己的产物白名单 —— 不由任何外部编辑器或站点定义。
//
// ── 这一层解决什么问题
//   渲染器**输出什么**和**允许输出什么**是两件事。以前只有前者：渲染器靠"我只拼我自己的
//   标签"来保证安全。这话本身没错，但它是个**口头承诺** —— 谁在渲染器里加一处拼接、
//   或哪条 URL 出口忘了收口，都不会有人拦。白名单把这句承诺变成**可执行的断言**：
//   渲染完立刻拿真实产物去比对，名单外的东西当场炸。
//
// ── 为什么是"自检"而不是"清洗器"
//   清洗器（遇到不合法就剥掉但保留文字）看起来更宽容，代价是**自己写一个 HTML 解析器** ——
//   而解析器写错的方式（标签边界、属性引号、注释、CDATA）恰好是最容易漏掉 XSS 的地方。
//   自检不需要解析器：产物是渲染器自己拼的、形状已知，用一组锚死的正则就能穷举。
//   发现名单外的东西是**编写期的 bug**，就该炸，不该静默改写用户内容。
//
// ── 怎么用
//   auditHtml(html)         → 违规项数组（空数组 = 通过）
//   assertHtmlSafe(html)    → 有违规就抛 LaupError
//   render() 已默认接上：mode:'compile' 抛错、mode:'edit' 转为告警（编辑器不能因为
//   一个渲染 bug 就打不开文章）。
//
// ── 扩展怎么加自己的条目
//   宿主扩展（例如某个网站专属的元素）用 allowEntries() 登记，**登记要写 owner**，
//   这样名单长得太大时能一眼看出是谁加的。核心名单永远只有通用语法的那部分。

import { safeUrl } from './safeUrl.js';

// ── 核心名单：Laup 通用语法会产出的标签，一个不多一个不少。
// 这份表是**从渲染器真实产物盘点出来的**（把所有示例文档渲一遍，收集出现过的标签），
// 不是照某个 Markdown 规范抄的 —— 抄规范会把一堆 Laup 根本产不出的标签放进来，
// 名单越大越没人敢动，也就越没有约束力。
export const CORE_TAGS = new Set([
  'a', 'blockquote', 'br', 'caption', 'code', 'del', 'div', 'em', 'figcaption',
  'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'img', 'input',
  'li', 'nav', 'ol', 'p', 'pre', 'section', 'span', 'strong', 'sup',
  'table', 'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul',
]);

// 属性名。同样来自真实产物。
export const CORE_ATTRS = new Set([
  'alt', 'class', 'href', 'id', 'loading', 'src', 'start', 'style',
  'tabindex', 'title', 'type',
  // Laup 自己的语义属性
  'data-tex', 'data-message',
]);

// 不带值的属性（`<input type="checkbox" disabled checked>`）
const BARE_ATTRS = new Set(['disabled', 'checked']);

// style 里允许出现的 CSS 属性，以及每个属性的值形状。
export const CORE_STYLE_PROPS = new Map([
  ['color', /^(#[0-9a-f]{3,8}|[a-z]+|rgba?\(\s*[\d.,%\s]+\))$/i],
  ['background-color', /^(#[0-9a-f]{3,8}|[a-z]+|rgba?\(\s*[\d.,%\s]+\))$/i],
  ['font-size', /^\d+(?:\.\d+)?px$/],
  ['text-align', /^(?:left|right|center)$/],
]);

// 值必须是 URL 的属性 —— 这些走 safeUrl 复核，是"新加了一处 URL 出口却忘了收口"的兜底。
const URL_ATTRS = new Set(['href', 'src']);

// 这三个标签是**内容整段丢弃**级别的：出现即视为渲染器被攻破或写坏了，
// 不需要靠名单兜底（名单里本来也没有），单独列出来是为了给出更直白的报错。
const NEVER_TAGS = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'base', 'link', 'meta', 'form',
]);

// ── 扩展登记
const extraTags = new Map();   // tag → owner
const extraAttrs = new Map();  // attr → owner
const extraStyle = new Map();  // prop → { pattern, owner }

/** 登记扩展条目。owner 必填 —— 名单出问题时得能找出是谁加的。 */
export function allowEntries({ tags = [], attrs = [], styleProps = {}, owner } = {}) {
  if (!owner) throw new Error('allowEntries 必须写 owner');
  for (const t of tags) extraTags.set(t, owner);
  for (const a of attrs) extraAttrs.set(a, owner);
  for (const [prop, pattern] of Object.entries(styleProps)) extraStyle.set(prop, { pattern, owner });
}

/** 清掉扩展登记（只给测试用；核心名单不可变）。 */
export function resetExtensions() {
  extraTags.clear(); extraAttrs.clear(); extraStyle.clear();
}

export function isTagAllowed(tag) {
  return CORE_TAGS.has(tag) || extraTags.has(tag);
}

export function isAttrAllowed(attr) {
  return CORE_ATTRS.has(attr) || BARE_ATTRS.has(attr) || extraAttrs.has(attr);
}

function stylePropPattern(prop) {
  return CORE_STYLE_PROPS.get(prop) || extraStyle.get(prop)?.pattern || null;
}

// ── 扫描
//
// 为什么可以用正则：产物是渲染器拼出来的，**文本一律经过 esc()**，所以正文里不可能
// 出现字面的 `<`。能匹配到的 `<tag ...>` 一定是渲染器自己写的标签。
// 这不是"用正则解析 HTML"（那是靠不住的），而是"给已知形状的产物做清单核对"。
const TAG_RE = /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^<>]*?)?)\s*\/?>/g;
// 属性名；值可省（bare）、可单/双引号、可裸值。锚 `(?:^|\s)` 是为了不把
// `data-tex="E=mc^2"` 里那个 `E=` 当成属性名（踩过一次，盘点结果里凭空多了个 `E`）。
const ATTR_RE = /(?:^|\s)([a-zA-Z_][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

function checkStyle(value, add) {
  for (const decl of String(value).split(';')) {
    const text = decl.trim();
    if (!text) continue;
    const at = text.indexOf(':');
    if (at < 0) {
      add('style-语法', text);
      continue;
    }
    const prop = text.slice(0, at).trim().toLowerCase();
    const raw = text.slice(at + 1).trim();
    const pattern = stylePropPattern(prop);
    if (!pattern) {
      add('style-属性', prop);
    } else if (!pattern.test(raw)) {
      add('style-取值', `${prop}: ${raw}`);
    }
  }
}

/**
 * 核对一份渲染产物。
 * @returns {Array<{kind: string, name: string, detail?: string}>} 空数组表示通过
 */
export function auditHtml(html) {
  const violations = [];
  const add = (kind, name, detail) => violations.push({ kind, name, ...(detail ? { detail } : {}) });

  for (const match of String(html ?? '').matchAll(TAG_RE)) {
    const tag = match[1].toLowerCase();
    if (NEVER_TAGS.has(tag)) {
      add('禁止标签', tag, '这类标签一旦出现，整段内容都该被丢弃');
      continue;
    }
    if (!isTagAllowed(tag)) add('名单外标签', tag);

    for (const attr of match[2].matchAll(ATTR_RE)) {
      const name = attr[1];
      const lower = name.toLowerCase();
      const value = attr[2] ?? attr[3] ?? attr[4] ?? '';

      // 事件处理器单独判：它们不在名单里也会被下面拦下，但报错信息值得直白些
      if (/^on/i.test(lower)) {
        add('事件处理器', lower, `在 <${tag}> 上`);
        continue;
      }
      if (!isAttrAllowed(lower)) {
        add('名单外属性', lower, `在 <${tag}> 上`);
        continue;
      }
      if (URL_ATTRS.has(lower) && safeUrl(value, { kind: lower === 'src' ? 'image' : 'link' }) !== value) {
        // 渲染器已经过了 safeUrl，这里再比一次：相等才算数。
        // 不等 = 有新的 URL 出口绕过了收口，或者 safeUrl 被改松了。
        add('URL 未收口', lower, `在 <${tag}> 上：${String(value).slice(0, 60)}`);
      }
      if (lower === 'style') checkStyle(value, (kind, name) => add(kind, name, `在 <${tag}> 上`));
    }
  }
  return violations;
}

export function formatViolations(violations) {
  return violations
    .map((v) => `  ${v.kind}：${v.name}${v.detail ? `（${v.detail}）` : ''}`)
    .join('\n');
}
