const MS_PER_DAY = 86_400_000;

/** Read a nested value by dotted path: getPath({a:{b:1}}, 'a.b') -> 1 */
export function getPath(obj, path) {
  return String(path)
    .split('.')
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

/** Replace {name} placeholders with values; unknown placeholders stay as they are. */
export function interpolate(template, vars = {}) {
  return String(template).replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match,
  );
}

/** Lower-case, trim and strip Polish diacritics so "Biłgoraj" matches "bilgoraj". */
export function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/** Today's date as YYYY-MM-DD in the visitor's local time zone. */
export function todayIso(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Whole days from `fromIso` to `toIso` (negative when the date has passed). */
export function daysBetween(fromIso, toIso) {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  return Math.round((to - from) / MS_PER_DAY);
}

/** Split an ISO date into display parts for date "stamps". */
export function dateParts(iso, locale = 'en-GB') {
  const date = new Date(`${iso}T00:00:00Z`);
  const fmt = (options) => date.toLocaleDateString(locale, { timeZone: 'UTC', ...options });
  return {
    day: fmt({ day: 'numeric' }),
    month: fmt({ month: 'short' }),
    weekday: fmt({ weekday: 'short' }),
    full: fmt({ day: 'numeric', month: 'long', year: 'numeric' }),
  };
}

/** "Ola Wójcik" -> "OW"; "Kasia M." -> "KM" */
export function initials(name) {
  return String(name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}
