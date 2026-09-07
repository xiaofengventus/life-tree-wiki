<script setup>
import { computed, onMounted, ref } from "vue";
import navBar from "@/components/navBar.vue";
import { fetchTreeList } from "@/services/trees";
import { platformTreeLabel } from "@/utils/treeLabels";

const trees = ref([]);
const loading = ref(true);
const errorMessage = ref("");
const query = ref("");

const filteredTrees = computed(() => {
  const keyword = query.value.trim().toLocaleLowerCase();
  if (!keyword) return trees.value;
  return trees.value.filter((tree) =>
    [tree.title, tree.description, tree.creator, ...(tree.tags || [])]
      .join(" ")
      .toLocaleLowerCase()
      .includes(keyword),
  );
});

async function loadTrees() {
  loading.value = true;
  errorMessage.value = "";
  try {
    trees.value = await fetchTreeList("ALL");
  } catch (error) {
    errorMessage.value = error.message || "艺术树相画廊加载失败";
  } finally {
    loading.value = false;
  }
}

onMounted(loadTrees);
</script>

<template>
  <navBar />
  <main class="art-gallery-page">
    <section class="art-gallery-hero">
      <div class="hero-copy">
        <span>GENERATIVE EVOLUTION</span>
        <h1>艺术树相</h1>
        <p>
          同一棵进化树，可以是一株逐层开花的植物、一簇从晶核向外生长的晶体，
          也可以是一张从共同祖先向上分化的生命谱系，或漂浮在三维空间中的层级星云。
          艺术只改变观看方式，不改变任何节点关系。
        </p>
        <div class="hero-actions">
          <a href="#art-tree-gallery">浏览公开树相</a>
          <RouterLink to="/evolution-tree">制作进化树</RouterLink>
        </div>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="botanical-orbit">
          <i v-for="index in 7" :key="`leaf-${index}`"></i>
          <span></span>
        </div>
        <div class="crystal-orbit">
          <i v-for="index in 6" :key="`crystal-${index}`"></i>
          <span></span>
        </div>
      </div>
    </section>

    <section class="style-introduction" aria-label="艺术风格">
      <article class="botanical-style">
        <span>01 / BOTANICAL</span>
        <h2>植物花开</h2>
        <p>根节点成为种子，层级成为枝干，末端节点在生长完成时开放为花朵。</p>
      </article>
      <article class="crystal-style">
        <span>02 / CRYSTAL</span>
        <h2>晶体生长</h2>
        <p>根节点成为晶核，父子关系形成晶轴，知识沿不同方向结成透明晶面。</p>
      </article>
      <article class="lineage-style">
        <span>03 / TREE OF LIFE</span>
        <h2>生命谱系</h2>
        <p>根节点成为共同祖先，一级分支使用不同谱系色，沿清晰的分叉向上展开。</p>
      </article>
      <article class="nebula-style">
        <span>04 / HIERARCHICAL NEBULA</span>
        <h2>层级星云</h2>
        <p>根节点成为星核，层级决定空间半径，完整父子关系在可旋转的三维点云中发光。</p>
      </article>
    </section>

    <section id="art-tree-gallery" class="art-tree-gallery">
      <header>
        <div>
          <span>PUBLIC TREE GALLERY</span>
          <h2>选择一棵树，赋予它新的形态</h2>
        </div>
        <label>
          <span class="sr-only">搜索进化树</span>
          <input v-model="query" type="search" placeholder="搜索名称、作者或标签" />
        </label>
      </header>

      <p v-if="loading" class="gallery-state">正在培育艺术树相……</p>
      <p v-else-if="errorMessage" class="gallery-state error">{{ errorMessage }}</p>

      <div v-else-if="filteredTrees.length" class="art-tree-grid">
        <article v-for="(tree, index) in filteredTrees" :key="tree.id" class="art-tree-card">
          <div class="procedural-cover" :class="index % 2 ? 'crystal' : 'botanical'">
            <template v-if="index % 2">
              <span class="crystal-core"></span>
              <i v-for="facet in 6" :key="facet" :style="{ '--facet': facet }"></i>
            </template>
            <template v-else>
              <span class="plant-stem"></span>
              <i v-for="leaf in 7" :key="leaf" :style="{ '--leaf': leaf }"></i>
            </template>
            <strong>{{ tree.nodeCount || 0 }} NODES</strong>
          </div>
          <div class="card-copy">
            <div class="card-meta">
              <span>{{ tree.uid || "TREE" }}</span>
              <span v-if="platformTreeLabel(tree)" class="platform-label">
                {{ platformTreeLabel(tree) }}
              </span>
            </div>
            <h3>{{ tree.title || "未命名进化树" }}</h3>
            <p>{{ tree.description || "等待在艺术视图中展开它的结构与方向。" }}</p>
            <small>{{ tree.creator }} · {{ tree.nodeCount || 0 }} 个节点</small>
            <div class="card-actions">
              <RouterLink
                :to="{ path: `/art-tree/${tree.uid || tree.id}`, query: { style: 'botanical' } }"
              >
                植物花开
              </RouterLink>
              <RouterLink
                :to="{ path: `/art-tree/${tree.uid || tree.id}`, query: { style: 'crystal' } }"
              >
                晶体生长
              </RouterLink>
              <RouterLink
                :to="{ path: `/art-tree/${tree.uid || tree.id}`, query: { style: 'lineage' } }"
              >
                生命谱系
              </RouterLink>
              <RouterLink
                :to="{ path: `/art-tree/${tree.uid || tree.id}`, query: { style: 'nebula' } }"
              >
                层级星云
              </RouterLink>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="gallery-state empty">
        <strong>没有找到匹配的进化树</strong>
        <p>换一个关键词，或者先制作一棵公开进化树。</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.art-gallery-page{min-height:100vh;padding:88px 20px 72px;background:#f3f5f1;color:#1c342d}.art-gallery-hero,.style-introduction,.art-tree-gallery{width:min(100%,1240px);margin-right:auto;margin-left:auto}.art-gallery-hero{position:relative;display:grid;min-height:480px;overflow:hidden;grid-template-columns:minmax(0,1.05fr) minmax(420px,.95fr);align-items:center;border-radius:26px;background:linear-gradient(135deg,#071a15 0%,#102820 56%,#12152e 100%);box-shadow:0 26px 70px rgba(17,45,37,.2)}.hero-copy{position:relative;z-index:2;padding:62px}.hero-copy>span,.art-tree-gallery>header>div>span{color:#91d6ba;font-size:.7rem;font-weight:850;letter-spacing:.22em}.hero-copy h1{margin:9px 0 15px;color:#fff;font-size:clamp(2.7rem,7vw,5.6rem);font-weight:780;letter-spacing:-.07em;line-height:.95}.hero-copy p{max-width:650px;margin:0;color:rgba(239,255,249,.72);font-size:1rem;line-height:1.9}.hero-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px}.hero-actions a{padding:10px 16px;border:1px solid rgba(255,255,255,.3);border-radius:999px;color:#fff;font-size:.84rem;font-weight:750;text-decoration:none}.hero-actions a:first-child{border-color:#a5e2c4;background:#a5e2c4;color:#123b2e}.hero-art{position:relative;height:100%;min-height:430px}.botanical-orbit,.crystal-orbit{position:absolute}.botanical-orbit{right:45%;bottom:30px;width:250px;height:370px}.botanical-orbit>span{position:absolute;bottom:0;left:50%;width:9px;height:300px;border-radius:99px 99px 0 0;background:linear-gradient(#96d48b,#2e745a);transform:translateX(-50%) rotate(-8deg);transform-origin:bottom}.botanical-orbit i{--angle:calc((var(--i,1) - 4)*18deg);position:absolute;z-index:1;bottom:calc(32px + var(--i,1)*38px);left:50%;width:72px;height:36px;border:1px solid rgba(197,249,178,.45);border-radius:100% 0 100% 0;background:linear-gradient(135deg,rgba(177,231,135,.9),rgba(50,128,92,.38));filter:drop-shadow(0 0 11px rgba(122,226,163,.2));transform:rotate(calc(var(--i,1)*31deg)) translateX(calc((var(--i,1) - 4)*8px));transform-origin:0 50%}.botanical-orbit i:nth-child(1){--i:1}.botanical-orbit i:nth-child(2){--i:2}.botanical-orbit i:nth-child(3){--i:3}.botanical-orbit i:nth-child(4){--i:4}.botanical-orbit i:nth-child(5){--i:5}.botanical-orbit i:nth-child(6){--i:6}.botanical-orbit i:nth-child(7){--i:7}.crystal-orbit{right:30px;top:45px;width:260px;height:260px;border:1px solid rgba(126,177,255,.14);border-radius:50%;background:radial-gradient(circle,rgba(112,112,235,.26),transparent 67%)}.crystal-orbit>span{position:absolute;top:50%;left:50%;width:74px;height:74px;background:linear-gradient(145deg,rgba(194,224,255,.9),rgba(94,87,206,.18));clip-path:polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%);filter:drop-shadow(0 0 20px #766bdc);transform:translate(-50%,-50%)}.crystal-orbit i{position:absolute;top:50%;left:50%;width:8px;height:118px;background:linear-gradient(rgba(153,207,255,.04),rgba(126,167,255,.88),rgba(153,207,255,.04));transform:translate(-50%,-50%) rotate(calc(var(--c)*60deg))}.crystal-orbit i:nth-child(1){--c:1}.crystal-orbit i:nth-child(2){--c:2}.crystal-orbit i:nth-child(3){--c:3}.crystal-orbit i:nth-child(4){--c:4}.crystal-orbit i:nth-child(5){--c:5}.crystal-orbit i:nth-child(6){--c:6}.style-introduction{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:18px}.style-introduction article{position:relative;min-height:190px;overflow:hidden;padding:30px;border-radius:18px}.style-introduction article:after{position:absolute;right:-45px;bottom:-70px;width:220px;height:220px;border:1px solid currentColor;border-radius:50%;content:"";opacity:.16}.style-introduction span{font-size:.65rem;font-weight:850;letter-spacing:.17em}.style-introduction h2{margin:8px 0 8px;font-size:1.5rem}.style-introduction p{max-width:500px;margin:0;line-height:1.7}.botanical-style{background:#dfeedd;color:#315a45}.crystal-style{background:#e2e5f7;color:#414a86}.art-tree-gallery{margin-top:58px;scroll-margin-top:90px}.art-tree-gallery>header{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:22px}.art-tree-gallery h2{margin:5px 0 0;font-size:1.75rem}.art-tree-gallery label{width:min(100%,320px)}.art-tree-gallery input{width:100%;padding:11px 14px;border:1px solid #cad7d0;border-radius:999px;background:#fff;color:#263d35;font:inherit}.art-tree-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.art-tree-card{overflow:hidden;border:1px solid #dfe7e2;border-radius:17px;background:#fff;box-shadow:0 11px 32px rgba(31,71,59,.06)}.procedural-cover{position:relative;height:210px;overflow:hidden;background:#10251d}.procedural-cover strong{position:absolute;right:13px;bottom:11px;color:rgba(255,255,255,.58);font-size:.62rem;letter-spacing:.13em}.procedural-cover.botanical{background:radial-gradient(circle at 50% 100%,rgba(125,217,142,.24),transparent 58%),#0d2119}.plant-stem{position:absolute;bottom:-5px;left:50%;width:6px;height:178px;border-radius:99px;background:#78ae69;transform:translateX(-50%) rotate(-4deg);transform-origin:bottom}.procedural-cover.botanical i{position:absolute;bottom:calc(8px + var(--leaf)*22px);left:50%;width:50px;height:24px;border-radius:100% 0 100% 0;background:linear-gradient(135deg,#b2d887,#3c8a67);transform:rotate(calc(var(--leaf)*42deg));transform-origin:0 50%}.procedural-cover.crystal{background:radial-gradient(circle,#3a3d85 0%,#11152c 47%,#090d1c 100%)}.procedural-cover .crystal-core{position:absolute;top:50%;left:50%;width:62px;height:62px;background:linear-gradient(145deg,#bbdefc,#6764c7 68%,transparent);clip-path:polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%);filter:drop-shadow(0 0 16px #6d7de7);transform:translate(-50%,-50%)}.procedural-cover.crystal i{position:absolute;top:50%;left:50%;width:4px;height:150px;background:linear-gradient(transparent,#9dc9ff,transparent);transform:translate(-50%,-50%) rotate(calc(var(--facet)*60deg))}.card-copy{padding:19px}.card-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#7b8e87;font-size:.68rem;font-weight:750}.platform-label{padding:3px 7px;border-radius:999px;background:#e8f0fa;color:#42678d}.card-copy h3{margin:9px 0 7px;color:#213b32;font-size:1.08rem}.card-copy p{display:-webkit-box;min-height:3.2em;margin:0;overflow:hidden;color:#708079;font-size:.82rem;line-height:1.6;-webkit-box-orient:vertical;-webkit-line-clamp:2}.card-copy>small{display:block;margin-top:9px;color:#94a39e}.card-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:15px}.card-actions a{padding:8px;border:1px solid #a9c4b9;border-radius:8px;color:#2e6c57;font-size:.76rem;font-weight:750;text-align:center;text-decoration:none}.card-actions a:last-child{border-color:#b8bce0;color:#555e9e}.gallery-state{display:grid;min-height:260px;place-content:center;color:#71817b;text-align:center}.gallery-state.error{color:#a23b37}.gallery-state.empty strong{color:#3a5149}.gallery-state.empty p{margin:7px 0}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}@media(max-width:920px){.art-gallery-hero{grid-template-columns:1fr}.hero-copy{padding:42px}.hero-art{position:absolute;inset:0;opacity:.28}.art-tree-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:640px){.art-gallery-page{padding:76px 9px 42px}.art-gallery-hero{min-height:500px}.hero-copy{padding:28px}.style-introduction,.art-tree-grid{grid-template-columns:1fr}.art-tree-gallery>header{display:grid}.art-tree-gallery label{width:100%}}
.style-introduction{grid-template-columns:repeat(3,minmax(0,1fr))}
.lineage-style{background:#e7f1f6;color:#355f76}
.card-actions{grid-template-columns:repeat(3,minmax(0,1fr))}
.card-actions a:nth-child(2){border-color:#b8bce0;color:#555e9e}
.card-actions a:last-child{border-color:#9fc9dd;color:#39738e}
@media(max-width:640px){.style-introduction{grid-template-columns:1fr}.card-actions{grid-template-columns:1fr}}
.style-introduction{grid-template-columns:repeat(4,minmax(0,1fr))}
.nebula-style{background:linear-gradient(135deg,#111936,#080c1d);color:#b9dfff}
.card-actions{grid-template-columns:repeat(4,minmax(0,1fr))}
.card-actions a:nth-child(3){border-color:#9fc9dd;color:#39738e}
.card-actions a:last-child{border-color:#8e84c7;color:#665ba2}
@media(max-width:1000px){.style-introduction{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:640px){.style-introduction{grid-template-columns:1fr}.card-actions{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>
