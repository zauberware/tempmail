// Tiny localStorage wrapper that transparently migrates a value from an
// old key to a new one on first read. Used during the tempmail → Tempus
// rename so users don't lose their saved state.

export function lsGetMigrated(newKey: string, oldKey: string): string | null {
  try {
    const fresh = localStorage.getItem(newKey);
    if (fresh !== null) return fresh;
    const legacy = localStorage.getItem(oldKey);
    if (legacy !== null) {
      try {
        localStorage.setItem(newKey, legacy);
        localStorage.removeItem(oldKey);
      } catch {
        /* ignore quota */
      }
      return legacy;
    }
    return null;
  } catch {
    return null;
  }
}
