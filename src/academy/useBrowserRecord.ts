import { useMemo, useSyncExternalStore } from 'react';
import { progressClient } from './progress-session.ts';
import type { ProgressKey } from './progress-storage.ts';

export function useBrowserRecord<T>(key: ProgressKey, parse: (raw: string | null) => T) {
  const record = useMemo(() => progressClient.record(key, parse), [key, parse]);
  const state = useSyncExternalStore(record.subscribe, record.getSnapshot);
  return [state.value, record.update, state.status, record.retry, state.epoch, state.ready] as const;
}
