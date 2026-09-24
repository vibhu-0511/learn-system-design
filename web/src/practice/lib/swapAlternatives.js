export const SWAP_ALTERNATIVES = {
  "sql-database": ["kv-store", "sql-shard"],
  "kv-store": ["sql-database"],
  "cache": ["cdn"],
  "cdn": ["cache"],
  "message-queue": ["pub-sub"],
  "pub-sub": ["message-queue"],
  "sql-replica": ["cache"],
  "search-index": ["sql-database"],
};

export function swapComponent(components, fromId, toPaletteId, paletteById) {
  return components.map((c) =>
    c.id === fromId
      ? { ...c, paletteId: toPaletteId, name: paletteById[toPaletteId]?.name || toPaletteId }
      : c,
  );
}
