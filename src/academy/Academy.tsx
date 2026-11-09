import { useEffect, useRef, useState } from 'react';
import { lessons, type Lesson } from './curriculum.ts';
import LearningLab from './LearningLabs.tsx';
import { useBrowserRecord } from './useBrowserRecord.ts';
import { courseStorageKey, progressStorage } from './progress-storage.ts';

type CourseProgress = { answers: Record<string, Record<string, number>>; notes: Record<string, string>; lastLesson: string };
const emptyProgress = (): CourseProgress => ({ answers: {}, notes: {}, lastLesson: 'foundation' });

function parseProgress(raw: string | null): CourseProgress {
  try {
    const saved: unknown = JSON.parse(raw ?? 'null');
    if (!saved || typeof saved !== 'object') return emptyProgress();
    const value = saved as Partial<CourseProgress>;
    const clean = emptyProgress();
    for (const lesson of lessons) {
      if (value.notes && typeof value.notes[lesson.id] === 'string') clean.notes[lesson.id] = value.notes[lesson.id].slice(0, 5000);
      for (let index = 0; index < lesson.quiz.length; index++) {
        const answer = value.answers?.[lesson.id]?.[index];
        if (typeof answer === 'number' && Number.isInteger(answer) && answer >= 0 && answer < lesson.quiz[index].options.length) {
          clean.answers[lesson.id] ??= {};
          clean.answers[lesson.id][index] = answer;
        }
      }
    }
    if (lessons.some(lesson => lesson.id === value.lastLesson)) clean.lastLesson = value.lastLesson!;
    return clean;
  } catch { return emptyProgress(); }
}

function isComplete(lesson: Lesson, progress: CourseProgress): boolean {
  return lesson.quiz.every((question, index) => progress.answers[lesson.id]?.[index] === question.correct);
}

