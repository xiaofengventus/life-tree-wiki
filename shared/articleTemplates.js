export const ARTICLE_TEMPLATES = Object.freeze([
  {
    id: "taxon",
    version: 1,
    name: "生物／分类群条目",
    badge: "分类群",
    summary: "适用于物种、属、科或高阶演化支的基础百科条目，结构清晰、便于与进化树节点互相引用。",
    defaultTags: ["分类群条目"],
    sections: [
      {
        heading: "概述",
        guidance: "用 2–4 句话概括该类群的中文名、学名、现生/灭绝状态、主要类群归属与核心特征。",
      },
      {
        heading: "基本信息卡",
        guidance: "建议使用编辑器内置的“分类信息卡”组件填写阶元、学名、年代或保护状态；如不适用可删去本节。",
      },
      {
        heading: "主要特征",
        guidance: "分点描述形态、解剖、生理或分子鉴别特征（学名请使用斜体，避免手动调整字号）。",
      },
      {
        heading: "分布与生态",
        guidance: "说明地理分布、生境、食性或古生态背景（化石类群可写地层与时代）。",
      },
      {
        heading: "演化与分类",
        guidance: "说明系统发育位置与分类变动；建议通过“关联进化树”嵌入树对象并注明所采用的树版本，而非仅贴截图。",
      },
      {
        heading: "参考文献",
        guidance: "请在正文中通过引用工具插入来源编号，并在此列出或核对主要原始文献与数据库。",
      },
    ],
  },
  {
    id: "evolution-topic",
    version: 1,
    name: "演化专题",
    badge: "专题",
    summary: "适用于跨类群演化事件、关键性状起源、宏演化假说或分类学争议的深度综述。",
    defaultTags: ["演化专题"],
    sections: [
      {
        heading: "核心问题",
        guidance: "明确本专题要回答的演化问题、研究对象和时间尺度。",
      },
      {
        heading: "背景",
        guidance: "交代相关类群背景、经典假说以及问题提出的历史脉络。",
      },
      {
        heading: "关联进化树",
        guidance: "嵌入对应进化树对象并注明树版本与树类型（分类层级树 / 支序图 / 系统发育树 / 年代树），说明关键分支节点。",
      },
      {
        heading: "证据与解释",
        guidance: "综合化石记录、形态学、发育生物学或分子系统发育证据，解释主流观点。",
      },
      {
        heading: "争议",
        guidance: "客观呈现不同学派或新近研究的分歧与未决问题；如无明显争议可删去本节。",
      },
      {
        heading: "参考文献",
        guidance: "核对正文中的所有引用编号，列出关键论文、综述或数据来源。",
      },
    ],
  },
  {
    id: "research-brief",
    version: 1,
    name: "研究解读／新闻",
    badge: "研究解读",
    summary: "适用于新发表论文、化石新发现或系统发育修订的快速准确解读。",
    defaultTags: ["研究解读"],
    sections: [
      {
        heading: "研究来源",
        guidance: "注明论文标题、作者团队、发表期刊/预印本平台、发表日期及 DOI 链接。",
      },
      {
        heading: "主要发现",
        guidance: "提炼 3–5 条核心结论，避免夸大或脱离原论文范围的推论。",
      },
      {
        heading: "证据",
        guidance: "说明研究采用的样本、化石材料、测序数据或分析方法（如涉及系统发育树，请注明支持度与所引用树版本）。",
      },
      {
        heading: "局限",
        guidance: "指出样本量、年代校正、分类取样或统计方法上的局限与待验证之处。",
      },
      {
        heading: "参考文献",
        guidance: "附上原始论文及对照背景文献的规范引用。",
      },
    ],
  },
]);

export const ARTICLE_TEMPLATE_MAP = new Map(
  ARTICLE_TEMPLATES.map((template) => [template.id, template]),
);

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function getArticleTemplate(id) {
  return ARTICLE_TEMPLATE_MAP.get(id) || null;
}

export function buildArticleTemplateHtml(templateId) {
  const template = getArticleTemplate(templateId);
  if (!template) return "";
  return template.sections
    .map(
      (section) =>
        `<h2>${escapeHtml(section.heading)}</h2><p>${escapeHtml(section.guidance)}</p>`,
    )
    .join("");
}

