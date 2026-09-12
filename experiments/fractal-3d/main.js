/**
 * 分形漫游树 · 3D 实验页（版本 B）
 *
 * 用真实数据（T000021，2363 节点 / 1457 叶 / 最深 107 层）验证球面分形布局的观感。
 * 纯本地实验，不接入正式页面、不路由、不碰数据库。
 *
 * 跑法：npx vite --port 5199   然后打开 /experiments/fractal-3d/
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { layoutFractalTree3D, normalizeTree } from "./layout3d.js";

const $ = (id) => document.getElementById(id);

// ------------------------------------------------------------------ 视觉常量
const SKY_TOP = new THREE.Color("#060a16");
const SKY_HORIZON = new THREE.Color("#4a7396");
const SEA_NEAR = new THREE.Color("#0e2237");
const SEA_FAR = new THREE.Color("#4a7396");
const SEA_RADIUS = 26000;
const SKY_RADIUS = 90000;

// ------------------------------------------------------------------ 渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
// 不开 tone mapping：ACES 会把高饱和的色相洗成脏粉，分形树靠色相区分层次，洗不起
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.02, 900000);
camera.position.set(0, 900, 2600);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.rotateSpeed = 0.85;
controls.zoomSpeed = 1.0;
controls.minDistance = 0.02;
controls.maxDistance = 200000;
controls.autoRotateSpeed = 0.35;

// ------------------------------------------------------------------ 光照
// 光压刻意压低：分形树靠色相区分层次，光一强所有颜色都往白里跑
scene.add(new THREE.HemisphereLight(0xa8c8ff, 0x141d2a, 0.62));
const sun = new THREE.DirectionalLight(0xfff4e2, 0.78);
sun.position.set(1, 1.7, 0.9);
scene.add(sun);
const rim = new THREE.DirectionalLight(0x6f9be0, 0.34);
rim.position.set(-1.2, 0.4, -0.8);
scene.add(rim);

// ------------------------------------------------------------------ 场景层（海与天）
const sceneGroup = new THREE.Group();
scene.add(sceneGroup);

const gradientVert = `varying vec3 vP; void main(){ vP = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const sky = new THREE.Mesh(
  new THREE.SphereGeometry(SKY_RADIUS, 32, 20),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { top: { value: SKY_TOP }, horizon: { value: SKY_HORIZON } },
    vertexShader: gradientVert,
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; varying vec3 vP;
      void main(){
        float h = normalize(vP).y;
        vec3 c = mix(horizon, top, smoothstep(-0.02, 0.6, h));
        gl_FragColor = vec4(c, 1.0);
      }`,
  }),
);
sceneGroup.add(sky);

const sea = new THREE.Mesh(
  new THREE.PlaneGeometry(SEA_RADIUS * 4, SEA_RADIUS * 4, 1, 1),
  new THREE.ShaderMaterial({
    uniforms: { cNear: { value: SEA_NEAR }, cFar: { value: SEA_FAR } },
    vertexShader: gradientVert,
    fragmentShader: `uniform vec3 cNear; uniform vec3 cFar; varying vec3 vP;
      void main(){
        float d = clamp(length(vP.xy) / 22000.0, 0.0, 1.0);
        vec3 c = mix(cNear, cFar, smoothstep(0.05, 1.0, d));
        gl_FragColor = vec4(c, 1.0);
      }`,
  }),
);
sea.rotation.x = -Math.PI / 2;
sceneGroup.add(sea);

// 星星（固定屏幕像素尺寸，随便缩放都不会忽大忽小）
const starCount = 900;
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i += 1) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(1 - Math.random() * 0.9);
  const r = SKY_RADIUS * 0.97;
  starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  starPos[i * 3 + 1] = r * Math.cos(phi);
  starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
const stars = new THREE.Points(
  starGeo,
  new THREE.PointsMaterial({ color: 0xbcd2f2, size: 1.5, sizeAttenuation: false, transparent: true, opacity: 0.75 }),
);
sceneGroup.add(stars);

// ------------------------------------------------------------------ 树
const treeGroup = new THREE.Group();
scene.add(treeGroup);

let normalizedRoot = null;            // 规范化之后的树，布局与折叠都基于它
let treeInfo = { uid: "", title: "", nodeCount: 0 };
let layoutResult = null;
let lineMesh = null;
let nodeMesh = null;
let maxDepthAvailable = 1;
let autoFrame = true;

const colorCache = new Map();
function colorFor(depth, maxDepth) {
  const key = `${depth}/${maxDepth}`;
  let c = colorCache.get(key);
  if (!c) {
    const t = maxDepth > 0 ? Math.min(1, depth / maxDepth) : 0;
    // 深蓝(0.60) → 青 → 绿 → 黄 → 橙 → 红(0.0)，越深越暖越亮
    c = new THREE.Color().setHSL(0.6 * (1 - t), 0.9, 0.44 + 0.2 * t);
    colorCache.set(key, c);
  }
  return c;
}

function disposeTree() {
  for (const mesh of [lineMesh, nodeMesh]) {
    if (!mesh) continue;
    treeGroup.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
    if (mesh.dispose) mesh.dispose();
  }
  lineMesh = null;
  nodeMesh = null;
}

function buildTree() {
  const growth = Number($("r-growth").value);
  const nodeBase = Number($("r-node").value);
  const spreadDeg = Number($("r-spread").value);
  const maxDepth = Number($("r-depth").value);
  const depthExponent = Number($("r-expo").value);

  const t0 = performance.now();
  layoutResult = layoutFractalTree3D(normalizedRoot, {
    radiusGrowth: growth,
    nodeSizeGrowth: growth,
    nodeBase,
    depthExponent,
    rootSpread: THREE.MathUtils.degToRad(spreadDeg),
    maxDepth,
    normalize: false, // 进来之前已经规范化过，别每调一次滑杆就重跑一遍
  });
  const buildMs = performance.now() - t0;

  disposeTree();
  const { nodes, segments, meta } = layoutResult;

  // 枝：一个 LineSegments，顶点色按深度渐变
  const lp = new Float32Array(segments.length * 6);
  const lc = new Float32Array(segments.length * 6);
  for (let i = 0; i < segments.length; i += 1) {
    const a = nodes[segments[i][0]];
    const b = nodes[segments[i][1]];
    lp[i * 6] = a.x; lp[i * 6 + 1] = a.y; lp[i * 6 + 2] = a.z;
    lp[i * 6 + 3] = b.x; lp[i * 6 + 4] = b.y; lp[i * 6 + 5] = b.z;
    const ca = colorFor(a.depth, maxDepth);
    const cb = colorFor(b.depth, maxDepth);
    lc[i * 6] = ca.r; lc[i * 6 + 1] = ca.g; lc[i * 6 + 2] = ca.b;
    lc[i * 6 + 3] = cb.r; lc[i * 6 + 4] = cb.g; lc[i * 6 + 5] = cb.b;
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(lp, 3));
  lineGeo.setAttribute("color", new THREE.BufferAttribute(lc, 3));
  lineMesh = new THREE.LineSegments(
    lineGeo,
    new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.62 }),
  );
  lineMesh.frustumCulled = false;
  treeGroup.add(lineMesh);

  // 节点：InstancedMesh，一个 draw call 画完几千个球
  const nodeGeo = new THREE.SphereGeometry(1, 10, 7);
  // Lambert 而不是 Standard：没有高光，色相更纯，分层的色阶才看得出渐变
  const nodeMat = new THREE.MeshLambertMaterial({});
  nodeMesh = new THREE.InstancedMesh(nodeGeo, nodeMat, nodes.length);
  nodeMesh.frustumCulled = false;
  const m = new THREE.Matrix4();
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  for (let i = 0; i < nodes.length; i += 1) {
    const nd = nodes[i];
    p.set(nd.x, nd.y, nd.z);
    s.setScalar(nd.size);
    m.compose(p, q, s);
    nodeMesh.setMatrixAt(i, m);
    nodeMesh.setColorAt(i, colorFor(nd.depth, maxDepth));
  }
  nodeMesh.instanceMatrix.needsUpdate = true;
  if (nodeMesh.instanceColor) nodeMesh.instanceColor.needsUpdate = true;
  treeGroup.add(nodeMesh);

  // 统计
  const maxR = nodes.length
    ? Math.max(...nodes.map((n) => Math.hypot(n.x, n.y, n.z)))
    : 0;
  $("stat-nodes").textContent = nodes.length.toLocaleString();
  $("stat-leaves").textContent = `${meta.totalLeaves.toLocaleString()} / ${meta.maxDepth}`;
  $("stat-segments").textContent = segments.length.toLocaleString();
  $("stat-radius").textContent = maxR >= 10000 ? `${(maxR / 1000).toFixed(1)}k` : maxR.toFixed(0);
  $("tree-title").textContent = treeInfo.title || treeInfo.uid || "未命名";
  console.info(
    `[fractal-3d] 「${treeInfo.title || treeInfo.uid}」布局 ${nodes.length} 节点 / ` +
      `${segments.length} 段，耗时 ${buildMs.toFixed(0)}ms${meta.truncated ? "（已截断）" : ""}`,
  );

  if (autoFrame) frameTree();
}

// 取景方向刻意压得很平（仰角 ~11°）：树是长在地面上的，
// 从高处俯视只会看到一团放射状的扇面，看不出"向上生长"的姿态。
const FRAME_DIR = new THREE.Vector3(0.42, 0.19, 1).normalize();

/** 把整棵树塞进视野（同时充当"重置视角"） */
function frameTree() {
  if (!layoutResult || !layoutResult.nodes.length) return;
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  for (const nd of layoutResult.nodes) box.expandByPoint(v.set(nd.x, nd.y, nd.z));
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  if (!Number.isFinite(sphere.radius) || sphere.radius <= 0) return;

  const dist = (sphere.radius / Math.sin(THREE.MathUtils.degToRad(camera.fov * 0.5))) * 1.02;
  controls.target.copy(sphere.center);
  camera.position.copy(sphere.center).addScaledVector(FRAME_DIR, dist);
  controls.update();
}

