const PUBLIC_ID_CONFIG = Object.freeze({
  user: { prefix: "U", width: 6 },
  post: { prefix: "P", width: 6 },
  tree: { prefix: "T", width: 6 },
});

export function formatPublicId(type, value) {
  const config = PUBLIC_ID_CONFIG[type];
  const number = Number(value);
  if (!config || !Number.isSafeInteger(number) || number < 1) return null;
  return `${config.prefix}${String(number).padStart(config.width, "0")}`;
}

export function parsePublicId(type, value) {
  const config = PUBLIC_ID_CONFIG[type];
  if (!config) return null;
  const match = String(value || "").trim().toUpperCase().match(
    new RegExp(`^${config.prefix}(\\d{1,12})$`),
  );
  if (!match) return null;
  const number = Number(match[1]);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}
