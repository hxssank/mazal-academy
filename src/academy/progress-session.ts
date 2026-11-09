import { progressStorage, type ProgressKey, type ProgressSnapshot } from './progress-storage.ts';

export type SaveStatus = 'loading' | 'saving' | 'saved' | 'error';
type Storage = typeof progressStorage;
interface RecordState<T> { value: T; status: SaveStatus; epoch: number; ready: boolean }

function createRecordSession<T>(key: ProgressKey, parse: (raw: string | null) => T, storage: Storage) {
  let state: RecordState<T> = { value: parse(null), status: 'loading', epoch: 0, ready: false };
  let persisted: ProgressSnapshot | null = null;
  let pending: { id: number; change: (latest: T) => T }[] = [];
  let sequence = 0;
  let running: Promise<void> | null = null;
  let unsubscribe: (() => void) | null = null;
  const listeners = new Set<() => void>();
  function warnUnsaved(event: BeforeUnloadEvent) {
    if (pending.length === 0) return;
    event.preventDefault();
    event.returnValue = '';
  }
  function publish(next: Partial<RecordState<T>>) {
    state = { ...state, ...next };
    listeners.forEach(listener => listener());
  }
  function accept(snapshot: ProgressSnapshot) {
    if (persisted && snapshot.revision < persisted.revision) return;
    if (persisted && snapshot.epoch !== persisted.epoch) pending = [];
    persisted = snapshot;
    publish({ value: pending.reduce((next, entry) => entry.change(next), parse(snapshot.raw)), epoch: snapshot.epoch, ready: true });
  }
  async function refresh() {
    try {
      accept(await storage.read(key));
      if (pending.length === 0) publish({ status: 'saved' });
    } catch { publish({ status: 'error' }); }
  }
  function flush(): Promise<void> {
    if (running) return running;
    publish({ status: 'saving' });
    running = (async () => {
      try {
        if (!persisted) accept(await storage.read(key));
        while (pending.length) {
          const batch = [...pending];
          const result = await storage.update(key, persisted?.epoch ?? null, parse, batch.map(entry => entry.change));
          if (result.reset) pending = [];
          else pending = pending.filter(entry => entry.id > batch.at(-1)!.id);
          accept(result.snapshot);
        }
        publish({ status: 'saved' });
      } catch { publish({ status: 'error' }); }
      finally { running = null; }
    })();
    return running;
  }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (!unsubscribe) {
        unsubscribe = storage.subscribe(() => { void refresh(); });
        window.addEventListener('beforeunload', warnUnsaved);
        void refresh();
      }
      return () => { listeners.delete(listener); };
    },
    update(change: (latest: T) => T) {
      if (!state.ready) return;
      pending.push({ id: ++sequence, change });
      publish({ value: change(state.value) });
      void flush();
    },
    retry() {
      if (pending.length) return flush();
      publish({ status: state.ready ? 'saving' : 'loading' });
      return refresh();
    },
    async close() { unsubscribe?.(); unsubscribe = null; window.removeEventListener('beforeunload', warnUnsaved); listeners.clear(); await running; },
  };
}

export function createProgressClient(storage: Storage = progressStorage) {
  const records = new Map<ProgressKey, ReturnType<typeof createRecordSession<unknown>>>();
  return {
    record<T>(key: ProgressKey, parse: (raw: string | null) => T) {
      if (!records.has(key)) records.set(key, createRecordSession(key, parse, storage) as ReturnType<typeof createRecordSession<unknown>>);
      return records.get(key)! as ReturnType<typeof createRecordSession<T>>;
    },
    async close() {
      await Promise.all([...records.values()].map(record => record.close()));
      records.clear();
      await storage.close();
    },
  };
}

export const progressClient = createProgressClient();
