// 块级数据语法 `\命令=[ … ]` 的解析与 schema 校验（规范 §5）。
//
// 三条可词法判定的硬约束：
//   1. `=[` 后必须紧跟换行（否则它不是数据块）
//   2. 元素一行一个
//   3. 行首 `"` / `'` → 字符串元素；`标识符=` → 字段
//
// 护栏：**只有白名单类型能用 `=[]` 形状，内部只有白名单字段名**，
// 不做自由键值——否则它会退化成 YAML 配置文件。
//
// 两种形态（专题 docs/life-elements-spec.md §4）：
//   具名型（默认）              内部只能有 `字段=值` / `字段=[…]`
//   位置型（positional: true）  顶层直接是字符串元素，不允许字段
//
// 位置型**不违反护栏本意**：护栏要防"退化成 YAML"，而位置型根本没有 key，
// 它是一维数组。词法判定（硬约束 3）一个字都没改 —— 放宽的只是**语义允许性**：
// 具名型 schema 收到无名元素时仍然报错并列出可用字段。

import { LaupError } from './diag.js';
import { N } from './ast.js';
import { claimCore, extensionDataBlockNames, lookupDataBlock } from './extensions.js';

const ALIASES = { excel: 'table' };

const SCHEMAS = {
  table: {
    fields: {
      column: { kind: 'strings', required: true, single: true },
      row: { kind: 'strings', required: false, single: false },
      caption: { kind: 'string', required: false },
      align: { kind: 'string', required: false },
    },
    build(fields, ctx, line) {
      const columns = fields.column.value;
      const rows = (fields.row || []).map((f) => f.value);
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].length !== columns.length) {
          throw new LaupError(
            `数据行有 ${rows[i].length} 个单元格，但表头有 ${columns.length} 列`,
            rows[i].line || line,
            '每一行的元素个数必须与 column 一致',
          );
        }
      }
      const align = fields.align ? fields.align.value : '';
      if (align && align.length !== columns.length) {
        ctx.warn(line, `align="${align}" 长度 ${align.length} 与列数 ${columns.length} 不一致，已忽略对齐`);
      }
      return N.table(columns, rows, {
        caption: fields.caption ? fields.caption.value : '',
        align: align.length === columns.length ? align : '',
      });
    },
  },

  image: {
    fields: {
      src: { kind: 'string', required: true },
      alt: { kind: 'string', required: false },
      caption: { kind: 'string', required: false },
    },
    build(fields, ctx, line) {
      return N.image(fields.src.value, {
        alt: fields.alt ? fields.alt.value : '',
        caption: fields.caption ? fields.caption.value : '',
      });
    },
  },

  // ⚠️ 站点专属的数据块（研究树嵌入 `\tree`、参考文献 `\references`…）**不在这里**。
  // 核心只装通用类型；站点自己的 schema 由宿主用 defineExtension() 装
  // （机制见 src/extensions.js，参考实现见 extensions/life.js）。
};

// 核心的类型名记账：挡住"扩展想占用核心已经实现的名字"这种静默遮蔽。
claimCore('dataBlock', [...Object.keys(SCHEMAS), ...Object.keys(ALIASES)], 'core/dataBlock.js');

