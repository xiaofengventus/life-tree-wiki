// Laup 正文的服务端入口。
//
// ── 为什么收源码，而不是收前端渲染好的 HTML
//   收 HTML 的话，站点就得拿**自己的**清洗白名单去猜 Laup 的产物哪些能留 ——
//   那张名单是 wangEditor 方言（只到 h4、只认 data-life-math），猜错了要么漏（危险），
//   要么砍（丢内容：h5、研究树、文献列表全被剥掉）。
//   所以这里收的是 **Laup 源码**，由 Laup 自己的渲染器在服务端重渲一遍，
//   产物白名单也是 Laup 自己的（`render()` 内部的 auditHtml 自检，compile 模式有违规直接抛）。
//
//   于是入库的 HTML **100% 由 Laup 产出**，用户没有直通 HTML 的通道 —— `\raw` 一律拒收。
//   HTML 是 Laup 自己拼的，站点不需要再拿别的方言去审它。

import { ApiError } from "./http.js";
import { htmlToPlainText } from "./sanitize.js";
import {
  LaupError,
  defineExtension,
  listExtensions,
  render,
} from "../src/laup/core/index.js";
import { safeUrl } from "../src/laup/core/safeUrl.js";
import { PACK_NAME, lifeElements } from "../src/laup/extensions/life.js";
import { lifesequence, PACK_NAME as LIFETREE_PACK } from "../src/laup/extensions/lifetree.js";
// 变量（\varcell 块 + 正文里的 {{name}}）是宿主层的东西，客户端与服务端共用这一份口径
import { extractVarScope, interpolateVars } from "../shared/notebookVars.js";
// v1 / v2 两套内核独立：先判断文档是哪一套写的，再交给对应的解释器。
// v1 的编辑器与解释器原样保留（存量文章继续按 v1 渲染）；v2 文档直接走 v2，不做翻译。
import { detectLaupKernel, scanLaupSource } from "../shared/laupKernel.js";
import { typesetCells } from "../src/laup2/index.js";

const MAX_SOURCE_BYTES = 256 * 1024;
const MAX_OUTPUT_BYTES = 512 * 1024;

// ── 宿主在这里给出自己的站点约定
//   进化树的跳转路由是本站的，不是文档语法的一部分 —— 所以由这里传进去，
//   而不是改 Laup 核心（核心里那句写死的 `/life-tree/` 已经删了）。
//   文献锚点用 Laup 默认的 `laup-citation-N`：它和站点那套 `post-citation-N`
//   是两套独立机制，故意不混 —— 混了就得让 `\references` 去喂站点的 citations 字段，
//   那又变成"Laup 迁就站点"了。
if (!listExtensions().includes(PACK_NAME)) {
  defineExtension(lifeElements({ treeRoute: (id) => `/life-tree/${id}` }));
}
// Lifeseqence：```lifetree 围栏（Notebook 的 [lifetree] 格落库形态）服务端渲染
if (!listExtensions().includes(LIFETREE_PACK)) {
  defineExtension(lifesequence());
}

const encoder = new TextEncoder();
const byteLength = (value) => encoder.encode(String(value ?? "")).byteLength;

// ── URL 兜底
//   Laup 自己已经用 safeUrl() 管住了链接与图片；这条是**给扩展留的网** ——
//   宿主扩展（比如研究树的 href）自己拼 URL，拼错了 Laup 核心不知道。
//   做法是拿 Laup 自己的口径复核一遍，而不是另立一套规则。
//   ⚠️ 只扫标签内部：正文里被转义过的代码文本（`<a href=` 写成 `&lt;a href=`）
//   不算属性，放开了扫会把"讲解 XSS 的代码样例"误判成攻击。
const TAG_RE = /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^<>]*?)?)\s*\/?>/g;
const URL_ATTR_RE = /\b(href|src)\s*=\s*"([^"]*)"/g;

function assertSafeUrls(html) {
  TAG_RE.lastIndex = 0;
  let tag;
  while ((tag = TAG_RE.exec(html))) {
    URL_ATTR_RE.lastIndex = 0;
    let attr;
    while ((attr = URL_ATTR_RE.exec(tag[2] || ""))) {
      const value = attr[2];
      if (safeUrl(value, { kind: attr[1] === "src" ? "image" : "link" }) !== value) {
        throw new ApiError(
          400,
          `正文里的 ${attr[1]}="${value}" 不是允许的链接`,
          "LAUP_UNSAFE_URL",
        );
      }
    }
  }
}

/**
 * 把 Laup 源码渲染成可入库的正文。
 *
 * v1 / v2 独立：优先用请求里显式带的内核版本（落库字段），没有再按文档写法判定。
 * v2 文档里出现 v1 语法（[input:cpp] 等）会按 v2 的口径报 400，由作者改写。
 * 写错语法 → 400；出现 `\raw` → 400；产物过大 → 413。
 *
 * @param {string} source
 * @param {{ kernel?: 'v1'|'v2' }} [options]
 */
