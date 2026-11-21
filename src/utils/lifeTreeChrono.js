// lifetree 时序图 v3：参考论文图（timetree）的**直角谱系 + 时间标定**渲染。
// 纯字符串 → SVG；Node / 浏览器同一口径；不量 DOM、不写 CSS，发布端逐字可复现。
//
// ── 几何（这是与旧版最大的区别，改之前先看懂）
//   * 横轴 = Ma，老 → 新（左 → 右）；叶节点在右端附近收束。
//   * **只有叶节点占行**；内节点 y = 首尾后代行的中线，单子链不额外占行。
//   * 每个节点：横枝从「父节点分化点」画到「自己的时间点」。
//   * 内节点在 x=自己的分化点 画竖脊，连首尾孩子（直角）；斜线模式改画对角线。
//   * 叶节点：区间 → 横枝 + 色带；单值 → 横枝 + 标记点；现存 → 横枝到右缘 + 端点；
//     化石但没值 → 细横枝延伸到右缘（年代未知，参考图里也不画断头）。
//   * 标签默认**压在自己分支上方靠左**（参考图形态），可切 末端 / 右对齐 / 隐藏。
//
// ── 样式
//   全部令牌见 lifeTreeChronoStyle.js：全局配置行控整图，节点行内覆盖沿子树继承。
//   输出只用 SVG 表现属性（不用 style），Laup auditHtml 可逐项白名单核对。

import { esc } from '../laup/core/escape.js';
import { clipGeoBands } from '../../shared/geoTimes.js';
import { chronoColor, chronoNumber, normalizeChronoStyle } from './lifeTreeChronoStyle.js';

