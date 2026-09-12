/**
 * 验证「工具栏里只剩 wangEditor 一个元素，所有功能都是它的菜单」。
 *
 * node .local-3d/toolbar-menus.mjs
 */
import { chromium } from "playwright";

const browser = await chromium.launch();

/**
 * 窄屏时工具栏要横向滚动，Playwright 的 click 会因为「元素在视口外」而失败，
 * 所以统一用 DOM 原生 click（）触发（jQuery 的委托仍然会收到）。
 */
const clickMenu = (page, key) =>
  page.evaluate((k) => {
    document.querySelector(`.w-e-toolbar button[data-menu-key="${k}"]`)?.click();
  }, key);

const probe = async (width) => {
  const page = await browser.newPage({ viewport: { width, height: 820 } });
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message).slice(0, 200)));
  await page.goto("http://localhost:5200/create-post", {
    waitUntil: "load",
    timeout: 60000,
  });
  await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
  await page.waitForTimeout(900);

  const shape = await page.evaluate(() => {
    const bar = document.querySelector(".editor-toolbar-fixed");
    const wt = document.querySelector(".w-e-toolbar");
    const items = [...wt.querySelectorAll(".w-e-bar-item")];
    const tops = [...new Set(items.map((el) => Math.round(el.getBoundingClientRect().top)))];
    return {
      barTag: bar.tagName + "." + bar.className,
      barElementChildren: bar.children.length,
      barChildTags: [...bar.children].map((el) => el.tagName + (el.className ? "." + el.className : "")),
      leftOverDom: {
        extras: Boolean(document.querySelector(".editor-toolbar-extras")),
        citationBtn: Boolean(document.querySelector(".citation-panel-toggle-btn")),
        ioDropdown: Boolean(document.querySelector(".io-dropdown")),
        floatingToggle: Boolean(document.querySelector(".floating-tools-toggle")),
      },
      menuKeys: items
        .map((el) => el.querySelector("button")?.getAttribute("data-menu-key"))
        .filter(Boolean),
      rows: tops.length,
      barScrollW: bar.scrollWidth,
      barClientW: bar.clientWidth,
      canScroll: bar.scrollWidth > bar.clientWidth + 1,
      toolbarH: Math.round(wt.getBoundingClientRect().height),
      barH: Math.round(bar.getBoundingClientRect().height),
    };
  });

  // 1) 参考文献开关：点一下，面板应展开，按钮点亮
  const citationBefore = await page.evaluate(
    () => getComputedStyle(document.querySelector(".citation-panel")).display,
  );
  await clickMenu(page, "lifeCitationPanel");
  await page.waitForTimeout(350);
  const citationAfter = await page.evaluate(() => {
    const btn = document.querySelector('button[data-menu-key="lifeCitationPanel"]');
    return {
      panelDisplay: getComputedStyle(document.querySelector(".citation-panel")).display,
      btnActive: btn.classList.contains("active"),
    };
  });

  // 2) 浮动工具栏开关：点一下应关掉，按钮高亮同步
  await clickMenu(page, "lifeFloatingTools");
  await page.waitForTimeout(350);
  const floating = await page.evaluate(() => {
    const btn = document.querySelector('button[data-menu-key="lifeFloatingTools"]');
    const wrap = document.querySelector(".editor-wrapper");
    return {
      wrapperDisabled: wrap.classList.contains("floating-tools-disabled"),
      btnActive: btn.classList.contains("active"),
    };
  });
  await clickMenu(page, "lifeFloatingTools");
  await page.waitForTimeout(250);

  // 3) 导入下拉：面板要出现且不被滚动容器裁掉
  //    窄屏下先把工具栏滚到最右，否则按钮本身在视口外，面板也没法取点。
  //    注意必须在「点开之前」滚 —— 面板一开，overflow 变 visible，这时再设 scrollLeft 是无效的。
  await page.evaluate(() => {
    const bar = document.querySelector(".editor-toolbar-fixed");
    bar.scrollLeft = 99999;
  });
  await page.waitForTimeout(250);
  await clickMenu(page, "lifeImportDoc");
  await page.waitForTimeout(450);
  const importPanel = await page.evaluate(() => {
    const panel = document.querySelector(".w-e-drop-panel .life-toolbar-drop-panel");
    if (!panel) return { found: false };
    const r = panel.getBoundingClientRect();
    const bar = document.querySelector(".editor-toolbar-fixed");
    // 取「面板 ∩ 视口」的中心点，检查有没有被滚动容器裁掉
    const left = Math.max(r.left, 0);
    const right = Math.min(r.right, window.innerWidth);
    const top = Math.max(r.top, 0);
    const bottom = Math.min(r.bottom, window.innerHeight);
    const inside = right > left && bottom > top;
    const hit = inside
      ? document.elementFromPoint(
          Math.round((left + right) / 2),
          Math.round((top + bottom) / 2),
        )
      : null;
    return {
      found: true,
      labels: [...panel.querySelectorAll("button")].map((b) => b.textContent.trim()),
      panelH: Math.round(r.height),
      barOverflowY: getComputedStyle(bar).overflowY,
      hasPanelOpenClass: bar.classList.contains("is-panel-open"),
      scrollKept: bar.style.getPropertyValue("--life-toolbar-scroll-x") || "(none)",
      panelInViewport: inside,
      hitInsidePanel: Boolean(hit && panel.contains(hit)),
    };
  });
  await page.mouse.click(400, 700);

  // 4) 导出下拉同样检查
  await clickMenu(page, "lifeExportDoc");
  await page.waitForTimeout(450);
  const exportPanel = await page.evaluate(() => {
    const panel = document.querySelector(".w-e-drop-panel .life-toolbar-drop-panel");
    return panel
      ? { found: true, labels: [...panel.querySelectorAll("button")].map((b) => b.textContent.trim()) }
      : { found: false };
  });

  // 5) 辅助确认：窄屏下让工具栏横向滚动，确认"中间/两侧"同为一条（按钮整体位移）
  //    先把下拉面板关掉，否则 .is-panel-open 会让 overflow:visible、滚不动
  await page.mouse.click(400, 700);
  await page.waitForTimeout(350);
  const scrollCheck = await page.evaluate(() => {
    const bar = document.querySelector(".editor-toolbar-fixed");
    if (bar.scrollWidth <= bar.clientWidth + 1) {
      return { scrolled: false, overflowY: getComputedStyle(bar).overflowY };
    }
    const read = () =>
      Math.round(
        document
          .querySelector('.w-e-toolbar button[data-menu-key="lifeCitationPanel"]')
          .getBoundingClientRect().x,
      );
    // 先归零再滚，否则量到的「前后」都是同一个位置，看不出位移
    bar.scrollLeft = 0;
    void bar.offsetWidth;
    const before = read();
    bar.scrollLeft = 99999;
    return {
      scrolled: true,
      overflowY: getComputedStyle(bar).overflowY,
      scrollLeft: Math.round(bar.scrollLeft),
      firstXBefore: before,
      firstXAfter: read(),
    };
  });

  await page.close();
  return {
    width,
    shape,
    citation: { before: citationBefore, ...citationAfter },
    floating,
    importPanel,
    exportPanel,
    scrollCheck,
    errs,
  };
};

for (const w of [760, 1024, 1280, 1520]) {
  console.log(JSON.stringify(await probe(w)));
}

await browser.close();
