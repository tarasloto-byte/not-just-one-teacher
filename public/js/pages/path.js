// IT path: interest quiz (#/path, #/path?retake=1) and route overview (#/path/:track)
import { loadAll } from '../data.js';
import { t } from '../i18n.js';
import { esc } from '../lib/escape.js';
import { scoreQuiz, withAnswer, TRACK_ORDER } from '../lib/quiz.js';
import { modulesDoneIn, HOURS_PER_MODULE, MODULES_PER_TRACK } from '../lib/progress.js';
import { icon } from '../icons.js';
import * as store from '../store.js';
import { toast, pageHead } from '../ui.js';
import { view as notFoundView } from './not-found.js';

const AUTO_ADVANCE_MS = 320;
const LETTERS = ['A', 'B', 'C', 'D'];

export function load() {
  return loadAll(['quiz', 'tracks']);
}

function trackName(id) {
  return t(`common.fields.${id}`);
}

function chosenTrack(data, ctx) {
  if (ctx.params.track) return data.tracks.find((tr) => tr.id === ctx.params.track) ?? null;
  if (ctx.query.retake) return null;
  const mine = store.getProgress().quizTrack;
  return data.tracks.find((tr) => tr.id === mine) ?? null;
}

export function title(data, ctx) {
  const track = chosenTrack(data, ctx);
  return track ? `${t('nav.path')}: ${trackName(track.id)}` : t('path.quizTitle');
}

/* ---------- Quiz ---------- */

function quizShell() {
  return `
  <section class="section">
    <div class="container narrow">
      ${pageHead({ eyebrow: t('path.eyebrow'), title: t('path.quizTitle'), lead: t('path.quizLead') })}
      <div class="quiz card" id="quiz" aria-live="polite"></div>
    </div>
  </section>`;
}

function questionView(questions, index, answers) {
  const question = questions[index];
  const total = questions.length;
  const isLast = index === total - 1;
  const hasAnswer = Number.isInteger(answers[index]);
  const options = question.options.map((option, i) => `
    <button type="button" class="option" data-option="${i}" aria-pressed="${answers[index] === i}">
      <span class="option__letter" aria-hidden="true">${LETTERS[i]}</span><span>${esc(option.text)}</span>
    </button>`).join('');
  return `
    <div class="quiz__top">
      <span class="quiz__count">${esc(t('path.question', { n: index + 1, total }))}</span>
      <div class="progress progress--thin" aria-hidden="true"><span class="progress__bar progress__bar--static" style="width:${Math.round(((index + 1) / total) * 100)}%"></span></div>
    </div>
    <h2 class="quiz__q" tabindex="-1">${esc(question.q)}</h2>
    <div class="options">${options}</div>
    <div class="quiz__nav">
      <button type="button" class="btn btn--sm btn--ghost" data-step="-1" ${index === 0 ? 'disabled' : ''}>${icon('arrowLeft')}<span>${esc(t('path.prev'))}</span></button>
      <button type="button" class="btn btn--primary" data-step="${isLast ? 'finish' : '1'}" ${hasAnswer ? '' : 'disabled'}>
        <span>${esc(t(isLast ? 'path.finish' : 'path.next'))}</span>${icon('arrowRight')}
      </button>
    </div>`;
}

function resultView(track) {
  return `<div class="quiz-result track--${track.id}">
    <p class="eyebrow">${esc(t('path.resultEyebrow'))}</p>
    <h2 class="quiz-result__title">${esc(t('path.resultTitle', { track: trackName(track.id) }))}</h2>
    <p class="lead">${esc(track.tagline)}</p>
    <p class="muted">${esc(t('path.totalHours'))} · ${esc(t('path.eitNote'))}</p>
    <div class="hero__actions">
      <a class="btn btn--primary btn--lg" href="#/path/${track.id}">${esc(t('path.resultStart'))}${icon('arrowRight')}</a>
      <a class="btn btn--ghost" href="#/path?retake=1" data-retake>${esc(t('path.retake'))}</a>
    </div>
  </div>`;
}

function mountQuiz(root, data, ctx) {
  const box = root.querySelector('#quiz');
  const questions = data.quiz;
  let index = 0;
  let answers = [];
  let timer = null;

  const render = (focus = false) => {
    box.innerHTML = questionView(questions, index, answers);
    if (focus) box.querySelector('.quiz__q').focus({ preventScroll: true });
  };
  const go = (nextIndex) => {
    window.clearTimeout(timer);
    index = Math.max(0, Math.min(questions.length - 1, nextIndex));
    render(true);
  };
  const finish = () => {
    const { winner } = scoreQuiz(questions, answers);
    store.updateProgress((p) => ({ ...p, quizTrack: winner }));
    toast(t('path.resultToast'));
    box.innerHTML = resultView(data.tracks.find((tr) => tr.id === winner));
  };

  box.addEventListener('click', (event) => {
    if (event.target.closest('[data-retake]')) {
      event.preventDefault();
      answers = [];
      go(0);
      return;
    }
    const option = event.target.closest('[data-option]');
    if (option) {
      answers = withAnswer(answers, index, Number(option.dataset.option));
      render();
      if (index < questions.length - 1) timer = window.setTimeout(() => go(index + 1), AUTO_ADVANCE_MS);
      return;
    }
    const step = event.target.closest('[data-step]')?.dataset.step;
    if (step === 'finish') finish();
    else if (step) go(index + Number(step));
  });
  render();
}

