// Opportunity map: #/opportunities?q=&region=&field=&tags=
import { loadAll } from '../data.js';
import { t, locale } from '../i18n.js';
import { esc } from '../lib/escape.js';
import { daysBetween, dateParts, todayIso } from '../lib/format.js';
import { filterOpportunities, resolveRegion, isReachableEverywhere, OPPORTUNITY_TAGS, hasTag } from '../lib/filters.js';
import { buildHash } from '../lib/router.js';
import { TRACK_ORDER } from '../lib/quiz.js';
import { icon } from '../icons.js';
import { toast, regionName, regionOptions, pageHead, plural } from '../ui.js';

const URGENT_DAYS = 21;

export function load() {
  return loadAll(['opportunities', 'regions', 'towns']);
}

export function title() {
  return t('nav.opportunities');
}

function readState(query, regions) {
  const tags = String(query.tags ?? '').split(',').filter((tag) => OPPORTUNITY_TAGS.includes(tag));
  return {
    q: String(query.q ?? '').slice(0, 60),
    region: regions.some((r) => r.id === query.region) ? query.region : '',
    field: TRACK_ORDER.includes(query.field) ? query.field : '',
    tags,
  };
}

function effectiveRegion(state, data) {
  return state.region || resolveRegion(state.q, data.towns, data.regions);
}

function deadlineBadge(opp) {
  const days = daysBetween(todayIso(), opp.deadline);
  const date = dateParts(opp.deadline, locale());
  let note = t('opps.daysLeft', { n: days });
  if (days < 0) note = t('opps.closed');
  else if (days === 0) note = t('opps.lastDay');
  const isUrgent = days >= 0 && days <= URGENT_DAYS;
  return `<div class="opp__deadline ${isUrgent ? 'is-urgent' : ''}">
    <span class="opp__deadline-label">${esc(t('opps.deadline'))}</span>
    <span class="opp__deadline-date">${esc(date.day)} ${esc(date.month)}</span>
    <span class="opp__deadline-left">${esc(note)}</span>
  </div>`;
}

function oppCard(opp, regions) {
  const where = isReachableEverywhere(opp)
    ? t('opps.everywhere')
    : `${opp.city} · ${regionName(regions, opp.region)}`;
  const tags = OPPORTUNITY_TAGS.filter((tag) => hasTag(opp, tag))
    .map((tag) => `<span class="tag tag--${tag}">${esc(t(`opps.tags.${tag}`))}</span>`)
    .join('');
  const fields = opp.fields.map((f) => t(`common.fields.${f}`)).join(', ');
  return `<article class="opp">
    <div class="opp__top">
      <div>
        <p class="opp__type">${esc(t(`opps.types.${opp.type}`))} · ${esc(t(`opps.formats.${opp.format}`))}</p>
        <h3 class="opp__title">${esc(opp.title)}</h3>
      </div>
      ${deadlineBadge(opp)}
    </div>
    <p class="opp__desc">${esc(opp.desc)}</p>
    <dl class="opp__meta">
      <dt>${esc(t('opps.forWho'))}</dt><dd>${esc(opp.audience)}</dd>
      <dt>${esc(t('opps.where'))}</dt><dd>${esc(where)}</dd>
      <dt>${esc(t('common.field'))}</dt><dd>${esc(fields)}</dd>
    </dl>
    ${tags ? `<div class="opp__tags">${tags}</div>` : ''}
    <div class="opp__actions">
      <button type="button" class="btn btn--sm btn--primary" data-remind="${esc(opp.deadline)}">${icon('bell')}<span>${esc(t('opps.remind'))}</span></button>
      <button type="button" class="btn btn--sm" data-link>${esc(t('opps.open'))}${icon('external')}</button>
    </div>
  </article>`;
}

