#!/usr/bin/env node
/**
 * Laup → PDF（无头 Chromium，真矢量输出）
 *
 * 用法：
 *   node scripts/laup-pdf.mjs <input.laup> [output.pdf]
 *
 * 做的事：
 *   1. 用 Laup 自己的渲染器把源码渲染成 HTML（预览 / 发布 / PDF 同一条链路）；
 *   2. 套上 core/page.js 的独立页面外壳，KaTeX 换成本地文件（不依赖 CDN）；
 *   3. 无头 Chromium 打开该页面，用 CDP 导出 PDF —— 输出是矢量文字，不是截图。
 *
 * 这一步是「能不能真渲染 PDF」的可行性验证；正式功能（按钮、样式、分页控制）另做。
 */
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import { render, defineExtension } from '../src/laup/core/index.js';
import { lifeElements } from '../src/laup/extensions/life.js';
import { renderPage } from '../src/laup/core/page.js';

defineExtension(lifeElements());

const KATEX_DIR = path.resolve('node_modules/katex/dist');

async function localKatex(html) {
  if (!existsSync(path.join(KATEX_DIR, 'katex.min.js'))) return html;
  const jsUrl = pathToFileURL(path.join(KATEX_DIR, 'katex.min.js')).href;
  const cssUrl = pathToFileURL(path.join(KATEX_DIR, 'katex.min.css')).href;
  // 用 file:// 引用本地 KaTeX：CSS 里的相对字体路径会自然指向 node_modules/katex/dist/fonts。
  // 不内联源码 —— 内联时脚本内容可能被 HTML 解析器截断，整段 JS 会变成页面文字。
  return html
    .replace(
      /<link rel="stylesheet" href="https:[^"]*katex[^"]*">/,
      `<link rel="stylesheet" href="${cssUrl}">`,
    )
    .replace(
      /<script defer src="https:[^"]*katex[^"]*"><\/script>/,
      `<script defer src="${jsUrl}"></script>`,
    );
}

function summarize(pdfBytes) {
  const raw = Buffer.from(pdfBytes).toString('latin1');
  return {
    images: (raw.match(/\/Subtype\s*\/Image/g) || []).length,
    fonts: (raw.match(/\/Subtype\s*\/(?:Type0|TrueType|Type1|CIDFontType[02])/g) || []).length,
  };
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('用法：node scripts/laup-pdf.mjs <input.laup> [output.pdf]');
    process.exit(2);
  }
  const output = process.argv[3] || input.replace(/\.laup$/i, '') + '.pdf';
  const source = await readFile(input, 'utf8');

  const { output: body, warnings } = render(source, 'html', { mode: 'edit' });
  if (warnings?.length) {
    console.log(`渲染告警 ${warnings.length} 条（容错模式，已跳过）`);
  }

  let html = renderPage({
    title: path.basename(input).replace(/\.laup$/i, ''),
    body,
    meta: 'Laup → PDF（headless Chromium）',
  });
  html = await localKatex(html);

  const dir = await mkdtemp(path.join(tmpdir(), 'laup-pdf-'));
  const htmlPath = path.join(dir, 'doc.html');
  await writeFile(htmlPath, html, 'utf8');

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
    // 等公式与字体就绪，否则首屏可能按原始 TeX 排版
    await page
      .waitForFunction(
        () =>
          document.fonts.status === 'loaded' &&
          [...document.querySelectorAll('[data-tex]')].every((el) =>
            el.classList.contains('laup-tex-ok'),
          ),
        { timeout: 10000 },
      )
      .catch(() => console.log('公式/字体等待超时，继续导出'));

    const formulaStats = await page.evaluate(() => ({
      rendered: document.querySelectorAll('.katex').length,
      pending: document.querySelectorAll('[data-tex]:not(.laup-tex-ok)').length,
    }));

    const pdfBytes = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', right: '16mm', bottom: '18mm', left: '16mm' },
    });

    const doc = await PDFDocument.load(pdfBytes);
    const stats = summarize(pdfBytes);
    await writeFile(output, pdfBytes);

    console.log(`已生成 ${path.resolve(output)}`);
    console.log(`  页数：${doc.getPageCount()}`);
    console.log(`  体积：${(pdfBytes.length / 1024).toFixed(1)} KB`);
    console.log(`  公式：${formulaStats.rendered} 个已渲染，${formulaStats.pending} 个未完成`);
    console.log(`  内嵌字体对象：${stats.fonts}，位图对象：${stats.images}`);
    console.log(
      stats.images === 0
        ? '  结论：整篇是矢量文字（无位图），文字可选中 / 可搜索'
        : '  注意：PDF 里含位图对象（可能来自图片或背景）',
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