// ------------------------------------------------------------------ 悬停提示
const tip = document.createElement("div");
Object.assign(tip.style, {
  position: "fixed", zIndex: 30, pointerEvents: "none", padding: "4px 9px",
  background: "rgba(14,18,30,.92)", border: "1px solid rgba(255,255,255,.16)",
  borderRadius: "7px", fontSize: "12px", color: "#e8ecf5", whiteSpace: "nowrap",
  transform: "translate(12px, 12px)", display: "none", maxWidth: "380px",
  overflow: "hidden", textOverflow: "ellipsis", boxShadow: "0 4px 18px rgba(0,0,0,.5)",
});
document.body.appendChild(tip);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hoverQueued = false;

renderer.domElement.addEventListener("pointermove", (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  tip.style.left = `${e.clientX}px`;
  tip.style.top = `${e.clientY}px`;
  if (hoverQueued || !nodeMesh) return;
  hoverQueued = true;
  requestAnimationFrame(() => {
    hoverQueued = false;
    if (!nodeMesh || !layoutResult) return;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(nodeMesh, false)[0];
    if (hit && hit.instanceId != null) {
      const nd = layoutResult.nodes[hit.instanceId];
      tip.textContent = `${nd.text || "(无名)"}　·　第 ${nd.depth} 层　·　${nd.leafCount} 叶`;
      tip.style.display = "block";
    } else {
      tip.style.display = "none";
    }
  });
});
renderer.domElement.addEventListener("pointerleave", () => { tip.style.display = "none"; });

