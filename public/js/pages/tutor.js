// Socratic AI tutor skill: #/tutor?subject=math|biology|finance
import { loadAll } from '../data.js';
import { t, tData } from '../i18n.js';
import { esc } from '../lib/escape.js';
import { buildHash } from '../lib/router.js';
import { icon } from '../icons.js';
import { pageHead } from '../ui.js';

export function load() {
  return loadAll(['tutor']);
}

export function title() {
  return t('nav.tutor');
}

function pickDialogue(dialogues, id) {
  return dialogues.find((d) => d.id === id) ?? dialogues[0];
}

function heroView(cfg) {
  return `
  <section class="tutor-hero">
    <div class="container tutor-hero__grid">
      <div>
        <p class="eyebrow">${icon('spark', 'icon icon--sm')} ${esc(t('tutor.eyebrow'))}</p>
        <h1 class="tutor-hero__title">${esc(t('tutor.title'))}</h1>
        <p class="lead">${esc(t('tutor.lead'))}</p>
        <div class="hero__actions">
          <a class="btn btn--primary btn--lg" href="${esc(cfg.zipPath)}" download>${icon('download')}<span>${esc(t('tutor.download'))}</span></a>
          <a class="btn btn--lg" href="${esc(cfg.repoUrl)}" target="_blank" rel="noopener noreferrer">${esc(t('tutor.github'))}${icon('external')}</a>
        </div>
        <p class="muted small tutor-hero__note">${esc(t('tutor.downloadNote'))}</p>
      </div>
      <div class="tutor-hero__visual" aria-hidden="true">
        ${tData('tutor.heroBubbles').map((b) => `<span class="bubble bubble--${b.from === 'tutor' ? 'tutor' : 'student'}">${esc(b.text)}</span>`).join('')}
      </div>
    </div>
  </section>`;
}

function chatHtml(dialogue) {
  return dialogue.turns.map((turn, i) => {
    const isTutor = turn.from === 'tutor';
    const who = isTutor ? t('tutor.tutorName') : t('tutor.student');
    const move = isTutor && turn.move ? `<span class="chat__move">${icon('spark', 'icon icon--sm')} ${esc(t(`tutor.moves.${turn.move}`))}</span>` : '';
    return `<li class="chat__row chat__row--${isTutor ? 'tutor' : 'student'}" style="--i:${i}">
      <span class="visually-hidden">${esc(who)}:</span>
      <p class="chat__bubble">${esc(turn.text)}</p>
      ${move}
    </li>`;
  }).join('');
}

function demoView(dialogues, active) {
  const tabs = dialogues.map((d) => `<button type="button" class="chip" role="tab" data-subject="${esc(d.id)}" aria-selected="${d.id === active.id}" aria-pressed="${d.id === active.id}">${esc(d.subject)}</button>`).join('');
  return `
  <section class="section">
    <div class="container">
      ${pageHead({ eyebrow: t('tutor.demoEyebrow'), title: t('tutor.demoTitle'), lead: t('tutor.demoLead') })}
      <div class="chat-card card">
        <div class="chat-card__head">
          <div class="chip-row" role="tablist" aria-label="${esc(t('tutor.subjectsLabel'))}">${tabs}</div>
          <button type="button" class="btn btn--sm btn--ghost" data-replay>${icon('play')}<span>${esc(t('tutor.replay'))}</span></button>
        </div>
        <p class="chat-card__topic" data-topic>${esc(active.topic)}</p>
        <ol class="chat" data-chat aria-live="polite">${chatHtml(active)}</ol>
      </div>
    </div>
  </section>`;
}

function principlesView() {
  const cards = tData('tutor.principles').map((p, i) => `<li class="principle"><span class="principle__num" aria-hidden="true">0${i + 1}</span><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></li>`).join('');
  return `<section class="section section--tight"><div class="container"><h2>${esc(t('tutor.principlesTitle'))}</h2><ul class="principles">${cards}</ul></div></section>`;
}

