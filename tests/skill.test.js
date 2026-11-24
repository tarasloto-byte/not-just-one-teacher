import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_DIR = fileURLToPath(new URL('../skills/socratic-tutor/', import.meta.url));
const skill = readFileSync(join(SKILL_DIR, 'SKILL.md'), 'utf8');

function frontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, 'SKILL.md must start with a --- frontmatter block');
  return Object.fromEntries(
    match[1].split(/\r?\n/).map((line) => {
      const i = line.indexOf(':');
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    }),
  );
}

test('SKILL.md frontmatter follows the Agent Skills format', () => {
  const meta = frontmatter(skill);
  assert.match(meta.name, /^[a-z0-9-]{1,64}$/);
  assert.equal(meta.name, 'socratic-tutor');
  assert.ok(meta.description.length > 50 && meta.description.length <= 1024);
  assert.ok(!/[<>]/.test(meta.description), 'description must not contain angle brackets');
});

test('every file referenced from SKILL.md exists', () => {
  const refs = [...skill.matchAll(/`(references\/[\w.-]+\.md)`/g)].map((m) => m[1]);
  assert.ok(refs.length >= 3);
  refs.forEach((ref) => assert.ok(existsSync(join(SKILL_DIR, ref)), ref));
});

test('the core Socratic rules and safety rules are present', () => {
  ['hint ladder', 'teach-back', 'one question at a time', '116 111', 'not financial advice'].forEach((phrase) => {
    const haystack = skill + readFileSync(join(SKILL_DIR, 'references/entrepreneurship.md'), 'utf8');
    assert.ok(haystack.toLowerCase().includes(phrase.toLowerCase()), phrase);
  });
});