// ------------------------------------------------------------------ UI
let pending = false;
function scheduleRebuild() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => {
    pending = false;
    buildTree();
  });
}

const bindings = [
  ["r-growth", "v-growth", (v) => Number(v).toFixed(3)],
  ["r-expo", "v-expo", (v) => Number(v).toFixed(2)],
  ["r-node", "v-node", (v) => Number(v).toFixed(3)],
  ["r-spread", "v-spread", (v) => `${v}°`],
  ["r-depth", "v-depth", (v) => (Number(v) >= maxDepthAvailable ? "全部" : v)],
];
for (const [inputId, labelId, fmt] of bindings) {
  const input = $(inputId);
  const label = $(labelId);
  label.textContent = fmt(input.value);
  input.addEventListener("input", () => {
    label.textContent = fmt(input.value);
    scheduleRebuild();
  });
}

$("b-frame").addEventListener("click", (e) => {
  autoFrame = !autoFrame;
  e.currentTarget.classList.toggle("on", autoFrame);
  if (autoFrame) frameTree();
});
$("b-scene").addEventListener("click", (e) => {
  sceneGroup.visible = !sceneGroup.visible;
  e.currentTarget.classList.toggle("on", sceneGroup.visible);
});
$("b-spin").addEventListener("click", (e) => {
  controls.autoRotate = !controls.autoRotate;
  e.currentTarget.classList.toggle("on", controls.autoRotate);
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ------------------------------------------------------------------ 渲染循环
let frames = 0;
let fpsClock = performance.now();
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  frames += 1;
  const now = performance.now();
  if (now - fpsClock >= 500) {
    $("stat-fps").textContent = `${Math.round((frames * 1000) / (now - fpsClock))}`;
    frames = 0;
    fpsClock = now;
  }
}

// ------------------------------------------------------------------ 数据载入
// 刻意不对树做任何假设：换一棵、拖一棵、甚至结构长得不一样，都应该能画出来。
let treeList = [];

/**
 * 从各种可能的 json 形状里把树根挖出来。都挖不到就返回 null。
 *   { document: { root } }   平台 API 的完整格式
 *   { root }                 只包了一层
 *   { data, children }       就是个裸节点
 *   { text, children }       更简化的裸节点
 */
function extractRoot(payload) {
  if (!payload || typeof payload !== "object") return null;
  const root =
    (payload.document && payload.document.root) ||
    payload.root ||
    (Array.isArray(payload.children) ? payload : null);
  if (!root || typeof root !== "object") return null;
  if (!root.children && !root.data && !root.text && !root.label && !root.name) return null;
  return {
    root,
    uid: String(payload.uid || ""),
    title: String(payload.title || ""),
    nodeCount: Number(payload.nodeCount || 0),
  };
}

function setLoading(text) {
  const el = $("loading");
  if (!el) return;
  el.classList.remove("gone");
  if (text) $("loading-text").textContent = text;
}

function hideLoading() {
  const el = $("loading");
  if (el) el.classList.add("gone");
}

/** 把一棵树装上：规范化 → 更新滑杆上限 → 重建几何 */
function applyTree(info, sourceLabel) {
  if (!info || !info.root) throw new Error("这个文件里找不到树");
  const normalized = normalizeTree(info.root);
  if (!normalized) throw new Error("树结构无法解析");

  normalizedRoot = normalized;
  treeInfo = info;
  maxDepthAvailable = maxDepthOf(normalized);

  const depthInput = $("r-depth");
  depthInput.max = String(Math.max(1, maxDepthAvailable));
  depthInput.value = String(Math.max(1, maxDepthAvailable));
  $("v-depth").textContent = "全部";

  $("tree-uid").textContent =
    `${info.uid || "本地文件"} · ${(info.nodeCount || 0).toLocaleString()} 节点 · ${sourceLabel || ""}`;

  buildTree();
}

async function populateTreeList() {
  try {
    const res = await fetch("./data/index.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    treeList = (await res.json()).trees || [];
  } catch (error) {
    console.warn("[fractal-3d] 读不到 data/index.json：", error.message);
    treeList = [];
  }
  const select = $("tree-select");
  select.innerHTML = "";
  for (const t of treeList) {
    const option = document.createElement("option");
    option.value = t.uid;
    option.textContent = `${t.title || t.uid}（${t.nodeCount.toLocaleString()} 节点）`;
    select.appendChild(option);
  }
  if (!treeList.length) select.style.display = "none";
}

async function loadTreeByUid(uid) {
  setLoading(`正在载入 ${uid} …`);
  const res = await fetch(`./data/${encodeURIComponent(uid)}.json`);
  if (!res.ok) throw new Error(`${uid} 载入失败（HTTP ${res.status}）`);
  const payload = await res.json();
  const info = extractRoot(payload);
  if (!info) throw new Error(`${uid} 里没有可识别的树结构`);
  if (!info.uid) info.uid = uid;
  applyTree(info, `本地 ${uid}`);
  $("tree-select").value = uid;
  const url = new URL(location.href);
  url.searchParams.set("tree", uid);
  history.replaceState(null, "", url);
  hideLoading();
}

// ------------------------------------------------------------------ 拖放任意树
function setupDrop() {
  let depth = 0;
  window.addEventListener("dragenter", (e) => {
    e.preventDefault();
    depth += 1;
    document.body.classList.add("dragging");
  });
  window.addEventListener("dragover", (e) => e.preventDefault());
  window.addEventListener("dragleave", (e) => {
    e.preventDefault();
    depth -= 1;
    if (depth <= 0) { depth = 0; document.body.classList.remove("dragging"); }
  });
  window.addEventListener("drop", async (e) => {
    e.preventDefault();
    depth = 0;
    document.body.classList.remove("dragging");
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      const info = extractRoot(payload);
      if (!info) throw new Error("没找到树结构（需要 document.root、root，或带 children 的节点）");
      info.title = info.title || file.name.replace(/\.json$/i, "");
      applyTree(info, file.name);
      $("tree-select").value = "";
    } catch (error) {
      console.error(error);
      window.alert(`载入「${file.name}」失败：${error.message}`);
    }
  });
}

// ------------------------------------------------------------------ 启动
function maxDepthOf(node) {
  let best = 0;
  const stack = [[node, 0]];
  while (stack.length) {
    const [cur, d] = stack.pop();
    if (!cur) continue;
    if (d > best) best = d;
    for (const c of cur.children || []) stack.push([c, d + 1]);
  }
  return best;
}

async function boot() {
  setupDrop();
  $("tree-select").addEventListener("change", (e) => {
    if (!e.target.value) return;
    loadTreeByUid(e.target.value).catch((error) => {
      console.error(error);
      $("loading-text").textContent = `载入失败：${error.message}`;
    });
  });

  try {
    await populateTreeList();
    const wanted =
      new URL(location.href).searchParams.get("tree") ||
      (treeList[0] && treeList[0].uid);
    if (!wanted) throw new Error("没有可用的树：data/index.json 是空的");
    await loadTreeByUid(wanted);
    animate();
  } catch (error) {
    console.error(error);
    $("loading-text").innerHTML =
      `载入失败：${error.message}<br /><br />` +
      `请确认 experiments/fractal-3d/data/ 下有 index.json 和对应的 .json`;
  }
}

boot();
