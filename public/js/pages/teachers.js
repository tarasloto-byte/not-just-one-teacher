// For teachers: demo class dashboard + lesson materials. #/teachers
import { loadAll } from '../data.js';
import { t, tData } from '../i18n.js';
import { esc } from '../lib/escape.js';
import { MODULES_PER_TRACK } from '../lib/progress.js';
import { icon } from '../icons.js';
import { toast, pageHead } from '../ui.js';

const ACTIVE_WITHIN_DAYS = 7;

export function load() {
  return loadAll(['teacher-class', 'lesson-materials']);
}

export function title() {
  return t('nav.teachers');
}

function classStats(students) {
  const count = students.length || 1;
  const pct = (n) => Math.round((n / count) * 100);
  const avg = students.reduce((sum, s) => sum + s.modules, 0) / count;
  return [
    { value: `${students.filter((s) => s.daysAgo <= ACTIVE_WITHIN_DAYS).length}/${students.length}`, label: t('teachers.stats.active') },
    { value: avg.toFixed(1), label: t('teachers.stats.avgModules') },
    { value: `${pct(students.filter((s) => s.gender === 'female').length)}%`, label: t('teachers.stats.girls') },
    { value: `${pct(students.filter((s) => s.session).length)}%`, label: t('teachers.stats.sessions') },
  ];
}

function lastActive(days) {
  if (days === 0) return t('teachers.lastActive.today');
  if (days === 1) return t('teachers.lastActive.yesterday');
  return t('teachers.lastActive.days', { n: days });
}

function dots(done) {
  const items = Array.from({ length: MODULES_PER_TRACK }, (_, i) => `<span class="dot ${i < done ? 'dot--on' : ''}"></span>`).join('');
  return `<span class="dots" role="img" aria-label="${done}/${MODULES_PER_TRACK}">${items}</span>`;
}

function studentRow(s) {
  const route = s.track ? `<span class="tag tag--field tag--${esc(s.track)}">${esc(t(`common.fields.${s.track}`))}</span>` : `<span class="muted">${esc(t('teachers.noRoute'))}</span>`;
  const isInactive = s.daysAgo > ACTIVE_WITHIN_DAYS;
  return `<tr>
    <th scope="row">${esc(s.name)}</th>
    <td>${route}</td>
    <td>${dots(s.modules)}</td>
    <td class="${isInactive ? 'is-inactive' : ''}">${esc(lastActive(s.daysAgo))}</td>
    <td class="hide-sm">${s.session ? `${icon('check', 'icon icon--sm')} ${esc(t('teachers.yes'))}` : `<span class="muted">${esc(t('teachers.no'))}</span>`}</td>
  </tr>`;
}

function dashboard(cls) {
  const stats = classStats(cls.students).map((s) => `<div class="dash-stat"><span class="dash-stat__value">${esc(s.value)}</span><span class="dash-stat__label">${esc(s.label)}</span></div>`).join('');
  return `<div class="dash card">
    <div class="dash__head">
      <div>
        <h2>${esc(t('teachers.dashTitle', { className: cls.className }))}</h2>
        <p class="muted">${esc(cls.teacher)} · ${esc(cls.school)}</p>
      </div>
      <button type="button" class="btn btn--sm btn--lime" data-nudge>${icon('bell')}<span>${esc(t('teachers.nudge'))}</span></button>
    </div>
    <div class="dash-stats">${stats}</div>
    <div class="table-scroll">
      <table class="class-table">
        <thead><tr>
          <th scope="col">${esc(t('teachers.table.student'))}</th>
          <th scope="col">${esc(t('teachers.table.route'))}</th>
          <th scope="col">${esc(t('teachers.table.modules'))}</th>
          <th scope="col">${esc(t('teachers.table.last'))}</th>
          <th scope="col" class="hide-sm">${esc(t('teachers.table.session'))}</th>
        </tr></thead>
        <tbody>${cls.students.map(studentRow).join('')}</tbody>
      </table>
    </div>
    <p class="muted small">${icon('lock', 'icon icon--sm')} ${esc(t('teachers.privacy'))}</p>
  </div>`;
}

function materials(list) {
  const cards = list.map((m) => `<article class="material card">
    <p class="material__meta">${esc(m.format)} · ${esc(t('common.minutes', { n: m.minutes }))}</p>
    <h3 class="material__title">${esc(m.title)}</h3>
    <p>${esc(m.desc)}</p>
    <button type="button" class="btn btn--sm" data-download="${esc(m.title)}">${icon('download')}<span>${esc(t('teachers.download'))}</span></button>
  </article>`).join('');
  return `<h2 class="more-title">${esc(t('teachers.materialsTitle'))}</h2><div class="materials">${cards}</div>`;
}

function allyBlock() {
  const points = tData('teachers.allyPoints').map((p) => `<li>${icon('check', 'icon icon--sm')} <span>${esc(p)}</span></li>`).join('');
  return `<div class="ally">
    <h2>${esc(t('teachers.allyTitle'))}</h2>
    <ul class="ally__list">${points}</ul>
  </div>`;
}

export function view(data) {
  return `
  <section class="section">
    <div class="container">
      <div class="teachers-hero">
        ${pageHead({ eyebrow: t('teachers.eyebrow'), title: t('teachers.title'), lead: t('teachers.lead') })}
        ${allyBlock()}
      </div>
      ${dashboard(data.teacherClass)}
      ${materials(data.lessonMaterials)}
    </div>
  </section>`;
}

export function mount(root) {
  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-nudge]')) toast(t('teachers.nudgeDone'));
    const download = event.target.closest('[data-download]');
    if (download) toast(t('teachers.downloaded', { title: download.dataset.download }));
  });
}
