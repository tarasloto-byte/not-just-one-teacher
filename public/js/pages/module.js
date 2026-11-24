// One 2-hour module: video, practice task, short test. #/path/:track/:moduleId
import { loadAll } from '../data.js';
import { t } from '../i18n.js';
import { esc } from '../lib/escape.js';
import { completeModule, modulesDoneIn, HOURS_PER_MODULE } from '../lib/progress.js';
import { icon } from '../icons.js';
import * as store from '../store.js';
import { toast, videoPlaceholder, bindVideoButtons } from '../ui.js';

const TRACK_HUES = Object.freeze({ programming: 16, design: 255, data: 75, ai: 200 });

export function load() {
  return loadAll(['tracks']);
}

function find(data, ctx) {
  const track = data.tracks.find((tr) => tr.id === ctx.params.track);
  if (!track) return null;
  const index = track.modules.findIndex((m) => m.id === ctx.params.moduleId);
  return index === -1 ? null : { track, module: track.modules[index], index };
}

export function title(data, ctx) {
  return find(data, ctx)?.module.title ?? t('module.notFound');
}

function testView(test) {
  const options = test.options.map((option, i) => `
    <label class="answer"><input type="radio" name="answer" value="${i}"><span>${esc(option)}</span></label>`).join('');
  return `<fieldset class="test">
    <legend class="test__q">${esc(test.q)}</legend>
    <div class="answers">${options}</div>
  </fieldset>
  <div class="test__row">
    <button type="button" class="btn btn--sm" data-check>${esc(t('module.check'))}</button>
    <p class="test__feedback" data-feedback aria-live="polite"></p>
  </div>`;
}

function footer(found, isDone) {
  const { track, index } = found;
  const next = track.modules[index + 1];
  const nextLink = next
    ? `<a class="btn btn--primary" href="#/path/${track.id}/${next.id}">${esc(t('module.next'))}${icon('arrowRight')}</a>`
    : '';
  if (isDone) {
    return `<div class="module-done">
      <p class="module-done__label">${icon('check')} ${esc(t('module.completed'))}</p>
      <div class="hero__actions">${nextLink}<a class="btn" href="#/path/${track.id}">${esc(t('module.backToRoute'))}</a></div>
    </div>`;
  }
  return `<div class="module-complete">
    <p class="muted small" data-need>${esc(t('module.needBoth'))}</p>
    <button type="button" class="btn btn--primary btn--lg btn--block" data-complete disabled>${icon('check')}<span>${esc(t('module.complete'))}</span></button>
  </div>`;
}

export function view(data, ctx) {
  const found = find(data, ctx);
  if (!found) {
    return `<section class="section"><div class="container narrow center"><h1>${esc(t('module.notFound'))}</h1><a class="btn btn--primary" href="#/path">${esc(t('nav.path'))}</a></div></section>`;
  }
  const { track, module, index } = found;
  const isDone = modulesDoneIn(store.getProgress(), track.id).includes(module.id);
  return `
  <section class="section section--top-tight">
    <div class="container module track--${track.id}">
      <a class="back-link" href="#/path/${track.id}">${icon('arrowLeft', 'icon icon--sm')} ${esc(t(`common.fields.${track.id}`))}</a>
      <p class="eyebrow">${esc(t('path.module', { n: index + 1 }))} · ${esc(t('common.hours', { n: HOURS_PER_MODULE }))}</p>
      <h1>${esc(module.title)}</h1>
      <p class="lead">${esc(module.summary)}</p>
      <div class="module-grid">
        <div>
          <h2 class="module__h">${icon('film', 'icon icon--sm')} ${esc(t('module.video'))}</h2>
          ${videoPlaceholder({ label: module.title, hue: TRACK_HUES[track.id] })}
        </div>
        <div class="module-side">
          <div class="card">
            <h2 class="module__h">${icon('spark', 'icon icon--sm')} ${esc(t('module.task'))}</h2>
            <p>${esc(module.task)}</p>
            <label class="check"><input type="checkbox" data-task ${isDone ? 'checked disabled' : ''}><span>${esc(t('module.taskDone'))}</span></label>
          </div>
          <div class="card">
            <h2 class="module__h">${icon('check', 'icon icon--sm')} ${esc(t('module.test'))}</h2>
            ${testView(module.test)}
          </div>
          ${footer(found, isDone)}
        </div>
      </div>
    </div>
  </section>`;
}

export function mount(root, data, ctx) {
  const found = find(data, ctx);
  if (!found) return;
  bindVideoButtons(root);
  const { track, module } = found;
  const completeBtn = root.querySelector('[data-complete]');
  const feedback = root.querySelector('[data-feedback]');
  let isTaskDone = false;
  let isTestPassed = false;
  const sync = () => {
    if (completeBtn) completeBtn.disabled = !(isTaskDone && isTestPassed);
  };
  root.querySelector('[data-task]').addEventListener('change', (e) => {
    isTaskDone = e.target.checked;
    sync();
  });
  // Changing the answer after a correct check must be checked again.
  root.querySelectorAll('input[name="answer"]').forEach((radio) => radio.addEventListener('change', () => {
    isTestPassed = false;
    feedback.textContent = '';
    feedback.className = 'test__feedback';
    sync();
  }));
  root.querySelector('[data-check]').addEventListener('click', () => {
    const picked = root.querySelector('input[name="answer"]:checked');
    if (!picked) {
      feedback.textContent = t('module.pick');
      feedback.className = 'test__feedback';
      return;
    }
    isTestPassed = Number(picked.value) === module.test.answer;
    feedback.textContent = t(isTestPassed ? 'module.correct' : 'module.wrong');
    feedback.className = `test__feedback ${isTestPassed ? 'is-ok' : 'is-bad'}`;
    sync();
  });
  completeBtn?.addEventListener('click', () => {
    // Working on a route makes it the student's route, so the profile counts this progress.
    store.updateProgress((p) => completeModule({ ...p, quizTrack: track.id }, track.id, module.id));
    const town = store.getProfile()?.city ?? t('module.yourTown');
    toast(t('module.completedToast', { town }));
    ctx.refresh();
  });
}
