/**
 * Laup v2 —— 补全项（注册表驱动）。
 *
 * 不再手写补全列表：命令来自 registry，环境来自 registry，格声明是固定的一张表。
 * 编辑器只需拿这些条目去做 CodeMirror / 自定义补全，不需要知道语法细节。
 */

import { commandNames, environmentNames, getCommand, getEnvironment } from "./registry.js";
import { CELL_DECL_TABLE, CELL_MAGIC_TABLE } from "./cells.js";

export function commandCompletions() {
  return commandNames().map((name) => {
    const def = getCommand(name);
    const signature = (def.args || []).map((arg) => `{${arg.name}}`).join("");
    return {
      label: `\\${name}`,
      apply: `\\${name}${signature}`,
      type: "keyword",
      scope: def.scope,
      detail: signature || "无参数",
    };
  });
}

export function environmentCompletions() {
  return environmentNames().map((name) => {
    const def = getEnvironment(name);
    return {
      label: name,
      apply: `\\begin{${name}}\n\n\\end{${name}}`,
      type: "keyword",
      scope: "block",
      detail: `环境（${def.content}）`,
    };
  });
}

export function cellCompletions() {
  return [
    ...CELL_DECL_TABLE.map((item) => ({
      label: `[${item.name}]`,
      apply: `[${item.name}]\n`,
      type: "keyword",
      detail: item.detail,
    })),
    ...CELL_MAGIC_TABLE.map((item) => ({
      label: `%%${item.name}`,
      apply: `%%${item.name}\n`,
      type: "keyword",
      detail: item.detail,
    })),
    { label: "\\cellbreak", apply: "\\cellbreak\n", type: "keyword", detail: "格分隔" },
  ];
}

export function allCompletions() {
  return [...cellCompletions(), ...commandCompletions(), ...environmentCompletions()];
}