function resultsHtml(state, data) {
  const region = effectiveRegion(state, data);
  const list = filterOpportunities(data.opportunities, { region, text: region ? '' : state.q, field: state.field, tags: state.tags });
  const resolvedNote = region && !state.region ? `<p class="resolved">${icon('pin', 'icon icon--sm')} ${esc(t('opps.resolved', { region: regionName(data.regions, region) }))}</p>` : '';
  const fieldChip = state.field
    ? `<button type="button" class="chip chip--active" data-remove-field aria-label="${esc(t('opps.removeFilter'))}">${esc(t('opps.fieldFilter', { field: t(`common.fields.${state.field}`) }))} ${icon('close', 'icon icon--sm')}</button>`
    : '';
  const body = list.length
    ? `<div class="opp-list">${list.map((o) => oppCard(o, data.regions)).join('')}</div>`
    : `<div class="empty"><p>${esc(t('common.noResults'))}</p><button type="button" class="btn btn--sm" data-clear>${esc(t('common.clearFilters'))}</button></div>`;
  return `<div class="results-head">
      <p class="result-count">${esc(plural(list.length, 'opps.countOne', 'opps.count'))}</p>${fieldChip}
    </div>${resolvedNote}${body}`;
}

function tagChips(state) {
  return OPPORTUNITY_TAGS.map((tag) => `<button type="button" class="chip chip--${tag}" data-tag="${tag}" aria-pressed="${state.tags.includes(tag)}">${esc(t(`opps.tags.${tag}`))}</button>`).join('');
}

export function view(data, ctx) {
  const state = readState(ctx.query, data.regions);
  return `
  <section class="section">
    <div class="container">
      ${pageHead({ eyebrow: t('opps.eyebrow'), title: t('opps.title'), lead: t('opps.lead') })}
      <div class="search-panel card">
        <div class="field">
          <label for="opp-q">${esc(t('opps.search'))}</label>
          <div class="input-icon">${icon('pin')}<input id="opp-q" class="input" type="search" list="opp-towns" value="${esc(state.q)}" placeholder="${esc(t('opps.searchPh'))}" autocomplete="off" maxlength="60"></div>
          <datalist id="opp-towns">${data.towns.map((town) => `<option value="${esc(town.name)}"></option>`).join('')}</datalist>
        </div>
        <div class="field">
          <label for="opp-region">${esc(t('common.region'))}</label>
          <select id="opp-region" class="select">${regionOptions(data.regions, state.region)}</select>
        </div>
        <div class="field search-panel__tags">
          <span class="field__label">${esc(t('opps.tagsLabel'))}</span>
          <div class="chip-row">${tagChips(state)}</div>
        </div>
      </div>
      <div data-results aria-live="polite">${resultsHtml(state, data)}</div>
    </div>
  </section>`;
}

export function mount(root, data, ctx) {
  let state = readState(ctx.query, data.regions);
  const results = root.querySelector('[data-results]');
  const apply = (next) => {
    state = next;
    results.innerHTML = resultsHtml(state, data);
    root.querySelectorAll('[data-tag]').forEach((chip) => chip.setAttribute('aria-pressed', String(state.tags.includes(chip.dataset.tag))));
    window.history.replaceState(null, '', buildHash('/opportunities', { ...state, tags: state.tags.join(',') }));
  };
  const townInput = root.querySelector('#opp-q');
  const regionSelect = root.querySelector('#opp-region');
  // Town search and the voivodeship list are alternatives: using one clears the other.
  townInput.addEventListener('input', (e) => {
    regionSelect.value = '';
    apply({ ...state, q: e.target.value, region: '' });
  });
  regionSelect.addEventListener('change', (e) => {
    if (e.target.value) townInput.value = '';
    apply({ ...state, region: e.target.value, q: e.target.value ? '' : state.q });
  });
  root.addEventListener('click', (event) => {
    const tagChip = event.target.closest('[data-tag]');
    if (tagChip) {
      const tag = tagChip.dataset.tag;
      const tags = state.tags.includes(tag) ? state.tags.filter((x) => x !== tag) : [...state.tags, tag];
      apply({ ...state, tags });
    }
    if (event.target.closest('[data-remove-field]')) apply({ ...state, field: '' });
    if (event.target.closest('[data-clear]')) {
      root.querySelector('#opp-q').value = '';
      root.querySelector('#opp-region').value = '';
      apply({ q: '', region: '', field: '', tags: [] });
    }
    const remind = event.target.closest('[data-remind]');
    if (remind) toast(t('opps.reminded', { date: dateParts(remind.dataset.remind, locale()).full }));
    if (event.target.closest('[data-link]')) toast(t('common.linkDemo'));
  });
}