/* ---------- Route overview ---------- */

function moduleRow(track, module, i, doneIds) {
  const isDone = doneIds.includes(module.id);
  return `<li><a class="module-row ${isDone ? 'module-row--done' : ''}" href="#/path/${track.id}/${module.id}">
    <span class="module-row__num" aria-hidden="true">${isDone ? icon('check') : i + 1}</span>
    <span class="module-row__body">
      <span class="module-row__kicker">${esc(t('path.module', { n: i + 1 }))} · ${esc(t('common.hours', { n: HOURS_PER_MODULE }))}</span>
      <span class="module-row__title">${esc(module.title)}</span>
      <span class="module-row__summary">${esc(module.summary)}</span>
    </span>
    <span class="module-row__status">${esc(t(isDone ? 'path.moduleDone' : 'path.moduleOpen'))}${isDone ? '' : icon('arrowRight', 'icon icon--sm')}</span>
  </a></li>`;
}

function mentorCard(progress) {
  const action = progress.sessionBooked
    ? `<p class="mentor__booked">${icon('check', 'icon icon--sm')} ${esc(t('path.mentorBooked'))}</p>`
    : `<button type="button" class="btn btn--lime btn--block" data-book>${icon('calendar')}<span>${esc(t('path.mentorCta'))}</span></button>`;
  return `<aside class="mentor card">
    <span class="mentor__live">LIVE</span>
    <h2 class="mentor__title">${esc(t('path.mentorTitle'))}</h2>
    <p>${esc(t('path.mentorText'))}</p>
    ${action}
  </aside>`;
}

function trackView(track, data) {
  const progress = store.getProgress();
  const doneIds = modulesDoneIn(progress, track.id);
  const isMine = progress.quizTrack === track.id;
  const others = TRACK_ORDER.filter((id) => id !== track.id)
    .map((id) => `<a class="chip" href="#/path/${id}">${esc(trackName(id))}</a>`).join('');
  const mineControl = isMine
    ? `<span class="tag tag--mine">${icon('check', 'icon icon--sm')} ${esc(t('path.isMine'))}</span>`
    : `<button type="button" class="btn btn--sm btn--dark" data-make-mine>${esc(t('path.makeMine'))}</button>`;
  return `
  <section class="track-hero track--${track.id}">
    <div class="container">
      <p class="eyebrow eyebrow--ink">${esc(t('path.eyebrow'))}</p>
      <h1 class="track-hero__title">${esc(trackName(track.id))}</h1>
      <p class="track-hero__tagline">${esc(track.tagline)}</p>
      <div class="track-hero__meta">
        <span class="tag tag--dark">${icon('clock', 'icon icon--sm')} ${esc(t('path.totalHours'))}</span>
        <span class="tag tag--dark">${esc(t('path.modulesProgress', { done: doneIds.length, total: MODULES_PER_TRACK }))}</span>
        ${mineControl}
      </div>
      <p class="track-hero__note">${esc(t('path.eitNote'))} <a href="#/path?retake=1">${esc(t('path.retake'))}</a></p>
    </div>
  </section>
  <section class="section section--top-tight">
    <div class="container track-layout">
      <ol class="module-list">${track.modules.map((m, i) => moduleRow(track, m, i, doneIds)).join('')}</ol>
      <div class="track-side">
        ${mentorCard(progress)}
        <div class="card"><p class="card__label">${esc(t('path.otherRoutes'))}</p><div class="chip-row chip-row--wrap">${others}</div></div>
      </div>
    </div>
  </section>`;
}

function mountTrack(root, track, ctx) {
  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-book]')) {
      store.updateProgress((p) => ({ ...p, sessionBooked: true }));
      toast(t('path.mentorToast'));
      ctx.refresh();
    }
    if (event.target.closest('[data-make-mine]')) {
      store.updateProgress((p) => ({ ...p, quizTrack: track.id }));
      toast(t('path.madeMine', { track: trackName(track.id) }));
      ctx.refresh();
    }
  });
}

function isUnknownTrack(data, ctx) {
  return Boolean(ctx.params.track) && !chosenTrack(data, ctx);
}

export function view(data, ctx) {
  if (isUnknownTrack(data, ctx)) return notFoundView();
  const track = chosenTrack(data, ctx);
  return track ? trackView(track, data) : quizShell();
}

export function mount(root, data, ctx) {
  if (isUnknownTrack(data, ctx)) return;
  const track = chosenTrack(data, ctx);
  if (track) mountTrack(root, track, ctx);
  else mountQuiz(root, data, ctx);
}