const LABEL_PAD = 8;
const TOP_PAD = 26;
const PLOT_LEFT = 26;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function parseMa(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** 生存：`68-66` = 区间；`68` = 单点。 */
function parseRange(v) {
  const s = String(v ?? '').trim();
  if (!s) return null;
  const m = /^(\d+(?:\.\d+)?)\s*[-—–~]\s*(\d+(?:\.\d+)?)$/.exec(s);
  if (m) return { older: Number(m[1]), younger: Number(m[2]) };
  if (/^\d+(?:\.\d+)?$/.test(s)) return { older: null, younger: Number(s) };
  return null;
}

/** 时间参数 → { divergence, range, point, evidence }。`生存` 通吃，`时间` 当别名。 */
function temporalInfo(attrs) {
  const divergence = parseMa(attrs?.分化);
  const legacy = attrs?.生存 == null ? parseMa(attrs?.时间) : null;
  const raw = attrs?.生存 ?? (legacy != null ? String(legacy) : null);
  const range = raw == null ? null : parseRange(raw);
  const validRange = range && range.older != null && range.younger != null && range.older >= range.younger
    ? range : null;
  const point = range && range.older == null ? range.younger : null;
  const evidence = divergence ?? validRange?.older ?? point ?? null;
  return { divergence, range: validRange, point, evidence, raw, invalid: raw != null && !range };
}

/** 缺分化时间的内节点：取子树里最老的证据兜底（不臆造：没有证据就 null）。 */
function estimateDivergence(n) {
  const own = temporalInfo(n.attrs).evidence;
  if (own != null) return own;
  let best = null;
  for (const c of n.children || []) {
    const e = estimateDivergence(c);
    if (e != null && (best == null || e > best)) best = e;
  }
  return best;
}

function baseStyleState(s) {
  return {
    lineColor: s.线色,
    lineWidth: s.线宽,
    pointShape: s.点,
    innerPoint: s.内点,
    pointColor: s.点色,
    pointRadius: s.点半径,
    bandColor: s.条色,
    bandHeight: s.条高,
    bandType: s.条型,
    textColor: s.字色,
    fontSize: s.字号,
    fontWeight: s.字重 === '粗体' ? 600 : 400,
    labelMode: s.标签,
  };
}

/** 行内样式覆盖并沿子树继承；`[色=]` 是整支配色 shorthand。 */
function localStyle(attrs, inherited) {
  const st = { ...inherited };
  if (!attrs) return st;
  const named = chronoColor(attrs.色, null);
  if (named) {
    st.lineColor = named;
    st.textColor = named;
    st.pointColor = named;
    st.bandColor = named;
  }
  if (attrs.线色 != null) st.lineColor = chronoColor(attrs.线色, st.lineColor);
  if (attrs.字色 != null) st.textColor = chronoColor(attrs.字色, st.textColor);
  if (attrs.条色 != null) st.bandColor = chronoColor(attrs.条色, st.bandColor);
  if (attrs.点色 != null) st.pointColor = attrs.点色 === '跟随' ? '跟随' : chronoColor(attrs.点色, st.pointColor);
  if (attrs.线宽 != null) st.lineWidth = chronoNumber(attrs.线宽, st.lineWidth, 0.4, 12);
  if (attrs.点半径 != null) st.pointRadius = chronoNumber(attrs.点半径, st.pointRadius, 0.8, 12);
  if (attrs.条高 != null) st.bandHeight = chronoNumber(attrs.条高, st.bandHeight, 1, 24);
  if (attrs.字号 != null) st.fontSize = chronoNumber(attrs.字号, st.fontSize, 9, 32);
  if (attrs.点 != null && ['圆点', '方点', '无'].includes(attrs.点)) st.pointShape = attrs.点;
  if (attrs.内点 != null && ['关', '圆点', '方点'].includes(attrs.内点)) st.innerPoint = attrs.内点;
  if (attrs.条型 != null && ['色带', '细线', '无'].includes(attrs.条型)) st.bandType = attrs.条型;
  if (attrs.字重 != null) st.fontWeight = attrs.字重 === '粗体' ? 700 : 400;
  if (attrs.标签 != null && ['跟随', '末端', '右对齐', '隐藏'].includes(attrs.标签)) st.labelMode = attrs.标签;
  return st;
}

function marker(shape, cx, cy, r, fill) {
  if (shape === '无' || shape === '关') return '';
  if (shape === '方点') {
    return `<rect x="${(cx - r).toFixed(1)}" y="${(cy - r).toFixed(1)}" width="${(r * 2).toFixed(1)}" height="${(r * 2).toFixed(1)}" rx="${Math.min(1, r / 3).toFixed(1)}" fill="${fill}"/>`;
  }
  return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}"/>`;
}

