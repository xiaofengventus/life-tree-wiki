// 地质年代轴数据（唯一一份，客户端时序图 / 服务端渲染共用 —— 纯数据，零依赖）。
//
// ── 形态沿用既有约定
//   Android 引擎（ls-program.js 的 `geo` 操作）吃的库包字段就是
//   `{ name, startMya, endMya }`（startMya = 老端/更古老，endMya = 新端/距今更近）；
//   xmind 特色版的 timeBands 再多一个 `color`。这里合并两者：
//   `{ name, en, startMya, endMya, color }`，startMya > endMya，单位百万年前（Ma）。
//
// ── 数值口径：ICS《国际年代地层表》（v2023/09），四舍五入到 0.1 Ma。
//   显生宙各纪用 ICS 官方配色；前寒武的宇/宙只给到"代"级（够 541 Ma 以前的树用）。

export const GEO_TIMES = [
  // 新生代
  { name: '第四纪', en: 'Quaternary', startMya: 2.58, endMya: 0, color: '#f9f97f' },
  { name: '新近纪', en: 'Neogene', startMya: 23.03, endMya: 2.58, color: '#ffe619' },
  { name: '古近纪', en: 'Paleogene', startMya: 66, endMya: 23.03, color: '#fd9a52' },
  // 中生代
  { name: '白垩纪', en: 'Cretaceous', startMya: 145, endMya: 66, color: '#86c5a5' },
  { name: '侏罗纪', en: 'Jurassic', startMya: 201.4, endMya: 145, color: '#34b2c9' },
  { name: '三叠纪', en: 'Triassic', startMya: 251.9, endMya: 201.4, color: '#f2404d' },
  // 古生代
  { name: '二叠纪', en: 'Permian', startMya: 298.9, endMya: 251.9, color: '#f04028' },
  { name: '石炭纪', en: 'Carboniferous', startMya: 358.9, endMya: 298.9, color: '#67c183' },
  { name: '泥盆纪', en: 'Devonian', startMya: 419.2, endMya: 358.9, color: '#cb8c37' },
  { name: '志留纪', en: 'Silurian', startMya: 443.8, endMya: 419.2, color: '#b3e4b7' },
  { name: '奥陶纪', en: 'Ordovician', startMya: 485.4, endMya: 443.8, color: '#009270' },
  { name: '寒武纪', en: 'Cambrian', startMya: 538.8, endMya: 485.4, color: '#7fa056' },
  // 前寒武（代级，画深时间范围的树用）
  { name: '埃迪卡拉纪', en: 'Ediacaran', startMya: 635, endMya: 538.8, color: '#f9b2a5' },
  { name: '成冰纪', en: 'Cryogenian', startMya: 720, endMya: 635, color: '#dcf0f4' },
  { name: '新元古代', en: 'Neoproterozoic', startMya: 1000, endMya: 720, color: '#feda96' },
  { name: '中元古代', en: 'Mesoproterozoic', startMya: 1600, endMya: 1000, color: '#b6e2f2' },
  { name: '古元古代', en: 'Paleoproterozoic', startMya: 2500, endMya: 1600, color: '#fcf6a7' },
  { name: '太古宙', en: 'Archean', startMya: 4000, endMya: 2500, color: '#f0047f' },
  { name: '冥古宙', en: 'Hadean', startMya: 4600, endMya: 4000, color: '#ae0000' },
]

/**
 * 取画某个时间窗（olderMya ≥ youngerMya，单位 Ma）要画的年代带。
 * 与窗口相交的条目被裁剪到窗口内，按老 → 新排序。窗口外的条目不返回。
 */
export function clipGeoBands(olderMya, youngerMya, times = GEO_TIMES) {
  const out = []
  for (const t of times) {
    const a = Math.min(t.startMya, olderMya)
    const b = Math.max(t.endMya, youngerMya)
    if (a <= b) continue // 完全在窗口外（裁完没有宽度）
    out.push({ ...t, startMya: a, endMya: b })
  }
  return out.sort((p, q) => q.startMya - p.startMya)
}