export function renderLaupPost(source, options = {}) {
  // `import "laup"` 等行是 Notebook 宿主层的特性开关（见 src/notebook/renderer.js 的
  // preprocess），Laup 核心不认识这个语法，不剥掉会被当成正文渲染成第一段文字。
  const raw = String(source ?? "").replace(
    /^[ \t]*import(?:\s+["'][^"']+["']|\s+[A-Za-z][\w-]*)[ \t]*$/gm,
    "",
  );
  if (byteLength(raw) > MAX_SOURCE_BYTES) {
    throw new ApiError(413, "Laup 源码过大", "CONTENT_TOO_LARGE");
  }

  const requested = options.kernel === "v1" || options.kernel === "v2" ? options.kernel : "";
  // 显式版本优先；存量文章（未落库）按内容判定
  const kernel = requested || detectLaupKernel(raw);
  const rendered = kernel === "v1" ? renderWithV1(raw) : renderWithV2(raw);

  const html = rendered.html;
  if (byteLength(html) > MAX_OUTPUT_BYTES) {
    throw new ApiError(413, "正文渲染结果过大", "CONTENT_TOO_LARGE");
  }
  assertSafeUrls(html);

  return {
    html,
    text: htmlToPlainText(html),
    warnings: rendered.warnings,
    // 便于日志/排查：这一篇最终由哪个内核产出
    kernel,
  };
}

/** v2 路径：原文直接交给 v2 的格层（变量格、[references] 都由 v2 自己解析）。 */
function renderWithV2(raw) {
  if (!raw.trim()) {
    throw new ApiError(400, "文章正文不能为空", "EMPTY_CONTENT");
  }
  const result = typesetCells(raw);
  // 格层本身对未知的 `[input:cpp]` 会当正文（不报错），发布路径必须点名拒绝
  const visible = scanLaupSource(raw).visible;
  if (/^\[(?:input|output):[A-Za-z0-9+#-]+\][ \t]*$/m.test(visible)) {
    throw new ApiError(
      400,
      "v2 的输入/输出栏不声明语言：请写成 [input] / [output]，语言只写在代码格里",
      "LAUP_COMPILE_FAILED",
    );
  }
  // 与 v1 的 compile 模式对齐：语法错误必须当场 400，不能把 Broken 块发出去
  const fatal = (result.diagnostics || []).find((item) => item.level === "error");
  if (fatal) {
    throw new ApiError(400, `Laup 源码有错 —— ${fatal.message}`, "LAUP_COMPILE_FAILED");
  }
  // 空文档（只有变量格 / 注释）同样拒收
  if (!result.html.replace(/^<article class="laup2">\s*|<\/article>\s*$/g, "").trim()) {
    throw new ApiError(400, "文章正文不能为空", "EMPTY_CONTENT");
  }
  return {
    html: result.html,
    warnings: (result.diagnostics || []).map((item) => ({ line: null, message: item.message })),
  };
}

/** v1 路径：v2 还不支持的写法（lifetree / \tree / \image / \raw）继续用旧内核。 */
function renderWithV1(raw) {
  // ── 变量解析（宿主层）
  //   Notebook 导出的 .laup 里，变量定义住在零输出的 \varcell 块里，正文写 {{name}}。
  //   这里先扫出定义（扫描的是原文，块的位置被替换成等量空行 → 报错行号仍然指得准），
  //   再把 {{name}} 插值进去，最后才交给 Laup 渲染。
  //   ⚠️ 顺序不能反：插值必须**绕开定义本身** —— 作者写 `var a = "{{b}}"` 要存的就是字面量。
  //   ⚠️ 口径必须与客户端逐字一致，否则症状是"编辑器里好好的、发出来变个样"。
  const { scope, text } = extractVarScope(raw);
  const src = interpolateVars(text, scope);
  // 空正文判断放在插值**之后**：只写了变量格、没有正文的文档，块已被挖空 → 这里判空
  if (!src.trim()) {
    throw new ApiError(400, "文章正文不能为空", "EMPTY_CONTENT");
  }

  let result;
  try {
    // mode 不传就是 'compile'：写错直接抛，发布路径要的就是当场炸，不许静默降级。
    result = render(src, "html");
  } catch (error) {
    if (error instanceof LaupError) {
      const at = error.line == null ? "" : `第 ${error.line} 行：`;
      throw new ApiError(400, `Laup 源码有错 —— ${at}${error.message}`, "LAUP_COMPILE_FAILED");
    }
    throw error;
  }

  // `\raw` 是 Laup 里唯一"用户直通 HTML"的通道。放它进来，上面那句
  // "入库的 HTML 100% 由 Laup 产出"就不成立了 —— 所以发布路径一律拒收。
  if (result.stats.rawCount > 0) {
    throw new ApiError(
      400,
      `Laup 源码里有 ${result.stats.rawCount} 处 \\raw，发布时不允许（它是直通 HTML 的通道）`,
      "LAUP_RAW_NOT_ALLOWED",
    );
  }

  return {
    html: result.output,
    warnings: result.warnings.map((warning) => ({
      line: warning.line,
      message: warning.message,
    })),
  };
}
