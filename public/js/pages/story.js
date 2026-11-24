// One story: #/stories/:id
import { loadAll } from '../data.js';
import { t, tData } from '../i18n.js';
import { esc } from '../lib/escape.js';
import { buildHash } from '../lib/router.js';
import { icon } from '../icons.js';
import * as store from '../store.js';
import { videoPlaceholder, bindVideoButtons, fieldTag, regionName, openModal, toast, photoPlaceholder } from '../ui.js';
import { storyCard } from './stories.js';

const MORE_STORIES = 3;
const STEP_ICONS = Object.freeze({ course: 'book', hackathon: 'spark', scholarship: 'trophy', club: 'users', competition: 'trophy' });

export function load() {
  return loadAll(['stories', 'regions']);
}

function findStory(data, ctx) {
  return data.stories.find((s) => s.id === ctx.params.id) ?? null;
}

export function title(data, ctx) {
  return findStory(data, ctx)?.name ?? t('story.notFound');
}

function timeline(story) {
  return story.started
    .map((step) => `<li class="timeline__item">
      <span class="timeline__icon" aria-hidden="true">${icon(STEP_ICONS[step.type] ?? 'spark')}</span>
      <div>
        <p class="timeline__meta"><span class="tag tag--muted">${esc(t(`story.types.${step.type}`))}</span> <span class="muted">${esc(step.year)}</span></p>
        <h3 class="timeline__title">${esc(step.title)}</h3>
        <p>${esc(step.text)}</p>
      </div>
    </li>`)
    .join('');
}

function heroCard(story, regions) {
  const oppsHref = buildHash('/opportunities', { field: story.field });
  return `<aside class="story-aside">
    <div class="card story-aside__card">
      <div class="story-aside__who">
        ${photoPlaceholder(story.name, story.hue, 'story-aside__photo')}
        <div>
          <h1 class="story-aside__name">${esc(story.name)}</h1>
          <p class="muted">${esc(t('story.age', { n: story.age }))}</p>
        </div>
      </div>
      <dl class="facts">
        <div><dt>${icon('pin', 'icon icon--sm')}</dt><dd>${esc(t('stories.from', { town: story.hometown }))} · ${esc(regionName(regions, story.region))}</dd></div>
        <div><dt>${icon('route', 'icon icon--sm')}</dt><dd>${esc(story.role)}</dd></div>
      </dl>
      ${fieldTag(story.field)}
      <div class="story-aside__actions">
        <a class="btn btn--primary btn--block" href="${oppsHref}">${icon('pin')}<span>${esc(t('story.ctaOpportunities'))}</span></a>
        <button type="button" class="btn btn--block" data-ask>${icon('chat')}<span>${esc(t('story.ctaAsk'))}</span></button>
        <p class="muted small center">${esc(t('story.askHint'))}</p>
      </div>
    </div>
  </aside>`;
}

function notFoundView() {
  return `<section class="section"><div class="container narrow center">
    <h1>${esc(t('story.notFound'))}</h1>
    <a class="btn btn--primary" href="#/stories">${esc(t('story.more'))}</a>
  </div></section>`;
}

export function view(data, ctx) {
  const story = findStory(data, ctx);
  if (!story) return notFoundView();
  const more = data.stories.filter((s) => s.id !== story.id && s.field === story.field)
    .concat(data.stories.filter((s) => s.id !== story.id && s.field !== story.field))
    .slice(0, MORE_STORIES);
  const helpers = story.helpers.map((h) => `<li>${icon('check', 'icon icon--sm')} ${esc(h)}</li>`).join('');
  return `
  <section class="section section--top-tight">
    <div class="container">
      <a class="back-link" href="#/stories">${icon('arrowLeft', 'icon icon--sm')} ${esc(t('nav.stories'))}</a>
      <div class="story-layout">
        <article class="story-main">
          ${videoPlaceholder({ label: story.name, hue: story.hue })}
          <blockquote class="story-quote">${esc(story.quote)}</blockquote>
          <p class="lead">${esc(story.intro)}</p>
          <h2>${esc(t('story.howStarted'))}</h2>
          <ol class="timeline">${timeline(story)}</ol>
          <h2>${esc(t('story.helped'))}</h2>
          <ul class="helpers">${helpers}</ul>
          <div class="story-cta">
            <a class="btn btn--primary btn--lg" href="${buildHash('/opportunities', { field: story.field })}">${icon('pin')}<span>${esc(t('story.ctaOpportunities'))}</span></a>
            <button type="button" class="btn btn--lg" data-ask>${icon('chat')}<span>${esc(t('story.ctaAsk'))}</span></button>
          </div>
        </article>
        ${heroCard(story, data.regions)}
      </div>
      <h2 class="more-title">${esc(t('story.more'))}</h2>
      <div class="story-grid">${more.map((s) => storyCard(s, data.regions)).join('')}</div>
    </div>
  </section>`;
}

function askForm() {
  const slots = tData('story.askSlots').map((slot, i) => `<label class="pill-radio"><input type="radio" name="slot" value="${i}" ${i === 0 ? 'checked' : ''}><span>${esc(slot)}</span></label>`).join('');
  const profileName = store.getProfile()?.name ?? '';
  return `<form class="form" novalidate>
    <p class="muted">${esc(t('story.askLead'))}</p>
    <div class="field"><label for="ask-name">${esc(t('story.askName'))}</label><input id="ask-name" name="name" class="input" maxlength="40" value="${esc(profileName)}" autocomplete="given-name"></div>
    <fieldset class="field"><legend>${esc(t('story.askSlot'))}</legend><div class="pill-radios">${slots}</div></fieldset>
    <div class="field"><label for="ask-q">${esc(t('story.askQuestion'))}</label><textarea id="ask-q" name="question" class="textarea" rows="3" maxlength="500" placeholder="${esc(t('story.askQuestionPh'))}"></textarea></div>
    <p class="field__error" data-error hidden>${esc(t('story.askError'))}</p>
    <button type="submit" class="btn btn--primary btn--block">${esc(t('story.askSubmit'))}</button>
  </form>`;
}

function openAsk(story) {
  const firstName = story.name.split(' ')[0];
  openModal({
    title: t('story.askTitle', { name: firstName }),
    body: askForm(),
    onMount: (dialog, close) => {
      const form = dialog.querySelector('form');
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const isValid = form.elements.name.value.trim().length >= 2 && form.elements.question.value.trim().length >= 3;
        form.querySelector('[data-error]').hidden = isValid;
        if (!isValid) return;
        close();
        toast(t('story.askDone', { name: firstName }));
      });
    },
  });
}

export function mount(root, data, ctx) {
  const story = findStory(data, ctx);
  if (!story) return;
  bindVideoButtons(root);
  root.querySelectorAll('[data-ask]').forEach((button) => button.addEventListener('click', () => openAsk(story)));
}
