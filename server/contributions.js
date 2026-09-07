import { formatPublicId } from "./publicIds.js";
import { mediaUrl } from "./media.js";
import { compareTreeDocuments } from "./treeDiff.js";

function parseTags(value) {
  try {
    const tags = JSON.parse(value || "[]");
    return Array.isArray(tags) ? tags : [];
  } catch {
    return [];
  }
}

export function contributionSummary(row) {
  return {
    id: row.id,
    targetTreeId: row.target_tree_id,
    targetTreeUid: formatPublicId("tree", row.target_public_id),
    targetTitle: row.target_title || "",
    contributor: {
      uid: formatPublicId("user", row.contributor_public_id),
      name: row.contributor_name || "",
      avatarUrl: row.contributor_avatar_hash ? mediaUrl(row.contributor_avatar_hash) : "",
    },
    baseVersion: Number(row.base_version || 1),
    currentTargetVersion: Number(row.target_current_version || row.base_version || 1),
    hasVersionConflict:
      row.status === "PENDING" &&
      Number(row.target_current_version || row.base_version || 1) !== Number(row.base_version || 1),
    title: row.title,
    description: row.description || "",
    nodeCount: Number(row.node_count || 0),
    license: row.license,
    tags: parseTags(row.tags_json),
    changeNote: row.change_note || "",
    forkEnabled: Boolean(row.fork_enabled),
    contributionEnabled: Boolean(row.contribution_enabled),
    status: row.status,
    reviewNote: row.review_note || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewedAt: row.reviewed_at || "",
  };
}

function parseDocument(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function contributionDetail(row, baseRevision = null) {
  const document = parseDocument(row.document_json);
  const baseDocument = parseDocument(baseRevision?.document_json);
  return {
    ...contributionSummary(row),
    document,
    changes: baseDocument && document
      ? compareTreeDocuments(baseDocument, document)
      : null,
    metadataChanges: baseRevision
      ? {
          title: baseRevision.title !== row.title,
          description: baseRevision.description !== row.description,
          license: baseRevision.license !== row.license,
          tags: baseRevision.tags_json !== row.tags_json,
          references: (baseRevision.references_text || "") !== (row.references_text || ""),
          imageCredits:
            (baseRevision.image_credits_text || "") !== (row.image_credits_text || ""),
          collaboration:
            Number(baseRevision.fork_enabled || 0) !== Number(row.fork_enabled || 0) ||
            Number(baseRevision.contribution_enabled || 0) !== Number(row.contribution_enabled || 0),
        }
      : null,
    referencesText: row.references_text || "",
    imageCreditsText: row.image_credits_text || "",
  };
}

export const CONTRIBUTION_SELECT = `
  SELECT tree_contributions.*,
         target.public_id AS target_public_id,
         target.title AS target_title,
         target.creator_id AS target_creator_id,
         target.version AS target_current_version,
         contributor.display_name AS contributor_name,
         contributor.public_id AS contributor_public_id,
         contributor.avatar_media_hash AS contributor_avatar_hash
    FROM tree_contributions
    JOIN published_trees AS target ON target.id = tree_contributions.target_tree_id
    JOIN users AS contributor ON contributor.id = tree_contributions.contributor_id`;
