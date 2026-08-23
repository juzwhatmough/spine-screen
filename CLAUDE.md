# CLAUDE.md — The To-Read Shelf

Context for anyone (human or Claude Code) picking this project up.

## What this is

A personal reading list app, organised by genre rather than by author or
"currently reading" status. Built for Juz, who also runs a streaming
watchlist and is merging both into a larger app called **Spine & Screen**
(separate project — see below).

Live pattern: static frontend + one serverless function, deployed via
Vercel with auto-deploy from GitHub, same as Juz's other projects
(Daysortd, Oh What Adventures, Built With You).

## Stack

- Plain HTML/CSS/vanilla JS — no build step, no framework, no bundler
- One Vercel serverless function (`api/suggest.js`) for AI-generated
  recommendations, using the Anthropic API with a server-side key
- Data persistence is client-side only: `localStorage`, per-visitor,
  nothing shared between users

## File structure

```
index.html          the entire app — markup, styles, and JS in one file
api/suggest.js       serverless function, proxies to Anthropic's Messages API
package.json         minimal project metadata, no dependencies
.env.example          shows the required ANTHROPIC_API_KEY variable
README.md            plain-English deploy instructions (no-code friendly)
```

## Design system

- **Palette**: paper ivory `#F1ECE1`, ink `#22261F`, spine burgundy `#7A2E27`,
  brass `#AD8A4E`, sage `#5F6E56` — a "library card catalogue" aesthetic,
  not a generic SaaS look
- **Type**: Fraunces (display serif, headings), Source Serif 4 (body),
  IBM Plex Mono (labels, metadata, UI chrome) — loaded via Google Fonts CDN
- **Signature element**: each book is an index-card-style card with a
  genre-coloured tab; marking a book "read" triggers a stamp animation
- Mobile-first — Juz reads and manages this primarily on her phone
- Full component states, breakpoints, animation timings, and known gaps
  (accessibility, edge cases) are documented in **`DESIGN_SPEC.md`** —
  read that before touching any styling.

## Content model

Data lives in a single JS array called `shelves` near the top of the
`<script>` block in `index.html`. Each shelf (genre) contains:
- `groups` — authors already on Juz's list, each with a `books` array
  (`status: 'want'` = explicitly requested, `status: 'more'` = suggested
  extra reading by that author)
- `similar` — seed suggestions for other authors, shown under "More to
  explore"

There is **no database** — adding a book means editing this array directly
in `index.html` and redeploying. That's intentional for now; the app is
small enough that a CMS or database would be overkill.

## Features

- Browse by genre shelf, sticky nav with active-section highlighting
- Tap a card to mark it read (stamp animation), tap again to un-mark
- Once read, a card reveals 👍 / 👎 rating buttons
- "🔄 More suggestions" button per shelf calls `/api/suggest`, which asks
  Claude for a mix of (a) more titles by authors already on that shelf and
  (b) new similar authors — weighted by the visitor's up/down ratings,
  read from an in-memory cache (not re-queried from storage, to avoid
  hitting rate limits)
- All state is per-browser via `localStorage`; nothing is shared or synced

## Known constraints / non-goals (for now)

- No accounts, no shared/multi-user data — every visitor gets their own
  private copy of read/rating state
- No database — content changes are code changes
- No build tooling on purpose — keep it a single deployable HTML file
  plus one function, so it stays easy to hand-edit and easy to reason about

## Where this might go next

- Eventually this reading list may get folded into **Spine & Screen**,
  Juz's unified Next.js + Supabase app that also covers the streaming
  watchlist (Shows/Books navigation). That's a separate, larger project
  with its own repo — this app is not currently wired to it.
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
- Book data (authors, titles, hooks) should be fact-checked against real
  bibliographies before adding — she's caught several attribution errors
  in this list already (mixed-up authors, region-specific title variants)
