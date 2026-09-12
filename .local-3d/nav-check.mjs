/**
 * 检查各页面滚动后「网站主导航」（.wiki-header）是否还在视口里。
 * sticky 失效时，滚动后 header.getBoundingClientRect().top 会变成负数。
 */
import { chromium } from "playwright";

const base = "http://localhost:5200";
const routes = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["/", "/columns", "/research", "/life-tree", "/notifications", "/art-trees", "/create-post"];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log("  [page-error]", e.message));

for (const route of routes) {
  await page.goto(base + route, { waitUntil: "load", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1500);

  const info = await page.evaluate(async () => {
    const header = document.querySelector(".wiki-header");
    if (!header) {
      return {
        hasHeader: false,
        url: location.pathname,
        bodyText: document.body.innerText.slice(0, 60).replace(/\n/g, " "),
      };
    }
    const topBefore = header.getBoundingClientRect().top;
    const canScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, 900);
    await new Promise((r) => setTimeout(r, 500));
    const topAfter = header.getBoundingClientRect().top;

    const blockers = [];
    let el = header.parentElement;
    while (el && el !== document.documentElement) {
      const cs = getComputedStyle(el);
      if (cs.overflowX !== "visible" || cs.overflowY !== "visible") {
        blockers.push(`${el.tagName}.${String(el.className).slice(0, 30)} [${cs.overflowX}/${cs.overflowY}]`);
      }
      el = el.parentElement;
    }
    const parentDisplay = getComputedStyle(header.parentElement).display;
    window.scrollTo(0, 0);
    return {
      hasHeader: true,
      url: location.pathname,
      canScroll,
      topBefore,
      topAfter,
      sticky: getComputedStyle(header).position,
      parentDisplay,
      blockers,
    };
  });

  if (!info.hasHeader) {
    console.log(`${route}\n  ✗ 页面没有 .wiki-header  (落地: ${info.url}「${info.bodyText}」)`);
  } else {
    const ok = info.canScroll <= 0 || info.topAfter >= -1;
    console.log(
      `${route}\n  ${ok ? "✓ sticky 正常" : "✗ 滚动后导航栏跑掉了"}  ` +
      `top: ${info.topBefore} → ${info.topAfter}  可滚动=${info.canScroll}  position=${info.sticky}  父display=${info.parentDisplay}` +
      (info.blockers.length ? `\n  overflow 祖先: ${info.blockers.join(" | ")}` : "\n  overflow 祖先: 无"),
    );
  }
}

await browser.close();
