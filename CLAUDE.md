# CLAUDE.md — The Shelf (Books & Shows)

Context for anyone (human or Claude Code) picking this project up.

## What this is

A personal library app for Juz — a reading list and a streaming watchlist,
side by side in one app, organised by genre rather than by author/platform
or "currently reading" status. Originally shipped as a books-only app (`The
To-Read Shelf`); a Shows section was added later using seed data extracted
from Juz's separate `watchlist.html`. Both live in this one repo now. Juz
is also planning a larger, separate app called **Spine & Screen** (Next.js
+ Supabase) that this may eventually get folded into — see "Where this
might go next" below.

Live pattern: static frontend + one serverless function, deployed via
Vercel with auto-deploy from GitHub, same as Juz's other projects
(Daysortd, Oh What Adventures, Built With You).

## Stack

- Plain HTML/CSS/vanilla JS — no build step, no framework, no bundler
- One Vercel serverless function (`api/suggest.js`) for AI-generated book
  recommendations, using the Anthropic API with a server-side key — books
  only for now, see "Known constraints" below
- Data persistence is client-side only: `localStorage`, per-visitor,
  nothing shared between users

## File structure

```
index.html                   the entire app — markup, styles, and JS in one file
api/suggest.js                serverless function, proxies to Anthropic's Messages API (books only)
package.json                  minimal project metadata, no dependencies
.env.example                   shows the required ANTHROPIC_API_KEY variable
README.md                     plain-English deploy instructions (no-code friendly)
DESIGN_SPEC.md                 design tokens, component states, responsive/a11y notes
SHOWS_SEED_DATA_NOTES.md       provenance notes for the Shows data (see below)
```

## Design system

- **Palette**: paper ivory `#F1ECE1`, ink `#22261F`, spine burgundy `#7A2E27`,
  brass `#AD8A4E`, sage `#5F6E56`, spine-2 `#9C4136`, warn orange `#C1652E`
  — a "library card catalogue" aesthetic, not a generic SaaS look
- **Type**: Fraunces (display serif, headings), Source Serif 4 (body),
  IBM Plex Mono (labels, metadata, UI chrome) — loaded via Google Fonts CDN
- **Signature element**: each book/show is an index-card-style card with a
  genre-coloured tab; marking it "read"/"watched" triggers a stamp animation
- **Books vs Shows toggle**: two tabs in the header switch between the
  Books view and Shows view (`#view-books` / `#view-shows`), each with its
  own stats bar, shelf nav, and `<main>` — see "Content model" below
- Mobile-first — Juz reads and manages this primarily on her phone
- Full component states, breakpoints, animation timings, and known gaps
  (accessibility, edge cases) are documented in **`DESIGN_SPEC.md`** —
  read that before touching any styling.

## Content model

Two separate data arrays near the top of the `<script>` block in
`index.html`:

**`shelves`** (Books) — genre shelves containing:
- `groups` — authors already on Juz's list, each with a `books` array
  (`status: 'want'` = explicitly requested, `status: 'more'` = suggested
  extra reading by that author)
- `similar` — seed suggestions for other authors, shown under "More to
  explore," refreshable via the AI "🔄 More suggestions" button

**`shows`** (Shows) — a flat array of `{ title, platform, genre, note,
currentlyStreaming, hook }`, grouped into shelves at render time by
`showGenreOrder`/`showGenreMeta` (genre → shelf colour + intro copy).
No author-style subgrouping — cards show the streaming platform where
book cards show the author. `note` is verification/provenance text (not
marketing copy); it's only surfaced on-card, as a small orange warning
badge, for titles where `currentlyStreaming` is `false`. No AI-refresh
button on Shows shelves — `api/suggest.js` is book-only right now.

There is **no database** — adding a title to either list means editing
the relevant array directly in `index.html` and redeploying. That's
intentional for now; the app is small enough that a CMS or database would
be overkill.

## Features

**Both sections:**
- Tap a card to mark it read/watched (stamp animation), tap again to un-mark
- Once marked, a card reveals 👍 / 👎 rating buttons
- All state is per-browser via `localStorage`; nothing is shared or synced
  (Books use the `reading-list:` key prefix, Shows use `watch-list:` —
  kept separate so the two never collide)

**Books:**
- Browse by genre shelf, sticky nav with active-section highlighting
- "🔄 More suggestions" button per shelf calls `/api/suggest`, which asks
  Claude for a mix of (a) more titles by authors already on that shelf and
  (b) new similar authors — weighted by the visitor's up/down ratings,
  read from an in-memory cache (not re-queried from storage, to avoid
  hitting rate limits)

**Shows:**
- Same genre-shelf browsing pattern, own sticky nav and stats bar
- Cards show the streaming platform (e.g. "Netflix," "Stan") instead of
  an author line
- Titles that aren't currently available on a normal subscription show a
  small orange "⚠ Not currently streaming" badge with the verification
  note explaining where to actually find them (rent/buy, moved platforms,
  etc.) — 8 of 93 seed titles currently carry this badge
- No AI "More suggestions" yet — would need a shows-specific prompt in
  `api/suggest.js` (or a second endpoint) if that's ever wanted

## Known constraints / non-goals (for now)

- No accounts, no shared/multi-user data — every visitor gets their own
  private copy of read/watched/rating state
- No database — content changes are code changes
- No build tooling on purpose — keep it a single deployable HTML file
  plus one function, so it stays easy to hand-edit and easy to reason about
- AI suggestions ("🔄 More suggestions") only exist for Books; Shows is
  browse-only until/unless that's explicitly asked for

## Where this might go next

- This app already does the "Shows/Books navigation" that was originally
  described as a future Spine & Screen feature — it's just local-storage-
  only and single-file rather than the Next.js + Supabase app Juz is
  separately planning. Worth keeping in mind if/when the two converge:
  this app's `shows`/`shelves` data model is a reasonable starting seed
  for whatever Spine & Screen's schema ends up being.
- If genuine multi-user sharing is ever wanted (e.g. a shared shelf two
  people can both check off), that would require swapping `localStorage`
  for a real backend (Supabase, in line with the Spine & Screen stack) —
  worth flagging to Juz before starting, since it changes the "everyone
  gets their own private copy" behaviour described above.

## Working style notes

- Juz has no coding background but is comfortable with the
  Claude Code → GitHub PR → Vercel auto-deploy loop
- Prefers step-by-step, verbatim instructions for anything requiring the
  terminal or unfamiliar tooling
- Values design coherence — please keep the existing palette/type system
  rather than defaulting to generic UI patterns
- Book/show data (titles, authors, platforms, hooks) should be
  fact-checked before adding — she's caught several attribution errors in
  the reading list already (mixed-up authors, region-specific title
  variants). One inconsistency was caught and fixed while building the
  Shows feature: the seed data listed "Nightingale" as
  `currently_streaming: true` despite its own note saying the film
  adaptation isn't out until March 2027 — it's now correctly flagged
  `false` with the warning badge. Worth a quick mention to Juz.
- Where a data decision isn't obvious from the source material (e.g.
  whether to write new marketing-style "hooks" vs. keep raw verification
  notes, or whether to keep/exclude not-currently-streaming titles), ask
  rather than guess — Juz has previously flagged this as the right call
  given how often source data turns out to have small errors.
