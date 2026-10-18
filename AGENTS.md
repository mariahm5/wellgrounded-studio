# Well Grounded, with Mariah Marcum: rules for any AI working on this site

You are editing the live website for Mariah Marcum's yoga business, https://wellgrounded.studio. Mariah is not a developer. She will ask for changes in plain words. Make the change, check it, and explain what you did in one or two plain sentences.

## How the site works

- Plain static files. There is no build step and no framework.
- GitHub Pages serves this repository's `main` branch. **Anything committed to `main` is live in about a minute.** If you work on a branch or pull request, tell Mariah she needs to merge it before it goes live.
- `CNAME` connects the domain. Never delete or edit it.

| File | What it holds |
|---|---|
| `index.html` | All the words, sections and photos on the page |
| `assets/css/site.css` | Colours, fonts, layout and spacing. Brand colours are the variables in `:root` at the top |
| `assets/js/site.js` | The menu, scroll reveals, the copy-email button and the live class schedule (`SCHED` near the top) |
| `assets/photo-golden/` | Photos in three sizes (700, 1200, 2000 px wide), each as `.webp` and `.jpg` |
| `assets/texture-golden/` | Plaster wall textures behind the sections |
| `assets/brand/` | The "W." monogram: favicon, iPhone icon, Instagram avatar |
| `assets/fonts/windsong/` | The script font used only for her signature in About |
| `assets/js/vendor/` | GSAP and Lenis animation libraries. Do not edit |
| `404.html` | The "page not found" page |
| `tools/add_photo.py` | Prepares a new photo in the site's look and sizes |

## Brand rules (keep these unless Mariah asks otherwise)

- **Feel:** a calm, high-end studio. Bright fall afternoon light through a window. Soft, muted, warm colours. Real plaster textures.
- **Colours:** use the `:root` variables in `site.css`. Do not add new bright colours.
- **Type:**
  - Boska (display) and Switzer (text), both loaded from Fontshare, in light weights (300).
  - Emphasis comes only from a slightly heavier weight (400) inside a light line, written as `<b>`.
  - **No italics anywhere.**
  - WindSong is only for her signature.
- **Writing:**
  - Plain, calm and specific, the way a skilled teacher talks. Short sentences.
  - No em dashes (the long dash). Use commas, colons or periods.
  - No hype words: journey, elevate, unlock, transform, holistic, empower.
  - No three-word slogans.
- **Photos:**
  - Real photos of Mariah are the priority.
  - Stock photos are stand-ins and must not show anyone's face.
  - New photos go through `tools/add_photo.py` so they match the warm afternoon look.
  - Every `<img>` needs a short, honest `alt` description.
- **Motion:** gentle only. Respect `prefers-reduced-motion`. No 3D, no gimmicks.

## Content rules (these protect Mariah; do not change without her clear say-so)

1. **GoYoga's name.** Don't add GoYoga's name, logo or photos to the site unless Mariah confirms she has written permission from GoYoga. The schedule shows "Grandview" as the location, and that is approved.
2. **Student quotes.**
   - Use real words only. Never invent or polish a testimonial.
   - Don't use full names unless the person agreed.
   - Leave out any line that names another studio.
3. **Health and pregnancy.**
   - Keep prenatal wording careful: "with your provider's okay".
   - Never give medical advice or promise outcomes.
   - Keep the health note in the footer.
4. **Privacy.**
   - The footer says the site sets no cookies and runs no analytics. If you add any tracking, booking widget or form service, update that note.
   - Never put health questions in a web form.
5. **Credits.** The footer lists photographers for stand-in photos (Unsplash License). When a stand-in is replaced, remove its credit. When adding one, add its credit.
6. **Email.** The contact address is hello@wellgrounded.studio. It forwards to Mariah's Gmail through Cloudflare (set up and paid for by her brother Brock).

## Common jobs

- **Change words.** Edit `index.html`. Keep the existing tags and classes.
- **Swap a photo.**
  1. Run `python3 tools/add_photo.py path/to/photo.jpg new-name` (add `--bw` for black and white).
  2. In `index.html`, copy an existing `<picture>` block and change the file name and `alt`. Use the same `width` and `height` the script prints.
  3. If you cannot run Python, add one 2000 px wide JPG to `assets/photo-golden/` and point a plain `<img>` at it.
- **Class schedule.** It loads live from the studio's booking system (Momence). `SCHED.teacher` is Mariah's teacher ID (94797). If she stops teaching there, remove the schedule section and the "Schedule" menu link, or replace it with her own booking link.
- **Add a section.** Copy the pattern of an existing `<section class="sheet ...">` and reuse existing classes. Don't add a new CSS framework.

## Check before you finish

1. Open the page locally, for example with `python3 -m http.server` in the repo root, then visit http://localhost:8000. Look at it at desktop width and at 390 px (phone).
2. Make sure there are no broken images or 404s, and the menu works on a phone.
3. Text must stay readable on the plaster and photos (WCAG AA contrast).
4. Then commit to `main`, or tell Mariah to merge your pull request. Give the commit a plain message.

If something breaks after a change, revert the last commit. Every version is kept in Git history.
