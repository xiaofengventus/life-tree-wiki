export const TAXONOMY_RANK_GROUPS = Object.freeze([
  {
    label: "常规分类阶元",
    ranks: [
      ["realm", "域", "Realm"],
      ["subrealm", "亚域", "Subrealm"],
      ["clade", "演化支", "Clade"],
      ["grade", "等级群", "Grade"],
      ["supergroup", "超群", "Supergroup"],

      ["domain", "域", "Domain"],
      ["kingdom", "界", "Kingdom"],
      ["subkingdom", "亚界", "Subkingdom"],
      ["branch", "支", "Branch"],
      ["infrakingdom", "下界", "Infrakingdom"],

      ["superphylum", "总门、超门", "Superphylum"],
      ["superdivision", "总门、超门", "Superdivision", "植物学"],

      ["phylum", "门", "Phylum", "植物学用 Division"],
      ["subphylum", "亚门", "Subphylum", "植物学用 Subdivision"],
      ["infraphylum", "下门", "Infraphylum", "植物学用 Infradivision"],
      ["microphylum", "小门", "Microphylum"],
      ["megaclass", "高纲", "Megaclass"],
      ["superclass", "总纲", "Superclass"],
      ["class", "纲", "Class"],
      ["subclass", "亚纲", "Subclass"],
      ["infraclass", "下纲", "Infraclass"],
      ["parvclass", "小纲", "Parvclass / Subterclass"],
      ["superlegion", "总部", "Superlegion"],
      ["legion", "部", "Legion"],
      ["sublegion", "亚部", "Sublegion"],
      ["infralegion", "下部", "Infralegion"],
      ["supercohort", "总群", "Supercohort"],
      ["cohort", "群", "Cohort"],
      ["subcohort", "亚群", "Subcohort"],
      ["infracohort", "下群", "Infracohort"],
      ["gigaorder", "宏目", "Gigaorder"],
      ["magnorder", "高目", "Magnorder / Megaorder"],
      ["grandorder", "大目", "Grandorder / Capaxorder"],
      ["mirorder", "上目", "Mirorder / Hyperorder"],
      ["superorder", "总目", "Superorder", "一些分类体系置于高目及大目之间"],
      ["fish-series", "系", "Series", "常用于鱼类"],
      ["order", "目", "Order"],
      ["nanorder", "从目", "Nanorder"],
      ["hypoorder", "次目", "Hypoorder"],
      ["minorder", "若目", "Minorder"],
      ["suborder", "亚目", "Suborder"],
      ["infraorder", "下目", "Infraorder"],
      ["parvorder", "小目", "Parvorder / Microorder"],
      ["gigafamily", "宏科", "Gigafamily"],
      ["megafamily", "高科", "Megafamily"],
      ["grandfamily", "大科", "Grandfamily"],
      ["hyperfamily", "上科", "Hyperfamily"],
      ["superfamily", "总科", "Superfamily"],
      ["epifamily", "领科", "Epifamily"],
      ["lepidoptera-series", "系", "Series", "常用于鳞翅类"],
      ["lepidoptera-group", "组", "Group", "常用于鳞翅类"],
      ["family", "科", "Family"],
      ["subfamily", "亚科", "Subfamily"],
      ["infrafamily", "下科", "Infrafamily"],
      ["supertribe", "总族", "Supertribe"],
      ["tribe", "族", "Tribe"],
      ["subtribe", "亚族", "Subtribe"],
      ["infratribe", "下族", "Infratribe"],
      ["genus", "属", "Genus"],
      ["subgenus", "亚属", "Subgenus"],
      ["infraspecific", "下属", "Infraspecific"],
      ["botany-section", "节（台湾）、组（大陆）", "Section", "常用于植物学"],
      [
        "botany-subsection",
        "亚节（台湾）、亚组（大陆）",
        "Subsection",
        "常用于植物学",
      ],
      ["botany-series", "系", "Series", "常用于植物学"],
      ["botany-subseries", "亚系", "Subseries", "常用于植物学"],
      ["species-group", "种团", "Superspecies / Species-group"],
      ["species", "种", "Species"],
      ["subspecies", "亚种", "Subspecies"],
      ["variety", "变种", "Variety", "常用于植物学"],
      ["subvariety", "亚变种", "Subvariety", "常用于植物学"],
      ["form", "型", "Form", "常用于植物学"],
      ["subform", "亚型", "Subform", "常用于植物学"],
    ],
  },
  {
    label: "可在任意位置使用的阶元",
    ranks: [
      ["zoology-superdivision", "总类、超类", "Superdivision", "常用于动物学"],
      ["zoology-division", "类", "Division", "常用于动物学"],
      ["zoology-subdivision", "亚类", "Subdivision", "常用于动物学"],
      ["zoology-infradivision", "下类", "Infradivision", "常用于动物学"],
      ["zoology-supersection", "总派", "Supersection", "常用于动物学"],
      ["zoology-section", "派", "Section", "常用于动物学"],
      ["zoology-subsection", "亚派", "Subsection", "常用于动物学"],
      ["zoology-infrasection", "下派", "Infrasection", "常用于动物学"],
      ["zoology-series", "系", "Series", "常用于动物学"],
      ["zoology-subseries", "亚系", "Subseries", "常用于动物学"],
    ],
  },
]);

