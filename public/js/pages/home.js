import { loadAll } from '../data.js';
import { t, tData, locale } from '../i18n.js';
import { esc } from '../lib/escape.js';
import { dateParts, todayIso } from '../lib/format.js';
import { nextWorkshop, resolveRegion } from '../lib/filters.js';
import { icon } from '../icons.js';
import * as store from '../store.js';
import { toast, videoPlaceholder, bindVideoButtons, countUp, regionOptions } from '../ui.js';

const DEFAULT_REGION = 'lubelskie';

export function load() {
  return loadAll(['stats', 'stories', 'workshops', 'regions', 'towns']);
}

function reelOverlay(stories) {
  const items = stories
    .map((s) => `<span class="reel__item"><b>${esc(s.name.split(' ')[0])}</b> · ${esc(s.hometown)} ${icon('arrowRight', 'icon icon--sm')} ${esc(s.role)}</span>`)
    .join('');
  // Rendered twice so the marquee can loop seamlessly.
  return `<div class="reel__marquee" aria-hidden="true"><div class="reel__track">${items}${items}</div></div>`;
}

function heroView(stories) {
  return `
  <section class="hero">
    <div class="container hero__grid">
      <div class="hero__copy">
        <p class="eyebrow">${esc(t('home.eyebrow'))}</p>
        <h1 class="hero__title">${esc(t('home.titleA'))} <span class="hero__accent">${esc(t('home.titleB'))}</span></h1>
        <p class="lead">${esc(t('home.lead'))}</p>
        <div class="hero__actions">
          <a class="btn btn--primary btn--lg" href="#/stories">${icon('play')}<span>${esc(t('home.ctaStories'))}</span></a>
          <a class="btn btn--lg" href="#/opportunities">${icon('pin')}<span>${esc(t('home.ctaOpportunities'))}</span></a>
        </div>
      </div>
      <div class="reel">
        ${videoPlaceholder({ label: t('home.videoLabel'), hue: 262, className: 'reel__video', overlay: reelOverlay(stories) })}
        <span class="reel__sticker" aria-hidden="true">${esc(t('home.sticker'))}</span>
      </div>
    </div>
  </section>`;
}

function statsView(stats) {
  const towns = stats.townsSample.map((town) => `<li>${esc(town)}</li>`).join('');
  return `
  <section class="section section--tight">
    <div class="container">
      <div class="band">
        <h2 class="band__title">${esc(t('home.counterTitle'))}</h2>
        <div class="stats">
          <p class="stat stat--big"><span class="stat__num" data-count="${stats.students}">0</span><span class="stat__label">${esc(t('home.counterLead'))}</span></p>
          <p class="stat"><span class="stat__num" data-count="${stats.towns}">0</span><span class="stat__label">${esc(t('home.counterTowns'))}</span></p>
          <p class="stat"><span class="stat__num"><span data-count="${stats.girlsPercent}">0</span>%</span><span class="stat__label">${esc(t('home.counterGirls'))}</span></p>
          <p class="stat"><span class="stat__num" data-count="${stats.schools}">0</span><span class="stat__label">${esc(t('home.counterSchools'))}</span></p>
        </div>
        <p class="band__sub">${esc(t('home.counterFrom'))}</p>
        <ul class="town-cloud">${towns}</ul>
        <p class="band__note">${esc(t('home.counterNote'))}</p>
      </div>
    </div>
  </section>`;
}

function workshopCard(workshop) {
  if (!workshop) {
    return `<div class="workshop-card workshop-card--empty">
      <p>${esc(t('home.workshopNone'))}</p>
      <button type="button" class="btn btn--dark" data-action="invite">${icon('spark')}<span>${esc(t('home.workshopInvite'))}</span></button>
    </div>`;
  }
  const date = dateParts(workshop.date, locale());
  return `<div class="workshop-card">
    <div class="date-stamp" aria-hidden="true"><span class="date-stamp__month">${esc(date.month)}</span><span class="date-stamp__day">${esc(date.day)}</span><span class="date-stamp__weekday">${esc(date.weekday)}</span></div>
    <div class="workshop-card__body">
      <h3 class="workshop-card__topic">${esc(workshop.topic)}</h3>
      <p class="workshop-card__meta">${icon('pin', 'icon icon--sm')} ${esc(workshop.town)} · ${esc(workshop.school)}</p>
      <p class="workshop-card__meta">${icon('clock', 'icon icon--sm')} ${esc(date.full)}, ${esc(workshop.time)}</p>
      <button type="button" class="btn btn--sm btn--lime" data-action="save-workshop">${icon('calendar')}<span>${esc(t('home.workshopSave'))}</span></button>
    </div>
  </div>`;
}

