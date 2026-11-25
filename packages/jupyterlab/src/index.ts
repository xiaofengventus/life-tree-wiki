/**
 * JupyterLab 4 的 Markdown 渲染管线替换插件（Laup v2）。
 *
 * 为什么替换「渲染器工厂」而不是只换 IMarkdownParser：
 *   JupyterLab 的 renderMarkdown 在调用解析器之前会先跑 removeMath()，
 *   它把任何 `\begin{…}` 都当成 LaTeX 环境抽走 —— `\begin{todo}` /
 *   `\begin{card}` 根本到不了解析器。所以这里直接接管 text/markdown：
 *   源码整体交给 Laup，数学用 mathOutput:'source' 输出 $…$ 文本，
 *   再由 JupyterLab 的 latexTypesetter（KaTeX）统一排版。
 *
 * 其余能力仍复用 JupyterLab 现有管线：
 *   · sanitize、attachment: 解析（AttachmentsResolver）、标题锚点；
 *   · 本插件只负责「源码 → HTML 片段」。
 */

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { IEditorLanguageRegistry } from '@jupyterlab/codemirror';
import { IRenderMimeRegistry, renderHTML, renderMarkdown } from '@jupyterlab/rendermime';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { Message } from '@lumino/messaging';
import { Widget } from '@lumino/widgets';
import { typesetCells } from '@xiaoxueria/laup2';
import '@xiaoxueria/laup2/css';
import '../style/index.css';

const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (ch) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[ch] as string,
  );

/**
 * 单元格源码 → HTML。
 *
 * 用 typesetCells 而不是 typeset：这样在一个 Markdown 单元格里写
 * `\cellbreak` 分隔的 Laup 格（[input] / [output] / [references] / var）也能生效。
 * 保留 <article class="laup2"> 容器 —— laup2.css 的表格 / 引用等样式都挂在 `.laup2` 下。
 */
export function renderLaupFragment(source: string): string {
  try {
    const { html } = typesetCells(source, {
      allowAttachment: true,
      mathOutput: 'source',
    });
    return html;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return [
      '<pre class="laup-error">',
      `Laup 渲染失败：${escapeHtml(message)}`,
      '',
      escapeHtml(source),
      '</pre>',
    ].join('\n');
  }
}

/** JupyterLab 原本由 renderMarkdown 私有函数补的标题锚点。 */
function addHeaderAnchors(host: HTMLElement): void {
  host.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6').forEach((header) => {
    if (!header.id) {
      header.id = renderMarkdown.createHeaderId(header);
    }
    const anchor = document.createElement('a');
    anchor.className = 'jp-InternalAnchorLink';
    anchor.href = `#${header.id}`;
    anchor.textContent = '¶';
    header.appendChild(anchor);
  });
}

class LaupMarkdownRenderer extends Widget implements IRenderMime.IRenderer {
  constructor(options: IRenderMime.IRendererOptions, languages: IEditorLanguageRegistry | null) {
    super();
    this.addClass('jp-RenderedMarkdown');
    this._options = options;
    this._languages = languages;
  }

  async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    const source = String(model.data[this._options.mimeType] ?? '');
    if (!source) {
      this.node.textContent = '';
      return;
    }
    this._rendered = renderHTML({
      host: this.node,
      source: renderLaupFragment(source),
      trusted: model.trusted,
      sanitizer: this._options.sanitizer,
      resolver: this._options.resolver,
      linkHandler: this._options.linkHandler,
      // 挂载时往往还没进 DOM，真正的排版在 onAfterAttach 里补
      shouldTypeset: this.isAttached,
      latexTypesetter: this._options.latexTypesetter,
      translator: this._options.translator,
    });
    await this._rendered;
    addHeaderAnchors(this.node);
    await this._highlightCode();
  }

  /** 用 JupyterLab 自己的语言注册表给 `[cpp]` 这类代码格上色。 */
  private async _highlightCode(): Promise<void> {
    if (!this._languages) return;
    const blocks = Array.from(
      this.node.querySelectorAll<HTMLElement>('pre.laup2-code[data-lang] > code'),
    );
    await Promise.all(
      blocks.map(async (code) => {
        const lang = code.parentElement?.getAttribute('data-lang') || '';
        if (!lang) return;
        const language = this._languages?.findBest(lang);
        if (!language) return;
        const holder = document.createElement('div');
        try {
          await this._languages?.highlight(code.textContent || '', language, holder);
          code.innerHTML = holder.innerHTML;
        } catch (error) {
          console.warn('Laup 代码高亮失败', error);
        }
      }),
    );
  }

  /** 与官方 RenderedMarkdown 一致：挂载后补一次数学排版。 */
  onAfterAttach(_msg: Message): void {
    this._rendered
      .then(() => {
        if (this._options.latexTypesetter) {
          void this._options.latexTypesetter.typeset(this.node);
        }
      })
      .catch(console.warn);
  }

  private _options: IRenderMime.IRendererOptions;
  private _languages: IEditorLanguageRegistry | null;
  private _rendered: Promise<void> = Promise.resolve();
}

const plugin: JupyterFrontEndPlugin<void> = {
  id: '@xiaoxueria/jupyterlab-laup:plugin',
  description: 'Render Markdown cells with Laup v2',
  autoStart: true,
  requires: [IRenderMimeRegistry, IEditorLanguageRegistry],
  activate: (
    app: JupyterFrontEnd,
    rendermime: IRenderMimeRegistry,
    languages: IEditorLanguageRegistry,
  ) => {
    const factory: IRenderMime.IRendererFactory = {
      mimeTypes: ['text/markdown'],
      safe: true,
      defaultRank: 0,
      createRenderer: (options) => new LaupMarkdownRenderer(options, languages),
    };
    rendermime.addFactory(factory, 0);
  },
};

export default plugin;
