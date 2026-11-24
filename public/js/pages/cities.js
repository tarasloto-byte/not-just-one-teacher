// Town vs town leaderboard: #/cities
import { loadAll } from '../data.js';
import { t } from '../i18n.js';
import { esc } from '../lib/escape.js';
import { normalize } from '../lib/format.js';
import { rankCities, POINTS } from '../lib/leaderboard.js';
import { icon } from '../icons.js';
import * as store from '../store.js';
import { regionName, pageHead, formatNumber } from '../ui.js';

export function load() {
  return loadAll(['cities', 'regions']);
}

export function title() {
  return t('nav.cities');
}

function prizes() {
  return `<div class="prize-grid">
    <div class="prize prize--lime">
      <span class="prize__icon" aria-hidden="true">${icon('trophy')}</span>
      <h2 class="prize__title">${esc(t('cities.prizeTitle'))}</h2>
      <p>${esc(t('cities.prizeText'))}</p>
    </div>
    <div class="prize prize--violet">
      <span class="prize__icon" aria-hidden="true">${icon('spark')}</span>
      <h2 class="prize__title">${esc(t('cities.hackTitle'))}</h2>
      <p>${esc(t('cities.hackText'))}</p>
    </div>
  </div>`;
}

function rowHtml(city, regions, max, myTown) {
  const isMine = myTown && normalize(city.town) === myTown;
  const width = max > 0 ? Math.round((city.perStudent / max) * 100) : 0;
  return `<tr class="${isMine ? 'is-mine' : ''} ${city.rank <= 3 ? `is-top is-top-${city.rank}` : ''}">
    <td class="board__rank"><span>${city.rank}</span></td>
    <th scope="row" class="board__town">${esc(city.town)}${isMine ? ` <span class="tag tag--mine">${esc(t('cities.yourTown'))}</span>` : ''}<span class="board__region">${esc(regionName(regions, city.region))}</span></th>
    <td class="board__num hide-sm">${formatNumber(city.students)}</td>
    <td class="board__score">
      <span class="board__value">${formatNumber(city.perStudent)}</span>
      <span class="bar" aria-hidden="true"><span style="width:${width}%"></span></span>
    </td>
    <td class="board__num hide-sm">${formatNumber(city.total)}</td>
  </tr>`;
}

function board(ranked, regions) {
  const myCity = store.getProfile()?.city;
  const myTown = myCity ? normalize(myCity) : '';
  const max = ranked[0]?.perStudent ?? 0;
  return `<div class="board-wrap card">
    <h2 class="board__title">${esc(t('cities.boardTitle'))}</h2>
    <table class="board">
      <thead><tr>
        <th scope="col">${esc(t('cities.table.rank'))}</th>
        <th scope="col">${esc(t('cities.table.town'))}</th>
        <th scope="col" class="hide-sm">${esc(t('cities.table.students'))}</th>
        <th scope="col">${esc(t('cities.table.points'))}</th>
        <th scope="col" class="hide-sm">${esc(t('cities.table.total'))}</th>
      </tr></thead>
      <tbody>${ranked.map((c) => rowHtml(c, regions, max, myTown)).join('')}</tbody>
    </table>
  </div>`;
}

function pointsExplainer() {
  const items = [
    { key: 'module', icon: 'book' },
    { key: 'task', icon: 'spark' },
    { key: 'session', icon: 'users' },
  ].map((item) => `<li class="points__item">
      <span class="points__icon" aria-hidden="true">${icon(item.icon)}</span>
      <span class="points__pts">${esc(t('cities.pts', { n: POINTS[item.key] }))}</span>
      <span>${esc(t(`cities.how.${item.key}`))}</span>
    </li>`).join('');
  return `<div class="card points">
    <h2>${esc(t('cities.howTitle'))}</h2>
    <ul class="points__list">${items}</ul>
  </div>`;
}

export function view(data) {
  const ranked = rankCities(data.cities);
  return `
  <section class="section">
    <div class="container">
      ${pageHead({ eyebrow: t('cities.eyebrow'), title: t('cities.title'), lead: t('cities.lead') })}
      ${prizes()}
      <div class="cities-layout">
        ${board(ranked, data.regions)}
        ${pointsExplainer()}
      </div>
    </div>
  </section>`;
}
