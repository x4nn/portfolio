# CLAUDE.md — Project context
 
## What this is
 
A single-file gift website: a "mixtape" page made for my girlfriend to cheer
her up and keep her busy while she's away. The whole page is themed like a
cassette tape, with a tracklist where each "track" is a little interactive
surprise. Her favourite colour is pastel green, and she loves music — that's
the theme throughout.
 
The entire site is one file: **`for-you.html`**. All CSS and JavaScript are
inline. There are no dependencies, no build step, and no framework. Please keep
it that way — it should stay a single self-contained file that opens by just
double-clicking it.
 
## The vibe (please preserve this)
 
Warm, cute, romantic, personal — never corporate or generic. Pastel green paper
feel, soft coral accent for the hearts, handwritten-style font (Caveat) for the
sweet/personal bits, a soft serif (Fraunces) for titles. If you add or change
anything visual, match this palette and tone. Don't flatten it into a plain
default template.
 
Colour tokens are defined as CSS variables in `:root` at the top of the
`<style>` block (`--sage`, `--mint`, `--cream`, `--forest`, `--peach`, etc.).
Reuse those variables rather than hardcoding new colours.
 
## Page structure
 
- **Hero** — a cassette tape graphic (SVG-ish, built with CSS) with spinning
  reels and her name on the label.
- **Track 01 — Love notes:** button reveals a random sweet note. Notes live in
  the `NOTES` array in the `<script>`.
- **Track 02 — Reasons I love you:** flip through them. Content in the `REASONS`
  array.
- **Track 03 — Catch the notes:** a 30-second tap game. Pure fun/distraction;
  logic is self-contained, usually no need to touch it.
- **Track 04 — Playlist:** a styled list of songs + a line on why each reminds
  me of her. These are HTML blocks (`<div class="song">…</div>`) in the body,
  not in the script.
- **Track 05 — Countdown:** live countdown to our reunion. Date is the `REUNION`
  variable in the `<script>`.
- **Footer** — a sign-off line.
## Where to edit
 
Everything I'm meant to personalise is marked in the file with a `✏️ EDIT`
comment. Please find all of them. The main ones:
 
1. **Her name + opening line** — in the hero section (`cassette-name`,
   `cassette-sub`, and the `hero-note` paragraph).
2. **`NOTES`** array (in `<script>`) — the random love notes.
3. **`REASONS`** array (in `<script>`) — reasons I love her.
4. **Song blocks** (Track 04, in the HTML body) — song title, artist, and the
   handwritten "why" line for each. Duplicate a `<div class="song">` block to
   add more songs.
5. **`REUNION`** date (in `<script>`) — the reunion date/time.
6. **Footer** sign-off.
### ⚠️ Important gotcha — the reunion date
`REUNION` uses JavaScript's `new Date(year, month, day, hour, minute)`, where
**months start at 0**. So January = 0, August = 7, December = 11. Double-check
this when setting the date — it's the easiest thing to get wrong.
 
## My changes
 
<!-- I'll fill this in / tell you directly. Put the real content here so Claude
     Code has it in one place. For example: -->
 
- Her name: _____
- Opening line: _____
- Love notes (Track 01): _____
- Reasons (Track 02): _____
- Songs + why (Track 04): _____
- Reunion date & time: _____
- Sign-off: _____
## Technical notes
 
- Fonts (Fraunces, Nunito, Caveat) load from Google Fonts over the internet via
  a `<link>` in the `<head>`. Needs a connection to look right; degrades
  gracefully to system fonts offline.
- Fully responsive; works on phones. There's a `prefers-reduced-motion` block
  that disables animation for anyone who's set that — keep it.
- To share it live: drag `for-you.html` onto https://app.netlify.com/drop for
  an instant public link (no account needed), or just send her the file to open
  in a browser.
## If adding this to a larger project
 
If this is going into an existing site rather than standing alone, ask me where
it should live (its own route/page vs. the homepage). Because it's one
self-contained file, it can usually be dropped in as a static page as-is.