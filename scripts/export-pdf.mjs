#!/usr/bin/env node
/**
 * scripts/export-pdf.mjs
 * ------------------------------------------------------------------
 * UI-PDF v2 的命令行 PDF 导出脚本。
 *
 * 链路：
 *   Vue 3 文档 JSON → staticHtmlRenderer.js（同一套 CSS Generator）
 *      → Node.js 启动 Playwright → 无头 Chromium
 *      → page.pdf({ format, preferCSSPageSize, printBackground:true })
 *      → 输出 PDF 文件
 *
 * 用法：
 *   # 本地先装依赖（第一次）
 *   npm i playwright
 *   npx playwright install chromium
 *
 *   # 导出
 *   node scripts/export-pdf.mjs --input ./my-doc.json --output ./my-doc.pdf
 *   node scripts/export-pdf.mjs --input ./my-doc.json --format png   # 每页一张 PNG，打包 zip
 *
 * 参数：
 *   --input,  -i  <path>    v2 Document JSON 文件路径（必填）
 *   --output, -o  <path>    输出 PDF 路径（默认同目录同名 .pdf）
 *   --format        pdf|png|html  默认 pdf
 *   --theme         academic|minimal|wechat|tech|magazine|business|custom  （可选，覆盖 doc.theme.id）
 *   --timeout       ms       渲染超时，默认 30000
 *   --wait-ms       ms       渲染完额外等待（字体/图片加载），默认 800
 *   --no-validate            跳过 PDF 合法性检查（缺 pdfinfo 时）
 *   --quiet                  少输出日志
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ---------- CLI 解析 ----------
function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-i" || a === "--input")   { args.input   = argv[++i]; continue; }
    if (a === "-o" || a === "--output")  { args.output  = argv[++i]; continue; }
    if (a === "--format")                { args.format  = argv[++i]; continue; }
    if (a === "--theme")                 { args.theme   = argv[++i]; continue; }
    if (a === "--timeout")               { args.timeout = Number(argv[++i]); continue; }
    if (a === "--wait-ms")               { args.waitMs  = Number(argv[++i]); continue; }
    if (a === "--no-validate")           { args.noValidate = true; continue; }
    if (a === "--quiet")                 { args.quiet = true; continue; }
    if (!a.startsWith("-")) args._.push(a);
  }
  return args;
}
const args = parseArgs(process.argv.slice(2));
const QUIET = Boolean(args.quiet);
function log(...s) { if (!QUIET) console.error("[export-pdf]", ...s); }
function fatal(msg, code = 1) { console.error("[export-pdf] 错误：", msg); process.exit(code); }

if (!args.input) fatal("缺少 --input <doc.json>");
const inputPath = path.resolve(args.input);
if (!fs.existsSync(inputPath)) fatal(`找不到输入文件：${inputPath}`);

const format = args.format || "pdf";
const outputPath = path.resolve(
  args.output ||
  path.join(path.dirname(inputPath), path.basename(inputPath, path.extname(inputPath)) + "." + format),
);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

// ---------- 读 doc JSON ----------
let doc;
try {
  doc = JSON.parse(fs.readFileSync(inputPath, "utf8"));
} catch (err) {
  fatal(`解析输入 JSON 失败：${err.message}`);
}
// 如果用户指定了 --theme，覆盖 doc.theme.id
if (args.theme) {
  doc.theme = doc.theme || {};
  doc.theme.id = args.theme;
}

// ---------- 导入静态渲染器（在 src/utils/ui-pdf 下） ----------
// 注意：staticHtmlRenderer.js 会相对路径 import 到 styleGenerator / themes / documentModel
const RENDERER_PATH = path.join(ROOT, "src", "utils", "ui-pdf", "staticHtmlRenderer.js");
let renderDocumentToHtml;
try {
  const mod = await import(`file://${RENDERER_PATH.replace(/\\/g, "/")}`);
  renderDocumentToHtml = mod.renderDocumentToHtml;
} catch (err) {
  fatal(`导入 staticHtmlRenderer 失败：${err.stack || err.message}`);
}
const rendered = renderDocumentToHtml(doc, { themeId: args.theme || undefined });
log(`文档渲染完成，共 ${rendered.pageCount} 页，标题：${rendered.title || "(无)"}`);

// 如果用户只要 HTML，直接写文件退出
if (format === "html") {
  fs.writeFileSync(outputPath, rendered.html, "utf8");
  if (!QUIET) process.stdout.write(outputPath + "\n");
  process.exit(0);
}

// ---------- 启动 Playwright 导出 PDF / PNG ----------
let chromium;
try {
  const pw = await import("playwright");
  chromium = pw.chromium;
} catch (err) {
  fatal(
    "未找到 playwright。请先执行：\n" +
    "  npm i playwright\n" +
    "  npx playwright install chromium\n" +
    `（详细报错：${err.message}）`
  );
}

const tmpHtmlPath = path.join(os.tmpdir(), `ui-pdf-${process.pid}-${Math.random().toString(36).slice(2,8)}.html`);
fs.writeFileSync(tmpHtmlPath, rendered.html, "utf8");
log(`临时 HTML 写入：${tmpHtmlPath}`);

const timeoutMs = Number(args.timeout) || 30000;
const waitMs    = Number(args.waitMs) || 800;

const pageSizeName = doc.pages?.[0]?.pageSize?.name || "A4";

let browser = null;
let tmpPageDir = null;

try {
  browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-dev-shm-usage",
      "--no-sandbox",
      "--hide-scrollbars",
      "--disable-gpu",
    ],
    timeout: timeoutMs,
  });
  const context = await browser.newContext({
    deviceScaleFactor: 2, // PNG 时更清晰
  });
  const page = await context.newPage();

  // 通过临时 HTML 文件打开（比 data:text/html 更稳，尤其是字体和图片）
  await page.goto(`file://${tmpHtmlPath.replace(/\\/g, "/")}`, {
    waitUntil: "load",
    timeout: timeoutMs,
  });
  // 等字体 / 图片 / 外部资源加载
  try { await page.waitForLoadState("networkidle", { timeout: Math.min(8000, timeoutMs) }); } catch {}
  if (waitMs > 0) await page.waitForTimeout(waitMs);

  if (format === "pdf") {
    // 关键：preferCSSPageSize + format，margin 交给 CSS @page + 每页的 padding 控制
    // 参考 Experience 793229：不要既传 format 又传 height/width 搞成长图；我们要多页 A4
    const pdfBuffer = await page.pdf({
      format: pageSizeName.toUpperCase(),
      preferCSSPageSize: true,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      displayHeaderFooter: false,
      timeout: timeoutMs,
    });
    fs.writeFileSync(outputPath, pdfBuffer);
  } else if (format === "png") {
    // 每页一张 PNG，输出到同名目录，然后打 zip（若可用 jszip）
    tmpPageDir = path.join(os.tmpdir(), `ui-pdf-pngs-${process.pid}`);
    fs.mkdirSync(tmpPageDir, { recursive: true });
    const sheetEls = await page.$$(".sr-page");
    const pngFiles = [];
    for (let i = 0; i < sheetEls.length; i++) {
      const buf = await sheetEls[i].screenshot({ type: "png", scale: "device" });
      const f = path.join(tmpPageDir, `page-${String(i + 1).padStart(3, "0")}.png`);
      fs.writeFileSync(f, buf);
      pngFiles.push(f);
    }
    // 尝试压缩（若项目里有 jszip 就打包成单个 zip；否则把目录移动到目标路径去掉扩展名）
    try {
      const jszipMod = await import("jszip");
      const JSZip = jszipMod.default || jszipMod;
      const zip = new JSZip();
      for (const f of pngFiles) zip.file(path.basename(f), fs.readFileSync(f));
      const zipBuf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
      const zipPath = outputPath.replace(/\.png$/i, ".zip");
      fs.writeFileSync(zipPath, zipBuf);
      log(`PNG 已打包成 zip：${zipPath}`);
      if (!QUIET) process.stdout.write(zipPath + "\n");
    } catch (_e) {
      // 没有 jszip，就把 pngs 目录 mv 到目标路径（去掉 .png 后缀）
      const dir = outputPath.replace(/\.png$/i, "") + "-pngs";
      fs.rmSync(dir, { recursive: true, force: true });
      fs.renameSync(tmpPageDir, dir);
      log(`PNG 目录：${dir}（缺少 jszip，未打包 zip）`);
      if (!QUIET) process.stdout.write(dir + "\n");
    }
  } else {
    fatal(`未知 --format：${format}（支持 pdf|png|html）`);
  }

  await context.close();
} catch (err) {
  fatal(`Playwright 渲染失败：${err.stack || err.message}`);
} finally {
  if (browser) { try { await browser.close(); } catch {} }
  try { fs.unlinkSync(tmpHtmlPath); } catch {}
  if (tmpPageDir) { try { fs.rmSync(tmpPageDir, { recursive: true, force: true }); } catch {} }
}

// ---------- 可选：PDF 合法性校验（需要 pdfinfo，存在时才跑） ----------
if (format === "pdf" && !args.noValidate) {
  const { spawnSync } = await import("node:child_process");
  const p = spawnSync("pdfinfo", [outputPath], { encoding: "utf8" });
  if (p.error) {
    log("（未检测到 pdfinfo，跳过 PDF 合法性校验；安装 poppler 可启用）");
  } else if (p.status !== 0) {
    log(`pdfinfo 报错：${p.stderr || p.stdout}`);
  } else {
    const m = /^Pages:\s*(\d+)/m.exec(p.stdout || "");
    const reported = m ? Number(m[1]) : null;
    if (reported != null && reported !== rendered.pageCount) {
      log(`警告：PDF 页数 ${reported} 与 doc 页数 ${rendered.pageCount} 不一致`);
    } else {
      log(`PDF 校验通过，页数 ${reported}`);
    }
  }
}

log(`导出完成：${outputPath}`);
if (!QUIET) process.stdout.write(outputPath + "\n");
process.exit(0);
