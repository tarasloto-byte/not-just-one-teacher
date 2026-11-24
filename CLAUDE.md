# CLAUDE.md — demo site "Not Just One Teacher"

Student project (Introduction to Innovation Management, Kozminski University) for the EIT STEM Talent 2026 grant, together with Samorząd Studencki ALK.

**Problem:** in small Polish towns, a student's attitude to tech often depends on one ICT teacher. If that teacher is overloaded, there's nobody else to fill the gap.
**Solution:** live workshops in small-town schools + a web platform students open via a QR code after the workshop.
**Audience:** students aged 15–19 (ISCED 3–5), especially girls and students from small towns. Goal: 1 200+ participants, 40%+ girls.

## What this repo is
A clickable presentation prototype, not a product. No backend, no real registration; all data is fake JSON.

## Rules
- Static HTML/CSS/JS (ES modules), no build step. Run with `npm start` (zero-dependency `server.js`, serves `public/` only).
- English UI. **All interface text lives in `public/i18n/en.json`** — never hard-code UI strings in JS. `tests/i18n.test.js` fails if a key is missing.
- Mobile-first (students arrive from a QR code on their phones). Big buttons, bright accent, friendly but not childish.
- Never blame teachers. The tone is always "one overloaded teacher can't be everything".
- No real company logos, no photos of real people — placeholders only. All names are fictional.
- Escape every interpolated value with `esc()` (`public/js/lib/escape.js`).
- Pure logic goes in `public/js/lib/` and gets unit tests (`npm test`).

## Pages (hash routes)
`#/` home · `#/join` QR landing form · `#/me` profile with 5 steps · `#/stories`, `#/stories/:id` · `#/opportunities` · `#/path` (quiz), `#/path/:track`, `#/path/:track/:module` · `#/tutor` Socratic AI tutor skill · `#/cities` town leaderboard · `#/teachers` teacher dashboard.

## Socratic tutor skill (`skills/socratic-tutor/`)
Added after feedback that the project was too general. A downloadable skill students install in their AI app.
- Tutor stance: invite rather than instruct, co-create with the student, one question/hint at a time (hint ladder), teach-back at the end. It never gives away homework answers.
- Persona lens: the student *and* their parents (anti-cheating, privacy, optional shareable summary, helpline 116 111). See `skills/FOR-PARENTS.md`.
- Subjects: maths, biology, podstawy przedsiębiorczości with the real case "Your first summer job".
- Age caveat: many AI consumer apps require users to be 18+, so under-18s use the tutor at school or with a parent.
- `tests/skill.test.js` checks the frontmatter and the referenced files.
