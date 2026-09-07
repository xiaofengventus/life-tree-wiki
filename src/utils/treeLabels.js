export function platformTreeLabel(tree) {
  if (!tree) return "";
  if (tree.platformLabel === "平台维护" || tree.platformLabel === "平台推荐") {
    return tree.platformLabel;
  }
  const isPlatformTree = Boolean(
    tree.platformRecommended || tree.kind === "OFFICIAL",
  );
  if (!isPlatformTree) return "";
  return tree.platformManaged || tree.kind === "OFFICIAL"
    ? "平台维护"
    : "平台推荐";
}
