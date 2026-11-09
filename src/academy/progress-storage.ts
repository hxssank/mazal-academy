export const courseStorageKey = 'mazal.academy.v1';
export const planStorageKey = 'mazal.academy.plan.v1';
const databaseName = 'mazal.academy';
const storeName = 'progress';
const documentKey = 'academy';
const notificationKey = 'mazal.academy.changed';

export type ProgressKey = typeof courseStorageKey | typeof planStorageKey;
interface ProgressDocument { epoch: number; revision: number; course: string | null; plan: string | null }
export interface ProgressSnapshot { raw: string | null; epoch: number; revision: number }
export interface ProgressWrite { snapshot: ProgressSnapshot; reset: boolean }
interface StorageOptions {
  indexedDB?: IDBFactory;
  legacyStorage?: Pick<Storage, 'getItem'>;
  name?: string;
}
const fieldFor = (key: ProgressKey) => key === courseStorageKey ? 'course' : 'plan';
const snapshot = (document: ProgressDocument, key: ProgressKey): ProgressSnapshot => ({ raw: document[fieldFor(key)], epoch: document.epoch, revision: document.revision });

export function createProgressStorage(options: StorageOptions = {}) {
  let connection: Promise<IDBDatabase> | null = null;
  let channel: BroadcastChannel | null = null;
  const listeners = new Set<() => void>();
  const receive = () => listeners.forEach(listener => listener());
  const announce = () => {
    receive();
    try { channel?.postMessage('changed'); } catch { /* Focus also refreshes open pages. */ }
    try { localStorage.setItem(notificationKey, crypto.randomUUID()); } catch { /* IndexedDB remains authoritative if this notification fails. */ }
  };
  function open(): Promise<IDBDatabase> {
    if (connection) return connection;
    const opening = new Promise<IDBDatabase>((resolve, reject) => {
      const request = (options.indexedDB ?? indexedDB).open(options.name ?? databaseName, 1);
      let blocked = false;
      request.onupgradeneeded = () => request.result.createObjectStore(storeName);
      request.onerror = () => reject(request.error ?? new Error('Could not open Academy storage.'));
      request.onblocked = () => { blocked = true; reject(new Error('Close older Academy tabs and retry saving.')); };
      request.onsuccess = () => {
        const database = request.result;
        if (blocked) { database.close(); return; }
        database.onversionchange = () => { database.close(); connection = null; };
        resolve(database);
      };
    });
    connection = opening;
    void opening.catch(() => { if (connection === opening) connection = null; });
    return opening;
  }
  async function transact<T>(operation: (document: ProgressDocument) => { value: T; write?: ProgressDocument }): Promise<T> {
    const database = await open();
    return new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const records = transaction.objectStore(storeName);
      const request = records.get(documentKey);
      let result: T;
      let failure: unknown;
      let changed = false;
      request.onsuccess = () => {
        try {
          let document = request.result as ProgressDocument | undefined;
          const migrated = !document;
          if (!document) {
            const legacy = options.legacyStorage ?? localStorage;
            document = { epoch: 0, revision: 0, course: legacy.getItem(courseStorageKey), plan: legacy.getItem(planStorageKey) };
          }
          const next = operation(document);
          result = next.value;
          if (next.write || migrated) records.put(next.write ?? document, documentKey);
          changed = Boolean(next.write);
        } catch (error) { failure = error; transaction.abort(); }
      };
      transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('Could not save Academy progress.'));
      transaction.onerror = () => { /* onabort reports the failed transaction once. */ };
      transaction.oncomplete = () => { if (changed) announce(); resolve(result); };
    });
  }
  return {
    read(key: ProgressKey) { return transact(document => ({ value: snapshot(document, key) })); },
    update<T>(key: ProgressKey, epoch: number | null, parse: (raw: string | null) => T, changes: readonly ((latest: T) => T)[]): Promise<ProgressWrite> {
      return transact<ProgressWrite>(document => {
        if (epoch !== null && document.epoch !== epoch) return { value: { snapshot: snapshot(document, key), reset: true } };
        const value = changes.reduce((current, change) => change(current), parse(document[fieldFor(key)]));
        const next = { ...document, revision: document.revision + 1, [fieldFor(key)]: JSON.stringify(value) };
        return { value: { snapshot: snapshot(next, key), reset: false }, write: next };
      });
    },
    reset(): Promise<void> {
      return transact(document => ({ value: undefined, write: { epoch: document.epoch + 1, revision: document.revision + 1, course: null, plan: null } }));
    },
    subscribe(listener: () => void) {
      if (listeners.size === 0 && typeof window !== 'undefined') {
        if (typeof window.BroadcastChannel === 'function') {
          try {
            channel = new window.BroadcastChannel(notificationKey);
            channel.addEventListener('message', receive);
          } catch { channel = null; }
        }
        window.addEventListener('focus', receive);
        window.addEventListener('storage', receiveStorage);
        document.addEventListener('visibilitychange', receive);
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          channel?.close(); channel = null;
          window.removeEventListener('focus', receive);
          window.removeEventListener('storage', receiveStorage);
          document.removeEventListener('visibilitychange', receive);
        }
      };
    },
    async close() { const active = connection; connection = null; try { (await active)?.close(); } catch { /* A failed open has no connection to close. */ } },
  };
  function receiveStorage(event: StorageEvent) { if (event.key === notificationKey || event.key === null) receive(); }
}

export const progressStorage = createProgressStorage();
