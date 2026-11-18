export const TREE_KINDS = Object.freeze([
  {
    value: "unspecified",
    label: "未指定（历史或草稿）",
    description: "尚未明确树的类型，不默认赋予系统发育或年代含义。",
  },
  {
    value: "classification",
    label: "分类层级树",
    description: "表示生物分类阶元隶属关系，不直接等同于演化支系或时间比例。",
  },
  {
    value: "cladogram",
    label: "支序图（Cladogram）",
    description: "仅表示演化亲缘拓扑关系，分支视觉长度不代表演化速率或年代。",
  },
  {
    value: "phylogram",
    label: "系统发育树（Phylogram）",
    description: "包含分支长度或替代率数据；注意当前画布排版并非按枝长比例绘制。",
  },
  {
    value: "chronogram",
    label: "年代树（Chronogram）",
    description: "包含分歧时间或化石年代数据；注意当前画布排版并非按时间比例绘制。",
  },
]);

export const TREE_KIND_MAP = new Map(
  TREE_KINDS.map((item) => [item.value, item]),
);

export const TAXON_STATUSES = Object.freeze([
  { value: "unknown", label: "未注明" },
  { value: "extant", label: "现生" },
  { value: "extinct", label: "灭绝（†）" },
]);

export const TAXON_STATUS_SET = new Set(
  TAXON_STATUSES.map((item) => item.value),
);

export const BRANCH_SUPPORT_TYPES = Object.freeze([
  { value: "", label: "无", min: null, max: null },
  { value: "bootstrap", label: "自举支持率（Bootstrap, 0–100）", min: 0, max: 100 },
  { value: "posterior", label: "后验概率（Posterior, 0–1）", min: 0, max: 1 },
]);

export const BRANCH_SUPPORT_TYPE_MAP = new Map(
  BRANCH_SUPPORT_TYPES.map((item) => [item.value, item]),
);

const LEADING_DAGGER_RE = /^\s*†+\s*/;

function limitedText(value, maxLength = 300) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function optionalFiniteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeCitationNumbers(value, availableCitations = null) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const result = [];
  for (const raw of value) {
    const num = Number(raw);
    if (!Number.isInteger(num) || num <= 0) continue;
    if (availableCitations instanceof Set && !availableCitations.has(num)) continue;
    if (seen.has(num)) continue;
    seen.add(num);
    result.push(num);
  }
  return result.sort((a, b) => a - b);
}

export function normalizeTreeScience(value) {
  const source = value && typeof value === "object" ? value : {};
  const rawKind = limitedText(source.kind, 40);
  const kind = TREE_KIND_MAP.has(rawKind) ? rawKind : "unspecified";
  return {
    kind,
    description: limitedText(source.description, 1000),
    branchLengthUnit: limitedText(source.branchLengthUnit, 80),
  };
}

export function normalizeNodeScience(
  data = {},
  { isRoot = false, availableCitations = null } = {},
) {
  const source = data && typeof data === "object" ? data : {};
  const rawTaxon = source.taxon && typeof source.taxon === "object" ? source.taxon : {};
  const rawBranch = source.branch && typeof source.branch === "object" ? source.branch : {};

  let text = String(source.text ?? "");
  const hadLeadingDagger = LEADING_DAGGER_RE.test(text);
  if (hadLeadingDagger) {
    text = text.replace(LEADING_DAGGER_RE, "");
  }

  let status = limitedText(rawTaxon.status, 20);
  if (!TAXON_STATUS_SET.has(status)) {
    status = "unknown";
  }
  if (status === "unknown" && (hadLeadingDagger || source.isExtinct === true)) {
    status = "extinct";
  }

  const taxon = {
    scientificName: limitedText(rawTaxon.scientificName, 200),
    rankKey: limitedText(rawTaxon.rankKey, 80),
    status,
    ageMa: optionalFiniteNumber(rawTaxon.ageMa),
  };

  let supportType = limitedText(rawBranch.supportType, 30);
  if (!BRANCH_SUPPORT_TYPE_MAP.has(supportType)) {
    supportType = "";
  }

  const branch = isRoot
    ? {
        length: null,
        supportType: "",
        support: null,
        citationNumbers: [],
      }
    : {
        length: optionalFiniteNumber(rawBranch.length),
        supportType,
        support: optionalFiniteNumber(rawBranch.support),
        citationNumbers: normalizeCitationNumbers(
          rawBranch.citationNumbers,
          availableCitations,
        ),
      };

  return { taxon, branch, text };
}

export function formatTaxonDisplayText(text, taxon) {
  const clean = String(text ?? "").replace(LEADING_DAGGER_RE, "").trim();
  if (!clean) return taxon?.status === "extinct" ? "†" : "";
  return taxon?.status === "extinct" ? `† ${clean}` : clean;
}

export function getTreeKindMeta(kind) {
  return TREE_KIND_MAP.get(kind) || TREE_KIND_MAP.get("unspecified");
}

