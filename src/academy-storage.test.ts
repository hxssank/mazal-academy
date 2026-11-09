import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { courseStorageKey, planStorageKey, createProgressStorage } from './academy/progress-storage.ts';

const parse = (raw: string | null): Record<string, string> => raw ? JSON.parse(raw) : {};
function clients(t: { after: (cleanup: () => Promise<void>) => void }, legacy = new Map<string, string>()) {
  const indexedDB = new IDBFactory();
  const options = { indexedDB, legacyStorage: { getItem: (key: string) => legacy.get(key) ?? null } };
  const first = createProgressStorage(options);
  const second = createProgressStorage(options);
  t.after(async () => { await first.close(); await second.close(); });
  return { first, second, legacy };
}

test('two initial readers migrate both legacy records once in a transaction', async t => {
  const legacy = new Map([[courseStorageKey, '{"note":"Existing course"}'], [planStorageKey, '{"goal":"Existing plan"}']]);
  const { first, second } = clients(t, legacy);
  const [course, plan] = await Promise.all([first.read(courseStorageKey), second.read(planStorageKey)]);
  assert.equal(course.raw, legacy.get(courseStorageKey));
  assert.equal(plan.raw, legacy.get(planStorageKey));
  assert.equal(course.epoch, 0);
  legacy.set(courseStorageKey, '{"note":"Obsolete localStorage write"}');
  assert.deepEqual(parse((await second.read(courseStorageKey)).raw), { note: 'Existing course' });
  assert.equal(legacy.get(planStorageKey), '{"goal":"Existing plan"}');
});

test('simultaneous transactions from independent tabs preserve every distinct field', async t => {
  const { first, second } = clients(t);
  await Promise.all([first.read(courseStorageKey), second.read(courseStorageKey)]);
  await Promise.all(Array.from({ length: 40 }, (_, index) => (index % 2 ? first : second).update(courseStorageKey, 0, parse, [latest => ({ ...latest, [`note-${index}`]: `Value ${index}` })])));
  const result = await first.read(courseStorageKey);
  assert.equal(result.revision, 40);
  assert.deepEqual(parse(result.raw), Object.fromEntries(Array.from({ length: 40 }, (_, index) => [`note-${index}`, `Value ${index}`])));
});

test('simultaneous course and plan transactions preserve both records', async t => {
  const { first, second } = clients(t);
  await Promise.all([
    first.update(courseStorageKey, null, parse, [latest => ({ ...latest, note: 'My note' })]),
    second.update(planStorageKey, null, parse, [latest => ({ ...latest, goal: 'My goal' })]),
  ]);
  assert.deepEqual(parse((await first.read(courseStorageKey)).raw), { note: 'My note' });
  assert.deepEqual(parse((await first.read(planStorageKey)).raw), { goal: 'My goal' });
});

test('reset clears both records atomically and rejects queued edits from the old generation', async t => {
  const { first, second } = clients(t);
  await first.update(planStorageKey, 0, parse, [() => ({ goal: 'Old goal' })]);
  await second.read(courseStorageKey);
  const [, , stale] = await Promise.all([
    first.update(courseStorageKey, 0, parse, [latest => ({ ...latest, note: 'Before reset' })]),
    second.reset(),
    first.update(planStorageKey, 0, parse, [latest => ({ ...latest, goal: 'Queued old goal' })]),
  ]);
  assert.equal(stale.reset, true);
  const course = await first.read(courseStorageKey);
  const plan = await first.read(planStorageKey);
  assert.equal(course.raw, null);
  assert.equal(plan.raw, null);
  assert.equal(course.epoch, 1);
  assert.equal(plan.epoch, 1);
  await second.update(planStorageKey, 1, parse, [latest => ({ ...latest, goal: 'After reset' })]);
  assert.deepEqual(parse((await first.read(planStorageKey)).raw), { goal: 'After reset' });
});

test('a failed reset leaves both records and the reset generation unchanged', async t => {
  const { first } = clients(t, new Map([[courseStorageKey, '{"note":"Keep note"}'], [planStorageKey, '{"goal":"Keep goal"}']]));
  await first.read(courseStorageKey);
  const put = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function () { throw new DOMException('Quota exceeded', 'QuotaExceededError'); };
  try { await assert.rejects(first.reset(), /Quota exceeded/); }
  finally { IDBObjectStore.prototype.put = put; }
  assert.deepEqual(await first.read(courseStorageKey), { raw: '{"note":"Keep note"}', revision: 0, epoch: 0 });
  assert.deepEqual(await first.read(planStorageKey), { raw: '{"goal":"Keep goal"}', revision: 0, epoch: 0 });
});

test('failed legacy reads abort migration so a later retry can still import existing progress', async t => {
  const indexedDB = new IDBFactory();
  let readable = false;
  const storage = createProgressStorage({ indexedDB, legacyStorage: { getItem: key => {
    if (!readable) throw new Error('Storage blocked');
    return key === courseStorageKey ? '{"note":"Recovered legacy note"}' : null;
  } } });
  t.after(() => storage.close());
  await assert.rejects(storage.read(courseStorageKey), /Storage blocked/);
  readable = true;
  assert.deepEqual(parse((await storage.read(courseStorageKey)).raw), { note: 'Recovered legacy note' });
});