export const TAXONOMY_RANKS = Object.freeze(
  TAXONOMY_RANK_GROUPS.flatMap((group) =>
    group.ranks.map(([key, zh, en, note = ""]) =>
      Object.freeze({
        key,
        zh,
        en,
        note,
        group: group.label,
      }),
    ),
  ),
);

export const TAXONOMY_RANK_MAP = new Map(
  TAXONOMY_RANKS.map((rank) => [rank.key, rank]),
);

const TAXONOMY_RANK_FAMILY_DEFINITIONS = Object.freeze([
  ["domain", "域", (rank) => rank.zh.endsWith("域")],
  ["clade", "支", (rank) => rank.zh.endsWith("支")],
  ["grade", "等级群", (rank) => rank.key === "grade"],
  ["kingdom", "界", (rank) => rank.zh.endsWith("界")],
  ["phylum", "门", (rank) => rank.zh.endsWith("门")],
  ["class", "纲", (rank) => rank.zh.endsWith("纲")],
  ["legion", "部", (rank) => rank.zh.endsWith("部")],
  ["cohort", "群", (rank) => rank.zh.endsWith("群")],
  ["order", "目", (rank) => rank.zh.endsWith("目")],
  ["family", "科", (rank) => rank.zh.endsWith("科")],
  ["tribe", "族", (rank) => rank.zh.endsWith("族")],
  ["genus", "属", (rank) => rank.zh.endsWith("属")],
  [
    "section-group",
    "节 / 组",
    (rank) =>
      rank.key === "lepidoptera-group" ||
      rank.key === "botany-section" ||
      rank.key === "botany-subsection",
  ],
  ["series", "系", (rank) => /(?:^|-)series$|(?:^|-)subseries$/.test(rank.key)],
  [
    "species",
    "种",
    (rank) => /种|species|variety/.test(`${rank.zh} ${rank.key}`),
  ],
  ["form", "型", (rank) => rank.zh.endsWith("型")],
  ["division", "类", (rank) => rank.zh.endsWith("类")],
  ["section", "派", (rank) => rank.zh.endsWith("派")],
]);

const ranksByFamily = new Map(
  TAXONOMY_RANK_FAMILY_DEFINITIONS.map(([key, label]) => [
    key,
    { key, label, ranks: [] },
  ]),
);
const unmatchedRanks = [];

TAXONOMY_RANKS.forEach((rank) => {
  const definition = TAXONOMY_RANK_FAMILY_DEFINITIONS.find(([, , matches]) =>
    matches(rank),
  );
  if (definition) {
    ranksByFamily.get(definition[0]).ranks.push(rank);
  } else {
    unmatchedRanks.push(rank);
  }
});

export const TAXONOMY_RANK_FAMILIES = Object.freeze([
  ...TAXONOMY_RANK_FAMILY_DEFINITIONS.map(([key]) => ranksByFamily.get(key))
    .filter((family) => family.ranks.length)
    .map((family) =>
      Object.freeze({
        ...family,
        ranks: Object.freeze([...family.ranks]),
      }),
    ),
  ...(unmatchedRanks.length
    ? [
        Object.freeze({
          key: "other",
          label: "其他",
          ranks: Object.freeze(unmatchedRanks),
        }),
      ]
    : []),
]);

export const TAXONOMY_RANK_FAMILY_MAP = new Map(
  TAXONOMY_RANK_FAMILIES.flatMap((family) =>
    family.ranks.map((rank) => [rank.key, family]),
  ),
);