function workshopView(data, region) {
  return `
  <section class="section">
    <div class="container workshop">
      <div class="workshop__intro">
        <p class="eyebrow">${esc(t('home.workshopEyebrow'))}</p>
        <h2>${esc(t('home.workshopTitle'))}</h2>
        <div class="field">
          <label for="workshop-region">${esc(t('home.workshopPick'))}</label>
          <select id="workshop-region" class="select">${regionOptions(data.regions, region, null)}</select>
        </div>
      </div>
      <div id="workshop-slot" aria-live="polite">${workshopCard(nextWorkshop(data.workshops, region, todayIso()))}</div>
    </div>
  </section>`;
}

function howView() {
  const steps = tData('home.how')
    .map((step, i) => `<li class="how__step"><span class="how__num" aria-hidden="true">0${i + 1}</span><h3>${esc(step.title)}</h3><p>${esc(step.text)}</p></li>`)
    .join('');
  return `
  <section class="section section--tight">
    <div class="container">
      <h2>${esc(t('home.howTitle'))}</h2>
      <ol class="how">${steps}</ol>
    </div>
  </section>`;
}

function tutorTeaser() {
  return `
  <section class="section section--tight">
    <div class="container">
      <a class="tutor-teaser" href="#/tutor">
        <div>
          <p class="eyebrow">${icon('spark', 'icon icon--sm')} ${esc(t('tutor.homeEyebrow'))}</p>
          <h2 class="tutor-teaser__title">${esc(t('tutor.homeTitle'))}</h2>
          <p class="muted">${esc(t('tutor.homeText'))}</p>
          <span class="btn btn--primary">${esc(t('tutor.homeCta'))}${icon('arrowRight')}</span>
        </div>
        <div class="tutor-teaser__chat" aria-hidden="true">
          ${tData('tutor.heroBubbles').slice(0, 2).map((b) => `<span class="bubble bubble--${b.from === 'tutor' ? 'tutor' : 'student'}">${esc(b.text)}</span>`).join('')}
        </div>
      </a>
    </div>
  </section>`;
}

function networkView() {
  return `
  <section class="section">
    <div class="container">
      <div class="statement">
        <p class="eyebrow eyebrow--ink">${esc(t('home.networkEyebrow'))}</p>
        <h2 class="statement__title">${esc(t('home.networkTitle'))}</h2>
        <p class="statement__text">${esc(t('home.networkText'))}</p>
        <a class="btn btn--dark" href="#/teachers">${icon('book')}<span>${esc(t('home.networkCta'))}</span></a>
      </div>
    </div>
  </section>`;
}

function initialRegion(data) {
  const profile = store.getProfile();
  const fromProfile = profile ? resolveRegion(profile.city, data.towns, data.regions) : '';
  return fromProfile || DEFAULT_REGION;
}

export function view(data) {
  return [heroView(data.stories), statsView(data.stats), workshopView(data, initialRegion(data)), howView(), tutorTeaser(), networkView()].join('');
}

export function mount(root, data) {
  bindVideoButtons(root);
  countUp(root.querySelectorAll('[data-count]'));
  const slot = root.querySelector('#workshop-slot');
  root.querySelector('#workshop-region').addEventListener('change', (event) => {
    slot.innerHTML = workshopCard(nextWorkshop(data.workshops, event.target.value, todayIso()));
  });
  slot.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'invite') toast(t('home.workshopInviteDone'));
    if (action === 'save-workshop') toast(t('home.workshopSaved'));
  });
}
