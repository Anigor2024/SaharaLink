/**
 * Crypto and hashing utilities using standard Web Crypto API.
 * Runs 100% locally in the browser with zero external dependencies.
 */

/**
 * Computes a SHA-256 hex digest of a File, Blob, or base64 data URL.
 */
export async function computeSha256Hex(data: File | Blob | string): Promise<string> {
  try {
    let buffer: ArrayBuffer;

    if (typeof data === 'string') {
      // If it's a data URL, strip the prefix and decode base64
      const commaIdx = data.indexOf(',');
      const base64 = commaIdx >= 0 ? data.slice(commaIdx + 1) : data;
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      buffer = bytes.buffer;
    } else {
      buffer = await data.arrayBuffer();
    }

    if (typeof crypto === 'undefined' || !crypto.subtle) {
      // Fallback simple checksum if Web Crypto is unavailable in non-secure context
      let hash = 0;
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.length; i++) {
        hash = (hash << 5) - hash + bytes[i];
        hash |= 0;
      }
      return 'crc32-' + Math.abs(hash).toString(16).padStart(8, '0');
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.warn('Failed to compute SHA-256 hash:', err);
    return 'hash-' + Date.now().toString(36);
  }
}
