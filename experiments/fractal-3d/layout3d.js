/**
 * 分形漫游树 · 3D 球面布局（版本 B 的算法内核）
 *
 * 纯函数，不依赖 three / 浏览器，可直接用 node --test 跑。
 * 对输入树不做任何假设 —— 任意形状的树都能吃进来（见 normalizeTree）。
 *
 * 目标：把一棵树映射成一朵「自相似的球状分形」——
 * 从任意深度放大进去，看到的结构形态都一样，这样缩放才是"无限"的。
 *
 * 三条规则：
 *
 * 1) 半径几何增长  r(d) = radiusBase * growth^d
 *    这是自相似的充要条件：每往下一层，所有长度都乘 growth，
 *    所以"放大 growth 倍"后画面与上一层完全一致。
 *
 * 2) 方向按「球冠」逐层铺开
 *    每个节点持有一个方向 dir 和一个锥半角 spread ——
 *    含义是「该节点的整棵子树都被约束在这个锥里」。
 *    子节点方向在父锥内按面积均匀排开（黄金角错开，避免相邻打架）。
 *
 * 3) 角度空间按「等立体角」分给子节点  cos(α_i) = 1 - w_i * (1 - cos α_p)
 *    w 是子节点的叶子数占比。球冠面积 ∝ 1-cos α，所以这条保证
 *    Σ 子立体角 = 父立体角：权重大的分支自动拿到更大的展开空间。
 *
 * 4) 子锥必须被父锥包含  β_i + α_i ≤ α_p
 *    缺了这条，误差会逐层累积，最终把枝甩到锥外面去
 *    （实测会在半球模式下把节点甩到 y = -3671，整棵树沉到海面以下）。
 *
 * 这四条合起来，就是 2D 版「角度按叶子数加权」在球面上的正确推广。
 */

export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈ 2.399963

export const DEFAULT_OPTIONS_3D = {
  /** 根节点半径 */
  radiusBase: 1,
  /** 每层半径倍率，自相似的关键参数，> 1 */
  radiusGrowth: 1.08,
  /** 根节点大小（世界单位） */
  nodeBase: 0.02,
  /** 节点大小的每层倍率，通常 = radiusGrowth 才自相似 */
  nodeSizeGrowth: 1.08,
  /**
   * 深度指数，用来拧"自相似强度"：
   *   1   = 严格几何 r ∝ K^d，放大 K 倍后画面完全一致（真·无限缩放）
   *   0.7 = 半径按 K^(d^0.7) 走，深层被压紧，整棵树更饱满
   * 跨度越大的树（比如 107 层）越需要这个旋钮 —— 纯几何下最深一层
   * 的半径是根部的几千倍，看全树时内部会糊成一团。
   */
  depthExponent: 1,
  /** 根的锥半角：π = 整球辐射，π/2 ≈ 半球（"长在地面上"） */
  rootSpread: Math.PI / 2,
  /** 根的生长方向 */
  rootDir: [0, 1, 0],
  /** 锥半角下限，防止深层塌成一条直线 */
  minSpread: 0.0015,
  /** 只展开到第几层（Infinity = 全部），用于 LOD */
  maxDepth: Infinity,
  /** 节点数上限，超出按深度优先截断 */
  nodeLimit: Infinity,
  /** 折叠的节点 uid 集合（Set / 数组 / 任何可迭代物）；折叠节点的子树不展开 */
  collapsedIds: null,
};

// ---------------------------------------------------------------- 向量工具

function normalize3(v) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

