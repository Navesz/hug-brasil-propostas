import { compressImageDataUrl } from "@/lib/imageUtils";

const DB_NAME = "hug-brasil-storage";
const DB_VERSION = 1;
const STORE_NAME = "logos";
export const LOGO_REF_PREFIX = "idb://logo/";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function isLogoReference(url: string | undefined | null): boolean {
  return Boolean(url?.startsWith(LOGO_REF_PREFIX));
}

export function logoRefKey(propostaId: string): string {
  return `${LOGO_REF_PREFIX}${propostaId}`;
}

export async function saveLogo(propostaId: string, dataUrl: string): Promise<string> {
  const compressed = await compressImageDataUrl(dataUrl);
  const key = propostaId;
  await idbSet(key, compressed);
  return logoRefKey(propostaId);
}

export async function loadLogo(ref: string): Promise<string | null> {
  if (!ref) return null;
  if (ref.startsWith("/") || ref.startsWith("data:")) return ref;
  if (!isLogoReference(ref)) return ref;

  const key = ref.slice(LOGO_REF_PREFIX.length);
  return idbGet(key);
}

export async function deleteLogo(propostaId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(propostaId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Resolve referência IndexedDB para URL utilizável em <img>. */
export async function resolveLogoUrl(logoUrl: string): Promise<string> {
  if (!logoUrl || !isLogoReference(logoUrl)) return logoUrl;
  const stored = await loadLogo(logoUrl);
  return stored ?? "";
}
