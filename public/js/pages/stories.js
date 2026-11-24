// "From the same place" — story grid with filters: #/stories
import { loadAll } from '../data.js';
import { t } from '../i18n.js';
import { esc } from '../lib/escape.js';
import { filterStories } from '../lib/filters.js';
import { buildHash } from '../lib/router.js';
import { TRACK_ORDER } from '../lib/quiz.js';
import { icon } from '../icons.js';
import { photoPlaceholder, fieldTag, regionName, regionOptions, pageHead, plural } from '../ui.js';

const GENDERS = ['female', 'male'];

export function load() {
  return loadAll(['stories', 'regions']);
}

export function title() {
  return t('nav.stories');
}

function readFilters(query, regions) {
  return {
    region: regions.some((r) => r.id === query.region) ? query.region : '',
    field: TRACK_ORDER.includes(query.field) ? query.field : '',
    gender: GENDERS.includes(query.gender) ? query.gender : '',
  };
}

function chipGroup(name, values, selected, labelFor) {
  const chips = ['', ...values].map((value) => {
    const label = value ? labelFor(value) : t('common.all');
    return `<button type="button" class="chip" data-filter="${name}" data-value="${value}" aria-pressed="${value === selected}">${esc(label)}</button>`;
  });
  return `<div class="chip-row" role="group" aria-label="${esc(t(`common.${name}`))}">${chips.join('')}</div>`;
}

export function storyCard(story, regions, isFeature = false) {
  return `<a class="story-card ${isFeature ? 'story-card--feature' : ''}" href="#/stories/${esc(story.id)}">
    ${photoPlaceholder(story.name, story.hue, 'story-card__photo')}
    <div class="story-card__body">
      ${fieldTag(story.field)}
      <h3 class="story-card__name">${esc(story.name)}</h3>
      <p class="story-card__town">${icon('pin', 'icon icon--sm')} ${esc(t('stories.from', { town: story.hometown }))} · ${esc(regionName(regions, story.region))}</p>
      <p class="story-card__role"><span class="muted">${esc(t('stories.now'))}:</span> ${esc(story.role)}</p>
      ${isFeature ? `<p class="story-card__quote">“${esc(story.quote.replace(/[“”]/g, ''))}”</p>` : ''}
      <span class="story-card__more">${esc(t('stories.read'))} ${icon('arrowRight', 'icon icon--sm')}</span>
    </div>
  </a>`;
}

function gridHtml(stories, regions, filters) {
  const list = filterStories(stories, filters);
  if (list.length === 0) {
    return `<div class="empty"><p>${esc(t('common.noResults'))}</p><button type="button" class="btn btn--sm" data-clear>${esc(t('common.clearFilters'))}</button></div>`;
  }
  const hasFilter = Object.values(filters).some(Boolean);
  return list.map((story, i) => storyCard(story, regions, !hasFilter && i === 0)).join('');
}

function countText(stories, filters) {
  return plural(filterStories(stories, filters).length, 'stories.countOne', 'stories.count');
}

export function view(data, ctx) {
  const filters = readFilters(ctx.query, data.regions);
  return `
  <section class="section">
    <div class="container">
      ${pageHead({ eyebrow: t('stories.eyebrow'), title: t('stories.title'), lead: t('stories.lead') })}
      <div class="filters">
        <div class="field">
          <label for="story-region">${esc(t('common.region'))}</label>
          <select id="story-region" class="select">${regionOptions(data.regions, filters.region)}</select>
        </div>
        <div class="field">
          <span class="field__label">${esc(t('common.field'))}</span>
          ${chipGroup('field', TRACK_ORDER, filters.field, (f) => t(`common.fields.${f}`))}
        </div>
        <div class="field">
          <span class="field__label">${esc(t('common.gender'))}</span>
          ${chipGroup('gender', GENDERS, filters.gender, (g) => t(`common.genders.${g}`))}
        </div>
      </div>
      <p class="result-count" aria-live="polite" data-count-label>${esc(countText(data.stories, filters))}</p>
      <div class="story-grid" data-grid>${gridHtml(data.stories, data.regions, filters)}</div>
    </div>
  </section>`;
}

export function mount(root, data, ctx) {
  let filters = readFilters(ctx.query, data.regions);
  const grid = root.querySelector('[data-grid]');
  const count = root.querySelector('[data-count-label]');
  const apply = (next) => {
    filters = next;
    grid.innerHTML = gridHtml(data.stories, data.regions, filters);
    count.textContent = countText(data.stories, filters);
    root.querySelector('#story-region').value = filters.region;
    root.querySelectorAll('[data-filter]').forEach((chip) => {
      chip.setAttribute('aria-pressed', String(filters[chip.dataset.filter] === chip.dataset.value));
    });
    window.history.replaceState(null, '', buildHash('/stories', filters));
  };
  root.querySelector('#story-region').addEventListener('change', (e) => apply({ ...filters, region: e.target.value }));
  root.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-filter]');
    if (chip) apply({ ...filters, [chip.dataset.filter]: chip.dataset.value });
    if (event.target.closest('[data-clear]')) apply({ region: '', field: '', gender: '' });
  });
}
