export const EXPERIENCE_POINTS = Object.freeze({
  DAILY_LOGIN: 10,
  POST_CREATED: 20,
  TREE_CREATED: 20,
});

export function chinaDateKey(value = new Date()) {
  return new Date(value.getTime() + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

export function experienceEventStatement(DB, userId, eventType, dedupeKey, occurredAt) {
  const points = EXPERIENCE_POINTS[eventType];
  if (!points) throw new TypeError("未知经验事件");
  return DB.prepare(
    `INSERT OR IGNORE INTO experience_events
      (user_id, dedupe_key, event_type, points, occurred_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).bind(userId, dedupeKey, eventType, points, occurredAt);
}

export function dailyLoginExperienceStatement(DB, userId, occurredAt = new Date().toISOString()) {
  return experienceEventStatement(
    DB,
    userId,
    "DAILY_LOGIN",
    `daily:${chinaDateKey(new Date(occurredAt))}`,
    occurredAt,
  );
}

export function experienceProgress(experience) {
  const total = Math.max(0, Number(experience || 0));
  const level = Math.floor(total / 100);
  return {
    experience: total,
    level,
    currentLevelExperience: total % 100,
    nextLevelExperience: 100,
  };
}