function cross3(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot3(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * 把方向投影到「以 axis 为轴、半角 maxAngle」的锥面之内。
 *
 * 递归铺开角度时，子锥难免会慢慢超出根锥（尤其权重极不均的树），
 * 误差攒够了几十层就会把枝条甩到锥外面去。与其层层设限把角度空间
 * 压扁（那样所有枝都会挤在轴附近），不如放开铺、最后统一投影回来 ——
 * 这样既保住了角度的均匀分布，也不会让树长到"地面以下"。
 *
 * maxAngle ≥ π 时是恒等变换（全球模式不受影响）。
 */
export function clampToCone(dir, axis, maxAngle) {
  const cosMax = Math.cos(maxAngle);
  const cos = dot3(dir, axis);
  if (cos >= cosMax) return dir;

  const parallel = [axis[0] * cos, axis[1] * cos, axis[2] * cos];
  const perp = [dir[0] - parallel[0], dir[1] - parallel[1], dir[2] - parallel[2]];
  const perpLen = Math.hypot(perp[0], perp[1], perp[2]);
  if (perpLen < 1e-9) return axis; // 与轴反向，任意方向投影都退化成轴本身

  const sinMax = Math.sin(maxAngle);
  return normalize3([
    axis[0] * cosMax + (perp[0] / perpLen) * sinMax,
    axis[1] * cosMax + (perp[1] / perpLen) * sinMax,
    axis[2] * cosMax + (perp[2] / perpLen) * sinMax,
  ]);
}

/**
 * 给方向向量配一对正交基 (u, v)，使 (u, v, dir) 成右手系。
 * 取 dir 的绝对值最小的分量做参考轴，避免与 dir 平行导致退化。
 */
export function orthoBasis(dir) {
  const [x, y, z] = dir.map(Math.abs);
  let ref;
  if (x <= y && x <= z) ref = [1, 0, 0];
  else if (y <= z) ref = [0, 1, 0];
  else ref = [0, 0, 1];
  const u = normalize3(cross3(dir, ref));
  const v = cross3(dir, u);
  return [u, v];
}

// ---------------------------------------------------------------- 规范化

const TEXT_KEYS = ["text", "label", "name", "title", "topic"];
const IMAGE_KEYS = ["image", "imageUrl", "img", "src"];

function pickString(source, keys) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

/**
 * 把任意形状的树规范成统一结构，让布局层不必再关心输入细节：
 *
 *   输入可以是
 *     - 平台的 { data: { uid, text, image }, children: [] }
 *     - 简化的 { text / label / name, children: [] }
 *     - 缺 uid、缺 text、children 不是数组、甚至重复引用
 *
 *   输出统一为 { uid, text, image, children: [...] }
 *
 * - uid 缺失时按路径生成（"0/2/1"），保证同一棵树每次跑结果一致，折叠功能才可用
 * - 用 WeakSet 记录访问过的对象，脏数据里的环会被切断，不会把页面挂死
 * - nodeLimit 兜底，防止有人拖进来一个几百万节点的文件
 */
export function normalizeTree(root, { nodeLimit = 50000 } = {}) {
  if (!root || typeof root !== "object") return null;

  const seen = new WeakSet();
  let autoId = 0;
  let count = 0;
  let truncated = false;

  function walk(node, path) {
    if (!node || typeof node !== "object") return null;
    if (seen.has(node)) return null; // 环 / 重复引用
    if (count >= nodeLimit) { truncated = true; return null; }
    seen.add(node);
    count += 1;

    const data = node.data && typeof node.data === "object" ? node.data : node;
    const rawChildren = Array.isArray(node.children) ? node.children : [];

    const uid = String(
      data.uid || node.uid || data.id || node.id || path || `n${autoId++}`,
    );

    const out = {
      uid,
      text: pickString(data, TEXT_KEYS) || pickString(node, TEXT_KEYS),
      image: pickString(data, IMAGE_KEYS) || pickString(node, IMAGE_KEYS) || null,
      children: [],
    };
    out.children = rawChildren
      .map((child, i) => walk(child, `${uid}/${i}`))
      .filter(Boolean);
    return out;
  }

  const result = walk(root, "0");
  if (result) result.__truncated = truncated;
  return result;
}

// ---------------------------------------------------------------- 叶子数

/**
 * 计算每个节点的「可见叶子数」。
 * 折叠节点的子树不展开，所以它自己算 1 个叶子 —— 这正是折叠能
 * "免费"重排角度的原因：省下的角度会自动按新权重分给兄弟。
 */
export function computeLeafCounts(root, collapsedIds) {
  const collapsed = toSet(collapsedIds);
  const memo = new Map();

  function walk(node) {
    if (!node) return 0;
    if (memo.has(node)) return memo.get(node);
    memo.set(node, 1); // 占位，防环时兜底
    const isCollapsed = collapsed ? collapsed.has(node.uid) : false;
    const children = isCollapsed ? [] : node.children;
    const value = children.length
      ? children.reduce((sum, child) => sum + walk(child), 0)
      : 1;
    memo.set(node, value);
    return value;
  }

  walk(root);
  return memo;
}

function toSet(ids) {
  if (!ids) return null;
  if (ids instanceof Set) return ids;
  return new Set(Array.from(ids, (x) => String(x)));
}

// ---------------------------------------------------------------- 主布局

/**
 * @param {object} root  任意形状的树根
 * @param {object} [options] 见 DEFAULT_OPTIONS_3D
 * @returns {{ nodes: object[], segments: number[][], meta: object }}
 */
export function layoutFractalTree3D(root, options = {}) {
  const opts = { ...DEFAULT_OPTIONS_3D, ...options };
  const tree = opts.normalize === false ? root : normalizeTree(root, opts);
  if (!tree) return emptyResult();

  const collapsed = toSet(opts.collapsedIds);
  const leafCounts = computeLeafCounts(tree, collapsed);

  const nodes = [];
  const segments = [];
  let truncated = Boolean(tree.__truncated);
  let maxReachedDepth = 0;
  let rootAxis = [0, 1, 0];

  function visibleChildren(node, depth) {
    if (collapsed && collapsed.has(node.uid)) return [];
    if (depth >= opts.maxDepth) {
      if (node.children.length) truncated = true;
      return [];
    }
    return node.children;
  }

  function walk(node, parentIndex, depth, dir, spread) {
    if (nodes.length >= opts.nodeLimit) { truncated = true; return; }

    const depthPower = Math.pow(depth, opts.depthExponent);
    const r = opts.radiusBase * Math.pow(opts.radiusGrowth, depthPower);
    const index = nodes.length;
    const children = visibleChildren(node, depth);

    nodes.push({
      index,
      uid: node.uid,
      text: node.text,
      image: node.image,
      depth,
      x: dir[0] * r,
      y: dir[1] * r,
      z: dir[2] * r,
      dir,
      size: opts.nodeBase * Math.pow(opts.nodeSizeGrowth, depthPower),
      spread,
      leafCount: leafCounts.get(node) || 1,
      isLeaf: children.length === 0,
      hasChildren: node.children.length > 0,
      collapsed: Boolean(collapsed && collapsed.has(node.uid)),
      parentIndex,
    });
    if (parentIndex >= 0) segments.push([parentIndex, index]);
    if (depth > maxReachedDepth) maxReachedDepth = depth;

    if (!children.length) return;

    // 单子节点：方向与锥角原样下传，树自然"直着长"，不被无谓地拐弯收窄
    if (children.length === 1) {
      walk(children[0], index, depth + 1, dir, spread);
      return;
    }

    // 按叶子数降序排：方向是"按序号均匀铺开"的，谁排前面谁就更靠近锥轴。
    // 让最大的分支居中，才不会被挤到锥边、连着几十层后代一起贴着地走。
    // Array.sort 是稳定的，叶子数相同的分支保持作者原本的顺序，结果可复现。
    const ordered = [...children].sort(
      (a, b) => (leafCounts.get(b) || 1) - (leafCounts.get(a) || 1),
    );

    const totalLeaf = ordered.reduce((sum, c) => sum + (leafCounts.get(c) || 1), 0);
    const [u, v] = orthoBasis(dir);
    const cosSpread = Math.cos(spread);

    for (let i = 0; i < ordered.length; i += 1) {
      const child = ordered[i];
      const w = (leafCounts.get(child) || 1) / totalLeaf;

      // 锥角：等立体角分割，Σ 子立体角 = 父立体角
      const cosChild = 1 - w * (1 - cosSpread);
      const childSpread = Math.max(
        opts.minSpread,
        Math.acos(Math.min(1, Math.max(-1, cosChild))),
      );

      // 方向：能偏多远，取决于「当前方向离根锥边界还剩多少」，再扣掉自己
      // 要占掉的锥半径。这样保证子锥始终落在根锥内，不需要任何事后夹紧。
      //
      // 为什么不用父锥来约束：权重极不均的树里，最大分支的锥角能吃掉父锥的
      // 绝大部分（这棵树里真核占 83%，锥角 80°），父锥余量瞬间见底，
      // 其余分支全被压到轴上 —— 表现出来就是"一大坨全堆在顶上"。
      // 换成根锥余量后，每个节点无论多深都还剩它该有的那份角度空间。
      const angleToRoot = Math.acos(Math.min(1, Math.max(-1, dot3(dir, rootAxis))));
      const betaMax = Math.max(0, opts.rootSpread - angleToRoot - childSpread);
      const areaT = (i + 0.5) / ordered.length;
      const beta = betaMax * Math.sqrt(areaT);
      const theta = i * GOLDEN_ANGLE;

      const sb = Math.sin(beta);
      const cb = Math.cos(beta);
      const ct = Math.cos(theta);
      const st = Math.sin(theta);
      const childDir = clampToCone(
        normalize3([
          dir[0] * cb + (u[0] * ct + v[0] * st) * sb,
          dir[1] * cb + (u[1] * ct + v[1] * st) * sb,
          dir[2] * cb + (u[2] * ct + v[2] * st) * sb,
        ]),
        rootAxis,
        opts.rootSpread,
      );

      walk(child, index, depth + 1, childDir, childSpread);
    }
  }

  rootAxis = normalize3(opts.rootDir);
  walk(tree, -1, 0, rootAxis, opts.rootSpread);

  return {
    nodes,
    segments,
    meta: {
      count: nodes.length,
      segmentCount: segments.length,
      maxDepth: maxReachedDepth,
      totalLeaves: leafCounts.get(tree) || 0,
      truncated,
      /** 最大的节点半径，用来定相机远近与场景层尺寸 */
      maxRadius: nodes.reduce((m, n) => Math.max(m, Math.hypot(n.x, n.y, n.z)), 0),
    },
  };
}

function emptyResult() {
  return {
    nodes: [],
    segments: [],
    meta: { count: 0, segmentCount: 0, maxDepth: 0, totalLeaves: 0, truncated: false, maxRadius: 0 },
  };
}

// ---------------------------------------------------------------- 折叠辅助

/** 取某个节点（含全部后代）的 uid 列表，用于折叠时清理子孙标记 */
export function descendantUids(root, uid) {
  const tree = normalizeTree(root);
  if (!tree) return [];
  const target = findNode(tree, String(uid));
  if (!target) return [];
  const out = [];
  const stack = [...target.children];
  while (stack.length) {
    const node = stack.pop();
    out.push(node.uid);
    stack.push(...node.children);
  }
  return out;
}

/** 按 uid 找规范树里的节点 */
export function findNode(tree, uid) {
  const stack = [tree];
  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;
    if (node.uid === uid) return node;
    stack.push(...node.children);
  }
  return null;
}

/**
 * 切换某个节点的折叠状态，返回新的 Set（不修改入参），便于 Vue 响应式更新。
 * 折叠时会顺带清掉后代里的折叠标记，避免"解开父节点后子孙仍关着"的困惑。
 */
export function toggleCollapsed(collapsedIds, uid, descendantList = []) {
  const next = new Set(toSet(collapsedIds) || []);
  const key = String(uid);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
    for (const d of descendantList) next.delete(String(d));
  }
  return next;
}

/** 布局结果里某节点的祖先链（根 → 目标），用于面包屑与"飞入" */
export function ancestorChain(nodes, index) {
  const chain = [];
  let cur = index;
  let guard = 0;
  while (cur >= 0 && cur < nodes.length && guard < 1e6) {
    chain.push(cur);
    cur = nodes[cur].parentIndex;
    guard += 1;
  }
  return chain.reverse();
}