function Mark({ name, size = 20 }: { name: 'arrow' | 'book' | 'check' | 'close' | 'menu' | 'external' | 'lab'; size?: number }) {
  const paths = {
    arrow: 'M4 12h15m-6-6 6 6-6 6', book: 'M12 5v15M3 4h5c2 0 4 1 4 3 0-2 2-3 4-3h5v15h-5c-2 0-4 1-4 2 0-1-2-2-4-2H3Z',
    check: 'm5 12 4 4L19 6', close: 'm6 6 12 12M6 18 18 6', menu: 'M4 6h16M4 12h16M4 18h16', external: 'M8 5H4v15h15v-5M12 4h8v8M10 14 20 4',
    lab: 'M9 3h6M10 3v7L4 19c-.5 1 .5 2 2 2h12c1.5 0 2.5-1 2-2l-6-9V3M8 15h8',
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function Quiz({ lesson, answers, onAnswer, disabled }: { lesson: Lesson; disabled: boolean; answers: Record<string, number>; onAnswer: (index: number, answer: number) => void }) {
  const [selected, setSelected] = useState<Record<string, number>>({});
  return <div className="academy-quiz-grid">{lesson.quiz.map((question, index) => {
    const checked = answers[index] !== undefined;
    const correct = answers[index] === question.correct;
    const choice = checked ? answers[index] : selected[index];
    return <fieldset disabled={disabled} className={`academy-question ${checked ? correct ? 'is-correct' : 'is-incorrect' : ''}`} key={index}>
      <legend><span className="academy-question-number">0{index + 1}</span>{question.question}</legend>
      <div className="academy-options">{question.options.map((option, optionIndex) => <label className={`academy-option ${choice === optionIndex ? 'is-selected' : ''}`} key={option}>
        <input type="radio" name={`${lesson.id}-question-${index}`} value={optionIndex} checked={choice === optionIndex} disabled={checked} onChange={() => setSelected(current => ({ ...current, [index]: optionIndex }))} />
        <span>{option}</span>{checked && optionIndex === question.correct && <Mark name="check" size={17} />}
      </label>)}</div>
      {checked ? <div className="academy-answer" role="status"><strong>{correct ? "That's right." : "Let's work through it."}</strong><p>{question.explanation}</p>{!correct && <button className="academy-text-button" onClick={() => { onAnswer(index, -1); setSelected(current => { const next = { ...current }; delete next[index]; return next; }); }}>Try again <Mark name="arrow" size={16} /></button>}</div> : <button className="academy-secondary" disabled={choice === undefined} onClick={() => onAnswer(index, choice)}>Check answer <Mark name="arrow" size={16} /></button>}
    </fieldset>;
  })}</div>;
}

export default function Academy() {
  const [progress, updateProgress, progressStatus, retrySaving, courseGeneration, ready] = useBrowserRecord(courseStorageKey, parseProgress);
  const [lessonId, setLessonId] = useState(() => {
    const hash = window.location.hash.slice(1);
    return lessons.some(lesson => lesson.id === hash) ? hash : '';
  });
  const [resetError, setResetError] = useState(false);
  const [resetting, setResetting] = useState(false);
  const storageError = progressStatus === 'error';
  const saved = progressStatus === 'saved';
  const [mobileNav, setMobileNav] = useState(false);
  const [glossaryQuery, setGlossaryQuery] = useState('');
  const glossaryRef = useRef<HTMLDialogElement>(null);
  const resetRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const firstLessonRender = useRef(true);
  const lesson = lessons.find(item => item.id === lessonId) ?? lessons[0];
  const lessonIndex = lessons.indexOf(lesson);
  const completed = lessons.filter(item => isComplete(item, progress)).length;
  const complete = isComplete(lesson, progress);
  const groups = [...new Set(lessons.map(item => item.group))];
  const terms = lessons.flatMap(item => item.terms.map(term => ({ ...term, lesson: item }))).filter((term, index, list) => list.findIndex(item => item.term.toLowerCase() === term.term.toLowerCase()) === index).sort((a, b) => a.term.localeCompare(b.term));
  const matchingTerms = terms.filter(term => `${term.term} ${term.definition}`.toLowerCase().includes(glossaryQuery.toLowerCase()));

  useEffect(() => {
    const update = () => {
      const hash = window.location.hash.slice(1);
      setLessonId(lessons.some(item => item.id === hash) ? hash : lessons[0].id);
      setMobileNav(false);
    };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => {
    if (!lessonId && ready) {
      setLessonId(progress.lastLesson);
      window.history.replaceState(null, '', `#${progress.lastLesson}`);
    }
  }, [lessonId, progress.lastLesson, ready]);
  useEffect(() => {
    if (!lessonId || !ready) return;
    document.title = `${lesson.shortTitle} · Mazal Academy`;
    updateProgress(current => current.lastLesson === lesson.id ? current : { ...current, lastLesson: lesson.id });
    if (firstLessonRender.current) { firstLessonRender.current = false; return; }
    window.scrollTo({ top: 0, behavior: 'instant' });
    titleRef.current?.focus({ preventScroll: true });
  }, [lessonId, lesson.id, lesson.shortTitle, updateProgress, ready]);

  function navigate(id: string) {
    setMobileNav(false);
    if (window.location.hash !== `#${id}`) window.location.hash = id;
    else { window.scrollTo({ top: 0, behavior: 'instant' }); titleRef.current?.focus({ preventScroll: true }); }
  }
  function answer(index: number, choice: number) {
    updateProgress(current => {
      const answers = { ...current.answers[lesson.id] };
      if (choice < 0) delete answers[index]; else answers[index] = choice;
      return { ...current, answers: { ...current.answers, [lesson.id]: answers } };
    });
  }
  function jump(id: string) {
    const element = document.getElementById(id);
    element?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    element?.focus({ preventScroll: true });
  }
  async function reset() {
    setResetting(true);
    try {
      await progressStorage.reset();
      setResetError(false);
      resetRef.current?.close();
      navigate('foundation');
    } catch { setResetError(true); }
    finally { setResetting(false); }
  }

  return <div className="academy-app">
    <a className="academy-skip" href="#lesson-content" onClick={event => { event.preventDefault(); titleRef.current?.focus(); }}>Skip to lesson</a>
    <header className="academy-header">
      <button className="academy-brand" onClick={() => navigate('foundation')} aria-label="Mazal Academy, first lesson"><span className="academy-brand-symbol" aria-hidden="true"><svg viewBox="0 0 28 28" fill="none"><path d="M3 22V7l7 8 5-10 10 17M3 22l7-7 5 7 10-15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg></span><span>MAZAL<span className="academy-brand-divider">/</span><span className="academy-brand-sub">ACADEMY</span></span></button>
      <span className="academy-header-topic">An investor's education</span>
      <div className="academy-header-actions"><button className="academy-glossary-button" aria-label="Glossary" onClick={() => glossaryRef.current?.showModal()}><Mark name="book" size={17} /><span>Glossary</span></button><button className="academy-menu-button" aria-label="Lessons" aria-expanded={mobileNav} aria-controls="academy-course" onClick={() => setMobileNav(!mobileNav)}><Mark name={mobileNav ? 'close' : 'menu'} /><span>Lessons</span></button></div>
    </header>
    <div className="academy-layout">
      <aside className={`academy-sidebar ${mobileNav ? 'is-open' : ''}`} id="academy-course">
        <div className="academy-course-heading"><p className="academy-overline">YOUR LEARNING PATH</p><h2>Investing from<br />the foundations.</h2><p>Build understanding.<br />Test it with real numbers.</p></div>
        <div className="academy-progress"><div><span>Course progress</span><strong>{completed}<span> / {lessons.length}</span></strong></div><progress value={completed} max={lessons.length} aria-label={`${completed} of ${lessons.length} lessons completed`} /></div>
        <nav aria-label="Course lessons">{groups.map((group, groupIndex) => <div className="academy-nav-group" key={group}><h3><span>0{groupIndex + 1}</span>{group}</h3>{lessons.filter(item => item.group === group).map(item => {
          const index = lessons.indexOf(item);
          const done = isComplete(item, progress);
          return <button key={item.id} className={`academy-lesson-link ${lesson.id === item.id ? 'is-active' : ''} ${done ? 'is-done' : ''}`} aria-current={lesson.id === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}><span className="academy-lesson-marker">{done ? <Mark name="check" size={14} /> : String(index + 1).padStart(2, '0')}</span><span>{item.shortTitle}<small>{item.minutes} min{done ? ' · Completed' : ''}</small></span>{lesson.id === item.id && <span className="academy-active-dot" />}</button>;
        })}</div>)}</nav>
        <div className="academy-sidebar-foot"><span className="academy-local-mark" aria-hidden="true" />{storageError ? 'Progress is not saving' : saved ? 'Progress saved in this browser' : ready ? 'Saving progress…' : 'Loading progress…'}<button onClick={() => resetRef.current?.showModal()}>Reset course</button></div>
      </aside>
      <main className="academy-main" id="lesson-content">
        <div className="academy-breadcrumb"><span>{lesson.group}</span><span>/</span><span>Lesson {String(lessonIndex + 1).padStart(2, '0')}</span><span className="academy-reading-time">{lesson.minutes} min · Learn by doing</span></div>
        {storageError && <p className="academy-storage-error" role="alert">{ready ? 'Your browser could not save progress. Keep this tab open to retain your work in this session.' : 'Your saved progress could not be loaded. Retry before editing.'} <button className="academy-text-button" onClick={() => void retrySaving()}>{ready ? 'Retry saving' : 'Retry loading'}</button></p>}
        <section className="academy-lesson-header"><div><p className="academy-overline">{lesson.kicker}</p><h1 ref={titleRef} tabIndex={-1}>{lesson.title}</h1><p className="academy-intro">{lesson.intro}</p></div><span className="academy-large-number" aria-hidden="true">{String(lessonIndex + 1).padStart(2, '0')}</span></section>
        <nav className="academy-section-nav" aria-label="Within this lesson"><button onClick={() => jump('academy-understand')}><span>01</span>Understand</button><button onClick={() => jump('academy-experiment')}><span>02</span>Experiment</button><button onClick={() => jump('academy-check')}><span>03</span>Check yourself{complete && <Mark name="check" size={15} />}</button></nav>
        <div className="academy-learning-grid" key={`${lesson.id}-${courseGeneration}`}>
          <section className="academy-understand" id="academy-understand" tabIndex={-1}><div className="academy-section-heading"><span className="academy-section-icon"><Mark name="book" size={17} /></span><h2>The idea</h2></div><div className="academy-concepts">{lesson.concepts.map((concept, index) => <article key={concept.title}><span className="academy-concept-index">{String(index + 1).padStart(2, '0')}</span><div><h3>{concept.title}</h3><p>{concept.text}</p></div></article>)}</div><div className="academy-takeaway"><p className="academy-overline">TAKE THIS WITH YOU</p><p>{lesson.takeaway}</p></div></section>
          <section className="academy-experiment" id="academy-experiment" tabIndex={-1}><div className="academy-experiment-heading"><span><Mark name="lab" size={18} />The experiment</span><span className="academy-interactive-label">Interactive</span></div><LearningLab lessonId={lesson.id} /></section>
        </div>
        <section className="academy-terms"><p className="academy-overline">WORDS YOU NOW KNOW</p><div>{lesson.terms.map(term => <details key={term.term}><summary>{term.term}<span aria-hidden="true">+</span></summary><p>{term.definition}</p></details>)}</div></section>
        <section className="academy-check" id="academy-check" tabIndex={-1}><div className="academy-check-heading"><div><p className="academy-overline">MAKE IT STICK</p><h2>Check your understanding.</h2></div><p>Answer both questions to complete this lesson.<br />You can retry as often as you need.</p></div><Quiz key={`${lesson.id}-${courseGeneration}`} lesson={lesson} disabled={!ready} answers={progress.answers[lesson.id] ?? {}} onAnswer={answer} /></section>
        <section className="academy-reflection"><label htmlFor="academy-note"><span className="academy-overline">YOUR NOTEBOOK</span><strong>Explain it in your own words.</strong><span>What changed in the experiment, and why?</span></label><div><textarea disabled={!ready} id="academy-note" maxLength={5000} rows={3} placeholder="One idea I want to remember…" value={progress.notes[lesson.id] ?? ''} onChange={event => { const note = event.target.value; updateProgress(current => ({ ...current, notes: { ...current.notes, [lesson.id]: note } })); }} /><span className="academy-note-status">{storageError ? 'Not saved' : saved ? 'Saved in this browser' : ready ? 'Saving…' : 'Loading…'} · {(progress.notes[lesson.id] ?? '').length}/5000</span></div></section>
        <div className="academy-lesson-bottom"><div className={`academy-completion ${complete ? 'is-complete' : ''}`}>{complete ? <><span><Mark name="check" /></span><div><strong>{completed === lessons.length ? 'Course completed.' : 'Lesson completed.'}</strong><p>{completed === lessons.length ? 'Revisit any experiment or keep refining your practice plan.' : !saved ? 'Completed for this session. Progress is not saved yet.' : 'Your progress has been recorded in this browser.'}</p></div></> : <p>{progress.answers[lesson.id] ? 'Keep going. Both correct answers complete the lesson.' : 'Every lesson is open. Learn in order or follow your curiosity.'}</p>}</div>{lessonIndex < lessons.length - 1 ? <button className="academy-primary" onClick={() => navigate(lessons[lessonIndex + 1].id)}><span><small>Up next</small>{lessons[lessonIndex + 1].shortTitle}</span><Mark name="arrow" /></button> : <button className="academy-primary" onClick={() => navigate(lessons.find(item => !isComplete(item, progress))?.id ?? 'foundation')}>{completed === lessons.length ? 'Revisit the foundations' : 'Continue unfinished lessons'}<Mark name="arrow" /></button>}</div>
        <details className="academy-sources"><summary>Sources & further reading<span>+</span></summary><p>Use these references to check the ideas in this lesson.</p><ul>{lesson.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}<Mark name="external" size={14} /></a></li>)}</ul>{lesson.id === 'economy' && <p className="academy-source-inspiration">Visual inspiration from <a href="https://www.youtube.com/watch?v=u70oUWgVoYU" target="_blank" rel="noreferrer">the Bravos Research video you shared</a>. The debt-and-rates diagram is a starting point. The sources above explain the underlying mechanics.</p>}</details>
        <footer className="academy-footer"><span>MAZAL ACADEMY</span><p>Educational examples. Hypothetical returns. No connection to your financial accounts.</p></footer>
      </main>
    </div>
    <dialog className="academy-dialog academy-glossary" ref={glossaryRef} aria-labelledby="academy-glossary-title"><div className="academy-dialog-head"><div><p className="academy-overline">KEEP THE LANGUAGE SIMPLE</p><h2 id="academy-glossary-title">Investing glossary</h2></div><button className="academy-icon-button" aria-label="Close glossary" onClick={() => glossaryRef.current?.close()}><Mark name="close" /></button></div><label className="academy-search-label" htmlFor="academy-term-search">Find a term</label><input id="academy-term-search" className="academy-search" type="search" placeholder="Try yield, inflation, or ETF" value={glossaryQuery} onChange={event => setGlossaryQuery(event.target.value)} /><div className="academy-glossary-list">{matchingTerms.length ? matchingTerms.map(term => <article key={term.term}><h3>{term.term}</h3><p>{term.definition}</p><button className="academy-text-button" onClick={() => { glossaryRef.current?.close(); navigate(term.lesson.id); }}>Lesson {lessons.indexOf(term.lesson) + 1} · {term.lesson.shortTitle}<Mark name="arrow" size={15} /></button></article>) : <p>No matching terms. Try a different word.</p>}</div></dialog>
    <dialog className="academy-dialog academy-reset" ref={resetRef} aria-labelledby="academy-reset-title"><div className="academy-dialog-head"><h2 id="academy-reset-title">Start the course again?</h2><button className="academy-icon-button" aria-label="Close reset dialog" onClick={() => resetRef.current?.close()}><Mark name="close" /></button></div><p>This clears your lesson answers, notes, and practice plan in this browser.</p>{resetError && <p role="alert">Could not reset the course. Your saved progress is unchanged. Try again.</p>}<div className="academy-dialog-actions"><button className="academy-secondary" onClick={() => resetRef.current?.close()}>Keep my progress</button><button className="academy-primary" disabled={resetting || !ready} onClick={() => void reset()}>{resetting ? 'Resetting…' : 'Reset course'}</button></div></dialog>
  </div>;
}