function caseView() {
  const steps = tData('tutor.caseSteps').map((s) => `<li>${esc(s)}</li>`).join('');
  return `
  <section class="section">
    <div class="container">
      <div class="case">
        <div class="case__intro">
          <p class="eyebrow eyebrow--ink">${esc(t('tutor.caseEyebrow'))}</p>
          <h2 class="case__title">${esc(t('tutor.caseTitle'))}</h2>
          <p>${esc(t('tutor.caseLead'))}</p>
          <a class="btn btn--dark" href="${buildHash('/tutor', { subject: 'finance' })}" data-subject-link="finance">${icon('chat')}<span>${esc(t('tutor.caseCta'))}</span></a>
        </div>
        <ol class="case__steps">${steps}</ol>
      </div>
    </div>
  </section>`;
}

function parentsView(cfg) {
  const faq = tData('tutor.parentsFaq').map((item) => `<details class="faq"><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join('');
  const summary = tData('tutor.summaryLines').map((line) => `<li>${esc(line)}</li>`).join('');
  return `
  <section class="section parents">
    <div class="container parents__grid">
      <div>
        ${pageHead({ eyebrow: t('tutor.parentsEyebrow'), title: t('tutor.parentsTitle'), lead: t('tutor.parentsLead') })}
        <div class="faq-list">${faq}</div>
        <p class="age-note">${icon('lock', 'icon icon--sm')} ${esc(t('tutor.ageNote'))}</p>
        <a class="link-strong" href="${esc(cfg.parentsUrl)}" target="_blank" rel="noopener noreferrer">${esc(t('tutor.parentsLink'))} ${icon('external', 'icon icon--sm')}</a>
      </div>
      <aside class="summary-card">
        <p class="card__label">${esc(t('tutor.summaryTitle'))}</p>
        <ul class="summary-card__list">${summary}</ul>
      </aside>
    </div>
  </section>`;
}

function installView(cfg) {
  const steps = tData('tutor.install').map((s, i) => `<li class="install__step"><span class="how__num" aria-hidden="true">0${i + 1}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('');
  return `
  <section class="section">
    <div class="container">
      <h2>${esc(t('tutor.installTitle'))}</h2>
      <ol class="how">${steps}</ol>
      <div class="install__actions">
        <a class="btn btn--primary btn--lg" href="${esc(cfg.zipPath)}" download>${icon('download')}<span>${esc(t('tutor.download'))}</span></a>
        <p class="muted">${esc(t('tutor.noSkills'))} <a class="link-strong" href="${esc(cfg.promptUrl)}" target="_blank" rel="noopener noreferrer">${esc(t('tutor.noSkillsLink'))}</a></p>
      </div>
    </div>
  </section>`;
}

export function view(data, ctx) {
  const cfg = data.tutor;
  const active = pickDialogue(cfg.dialogues, ctx.query.subject);
  return [heroView(cfg), demoView(cfg.dialogues, active), principlesView(), caseView(), parentsView(cfg), installView(cfg)].join('');
}

export function mount(root, data, ctx) {
  const cfg = data.tutor;
  let active = pickDialogue(cfg.dialogues, ctx.query.subject);
  const chat = root.querySelector('[data-chat]');
  const topic = root.querySelector('[data-topic]');
  const show = (dialogue) => {
    active = dialogue;
    topic.textContent = dialogue.topic;
    chat.innerHTML = chatHtml(dialogue);
    root.querySelectorAll('[data-subject]').forEach((tab) => {
      const isActive = tab.dataset.subject === dialogue.id;
      tab.setAttribute('aria-selected', String(isActive));
      tab.setAttribute('aria-pressed', String(isActive));
    });
    window.history.replaceState(null, '', buildHash('/tutor', { subject: dialogue.id }));
  };
  root.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-subject]');
    if (tab) show(pickDialogue(cfg.dialogues, tab.dataset.subject));
    if (event.target.closest('[data-replay]')) show(active);
    const caseLink = event.target.closest('[data-subject-link]');
    if (caseLink) {
      event.preventDefault();
      show(pickDialogue(cfg.dialogues, caseLink.dataset.subjectLink));
      chat.closest('section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}
