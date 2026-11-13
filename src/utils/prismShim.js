// prismjs 组件修复（rolldown/vite 打包产物专用）：
// prismjs 主入口里 `_self.Prism = _`（挂全局）这行会被 rolldown 的 CJS 包装
// + tree-shaking 删掉（实测 dist 中 grep 不到），而 components/*.js 语法文件
// （prism-python.js 等）引用的是裸全局 `Prism`，chunk 加载时立即执行
// `Prism.languages.python = ...` → ReferenceError: Prism is not defined → 整站白屏。
//
// 这里显式把 Prism 挂上全局。ESM 依赖序保证本模块先于任何 prismjs/components/*
// 执行（importer 中本模块声明在组件 import 之前）。
import Prism from 'prismjs'

if (typeof globalThis !== 'undefined' && !globalThis.Prism) {
  globalThis.Prism = Prism
}

export default Prism
