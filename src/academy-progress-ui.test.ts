import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire, registerHooks } from 'node:module';
import ts from 'typescript';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { progressClient } from './academy/progress-session.ts';
import { progressStorage, createProgressStorage, courseStorageKey as courseKey, planStorageKey as planKey } from './academy/progress-storage.ts';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLDialogElement', 'Event'] as const) Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true });
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
Object.defineProperty(globalThis, 'localStorage', { value: dom.window.localStorage, configurable: true });
Object.defineProperty(dom.window, 'matchMedia', { value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }), configurable: true });
dom.window.scrollTo = () => {};
HTMLDialogElement.prototype.showModal = function () { this.open = true; };
HTMLDialogElement.prototype.close = function () { this.open = false; };
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/.test(specifier) && context.parentURL) {
      for (const extension of ['.ts', '.tsx']) {
        const url = new URL(`${specifier}${extension}`, context.parentURL);
        if (existsSync(url)) return nextResolve(url.href, context);
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith('.css')) return { format: 'module', source: 'export default {};', shortCircuit: true };
    if (url.endsWith('.tsx')) return { format: 'module', source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 } }).outputText, shortCircuit: true };
    return nextLoad(url, context);
  },
});
const { createElement, act } = await import('react');
const { createRoot } = await import('react-dom/client');
const { default: Academy } = await import('./academy/Academy.tsx');
const { default: LearningLab } = await import('./academy/LearningLabs.tsx');
const container = document.getElementById('root')!;
let root = createRoot(container);
const initialCourse = { answers: {}, notes: {}, lastLesson: 'foundation' };
const initialPlan = { goal: '', horizon: 10, checks: [] as string[], rule: '' };
class TestChannel {
  static channels = new Set<TestChannel>();
  listeners = new Set<() => void>();
  name: string;
  constructor(name: string) { this.name = name; TestChannel.channels.add(this); }
  addEventListener(_type: string, listener: () => void) { this.listeners.add(listener); }
  postMessage() { for (const channel of TestChannel.channels) if (channel !== this && channel.name === this.name) queueMicrotask(() => channel.listeners.forEach(listener => listener())); }
  close() { TestChannel.channels.delete(this); }
}
Object.defineProperty(dom.window, 'BroadcastChannel', { value: TestChannel, configurable: true });
let indexedDB: IDBFactory;

beforeEach(async () => {
  await act(async () => root.unmount());
  await progressClient.close();
  root = createRoot(container);
  localStorage.clear();
  indexedDB = new IDBFactory();
  Object.defineProperty(globalThis, 'indexedDB', { value: indexedDB, configurable: true });
  window.history.replaceState(null, '', '#foundation');
});
after(async () => { await act(async () => root.unmount()); await progressClient.close(); hooks.deregister(); dom.window.close(); });

