import { t } from '../i18n.js';
import { esc } from '../lib/escape.js';

export function load() {
  return Promise.resolve(null);
}

export function title() {
  return t('notFound.title');
}

export function view() {
  return `<section class="section"><div class="container narrow center">
    <p class="huge-404" aria-hidden="true">404</p>
    <h1>${esc(t('notFound.title'))}</h1>
    <a class="btn btn--primary btn--lg" href="#/">${esc(t('notFound.cta'))}</a>
  </div></section>`;
}