export function isDataBlockStart(line) {
  const m = /^\s*\\([A-Za-z][A-Za-z0-9]*)\s*=\s*\[(.*)$/.exec(line);
  if (!m) return null;
  return { name: m[1], tail: m[2] };
}

function readQuoted(src) {
  const q = src[0];
  let out = '';
  for (let i = 1; i < src.length; i++) {
    const c = src[i];
    if (c === '\\') {
      const nx = src[i + 1];
      if (nx === q || nx === '\\') { out += nx; i++; continue; }
      if (nx === 'n') { out += '\n'; i++; continue; }
      out += c;
      continue;
    }
    if (c === q) return { value: out, next: i + 1 };
    out += c;
  }
  return null;
}

// 读一个数据块。lines[i] 是 `\命令=[` 那一行。
export function readDataBlock(lines, i, base, ctx) {
  const start = isDataBlockStart(lines[i]);
  const name = ALIASES[start.name] || start.name;
  // 核心的通用类型在前，宿主扩展装的在后（撞名会在 defineExtension 时就被拒掉）
  const schema = SCHEMAS[name] || lookupDataBlock(name);
  const rootLine = base + i + 1;

  if (!schema) {
    throw new LaupError(
      `未知的数据块类型 \\${start.name}`,
      rootLine,
      `数据块白名单：${dataBlockTypeNames().map((k) => '\\' + k).join(' / ')}。` +
        '要新增类型，必须先定义自己的 schema —— 通用类型在核心，站点自己的用 defineExtension() 装',
    );
  }
  if (start.tail.trim() !== '') {
    throw new LaupError(
      '数据块的 `=[` 后必须紧跟换行',
      rootLine,
      '元素一行一个，这是判别"数据块"与"数组字面量"的唯一依据',
    );
  }

  const stack = [{ key: null, items: [], line: rootLine }];
  let i2 = i + 1;

  for (; i2 < lines.length; i2++) {
    const no = base + i2 + 1;
    const raw = lines[i2];
    const t = raw.trim();
    if (!t) continue;

    if (t === ']') {
      const closed = stack.pop();
      if (closed.key === null) {
        i2 += 1;
        return { node: build(name, schema, closed, ctx, rootLine), next: i2 };
      }
      // 嵌套数组闭合 → 作为字段挂回父级
      const parent = stack[stack.length - 1];
      parent.items.push({
        kind: 'field',
        key: closed.key,
        value: closed.items.map((e) => e.value),
        line: closed.line,
      });
      continue;
    }

    if (stack.length > 1) {
      if (/^[A-Za-z_][A-Za-z0-9_-]*\s*=/.test(t)) {
        throw new LaupError('数据块最多嵌套一层', no, '字段里不能再放字段或数组');
      }
      if (t[0] !== '"' && t[0] !== "'") {
        throw new LaupError('嵌套数组里只能放字符串元素', no, '元素必须用引号包起来，一行一个');
      }
      const q = readQuoted(t);
      if (!q || q.next < t.length) {
        throw new LaupError('字符串没有正确闭合，或同一行写了多个元素', no, '元素一行一个');
      }
      stack[stack.length - 1].items.push({ kind: 'elem', value: q.value, line: no });
      continue;
    }

    const openNested = /^([A-Za-z_][A-Za-z0-9_-]*)\s*=\s*\[(.*)$/.exec(t);
    if (openNested) {
      if (openNested[2].trim() !== '') {
        throw new LaupError(
          '字段的 `=[` 后必须紧跟换行',
          no,
          '元素一行一个；写在一行里的是数组字面量，不是数据块',
        );
      }
      stack.push({ key: openNested[1], items: [], line: no });
      continue;
    }

    const scalar = /^([A-Za-z_][A-Za-z0-9_-]*)\s*=\s*([\s\S]+)$/.exec(t);
    if (scalar) {
      const q = readQuoted(scalar[2]);
      if (!q || q.next < scalar[2].length) {
        throw new LaupError(
          `字段 \`${scalar[1]}\` 的值必须是完整的一对引号`,
          no,
          `例如 ${scalar[1]}="文字"`,
        );
      }
      stack[stack.length - 1].items.push({
        kind: 'field',
        key: scalar[1],
        value: q.value,
        line: no,
      });
      continue;
    }

    if (t[0] === '"' || t[0] === "'") {
      const q = readQuoted(t);
      if (!q || q.next < t.length) {
        throw new LaupError('字符串没有正确闭合，或同一行写了多个元素', no, '元素一行一个');
      }
      // 位置型 schema 允许顶层无名元素（它没有 key，不是 YAML 化）
      if (!schema.positional) {
        throw new LaupError(
          `「\\${name}=」的字段必须具名：这里出现了没有字段名的字符串元素`,
          no,
          `可用字段：${Object.keys(schema.fields).join(' / ')}。` +
            '不做位置绑定——可选字段多于一个时，位置绑定要靠 "" 占位符，既丑又易错',
        );
      }
      stack[0].items.push({ kind: 'elem', value: q.value, line: no });
      continue;
    }

    throw new LaupError('无法识别的数据块行', no, '一行只能是 `字段=值`、`字段=[`、字符串元素或 `]`');
  }

  throw new LaupError(`数据块没有闭合`, rootLine, '需要一个独占一行的 `]`');
}

function build(name, schema, root, ctx, line) {
  const fields = {};
  const positional = [];

  for (const item of root.items) {
    if (item.kind === 'elem') {
      // readDataBlock 已确保：只有 positional schema 能产出 elem 到根层
      positional.push({ value: item.value, line: item.line });
      continue;
    }
    const spec = schema.fields[item.key];
    if (!spec) {
      throw new LaupError(
        `「\\${name}=」不认识字段 \`${item.key}\``,
        item.line,
        `可用字段：${Object.keys(schema.fields).join(' / ')}。不做自由键值——这是防止退化成 YAML 的护栏`,
      );
    }
    const isArray = Array.isArray(item.value);
    const single = spec.kind === 'string' || spec.single === true;
    if (spec.kind === 'strings') {
      if (!isArray) {
        throw new LaupError(`字段 \`${item.key}\` 需要数组`, item.line, `写成 ${item.key}=[ … ]`);
      }
    } else if (isArray) {
      throw new LaupError(`字段 \`${item.key}\` 需要字符串，不接受数组`, item.line);
    }
    if (single && fields[item.key]) {
      throw new LaupError(`字段 \`${item.key}\` 只能出现一次`, item.line);
    }
    const entry = { value: item.value, line: item.line };
    if (fields[item.key]) fields[item.key].push(entry);
    else fields[item.key] = [entry];
  }

  for (const [key, spec] of Object.entries(schema.fields)) {
    if (spec.required && !fields[key]) {
      throw new LaupError(
        `「\\${name}=」缺少必需字段 \`${key}\``,
        line,
        `必需字段：${Object.entries(schema.fields).filter(([, s]) => s.required).map(([k]) => k).join(' / ')}`,
      );
    }
  }

  // 标量字段与"只允许一次"的数组字段取唯一一项；可重复的数组字段（row）保留全部
  const flat = {};
  for (const [key, entries] of Object.entries(fields)) {
    const spec = schema.fields[key];
    const single = spec.kind === 'string' || spec.single === true;
    flat[key] = single ? entries[0] : entries;
  }
  return schema.build(flat, ctx, line, positional);
}

// 当前可用的数据块类型 = 核心通用类型 + 已装扩展登记的类型。
//
// ⚠️ 是**函数**不是常量数组：扩展可以在任何时候装进来，常量会在 import 那一刻把
// 名单冻住，于是"装完扩展再报未知类型"的消息里会缺掉刚装的那些。
export function dataBlockTypeNames() {
  return [...Object.keys(SCHEMAS), ...Object.keys(ALIASES), ...extensionDataBlockNames()];
}