async function waitFor(check: () => boolean) {
  for (let attempt = 0; attempt < 100; attempt++) {
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 1)); });
    if (check()) return;
  }
  assert.ok(check(), `Timed out waiting for UI. ${container.textContent?.slice(-800)}`);
}
const settled = () => waitFor(() => !/(?:Saving|Loading) (?:draft|progress)|(?:Saving|Loading)…/.test(container.textContent ?? ''));
async function fill(selector: string, value: string) {
  const input = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  assert.ok(input, `Missing field ${selector}`);
  await act(async () => {
    const prototype = input instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await settled();
}
async function saved(key: typeof courseKey | typeof planKey) {
  const snapshot = await act(async () => progressStorage.read(key));
  return snapshot.raw ? JSON.parse(snapshot.raw) : key === courseKey ? initialCourse : initialPlan;
}
function otherTab(t: { after: (cleanup: () => Promise<void>) => void }) {
  const storage = createProgressStorage({ indexedDB, legacyStorage: localStorage });
  const unsubscribe = storage.subscribe(() => {});
  t.after(async () => { unsubscribe(); await storage.close(); });
  return storage;
}
const parseCourse = (raw: string | null) => raw ? JSON.parse(raw) as typeof initialCourse : initialCourse;
const parsePlan = (raw: string | null) => raw ? JSON.parse(raw) as typeof initialPlan : initialPlan;

test('legacy notes, answers and plan migrate without clearing either record', async () => {
  const course = { ...initialCourse, answers: { stocks: { 0: 1 } }, notes: { foundation: 'Legacy note' } };
  const plan = { ...initialPlan, goal: 'Legacy goal', checks: ['debt'] };
  localStorage.setItem(courseKey, JSON.stringify(course));
  localStorage.setItem(planKey, JSON.stringify(plan));
  await act(async () => root.render(createElement(Academy)));
  await settled();
  assert.equal(container.querySelector<HTMLTextAreaElement>('#academy-note')!.value, 'Legacy note');
  assert.deepEqual(await saved(courseKey), course);
  assert.deepEqual(await saved(planKey), plan);
  assert.deepEqual(JSON.parse(localStorage.getItem(courseKey)!), course);
});

test('Academy restores its last lesson from IndexedDB rather than an obsolete legacy copy', async () => {
  localStorage.setItem(courseKey, JSON.stringify(initialCourse));
  await progressStorage.update(courseKey, null, parseCourse, [() => ({ ...initialCourse, notes: { stocks: 'Stored note' }, lastLesson: 'stocks' })]);
  window.history.replaceState(null, '', '/');
  await act(async () => root.render(createElement(Academy)));
  await settled();
  await waitFor(() => window.location.hash === '#stocks');
  assert.equal(container.querySelector<HTMLTextAreaElement>('#academy-note')!.value, 'Stored note');
  assert.equal((await saved(courseKey)).lastLesson, 'stocks');
});

test('a notebook edit preserves another tab’s notes and answers through transactional field merges', async t => {
  await act(async () => root.render(createElement(Academy)));
  await settled();
  const remote = otherTab(t);
  await act(async () => {
    await remote.update(courseKey, 0, parseCourse, [latest => ({ ...latest, answers: { stocks: { 0: 1 } }, notes: { stocks: 'Ownership note' } })]);
  });
  await fill('#academy-note', 'Foundation note');
  assert.deepEqual((await saved(courseKey)).notes, { stocks: 'Ownership note', foundation: 'Foundation note' });
  const firstChoice = container.querySelector<HTMLInputElement>('input[name="foundation-question-0"]')!;
  await act(async () => firstChoice.click());
  const check = [...container.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.startsWith('Check answer'))!;
  await act(async () => check.click());
  await settled();
  assert.deepEqual((await saved(courseKey)).answers, { stocks: { 0: 1 }, foundation: { 0: 0 } });
});

test('cross-tab notifications refresh notes and quiz answers from the database', async t => {
  await act(async () => root.render(createElement(Academy)));
  await settled();
  const remote = otherTab(t);
  await act(async () => { await remote.update(courseKey, 0, parseCourse, [latest => ({ ...latest, answers: { foundation: { 0: 1 } }, notes: { foundation: 'Latest note' } })]); });
  await waitFor(() => container.querySelector<HTMLTextAreaElement>('#academy-note')!.value === 'Latest note');
  assert.equal(container.querySelector<HTMLInputElement>('input[name="foundation-question-0"][value="1"]')!.checked, true);
});

test('practice plan edits preserve independent changes from another tab', async t => {
  await act(async () => root.render(createElement(LearningLab, { lessonId: 'plan' })));
  await settled();
  const remote = otherTab(t);
  await act(async () => { await remote.update(planKey, 0, parsePlan, [latest => ({ ...latest, horizon: 23, checks: ['debt'], rule: 'Review my time horizon.' })]); });
  await fill('input[type="text"]', 'Retirement');
  assert.deepEqual(await saved(planKey), { goal: 'Retirement', horizon: 23, checks: ['debt'], rule: 'Review my time horizon.' });
});

test('an external reset clears an open plan and subsequent edits start with its defaults', async t => {
  localStorage.setItem(planKey, JSON.stringify({ goal: 'Old goal', horizon: 25, checks: ['debt', 'loss'], rule: 'Old rule' }));
  await act(async () => root.render(createElement(LearningLab, { lessonId: 'plan' })));
  await settled();
  await act(async () => { await otherTab(t).reset(); });
  await waitFor(() => container.querySelector<HTMLInputElement>('input[type="text"]')!.value === '');
  assert.equal(container.querySelector<HTMLInputElement>('input[type="range"]')!.value, '10');
  assert.equal(container.querySelectorAll('input[type="checkbox"]:checked').length, 0);
  await fill('input[type="text"]', 'New goal');
  assert.deepEqual(await saved(planKey), { ...initialPlan, goal: 'New goal' });
});

test('course reset clears notes, checked answers and the plan in one transaction', async () => {
  localStorage.setItem(courseKey, JSON.stringify({ ...initialCourse, answers: { foundation: { 0: 1 } }, notes: { foundation: 'Old note' } }));
  localStorage.setItem(planKey, JSON.stringify({ ...initialPlan, goal: 'Old goal' }));
  await act(async () => root.render(createElement(Academy)));
  await settled();
  await act(async () => container.querySelector<HTMLButtonElement>('.academy-reset .academy-primary')!.click());
  await waitFor(() => container.querySelector<HTMLTextAreaElement>('#academy-note')!.value === '');
  assert.deepEqual(await saved(courseKey), initialCourse);
  assert.deepEqual(await saved(planKey), initialPlan);
  assert.equal(container.querySelectorAll('.academy-question input:checked').length, 0);
});

test('failed saves preserve multiple draft fields and retry them over a newer remote record', async t => {
  localStorage.setItem(planKey, JSON.stringify({ ...initialPlan, goal: 'Saved goal' }));
  await act(async () => root.render(createElement(LearningLab, { lessonId: 'plan' })));
  await settled();
  const remote = otherTab(t);
  const put = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function () { throw new DOMException('Quota exceeded', 'QuotaExceededError'); };
  try {
    await fill('input[type="text"]', 'Unsaved goal');
    await fill('textarea', 'Unsaved rule');
    assert.equal(container.querySelector<HTMLInputElement>('input[type="text"]')!.value, 'Unsaved goal');
    assert.equal(container.querySelector<HTMLTextAreaElement>('textarea')!.value, 'Unsaved rule');
    assert.match(container.textContent!, /could not be saved/);
    const leaving = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(leaving);
    assert.equal(leaving.defaultPrevented, true);
    assert.deepEqual(await saved(planKey), { ...initialPlan, goal: 'Saved goal' });
  } finally { IDBObjectStore.prototype.put = put; }
  await act(async () => { await remote.update(planKey, 0, parsePlan, [latest => ({ ...latest, horizon: 32, checks: ['debt'] })]); });
  await waitFor(() => container.querySelector<HTMLInputElement>('input[type="range"]')!.value === '32');
  assert.equal(container.querySelector<HTMLInputElement>('input[type="text"]')!.value, 'Unsaved goal');
  assert.equal(container.querySelector<HTMLTextAreaElement>('textarea')!.value, 'Unsaved rule');
  await act(async () => [...container.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === 'Retry saving')!.click());
  await settled();
  assert.deepEqual(await saved(planKey), { goal: 'Unsaved goal', horizon: 32, checks: ['debt'], rule: 'Unsaved rule' });
  const leaving = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(leaving);
  assert.equal(leaving.defaultPrevented, false);
});

test('reset in another tab discards failed pre-reset edits instead of restoring them on retry', async t => {
  localStorage.setItem(planKey, JSON.stringify({ ...initialPlan, goal: 'Old goal' }));
  await act(async () => root.render(createElement(LearningLab, { lessonId: 'plan' })));
  await settled();
  const remote = otherTab(t);
  const put = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function () { throw new DOMException('Quota exceeded', 'QuotaExceededError'); };
  try { await fill('textarea', 'Unsaved old rule'); }
  finally { IDBObjectStore.prototype.put = put; }
  await act(async () => { await remote.reset(); });
  await waitFor(() => container.querySelector<HTMLTextAreaElement>('textarea')!.value === '');
  await fill('input[type="text"]', 'New goal');
  assert.deepEqual(await saved(planKey), { ...initialPlan, goal: 'New goal' });
});

test('an unavailable database blocks edits until an explicit retry loads the saved record', async () => {
  localStorage.setItem(planKey, JSON.stringify({ ...initialPlan, goal: 'Saved goal' }));
  Object.defineProperty(globalThis, 'indexedDB', { value: { open() { throw new Error('Database blocked'); } }, configurable: true });
  await act(async () => root.render(createElement(LearningLab, { lessonId: 'plan' })));
  await settled();
  assert.equal(container.querySelector<HTMLInputElement>('input[type="text"]')!.disabled, true);
  assert.equal(container.querySelector<HTMLInputElement>('input[type="text"]')!.value, '');
  assert.match(container.textContent!, /could not be loaded/);
  Object.defineProperty(globalThis, 'indexedDB', { value: indexedDB, configurable: true });
  const read = progressStorage.read;
  let release: (() => void) | undefined;
  progressStorage.read = key => new Promise((resolve, reject) => { release = () => { void read(key).then(resolve, reject); }; });
  try {
    await act(async () => [...container.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === 'Retry loading')!.click());
    assert.match(container.textContent!, /Loading draft/);
    assert.equal(container.querySelector<HTMLInputElement>('input[type="text"]')!.disabled, true);
    assert.ok(release);
    await act(async () => release!());
    await settled();
    assert.equal(container.querySelector<HTMLInputElement>('input[type="text"]')!.disabled, false);
    assert.equal(container.querySelector<HTMLInputElement>('input[type="text"]')!.value, 'Saved goal');
  } finally { progressStorage.read = read; }
  await fill('textarea', 'New rule');
  assert.deepEqual(await saved(planKey), { ...initialPlan, goal: 'Saved goal', rule: 'New rule' });
});

test('a failed practice-plan draft survives switching lessons and saves after returning', async () => {
  await act(async () => root.render(createElement(LearningLab, { lessonId: 'plan' })));
  await settled();
  const put = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function () { throw new DOMException('Quota exceeded', 'QuotaExceededError'); };
  try {
    await fill('input[type="text"]', 'Keep my unsaved goal');
    await fill('textarea', 'Keep my unsaved rule');
    await act(async () => root.render(createElement(LearningLab, { lessonId: 'stocks' })));
    await act(async () => root.render(createElement(LearningLab, { lessonId: 'plan' })));
    assert.equal(container.querySelector<HTMLInputElement>('input[type="text"]')!.value, 'Keep my unsaved goal');
    assert.equal(container.querySelector<HTMLTextAreaElement>('textarea')!.value, 'Keep my unsaved rule');
    assert.match(container.textContent!, /could not be saved/);
  } finally { IDBObjectStore.prototype.put = put; }
  await act(async () => [...container.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === 'Retry saving')!.click());
  await settled();
  assert.deepEqual(await saved(planKey), { ...initialPlan, goal: 'Keep my unsaved goal', rule: 'Keep my unsaved rule' });
});

test('initial loading neither displays stale legacy values nor accepts edits before reading IndexedDB', async () => {
  localStorage.setItem(planKey, JSON.stringify({ ...initialPlan, goal: 'Pre-reset legacy goal' }));
  await progressStorage.read(planKey);
  await progressStorage.reset();
  const read = progressStorage.read;
  let release: (() => void) | undefined;
  progressStorage.read = key => new Promise((resolve, reject) => { release = () => { void read(key).then(resolve, reject); }; });
  try {
    await act(async () => root.render(createElement(LearningLab, { lessonId: 'plan' })));
    const input = container.querySelector<HTMLInputElement>('input[type="text"]')!;
    assert.equal(input.value, '');
    assert.equal(input.disabled, true);
    assert.match(container.textContent!, /Loading draft/);
    assert.ok(release);
    await act(async () => release!());
    await settled();
    assert.equal(input.disabled, false);
    assert.equal(input.value, '');
  } finally { progressStorage.read = read; }
});

test('retrying a failed background read reloads saved progress and later edits still persist', async () => {
  await act(async () => root.render(createElement(LearningLab, { lessonId: 'plan' })));
  await settled();
  const read = progressStorage.read;
  let retryReads = 0;
  let release: (() => void) | undefined;
  progressStorage.read = async () => { throw new Error('Read unavailable'); };
  try {
    await act(async () => window.dispatchEvent(new Event('focus')));
    await settled();
    assert.match(container.textContent!, /could not be saved/);
    progressStorage.read = key => {
      retryReads++;
      return new Promise((resolve, reject) => { release = () => { void read(key).then(resolve, reject); }; });
    };
    await act(async () => [...container.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === 'Retry saving')!.click());
    assert.match(container.textContent!, /Saving draft/);
    assert.equal(container.querySelector<HTMLInputElement>('input[type="text"]')!.disabled, false);
    assert.ok(release);
    await act(async () => release!());
    await settled();
    assert.equal(retryReads, 1, 'retry reads the stored record even when there are no pending edits');
    progressStorage.read = read;
    await fill('input[type="text"]', 'Goal after storage recovered');
    assert.deepEqual(await saved(planKey), { ...initialPlan, goal: 'Goal after storage recovered' });
  } finally { progressStorage.read = read; }
});