/** 中文用正文字体、拉丁用斜体；按词切 tspan。 */
function labelTspans(n, fontStack, latinStack) {
  const zh = n.zh ? `${n.extinct ? '†' : ''}${n.zh}` : '';
  const label = [zh, n.latin].filter(Boolean).join(' ');
  if (!label) return { text: '', plain: '', width: 0 };
  let width = 0;
  const text = label.split(' ').map((tok) => {
    const latin = /^[A-Za-z][A-Za-z'’.-]*$/.test(tok);
    width += /[\u2E80-\u9FFF\uF900-\uFAFF]/.test(tok) ? tok.length * 1.0 : tok.length * 0.58;
    return `<tspan font-family="${esc(latin ? latinStack : fontStack)}" font-style="${latin ? 'italic' : 'normal'}">${esc(tok)}</tspan>`;
  }).join(' ');
  const extinctMark = n.extinct && !zh.startsWith('†')
    ? '<tspan fill="#176a8b" font-weight="700">†</tspan>' : '';
  return { text: extinctMark + text, plain: label, width };
}

/** 兼容旧 opts（width/rowHeight/mono/ticks/grid/axis/bands/scale）。 */
function resolveStyle(opts) {
  if (opts.style) return opts.style;
  const raw = { ...opts };
  if (opts.width != null && opts.图宽 == null) raw.图宽 = opts.width;
  if (opts.rowHeight != null && opts.行高 == null) raw.行高 = opts.rowHeight;
  if (opts.ticks != null && opts.刻度 == null) raw.刻度 = opts.ticks;
  if (opts.mono != null && opts.配色 == null) raw.配色 = opts.mono ? '单色' : '分支';
  if (opts.grid != null && opts.网格 == null) raw.网格 = opts.grid ? '开' : '关';
  if (opts.axis != null && opts.轴 == null) raw.轴 = opts.axis ? '开' : '关';
  if (opts.bands != null && opts.年代带 == null) raw.年代带 = opts.bands ? '开' : '关';
  if (opts.scale != null && opts.比例 == null) raw.比例 = opts.scale === 'sqrt' ? '根号' : '线性';
  return normalizeChronoStyle(raw);
}

/** @returns {{svg:string, diags:Array, width:number, height:number, leafCount:number}} */
export function renderChrono(tree, opts = {}) {
  const s = resolveStyle(opts);
  const diags = [];
  const inheritWarns = new Set();
  const all = [];
  let maxTime = 0;

  function walk(n, parent, parentTime, inherited, branchColor) {
    const branchBase = branchColor
      ? { ...inherited, lineColor: branchColor, textColor: branchColor, bandColor: branchColor }
      : inherited;
    const st = localStyle(n.attrs, branchBase);
    const t = temporalInfo(n.attrs);
    if (t.invalid) {
      diags.push({ line: n.line, level: 'warn', message: `第 ${n.line} 行的生存参数 "${t.raw}" 无法识别，已忽略` });
    } else if (t.raw != null && t.range == null && t.point == null) {
      diags.push({ line: n.line, level: 'warn', message: `第 ${n.line} 行的生存参数 "${t.raw}" 不是「老端-新端」，已忽略` });
    }
    const leaf = !(n.children || []).length;
    let time = t.evidence;
    if (time == null && !leaf) time = estimateDivergence(n);
    // 叶节点没给时间 = 年代未知，不继承父节点（语义上叶没有「分化」）；
    // 内节点没给时间才按父节点兜底，并告警。
    if (time == null) {
      if (leaf) {
        time = parentTime ?? 0;
        if (t.raw == null) inheritWarns.add(n.line);
      } else {
        time = parentTime ?? 0;
        inheritWarns.add(n.line);
      }
    }
    if (parentTime != null && time > parentTime) {
      diags.push({ line: n.line, level: 'warn', message: `第 ${n.line} 行的时间早于父节点，已夹回父节点时间` });
      time = parentTime;
    }
    const d = {
      source: n, parent, children: [], style: st, time,
      range: t.range ? { ...t.range } : null,
      point: t.point,
      ownEvidence: t.evidence,
      leaf,
      extant: n.kind === 'taxon' && !n.extinct,
      depth: parent ? parent.depth + 1 : 0,
      y: 0, first: 0, last: 0,
    };
    if (d.point != null) d.point = Math.min(d.point, time);
    if (d.range) {
      d.range.older = Math.min(d.range.older, time);
      d.range.younger = Math.min(d.range.younger, d.range.older);
    }
    all.push(d);
    maxTime = Math.max(maxTime, time, d.point ?? 0, d.range?.older ?? 0, d.range?.younger ?? 0);
    // 分支配色：只看顶级分支，整支继承同一个颜色
    (n.children || []).forEach((c, i) => {
      let color = null;
      if (s.配色 === '分支' && !parent) color = s.色环[i % s.色环.length];
      d.children.push(walk(c, d, time, st, color));
    });
    return d;
  }

  const root = tree ? walk(tree, null, null, baseStyleState(s), null) : null;
  for (const line of inheritWarns) {
    diags.push({ line, level: 'warn', message: `第 ${line} 行没写时间（分化/生存），按父节点时间画` });
  }
  if (!root) return { svg: '', diags, width: s.图宽, height: 0, leafCount: 0 };

  // ── 行分配：**每个会显示名字的节点各占一行**（内节点也算）。
  //    内节点若落在首尾孩子中线上，单子链就会和自己的子节点同 y，名字直接叠成一团 ——
  //    这张图每条命名支都要可读，所以宁可多占行。匿名 `/` 与 内标签=关 不占行，走中线。
  const leafCount = all.filter((d) => d.leaf).length;
  let rowCount = 0;
  function layout(n) {
    const labeled = n.style.labelMode !== '隐藏'
      && n.source.kind !== 'diverge'
      && (n.leaf || s.内标签);
    n.ownRow = labeled;
    if (labeled) {
      n.y = TOP_PAD + rowCount * s.行高 + s.行高 / 2;
      rowCount += 1;
    }
    for (const c of n.children) layout(c);
    if (!labeled) {
      n.y = n.children.length
        ? (n.children[0].y + n.children[n.children.length - 1].y) / 2
        : TOP_PAD + s.行高 / 2;
    }
  }
  layout(root);

  const olderMya = opts.olderMya ?? Math.max(s.刻度, Math.ceil(maxTime / s.刻度) * s.刻度);
  const youngerMya = opts.youngerMya ?? 0;
  const span = olderMya - youngerMya;
  if (!(span > 0)) return { svg: '', diags: [...diags, { level: 'warn', message: '时间窗无效' }], width: 0, height: 0, leafCount };

  // 右侧按标签宽度预留（叶标签可能跟在末端），最宽不超过画布宽度的一半
  let maxLabel = 0;
  for (const d of all) {
    if (!d.leaf || d.style.labelMode !== '末端') continue;
    const zh = d.source.zh || '';
    const latin = d.source.latin || '';
    maxLabel = Math.max(maxLabel, zh.length * d.style.fontSize + latin.length * d.style.fontSize * 0.58 + 26);
  }
  const labelReserve = clamp(maxLabel + 26, 120, Math.round(s.图宽 * 0.42));
  const width = s.图宽;
  const plotLeft = PLOT_LEFT;
  const plotRight = Math.max(plotLeft + 240, width - labelReserve);
  const plotWidth = plotRight - plotLeft;
  const x = (t) => (s.比例 === '根号'
    ? plotLeft + (1 - Math.sqrt(clamp(t, youngerMya, olderMya) / olderMya)) * plotWidth
    : plotLeft + ((olderMya - clamp(t, youngerMya, olderMya)) / span) * plotWidth);
  const plotBottom = TOP_PAD + rowCount * s.行高 + 6;
  const bottomSpace = s.年代带 ? 84 : (s.轴 ? 52 : 20);
  const height = plotBottom + bottomSpace;

  const layers = { back: [], lines: [], bands: [], markers: [], labels: [], axis: [] };
  if (s.背景 !== 'transparent') {
    layers.back.push(`<rect x="0" y="0" width="${width}" height="${height}" fill="${s.背景}"/>`);
  }
  if (s.网格) {
    for (let t = s.刻度; t < olderMya; t += s.刻度) {
      const gx = x(t);
      layers.back.push(`<line x1="${gx.toFixed(1)}" y1="${(TOP_PAD - 10).toFixed(1)}" x2="${gx.toFixed(1)}" y2="${plotBottom.toFixed(1)}" stroke="${s.网格色}" stroke-width="1" stroke-dasharray="3 4"/>`);
    }
  }

  /** 分支在 y 上从哪画到哪。 */
  function branchSpan(n) {
    const startT = n.parent ? n.parent.time : n.time;
    let endT;
    if (!n.leaf) endT = n.time;
    else if (n.extant) endT = youngerMya;
    else if (n.range) endT = n.range.older;
    else if (n.point != null) endT = n.point;
    else endT = youngerMya; // 化石叶年代未知：线延伸到右缘，不加端点（不是现存）
    return { startT, endT };
  }

  for (const n of all) {
    const st = n.style;
    const y = n.y;
    const nx = x(n.time);
    if (n.parent) {
      const { startT, endT } = branchSpan(n);
      const px = x(startT);
      const ex = x(endT);
      // 化石叶没给年代 → 线细一档，暗示「范围未知」
      const unknownRange = n.leaf && !n.extant && n.range == null && n.point == null;
      const w = unknownRange ? Math.max(0.6, st.lineWidth * 0.55) : st.lineWidth;
      const line = (x1, y1, x2, y2) => `x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${st.lineColor}" stroke-width="${w}" stroke-linecap="round"`;
      if (s.线型 === '斜线') {
        // 斜线：从父节点落点直接拉到本节点落点
        if (nx > px + 0.2) layers.lines.push(`<line ${line(px, n.parent.y, nx, y)}/>`);
        // 叶子在自身落点之后还要延伸到末端（区间/单值/现存）
        if (n.leaf && ex > nx + 0.2) layers.lines.push(`<line ${line(nx, y, ex, y)}/>`);
      } else if (ex > px + 0.2) {
        layers.lines.push(`<line ${line(px, y, ex, y)}/>`);
      }
    }
    if (s.线型 === '直角' && !n.leaf && n.children.length) {
      // 竖脊从本节点自己那一行（有名字就占行）拉到最后一个孩子；
      // 不占行的匿名节点从第一个孩子起画。
      const top = n.ownRow ? n.y : n.children[0].y;
      const bottom = n.children[n.children.length - 1].y;
      if (bottom > top + 0.2) {
        layers.lines.push(`<line x1="${nx.toFixed(1)}" y1="${top.toFixed(1)}" x2="${nx.toFixed(1)}" y2="${bottom.toFixed(1)}" stroke="${st.lineColor}" stroke-width="${s.分叉宽}"/>`);
      }
    }

    // 化石生存条（画在分支 y 上，盖住横枝，参考图的棕色条）
    if (n.leaf && n.range && st.bandType !== '无') {
      const bx = x(n.range.older);
      const ex = x(n.range.younger);
      const bw = Math.max(0, ex - bx);
      if (bw > 0.4) {
        if (st.bandType === '细线') {
          layers.bands.push(`<line x1="${bx.toFixed(1)}" y1="${y.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${st.bandColor}" stroke-width="${Math.max(1, Math.min(3, st.bandHeight))}"/>`);
        } else {
          const rx = s.条端 === '圆角' ? st.bandHeight / 2 : 0;
          layers.bands.push(`<rect x="${bx.toFixed(1)}" y="${(y - st.bandHeight / 2).toFixed(1)}" width="${bw.toFixed(1)}" height="${st.bandHeight}" rx="${rx}" fill="${st.bandColor}"/>`);
        }
      }
    }

    const pointFill = st.pointColor === '跟随' ? st.lineColor : st.pointColor;
    if (n.leaf && n.point != null) layers.markers.push(marker(st.pointShape, x(n.point), y, st.pointRadius, pointFill));
    if (n.leaf && n.extant) layers.markers.push(marker(s.现存点, x(youngerMya), y, st.pointRadius + 0.5, pointFill));
    if (!n.leaf && n.ownEvidence != null) layers.markers.push(marker(st.innerPoint, nx, y, st.pointRadius, pointFill));

    if (n.source.kind === 'diverge' || st.labelMode === '隐藏') continue;
    const { text, plain, width: labelW } = labelTspans(n.source, s.字体, s.拉丁字体);
    if (!plain) continue;
    const weight = n.leaf ? st.fontWeight : (n.parent ? 600 : 700);
    const size = n.leaf ? st.fontSize : st.fontSize + (n.parent ? 0 : 1);
    let age = '';
    if (n.leaf && s.标签年龄 && (n.range || n.point != null)) {
      const value = n.range ? `${n.range.older}–${n.range.younger}` : String(n.point);
      age = `<tspan font-size="${Math.max(9, st.fontSize - 3)}" fill="${s.轴色}"> ${esc(value)}</tspan>`;
    }
    const estW = labelW * (size / 13);

    if (!n.leaf) {
      if (!s.内标签) continue;
      // 内节点：名字在自己脊线右侧、与自己那一行垂直居中（白描边保证压线可读）
      layers.labels.push(`<text x="${(nx + 6).toFixed(1)}" y="${(y + size * 0.34).toFixed(1)}" font-size="${size}" font-weight="${weight}" fill="${st.textColor}" font-family="${esc(s.字体)}" stroke="#ffffff" stroke-width="3" stroke-linejoin="round" paint-order="stroke">${text}</text>`);
      continue;
    }

    // 叶节点三种摆法
    let lx;
    let ly = y - 6;
    if (st.labelMode === '右对齐') {
      lx = plotRight + LABEL_PAD;
      ly = y + size * 0.34;
    } else if (st.labelMode === '末端') {
      lx = x(branchSpan(n).endT) + LABEL_PAD;
      ly = y + size * 0.34;
      if (lx + estW > width - 6) lx = Math.max(plotRight + LABEL_PAD, width - 6 - estW);
    } else {
      // 跟随：压在自己分支上方靠左（参考图形态）
      const startT = n.parent ? n.parent.time : n.time;
      lx = x(startT) + 6;
      if (lx + estW > width - 6) lx = Math.max(plotLeft, width - 6 - estW);
    }
    layers.labels.push(`<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="${size}" font-weight="${weight}" fill="${st.textColor}" font-family="${esc(s.字体)}">${text}${age}</text>`);
  }

  if (s.轴 || s.年代带) {
    const axisY = plotBottom + (s.年代带 ? 18 : 12);
    if (s.年代带) {
      const bandH = 26;
      for (const b of clipGeoBands(olderMya, youngerMya)) {
        const bx = x(b.startMya);
        const ex = x(b.endMya);
        const bw = ex - bx;
        if (bw <= 0.4) continue;
        layers.axis.push(`<rect x="${bx.toFixed(1)}" y="${axisY}" width="${bw.toFixed(1)}" height="${bandH}" fill="${b.color}" stroke="${s.轴色}" stroke-width="0.6"/>`);
        if (bw >= 34) {
          layers.axis.push(`<text x="${(bx + bw / 2).toFixed(1)}" y="${(axisY + 17).toFixed(1)}" text-anchor="middle" font-size="11" font-family="${esc(s.字体)}" fill="#2c2c2a">${esc(b.name)}</text>`);
        }
      }
    } else {
      layers.axis.push(`<line x1="${plotLeft}" y1="${axisY}" x2="${plotRight}" y2="${axisY}" stroke="${s.轴色}" stroke-width="1"/>`);
    }
    const labelY = axisY + (s.年代带 ? 44 : 22);
    for (let t = 0; t <= olderMya; t += s.刻度) {
      const tx = x(t);
      if (!s.年代带) {
        layers.axis.push(`<line x1="${tx.toFixed(1)}" y1="${axisY - 3}" x2="${tx.toFixed(1)}" y2="${axisY + 3}" stroke="${s.轴色}" stroke-width="1"/>`);
      }
      layers.axis.push(`<text x="${tx.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" font-size="10.5" font-family="${esc(s.字体)}" fill="${s.轴色}">${t}</text>`);
    }
    layers.axis.push(`<text x="${(plotRight + 8).toFixed(1)}" y="${labelY.toFixed(1)}" font-size="10.5" font-family="${esc(s.字体)}" fill="${s.轴色}">Ma</text>`);
  }

  const svg = `<svg viewBox="0 0 ${width} ${height}" width="100%" class="life-tree-chrono" xmlns="http://www.w3.org/2000/svg" role="img"><title>生命时序图</title>${layers.back.join('')}${layers.lines.join('')}${layers.bands.join('')}${layers.markers.join('')}${layers.labels.join('')}${layers.axis.join('')}</svg>`;
  return { svg, diags, width, height, leafCount };
}
