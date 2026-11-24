// Student profile after the workshop: #/me
import { loadAll } from '../data.js';
import { t } from '../i18n.js';
import { esc } from '../lib/escape.js';
import { initials } from '../lib/format.js';
import { computeSteps, modulesDoneIn, MODULES_PER_TRACK } from '../lib/progress.js';
import { icon } from '../icons.js';
import * as store from '../store.js';
import { toast } from '../ui.js';

const STEP_LINKS = Object.freeze({
  quiz: () => '#/path',
  firstModule: (track) => (track ? `#/path/${track}` : '#/path'),
  pathComplete: (track) => (track ? `#/path/${track}` : '#/path'),
});

export function load() {
  return loadAll(['tracks']);
}

export function title() {
  return t('nav.me');
}

function noProfileView() {
  return `
  <section class="section">
    <div class="container narrow center">
      <span class="big-icon" aria-hidden="true">${icon('user')}</span>
      <h1>${esc(t('profile.noProfileTitle'))}</h1>
      <p class="lead">${esc(t('profile.noProfileText'))}</p>
      <a class="btn btn--primary btn--lg" href="#/join">${esc(t('profile.noProfileCta'))}${icon('arrowRight')}</a>
    </div>
  </section>`;
}

function hintText(remaining) {
  if (remaining === 0) return t('profile.hintDone');
  if (remaining === 1) return t('profile.hintOne');
  return t('profile.hintMany', { n: remaining });
}

function stepAction(step, progress) {
  if (step.done) return '';
  if (step.id === 'liveSession') {
    return `<button type="button" class="btn btn--sm btn--lime" data-action="book">${icon('calendar')}<span>${esc(t('profile.steps.liveSession.cta'))}</span></button>`;
  }
  const link = STEP_LINKS[step.id];
  if (!link) return '';
  return `<a class="btn btn--sm" href="${link(progress.quizTrack)}"><span>${esc(t(`profile.steps.${step.id}.cta`))}</span>${icon('arrowRight')}</a>`;
}

function stepView(step, index, progress) {
  const text = step.id === 'workshop' ? t('profile.completed') : t(`profile.steps.${step.id}.text`);
  return `<li class="step ${step.done ? 'step--done' : ''}">
    <span class="step__marker" aria-hidden="true">${step.done ? icon('check') : index + 1}</span>
    <div class="step__body">
      <h3 class="step__title">${esc(t(`profile.steps.${step.id}.title`))}${step.id === 'workshop' ? ` — <span class="step__done-word">${esc(t('profile.completed'))}</span>` : ''}</h3>
      ${step.id === 'workshop' ? '' : `<p class="step__text">${esc(text)}</p>`}
    </div>
    <div class="step__action">${stepAction(step, progress)}</div>
  </li>`;
}

function progressCard(summary, progress) {
  const steps = summary.steps.map((step, i) => stepView(step, i, progress)).join('');
  return `<div class="card progress-card">
    <div class="progress-card__head">
      <h2>${esc(t('profile.progressTitle'))}</h2>
      <span class="progress-card__count">${esc(t('profile.completedOf', { done: summary.completed, total: summary.steps.length }))}</span>
    </div>
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${summary.percent}" aria-label="${esc(t('profile.progressTitle'))}">
      <span class="progress__bar" style="width:${summary.percent}%"></span>
    </div>
    <p class="progress-card__hint">${icon('spark', 'icon icon--sm')} ${esc(hintText(summary.remaining))}</p>
    <ol class="steps">${steps}</ol>
  </div>`;
}

function sideCards(profile, progress, summary) {
  const track = progress.quizTrack;
  const done = track ? modulesDoneIn(progress, track).length : 0;
  const trackLine = track
    ? `${esc(t(`common.fields.${track}`))} · ${esc(t('path.modulesProgress', { done, total: MODULES_PER_TRACK }))}`
    : esc(t('profile.trackNone'));
  const isReady = summary.remaining === 0;
  return `<aside class="profile__side">
    <div class="card card--tinted">
      <p class="card__label">${esc(t('profile.trackLabel'))}</p>
      <p class="card__value">${trackLine}</p>
    </div>
    <div class="card certificate ${isReady ? 'certificate--ready' : ''}">
      <p class="card__label">${icon(isReady ? 'spark' : 'lock', 'icon icon--sm')} ${esc(t('profile.certificateTitle'))}</p>
      ${isReady
        ? `<button type="button" class="btn btn--primary btn--block" data-action="certificate">${icon('download')}<span>${esc(t('profile.certificateReady'))}</span></button>`
        : `<p class="muted">${esc(t('profile.certificateLocked'))}</p>`}
    </div>
    <div class="card card--violet">
      <p class="card__label">${icon('trophy', 'icon icon--sm')} ${esc(t('profile.townTitle'))}</p>
      <p>${esc(t('profile.townText', { town: profile.city }))}</p>
      <a class="btn btn--sm btn--light" href="#/cities">${esc(t('profile.townCta'))}${icon('arrowRight')}</a>
    </div>
  </aside>`;
}

export function view() {
  const profile = store.getProfile();
  if (!profile) return noProfileView();
  const progress = store.getProgress();
  const summary = computeSteps(progress);
  return `
  <section class="section">
    <div class="container">
      <header class="profile__head">
        <span class="avatar" aria-hidden="true">${esc(initials(profile.name))}</span>
        <div>
          <h1 class="profile__name">${esc(t('profile.hello', { name: profile.name }))}</h1>
          <p class="muted">${esc(t('profile.from', { school: profile.school, city: profile.city }))}</p>
        </div>
      </header>
      <div class="profile__grid">
        ${progressCard(summary, progress)}
        ${sideCards(profile, progress, summary)}
      </div>
    </div>
  </section>`;
}

export function mount(root, data, ctx) {
  root.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'book') {
      store.updateProgress((p) => ({ ...p, sessionBooked: true }));
      toast(t('profile.sessionBooked'));
      ctx.refresh();
    }
    if (action === 'certificate') toast(t('profile.certificateToast'));
  });
}
