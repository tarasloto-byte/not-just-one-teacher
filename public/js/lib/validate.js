export const AGES = Object.freeze(['15', '16', '17', '18', '19', 'other']);
export const GENDERS = Object.freeze(['female', 'male', 'other', 'na']);

const TEXT_LIMITS = Object.freeze({
  name: [2, 40],
  city: [2, 60],
  school: [2, 80],
});

function clean(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

/**
 * Validate the post-workshop sign-up form.
 * Returns { ok, errors: { field: true }, value } — value is the cleaned profile when ok.
 */
export function validateJoin(input) {
  const value = {
    name: clean(input.name),
    city: clean(input.city),
    school: clean(input.school),
    age: String(input.age ?? ''),
    gender: String(input.gender ?? ''),
  };
  const textErrors = Object.entries(TEXT_LIMITS)
    .filter(([key, [min, max]]) => value[key].length < min || value[key].length > max)
    .map(([key]) => key);
  const otherErrors = [
    !AGES.includes(value.age) && 'age',
    !GENDERS.includes(value.gender) && 'gender',
    input.consent !== true && 'consent',
  ].filter(Boolean);
  const errors = Object.fromEntries([...textErrors, ...otherErrors].map((key) => [key, true]));
  const ok = Object.keys(errors).length === 0;
  return { ok, errors, value: ok ? value : null };
}
