/**
 * @xiaoxueria/laup2 还没发布正式版，也没有 .d.ts；
 * 这里只声明插件用到的公开 API，避免 TS 报「找不到类型」。
 */
declare module '@xiaoxueria/laup2' {
  export interface TypesetOptions {
    variables?: Record<string, unknown>;
    mode?: 'edit' | 'strict';
    mathDelimiters?: 'dollar' | 'jupyter';
    mathOutput?: 'node' | 'source';
    allowAttachment?: boolean;
  }

  export interface TypesetResult {
    html: string;
    diagnostics: unknown[];
  }

  export function typeset(source: string, options?: TypesetOptions): TypesetResult;
  export function typesetCells(source: string, options?: TypesetOptions): TypesetResult;
}

declare module '@xiaoxueria/laup2/css';
declare module '*.css';