function stripHtml(html) {
  return String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function validateArticleDraft({
  title = "",
  content = "",
  citations = [],
  tags = [],
  templateId = "",
} = {}) {
  const html = String(content ?? "");
  const plain = stripHtml(html);
  const warnings = [];
  const checklist = [];

  const hasTitle = Boolean(String(title ?? "").trim());
  checklist.push({
    id: "title",
    label: "文章标题",
    ok: hasTitle,
    detail: hasTitle ? "已填写标题" : "请填写清晰、规范的标题",
  });
  if (!hasTitle) warnings.push("尚未填写文章标题。");

  const hasHeadings = /<h[23]\b/i.test(html) || /^#{2,3}\s/m.test(html);
  checklist.push({
    id: "structure",
    label: "章节层级",
    ok: hasHeadings,
    detail: hasHeadings
      ? "已使用标准标题层级（H2/H3）"
      : "建议使用模板章节或 H2/H3 标题组织正文，避免手动调字号",
  });

  const citationCount = Array.isArray(citations) ? citations.length : 0;
  const hasRefHeading = /参考文献/.test(plain);
  const hasReferences = citationCount > 0 || hasRefHeading;
  checklist.push({
    id: "references",
    label: "参考文献与引用",
    ok: hasReferences,
    detail:
      citationCount > 0
        ? `已添加 ${citationCount} 条结构化引用`
        : hasRefHeading
          ? "已包含参考文献章节，建议同步补充结构化引用"
          : "尚未添加结构化引用或参考文献章节",
  });
  if (citationCount === 0) {
    warnings.push("尚未添加结构化参考文献，建议补充主要依据来源。");
  }

  const hasTags = Array.isArray(tags) && tags.length > 0;
  checklist.push({
    id: "tags",
    label: "分类标签",
    ok: hasTags,
    detail: hasTags ? `已添加 ${tags.length} 个标签` : "建议添加至少 1 个分类标签便于检索",
  });

  const mentionsTree = /进化树|系统发育树|支序图/.test(plain);
  const hasTreeRef = /\/trees\/|data-tree-id|tree-embed/i.test(html);
  if (mentionsTree && !hasTreeRef) {
    warnings.push("正文提到了进化树，建议插入站内进化树对象并注明版本，而非仅贴截图。");
  }

  const template = getArticleTemplate(templateId);
  if (template) {
    const remainingGuidance = template.sections.filter((section) =>
      plain.includes(section.guidance),
    );
    if (remainingGuidance.length > 0) {
      warnings.push(
        `仍有 ${remainingGuidance.length} 个模板填写提示尚未替换或删去（如“${remainingGuidance[0].heading}”）。`,
      );
    }
  }

  return { warnings, checklist };
}

// 持久化只记录模板 id 与版本；章节内容仍属于可编辑正文。
export function normalizeArticleTemplate(value) {
  if (!value || typeof value !== "object") return null;
  const id = String(value.id || "");
  const template = ARTICLE_TEMPLATE_MAP.get(id);
  const version = Number(value.version);
  if (!template || !Number.isInteger(version) || version < 1) return null;
  return { id, version };
}

export function parseArticleTemplate(value) {
  try {
    return normalizeArticleTemplate(typeof value === "string" ? JSON.parse(value) : value);
  } catch {
    return null;
  }
}

export function articleTemplateLabel(value) {
  const template = ARTICLE_TEMPLATE_MAP.get(normalizeArticleTemplate(value)?.id);
  const normalized = normalizeArticleTemplate(value);
  return template ? `${template.name} · v${normalized.version}` : "自由写作";
}

export function articleTemplateSections(id, { automaticReferences = true } = {}) {
  const template = getArticleTemplate(id);
  if (!template) return [];
  return template.sections
    .filter((section) => !(automaticReferences && section.heading === "参考文献"))
    .map((section) => ({ heading: section.heading, text: section.guidance }));
}

export function buildArticleTemplateLaup(templateId) {
  const template = getArticleTemplate(templateId);
  if (!template) return "";
  return template.sections
    .map((section) => `## ${section.heading}\n\n${section.guidance}`)
    .join("\n\n");
}

// 追加而非覆盖，避免丢失正文、嵌入与引用标记。
export function applyArticleTemplate(
  content,
  templateId,
  { format = "html" } = {},
) {
  const template = getArticleTemplate(templateId);
  if (!template) return { content: String(content ?? ""), articleTemplate: null };
  const laup = format === "laup";
  const sections = articleTemplateSections(templateId, {
    automaticReferences: !laup,
  });
  const fragment = laup
    ? sections.map(({ heading, text }) => `## ${heading}\n\n${text}`).join("\n\n")
    : sections
        .map(({ heading, text }) => `<h2>${escapeHtml(heading)}</h2><p>${escapeHtml(text)}</p>`)
        .join("");
  const original = String(content ?? "");
  return {
    content: original ? `${original}${laup ? "\n\n" : ""}${fragment}` : fragment,
    articleTemplate: { id: template.id, version: template.version },
  };
}
