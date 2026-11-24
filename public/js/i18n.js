// All interface text lives in /i18n/<lang>.json.
// To add Polish: copy en.json to pl.json, translate the values, open the site with ?lang=pl
import { getPath, interpolate } from './lib/format.js';

export const SUPPORTED_LANGS = Object.freeze(['en', 'pl']);
export const DEFAULT_LANG = 'en';

let strings = {};
let currentLang = DEFAULT_LANG;

export function pickLang(search = window.location.search) {
  const requested = new URLSearchParams(search).get('lang');
  return SUPPORTED_LANGS.includes(requested) ? requested : DEFAULT_LANG;
}

export async function loadStrings(lang) {
  const res = await fetch(`i18n/${lang}.json`);
  if (!res.ok) throw new Error(`Cannot load i18n/${lang}.json (HTTP ${res.status})`);
  strings = await res.json();
  currentLang = lang;
  document.documentElement.lang = lang;
}

export function getLang() {
  return currentLang;
}

/** Translate a dotted key, e.g. t('profile.hintMany', { n: 4 }). Missing keys show the key itself. */
export function t(key, vars) {
  const value = getPath(strings, key);
  return typeof value === 'string' ? interpolate(value, vars) : key;
}

/** Arrays and objects from the strings file (lists of points, steps, options). */
export function tData(key, fallback = []) {
  const value = getPath(strings, key);
  return value ?? fallback;
}

/** Locale for dates and numbers. */
export function locale() {
  return currentLang === 'pl' ? 'pl-PL' : 'en-GB';
}
