// Shared UI pieces: toasts, modal dialog, placeholders, small HTML helpers.
import { esc } from './lib/escape.js';
import { initials } from './lib/format.js';
import { t, locale } from './i18n.js';
import { icon } from './icons.js';

const TOAST_MS = 3600;
const COUNT_UP_MS = 1200;

export function toast(message) {
  const region = document.querySelector('.toast-region');
  if (!region) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  region.append(el);
  window.setTimeout(() => el.remove(), TOAST_MS);
}

/** Open a native <dialog>. `body` must be trusted/escaped HTML. Returns a close function. */
export function openModal({ title, body, onMount }) {
  const dialog = document.createElement('dialog');
  dialog.className = 'modal';
  dialog.setAttribute('aria-labelledby', 'modal-title');
  dialog.innerHTML = `
    <div class="modal__head">
      <h2 id="modal-title" class="modal__title">${esc(title)}</h2>
      <button type="button" class="icon-btn" data-close aria-label="${esc(t('a11y.close'))}">${icon('close')}</button>
    </div>
    <div class="modal__body">${body}</div>`;
  document.body.append(dialog);
  const close = () => dialog.close();
  dialog.addEventListener('close', () => dialog.remove());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target.closest('[data-close]')) close();
  });
  dialog.showModal();
  if (onMount) onMount(dialog, close);
  return close;
}

export function photoPlaceholder(name, hue, className = '') {
  const label = `${t('a11y.photoPlaceholder')}: ${name}`;
  return `<div class="ph-photo ${className}" style="--hue:${Number(hue) || 0}" role="img" aria-label="${esc(label)}">
    <span class="ph-photo__initials" aria-hidden="true">${esc(initials(name))}</span>
  </div>`;
}

export function videoPlaceholder({ label = '', hue = 265, className = '', overlay = '' } = {}) {
  return `<div class="video-ph ${className}" style="--hue:${Number(hue) || 0}">
    ${overlay}
    <button type="button" class="video-ph__play" data-video aria-label="${esc(t('common.play'))}">${icon('play')}</button>
    ${label ? `<span class="video-ph__label">${icon('film', 'icon icon--sm')} ${esc(label)}</span>` : ''}
    <span class="visually-hidden">${esc(t('a11y.videoPlaceholder'))}</span>
  </div>`;
}

export function bindVideoButtons(root) {
  root.querySelectorAll('[data-video]').forEach((button) => {
    button.addEventListener('click', () => toast(t('common.videoDemo')));
  });
}

export function fieldTag(field) {
  return `<span class="tag tag--field tag--${esc(field)}">${esc(t(`common.fields.${field}`))}</span>`;
}

export function regionName(regions, id) {
  const region = regions.find((r) => r.id === id);
  return region ? region.name : id;
}

export function regionOptions(regions, selected, allLabel = t('common.allRegions')) {
  const options = regions.map(
    (r) => `<option value="${esc(r.id)}" ${r.id === selected ? 'selected' : ''}>${esc(r.name)}</option>`,
  );
  return `${allLabel === null ? '' : `<option value="">${esc(allLabel)}</option>`}${options.join('')}`;
}

export function pageHead({ eyebrow, title, lead, extra = '' }) {
  return `<header class="page-head">
    <p class="eyebrow">${esc(eyebrow)}</p>
    <h1 class="page-head__title">${esc(title)}</h1>
    ${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
    ${extra}
  </header>`;
}

export function formatNumber(n) {
  return Number(n).toLocaleString(locale());
}

/** Animate numbers in [data-count] when they scroll into view. */
export function countUp(elements) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const run = (el) => {
    const target = Number(el.dataset.count);
    if (reduceMotion) {
      el.textContent = formatNumber(target);
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / COUNT_UP_MS);
      const eased = 1 - (1 - p) ** 3;
      el.textContent = formatNumber(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const observer = new IntersectionObserver((entries) => {
    entries.filter((e) => e.isIntersecting).forEach((e) => {
      observer.unobserve(e.target);
      run(e.target);
    });
  }, { threshold: 0.4 });
  elements.forEach((el) => observer.observe(el));
}

export function plural(count, oneKey, manyKey) {
  return count === 1 ? t(oneKey, { n: count }) : t(manyKey, { n: count });
}
