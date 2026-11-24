// The page the workshop QR code points to: #/join
import { loadAll } from '../data.js';
import { t, tData } from '../i18n.js';
import { esc } from '../lib/escape.js';
import { AGES, GENDERS, validateJoin } from '../lib/validate.js';
import { icon } from '../icons.js';
import * as store from '../store.js';
import { toast } from '../ui.js';

const DEMO_PROFILE = Object.freeze({
  name: 'Ola',
  city: 'Biłgoraj',
  school: 'General Secondary School No. 1',
  age: '17',
  gender: 'female',
});

export function load() {
  return loadAll(['towns']);
}

export function title() {
  return t('nav.join');
}

function textField(id, autocomplete, extra = '') {
  return `<div class="field">
    <label for="join-${id}">${esc(t(`join.${id}`))}</label>
    <input id="join-${id}" name="${id}" class="input" type="text" placeholder="${esc(t(`join.${id}Ph`))}"
      autocomplete="${autocomplete}" aria-describedby="join-${id}-error" ${extra}>
    <p id="join-${id}-error" class="field__error" hidden></p>
  </div>`;
}

function ageField() {
  const options = AGES.map((age) => `<option value="${age}">${age === 'other' ? esc(t('join.ageOther')) : age}</option>`).join('');
  return `<div class="field">
    <label for="join-age">${esc(t('join.age'))}</label>
    <select id="join-age" name="age" class="select" aria-describedby="join-age-error">
      <option value="">${esc(t('join.agePick'))}</option>${options}
    </select>
    <p id="join-age-error" class="field__error" hidden></p>
  </div>`;
}

function genderField() {
  const labels = tData('join.genderOptions', {});
  const options = GENDERS.map((g) => `<label class="pill-radio"><input type="radio" name="gender" value="${g}"><span>${esc(labels[g] ?? g)}</span></label>`).join('');
  return `<fieldset class="field" aria-describedby="join-gender-why join-gender-error">
    <legend>${esc(t('join.gender'))}</legend>
    <div class="pill-radios">${options}</div>
    <p id="join-gender-why" class="field__hint">${esc(t('join.genderWhy'))}</p>
    <p id="join-gender-error" class="field__error" hidden></p>
  </fieldset>`;
}

function alreadyBanner() {
  if (!store.getProfile()) return '';
  return `<div class="notice">${esc(t('join.already'))} <a href="#/me">${esc(t('join.alreadyCta'))}</a></div>`;
}

export function view(data) {
  const towns = data.towns.map((town) => `<option value="${esc(town.name)}"></option>`).join('');
  return `
  <section class="section">
    <div class="container join">
      <div class="join__intro">
        <p class="eyebrow">${icon('check', 'icon icon--sm')} ${esc(t('join.eyebrow'))}</p>
        <h1>${esc(t('join.title'))}</h1>
        <p class="lead">${esc(t('join.lead'))}</p>
        ${alreadyBanner()}
      </div>
      <form class="card form join__form" novalidate>
        ${textField('name', 'given-name', 'maxlength="40"')}
        ${textField('city', 'address-level2', 'list="join-towns" maxlength="60"')}
        <datalist id="join-towns">${towns}</datalist>
        ${textField('school', 'organization', 'maxlength="80"')}
        ${ageField()}
        ${genderField()}
        <div class="field">
          <label class="check"><input type="checkbox" name="consent" aria-describedby="join-consent-error"><span>${esc(t('join.consent'))}</span></label>
          <p id="join-consent-error" class="field__error" hidden></p>
        </div>
        <button type="submit" class="btn btn--primary btn--block btn--lg">${esc(t('join.submit'))}${icon('arrowRight')}</button>
        <button type="button" class="btn btn--ghost btn--block" data-demo-fill>${icon('spark')}<span>${esc(t('join.demoFill'))}</span></button>
      </form>
    </div>
  </section>`;
}

function readForm(form) {
  const fd = new FormData(form);
  return {
    name: fd.get('name'),
    city: fd.get('city'),
    school: fd.get('school'),
    age: fd.get('age'),
    gender: fd.get('gender'),
    consent: fd.get('consent') === 'on',
  };
}

function showErrors(form, errors) {
  ['name', 'city', 'school', 'age', 'gender', 'consent'].forEach((key) => {
    const message = form.querySelector(`#join-${key}-error`);
    const hasError = Boolean(errors[key]);
    message.hidden = !hasError;
    message.textContent = hasError ? t(`join.errors.${key}`) : '';
    form.querySelectorAll(`[name="${key}"]`).forEach((input) => {
      if (hasError) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    });
  });
  const first = form.querySelector('[aria-invalid="true"]');
  if (first) first.focus();
}

function fillDemo(form) {
  Object.entries(DEMO_PROFILE).forEach(([key, value]) => {
    if (key === 'gender') form.querySelector(`[name="gender"][value="${value}"]`).checked = true;
    else form.elements[key].value = value;
  });
  form.elements.consent.checked = true;
}

export function mount(root) {
  const form = root.querySelector('form');
  form.querySelector('[data-demo-fill]').addEventListener('click', () => fillDemo(form));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = validateJoin(readForm(form));
    showErrors(form, result.errors);
    if (!result.ok) return;
    store.setProfile(result.value);
    toast(t('join.success', { name: result.value.name }));
    window.location.hash = '#/me';
  });
}
