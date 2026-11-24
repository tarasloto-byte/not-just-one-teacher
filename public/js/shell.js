// Header, mobile menu, bottom tab bar and footer.
import { esc } from './lib/escape.js';
import { t } from './i18n.js';
import { icon } from './icons.js';
import { toast } from './ui.js';
import * as store from './store.js';

const NAV_ITEMS = Object.freeze([
  { id: 'home', href: '#/', icon: 'home', tab: true },
  { id: 'stories', href: '#/stories', icon: 'film', tab: true },
  { id: 'opportunities', href: '#/opportunities', icon: 'pin', tab: true, tabLabel: 'nav.tabOpportunities' },
  { id: 'path', href: '#/path', icon: 'route', tab: true },
  { id: 'cities', href: '#/cities', icon: 'trophy' },
  { id: 'teachers', href: '#/teachers', icon: 'book' },
]);

function profileLink() {
  const hasProfile = Boolean(store.getProfile());
  return hasProfile
    ? { id: 'me', href: '#/me', icon: 'user', label: t('nav.me') }
    : { id: 'join', href: '#/join', icon: 'user', label: t('nav.join') };
}

function navLink(item, className = '') {
  return `<a class="${className}" href="${item.href}" data-nav="${item.id}">${esc(t(`nav.${item.id}`))}</a>`;
}

function headerHtml() {
  const me = profileLink();
  return `
  <div class="container site-header__inner">
    <a class="logo" href="#/" aria-label="${esc(t('meta.title'))}">
      <span class="logo__mark" aria-hidden="true">${icon('users')}</span>
      <span class="logo__text">Not Just<br>One Teacher</span>
    </a>
    <nav class="main-nav" aria-label="${esc(t('a11y.mainNav'))}">
      ${NAV_ITEMS.map((item) => navLink(item)).join('')}
    </nav>
    <div class="site-header__actions">
      <span class="demo-badge">${esc(t('common.demoBadge'))}</span>
      <a class="btn btn--primary btn--sm header-cta" href="${me.href}" data-nav="${me.id}" data-profile-link>${icon('user')}<span>${esc(me.label)}</span></a>
      <button type="button" class="icon-btn menu-btn" aria-expanded="false" aria-controls="mobile-nav" aria-label="${esc(t('a11y.menu'))}">${icon('menu')}</button>
    </div>
  </div>
  <nav id="mobile-nav" class="mobile-nav" hidden aria-label="${esc(t('a11y.mainNav'))}">
    <div class="container mobile-nav__list">
      ${NAV_ITEMS.map((item) => `<a href="${item.href}" data-nav="${item.id}">${icon(item.icon)}<span>${esc(t(`nav.${item.id}`))}</span></a>`).join('')}
    </div>
  </nav>`;
}

function tabbarHtml() {
  const me = profileLink();
  const tabs = NAV_ITEMS.filter((item) => item.tab).map((item) => ({
    ...item,
    label: t(item.tabLabel ?? `nav.${item.id}`),
  }));
  return [...tabs, me]
    .map((item) => `<a href="${item.href}" data-nav="${item.id}">${icon(item.icon)}<span>${esc(item.label)}</span></a>`)
    .join('');
}

function footerHtml() {
  return `
  <div class="container site-footer__inner">
    <div>
      <p class="site-footer__brand">${esc(t('meta.title'))}</p>
      <p>${esc(t('footer.text'))}</p>
      <p class="site-footer__note">${esc(t('footer.note'))}</p>
    </div>
    <button type="button" class="btn btn--sm btn--ghost-light" data-reset>${esc(t('footer.reset'))}</button>
  </div>`;
}

function bindMenu(header) {
  const button = header.querySelector('.menu-btn');
  const panel = header.querySelector('#mobile-nav');
  button.addEventListener('click', () => {
    const isOpen = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!isOpen));
    panel.hidden = isOpen;
  });
}

export function closeMenu() {
  const button = document.querySelector('.menu-btn');
  const panel = document.getElementById('mobile-nav');
  if (!button || !panel) return;
  button.setAttribute('aria-expanded', 'false');
  panel.hidden = true;
}

export function renderShell({ onReset }) {
  const header = document.querySelector('.site-header');
  header.innerHTML = headerHtml();
  bindMenu(header);
  document.querySelector('.skip-link').textContent = t('a11y.skip');
  const tabbar = document.querySelector('.tabbar');
  tabbar.setAttribute('aria-label', t('a11y.tabNav'));
  tabbar.innerHTML = tabbarHtml();
  const footer = document.querySelector('.site-footer');
  footer.innerHTML = footerHtml();
  footer.querySelector('[data-reset]').addEventListener('click', () => {
    store.resetAll();
    toast(t('footer.resetDone'));
    onReset();
  });
}

/** Refresh the profile/join links and highlight the current section. */
export function updateShell(section) {
  const me = profileLink();
  document.querySelector('.tabbar').innerHTML = tabbarHtml();
  const cta = document.querySelector('[data-profile-link]');
  if (cta) {
    cta.href = me.href;
    cta.dataset.nav = me.id;
    cta.querySelector('span').textContent = me.label;
  }
  document.querySelectorAll('[data-nav]').forEach((link) => {
    const isActive = link.dataset.nav === section || (section === 'module' && link.dataset.nav === 'path');
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  closeMenu();
}
