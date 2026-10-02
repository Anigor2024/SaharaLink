/**
 * ReceiptStorageService (Technical Fix 7)
 * Stores uploaded receipt image payloads in IndexedDB rather than stuffing multi-megabyte
 * base64 strings into localStorage. Includes an in-memory cache and graceful fallback
 * so a receipt upload or transfer request is never silently lost.
 */

const DB_NAME = 'saharalink_receipt_vault_v1';
const STORE_NAME = 'receipts';
const DB_VERSION = 1;

export class ReceiptStorageService {
  private memoryCache: Map<string, string> = new Map();
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  private getDb(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return Promise.resolve(null);
    }
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  /**
   * Saves a receipt dataUrl under a deterministic storage key.
   * Returns true if stored in IndexedDB, false if kept in memory/fallback only.
   */
  async saveReceipt(storageKey: string, dataUrl: string): Promise<boolean> {
    this.memoryCache.set(storageKey, dataUrl);
    const db = await this.getDb();
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(dataUrl, storageKey);
        tx.oncomplete = () => resolve(true);
        req.onerror = () => resolve(false);
        tx.onerror = () => resolve(false);
        tx.onabort = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Stores a receipt in the in-memory session cache only.
   */
  cacheInSession(storageKey: string, dataUrl: string): void {
    if (dataUrl) {
      this.memoryCache.set(storageKey, dataUrl);
    }
  }

  /**
   * Reads a receipt from the in-memory session cache without querying IndexedDB.
   */
  getSessionReceipt(storageKey: string): string | null {
    return this.memoryCache.get(storageKey) || null;
  }

  /**
   * Retrieves a receipt dataUrl by its storage key.
   */
  async getReceipt(storageKey: string): Promise<string | null> {
    if (this.memoryCache.has(storageKey)) {
      return this.memoryCache.get(storageKey) || null;
    }

    const db = await this.getDb();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(storageKey);
        req.onsuccess = () => {
          const result = typeof req.result === 'string' ? req.result : null;
          if (result) {
            this.memoryCache.set(storageKey, result);
          }
          resolve(result);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Clears all stored receipts when resetting demo data.
   */
  async clearAllReceipts(): Promise<void> {
    this.memoryCache.clear();
    const db = await this.getDb();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
}

export const receiptStorage = new ReceiptStorageService();
