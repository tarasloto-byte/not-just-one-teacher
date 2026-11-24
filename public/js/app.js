// Entry point: hash router. Every page module exports load(ctx), view(data, ctx), mount(root, data, ctx)
// and optionally title(data, ctx).
import { loadStrings, pickLang, t, DEFAULT_LANG } from './i18n.js';
import { parseHash, matchRoute } from './lib/router.js';
import { esc } from './lib/escape.js';
import { renderShell, updateShell } from './shell.js';
import * as home from './pages/home.js';
import * as join from './pages/join.js';
import * as profile from './pages/profile.js';
import * as stories from './pages/stories.js';
import * as story from './pages/story.js';
import * as opportunities from './pages/opportunities.js';
import * as path from './pages/path.js';
import * as module from './pages/module.js';
import * as cities from './pages/cities.js';
import * as teachers from './pages/teachers.js';
import * as tutor from './pages/tutor.js';
import * as notFound from './pages/not-found.js';

const ROUTES = [
  { pattern: '', section: 'home', page: home },
  { pattern: 'join', section: 'join', page: join },
  { pattern: 'me', section: 'me', page: profile },
  { pattern: 'stories', section: 'stories', page: stories },
  { pattern: 'stories/:id', section: 'stories', page: story },
  { pattern: 'opportunities', section: 'opportunities', page: opportunities },
  { pattern: 'path', section: 'path', page: path },
  { pattern: 'path/:track', section: 'path', page: path },
  { pattern: 'path/:track/:moduleId', section: 'path', page: module },
  { pattern: 'tutor', section: 'tutor', page: tutor },
  { pattern: 'cities', section: 'cities', page: cities },
  { pattern: 'teachers', section: 'teachers', page: teachers },
];
const NOT_FOUND = { pattern: '*', section: '', page: notFound };

let navigationId = 0;

function errorView(err) {
  return `<section class="section"><div class="container narrow">
    <h1>${esc(t('common.loadError'))}</h1>
    <p class="muted">${esc(err.message)}</p>
    <button type="button" class="btn btn--primary" data-retry>${esc(t('common.retry'))}</button>
  </div></section>`;
}

function setTitle(route, data, ctx) {
  const pageTitle = route.page.title ? route.page.title(data, ctx) : t(`nav.${route.section}`);
  document.title = route.section === 'home' ? t('meta.title') : `${pageTitle} · ${t('meta.title')}`;
}

/** Each render gets a fresh wrapper, so page event listeners never pile up on <main>. */
function showPage(main, html) {
  const page = document.createElement('div');
  page.className = 'page page-enter';
  page.innerHTML = html;
  main.replaceChildren(page);
  return page;
}

async function handleRoute({ keepScroll = false } = {}) {
  const parsed = parseHash(window.location.hash || '#/');
  if (!parsed) return; // in-page anchor such as #main
  const id = ++navigationId;
  const match = matchRoute(ROUTES, parsed.segments) ?? { route: NOT_FOUND, params: {} };
  const { route } = match;
  const main = document.getElementById('main');
  const ctx = { params: match.params, query: parsed.query, refresh: () => handleRoute({ keepScroll: true }) };
  updateShell(route.section);
  try {
    const data = await route.page.load(ctx);
    if (id !== navigationId) return; // a newer navigation started meanwhile
    const page = showPage(main, route.page.view(data, ctx));
    route.page.mount?.(page, data, ctx);
    setTitle(route, data, ctx);
  } catch (err) {
    if (id !== navigationId) return;
    console.error('[router] Failed to render page:', err);
    showPage(main, errorView(err))
      .querySelector('[data-retry]').addEventListener('click', () => handleRoute());
  }
  if (!keepScroll) {
    window.scrollTo({ top: 0 });
    main.focus({ preventScroll: true });
  }
}

function showFatal(message) {
  document.getElementById('main').innerHTML = `<div class="container section"><h1>Not Just One Teacher</h1><p>${esc(message)}</p></div>`;
}

function goHome() {
  const isHome = !window.location.hash || window.location.hash === '#/';
  if (isHome) handleRoute();
  else window.location.hash = '#/';
}

async function boot() {
  if (window.location.protocol === 'file:') {
    showFatal('Please start the demo with "npm start" and open http://localhost:5173 — opening index.html directly does not work.');
    return;
  }
  const lang = pickLang();
  try {
    await loadStrings(lang);
  } catch (err) {
    if (lang === DEFAULT_LANG) throw err;
    await loadStrings(DEFAULT_LANG);
  }
  renderShell({ onReset: goHome });
  window.addEventListener('hashchange', () => handleRoute());
  handleRoute();
}

boot().catch((err) => {
  console.error('[boot] Demo failed to start:', err);
  showFatal('The demo could not start. Check that the server is running (npm start).');
});
