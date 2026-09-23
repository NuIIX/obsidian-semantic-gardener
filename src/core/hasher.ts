/**
 * Computes a deterministic SHA-256 hex string for a given text.
 * Works seamlessly in both browser/Electron (Web Crypto API) and Node.js environments.
 */
export async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(text);

  if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback for environments where Web Crypto is unavailable
  try {
    const nodeCrypto = await import('crypto');
    return nodeCrypto.createHash('sha256').update(text).digest('hex');
  } catch {
    // Simple FNV-1a 64-bit hash fallback as last resort (should not happen in Obsidian)
    let h1 = 0x811c9dc5;
    let h2 = 0x01000193;
    for (let i = 0; i < text.length; i++) {
      const ch = text.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 16777619);
      h2 = Math.imul(h2 ^ (ch >> 8), 16777619);
    }
    return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
  }
}
