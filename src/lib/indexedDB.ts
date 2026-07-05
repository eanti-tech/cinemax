/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DB_NAME = 'cinemax_offline_storage_v1';
const STORE_NAME = 'cinemax_files';
const DB_VERSION = 1;

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open offline database'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function saveFile(key: string, file: Blob | File): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(file, key);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to save file for key: ${key}`));
    };
  });
}

export async function getFile(key: string): Promise<Blob | null> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.error('IndexedDB getFile error:', err);
    return null;
  }
}

export async function deleteFile(key: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to delete file for key: ${key}`));
    };
  });
}

/**
 * Creates and returns a temporary Object URL for a stored file, if it exists in IndexedDB.
 */
export async function getFileUrl(key: string): Promise<string | null> {
  const file = await getFile(key);
  if (!file) return null;
  return URL.createObjectURL(file);
}

/**
 * Cache API helpers for offline media thumbnails and assets
 */
export const CACHE_NAME = 'cinemax-downloads-cache';

export async function cacheAsset(url: string, data?: Blob): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    if (data) {
      const response = new Response(data, {
        headers: { 'Content-Type': data.type || 'image/jpeg' }
      });
      await cache.put(url, response);
    } else {
      await cache.add(url);
    }
  } catch (err) {
    console.error('Failed to cache asset in Cache API:', err);
  }
}

export async function getCachedAssetUrl(url: string): Promise<string | null> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(url);
    if (response) {
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
  } catch (err) {
    console.error('Failed to retrieve cached asset from Cache API:', err);
  }
  return null;
}

export async function removeCachedAsset(url: string): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(url);
  } catch (err) {
    console.error('Failed to remove asset from Cache API:', err);
  }
}

/**
 * Downloads list metadata in IndexedDB (for complete local persistence fallback)
 */
export async function saveDownloadsList(downloads: any[]): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await new Promise<void>((resolve, reject) => {
      const request = store.put(JSON.stringify(downloads), 'cinemax_downloads_list');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to save downloads list in IndexedDB:', err);
  }
}

export async function getDownloadsList(): Promise<any[]> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const result = await new Promise<any>((resolve, reject) => {
      const request = store.get('cinemax_downloads_list');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (result) {
      return JSON.parse(result);
    }
  } catch (err) {
    console.error('Failed to load downloads list from IndexedDB:', err);
  }
  return [];
}