export function validateScientificTree(document) {
  const errors = [];
  const warnings = [];

  if (!document || typeof document !== "object" || !document.root?.data) {
    errors.push("缺少有效的进化树根节点结构。");
    return { errors, warnings };
  }

  const scientific = normalizeTreeScience(document.scientific);
  const citations = Array.isArray(document.citations) ? document.citations : [];
  const availableCitations = new Set(
    citations
      .map((item) => Number(item?.number))
      .filter((num) => Number.isInteger(num) && num > 0),
  );

  if (scientific.kind === "unspecified") {
    warnings.push("尚未指定树类型：请明确区分“分类层级树”与“系统发育树 / 支序图 / 年代树”。");
  }
  if (!scientific.description) {
    warnings.push("建议补充树的科学说明（例如研究范围、类群界定或所依据的拓扑框架）。");
  }
  if (citations.length === 0) {
    warnings.push("整棵树尚未添加参考文献，建议补充主要依据文献。");
  }

  const seenUids = new Set();
  const duplicateUids = new Set();
  let hasAnyBranchLength = false;
  let hasAnyAgeMa = false;
  let invalidBranchCitations = 0;

  function walk(node, isRoot) {
    if (!node || typeof node !== "object" || !node.data) return;
    const uid = String(node.data.uid || "").trim();
    const label = String(node.data.text || "").trim() || uid || "未命名节点";

    if (!uid) {
      errors.push(`节点“${label}”缺少稳定 UID。`);
    } else if (seenUids.has(uid)) {
      duplicateUids.add(uid);
    } else {
      seenUids.add(uid);
    }

    const rawTaxon = node.data.taxon && typeof node.data.taxon === "object" ? node.data.taxon : {};
    const rawBranch = node.data.branch && typeof node.data.branch === "object" ? node.data.branch : {};

    const ageMa = optionalFiniteNumber(rawTaxon.ageMa);
    if (ageMa !== null) {
      if (ageMa < 0) {
        errors.push(`节点“${label}”的年代（ageMa）不能为负数。`);
      } else {
        hasAnyAgeMa = true;
      }
    }

    const rawLength = optionalFiniteNumber(rawBranch.length);
    const rawSupport = optionalFiniteNumber(rawBranch.support);
    const rawSupportType = limitedText(rawBranch.supportType, 30);

    if (isRoot) {
      if (
        rawLength !== null ||
        rawSupport !== null ||
        Boolean(rawSupportType) ||
        (Array.isArray(rawBranch.citationNumbers) && rawBranch.citationNumbers.length > 0)
      ) {
        warnings.push("根节点没有入边分支，根节点上的分支字段在保存时将被忽略。");
      }
    } else {
      if (rawLength !== null) {
        if (rawLength < 0) {
          errors.push(`节点“${label}”的枝长不能为负数。`);
        } else {
          hasAnyBranchLength = true;
        }
      }

      if (rawSupport !== null && !rawSupportType) {
        errors.push(`节点“${label}”填写了分支支持度数值，但未指定支持度类型（Bootstrap / Posterior）。`);
      } else if (rawSupportType && !BRANCH_SUPPORT_TYPE_MAP.has(rawSupportType)) {
        errors.push(`节点“${label}”的分支支持度类型“${rawSupportType}”不受支持。`);
      } else if (rawSupport !== null && rawSupportType) {
        const meta = BRANCH_SUPPORT_TYPE_MAP.get(rawSupportType);
        if (meta && (rawSupport < meta.min || rawSupport > meta.max)) {
          errors.push(
            `节点“${label}”的 ${rawSupportType} 支持度（${rawSupport}）超出合理范围 [${meta.min}, ${meta.max}]。`,
          );
        }
      }

      if (Array.isArray(rawBranch.citationNumbers)) {
        for (const num of rawBranch.citationNumbers) {
          if (!availableCitations.has(Number(num))) {
            invalidBranchCitations += 1;
          }
        }
      }
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        walk(child, false);
      }
    }
  }

  walk(document.root, true);

  if (duplicateUids.size > 0) {
    errors.push(`存在重复节点 UID：${Array.from(duplicateUids).join("、")}。`);
  }
  if (invalidBranchCitations > 0) {
    warnings.push(`有 ${invalidBranchCitations} 处分支引用编号未对应当前树的参考文献列表。`);
  }

  if (scientific.kind === "phylogram") {
    if (!hasAnyBranchLength) {
      warnings.push("当前树类型为系统发育树（Phylogram），但尚未录入任何实际枝长数据。");
    } else if (!scientific.branchLengthUnit) {
      warnings.push("已录入枝长数据，建议补充枝长单位（例如 substitutions/site）。");
    }
  }

  if (scientific.kind === "chronogram") {
    if (!hasAnyAgeMa && !hasAnyBranchLength) {
      warnings.push("当前树类型为年代树（Chronogram），但尚未录入任何年代（Ma）或时间枝长数据。");
    } else if (hasAnyBranchLength && !scientific.branchLengthUnit) {
      warnings.push("建议注明时间枝长单位（例如 Ma）。");
    }
  }

  if (
    scientific.kind === "phylogram" ||
    scientific.kind === "chronogram" ||
    hasAnyBranchLength ||
    hasAnyAgeMa
  ) {
    warnings.push("提示：当前画布采用结构化布局，节点间距并非按枝长或演化年代比例绘制。");
  }

  return { errors, warnings };
}
