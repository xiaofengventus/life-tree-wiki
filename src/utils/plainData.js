export function clonePlainData(value, label = "数据") {
  try {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) throw new TypeError(`${label}无法序列化`);
    return JSON.parse(serialized);
  } catch (error) {
    throw new TypeError(`${label}包含无法保存的内容`, { cause: error });
  }
}
