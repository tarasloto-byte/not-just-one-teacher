# Not Just One Teacher — demo prototype

A clickable demo for the EIT STEM Talent 2026 application (Introduction to Innovation Management, Kozminski University, with Samorząd Studencki ALK).
It's a presentation prototype: there's no backend and no real sign-up. All people, stories, schools and numbers are fictional.

## Run it

You need [Node.js](https://nodejs.org) 18 or newer. Nothing else needs installing.

```powershell
npm start
```

Then open **http://localhost:5173** in your browser. Stop the server with `Ctrl+C`.

> Don't open `public/index.html` by double-clicking. The browser blocks the JSON data files on `file://` pages, so the site has to run through the server.

## Showing it in a presentation

1. **Before you start:** run `npm start`, open the site and click **Reset demo data** in the footer, so the demo starts from zero.
2. **On a phone (works best):** connect the laptop and the phone to the same Wi-Fi. The terminal prints a line like
   `On your phone: http://192.168.1.23:5173/#/join`. Turn that address into a QR code with any QR generator and put it on a slide. The audience scans it and lands on the post-workshop page, just like after a real workshop.
   If you only see "Other network" lines, your laptop isn't on Wi-Fi, or a VPN (e.g. Radmin, Tailscale) is taking over. Connect to Wi-Fi and run `npm start` again. University Wi-Fi sometimes blocks phone-to-laptop connections. If that happens, share your phone's hotspot with the laptop.
3. **On the projector:** press `F12` → device toolbar (`Ctrl+Shift+M`) to show the mobile layout, or just use the desktop layout.

### Suggested 3-minute demo script

| # | Where | What to show |
|---|-------|--------------|
| 1 | Home `#/` | "You're from a small town? So were they." The counter of students and towns, and the next workshop in your region. |
| 2 | QR page `#/join` | Press **Fill with demo data** → **Save my progress**. The profile shows "Workshop at your school — completed" and "4 more steps to your certificate…". |
| 3 | Stories `#/stories` | Filter by **Women** or **AI**. Open a story → "How I started" → **These opportunities are for you** (opens the map already filtered) → **Ask the hero**. |
| 4 | Opportunities `#/opportunities` | Type **Sanok** → the region is detected automatically. Toggle **For girls** / **Free**, then press **Remind me about the deadline**. |
| 5 | IT Path `#/path` | 8-question quiz → your route (5 modules × 2 h = 10 h). Open a module, tick the task, answer the test, complete it. |
| 6 | Towns `#/cities` | Towns compete, not students. Points are averaged per student, so small towns can win. |
| 7 | Teachers `#/teachers` | Class dashboard and lesson materials: the teacher is a coach, not the only source. |

## Where things live

```
public/
  index.html            page shell
  i18n/en.json          ALL interface text (translate this file)
  data/*.json           fake content: stories, opportunities, quiz, routes, towns, class...
  css/                  design tokens, base, components, page styles
  js/app.js             router
  js/pages/*.js         one file per page
  js/lib/*.js           pure logic (filters, quiz scoring, progress, leaderboard, validation)
server.js               zero-dependency static server (serves ./public only)
tests/                  unit tests: npm test
```

## Translating to Polish

1. Copy `public/i18n/en.json` to `public/i18n/pl.json` and translate the values (keep the keys).
2. Open the site with `?lang=pl`, e.g. `http://localhost:5173/?lang=pl#/`.

Story texts, opportunities and module content are in `public/data/*.json`. Translate them there too, or keep a copy per language.

## Tests

```powershell
npm test
```

The tests cover the logic (filters, quiz scoring, progress steps, leaderboard, form validation, router). They also check that every text key used in the code exists in `en.json` and that the data matches the brief: 6–8 stories with at least half women, 10–15 opportunities, 4 routes × 5 modules, and 8 quiz questions.
