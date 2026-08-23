@AGENTS.md

# CLAUDE.md — The Shelf (Books, multi-user)

Context for anyone (human or Claude Code) picking this project up.

## What this is

The account-backed successor to `the-to-read-shelf` (one folder up, still
a separate live static site — see its own CLAUDE.md). Same visual system
and card/read/rate interaction, but backed by Supabase auth + Postgres
instead of `localStorage`, so a reading list follows a user between
devices. Anyone can sign in via magic link, do a short onboarding, and get
their own genre shelves with the same "🔄 More suggestions" AI feature.

This project was built without a prior "Batch 1" scaffold existing — the
Next.js app, Supabase schema, and auth were all built from scratch in the
same pass that ported the Books UI (originally planned as a separate
earlier phase). See `supabase/migrations/0001_init.sql` for the schema.

## Stack

- Next.js 16 (App Router, TypeScript), deployed on Vercel as its own
  project (Root Directory `web`) from the same GitHub repo as the static
  site
- Supabase: Postgres + Row Level Security + magic-link/email-OTP auth,
  via `@supabase/ssr` (not the deprecated `@supabase/auth-helpers-*`)
- Anthropic API for book suggestions, server-side only (`ANTHROPIC_API_KEY`)

### Next.js 16 note

This version renamed the `middleware.ts` file convention to `proxy.ts`
(middleware is deprecated) — session refresh lives at `proxy.ts` (root) +
`lib/supabase/proxy.ts` (the actual logic), not `middleware.ts`. If a
future Next.js upgrade changes this again, check
`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/`
before assuming either name is still current — see `AGENTS.md` above,
which flags that this Next.js version may differ from an LLM's training
data.

## File structure

```
supabase/migrations/0001_init.sql   schema — user runs this in Supabase's SQL editor, not Claude
proxy.ts                             session-refresh entrypoint (was middleware.ts pre-Next-16)
app/
  layout.tsx, globals.css             fonts + design tokens, ported verbatim from index.html/DESIGN_SPEC.md
  page.tsx                            redirect: signed-in -> /books, signed-out -> /login
  login/page.tsx                      magic-link email form
  auth/callback/route.ts               exchanges the auth code for a session
  onboarding/page.tsx                  gate + form (Juz never sees this — see below)
  books/page.tsx                       gate (auth, onboarding, Juz auto-seed) + shelf render
  api/books/suggest/route.ts            ported api/suggest.js, now with an auth check
components/books/                     ShelfNav, BookShelf, AuthorGroup, BookCard, MoreSuggestions
components/onboarding/                 OnboardingForm, GenrePicker
lib/supabase/                          client.ts (browser), server.ts (RSC/actions), proxy.ts (session refresh)
lib/books/                             genres.ts, kindLabel.ts, groupItems.ts, seedData.ts (Juz's 70 books)
lib/anthropic/suggestBooks.ts          shared by the API route AND onboarding's auto-seed
lib/actions/                           listItems.ts, onboarding.ts, seedJuz.ts (all Server Actions)
types/database.ts                     hand-written — regenerate with `supabase gen types typescript` if the CLI ever gets wired up
```

## Content model

`list_items` (RLS: a user only ever sees/writes their own rows) holds both
books and shows, though only `media_type = 'book'` is used right now —
`'show'` is reserved for a future port of the Shows UI, not built here.

Mapping from the original prototype's fields:
- card "read" (stamped) -> `status = 'done'`
- 👍 -> `rating = 'liked'`, 👎 -> `rating = 'disliked'`
- the prototype's `hook` text -> `meta.hook`
- the prototype's `source_status` -> `meta.source_status` — kept as **5**
  values (`want`/`more`/`discover`/`ai`/`ai-known`), not the 3 a planning
  doc for this work originally described, because the original app's
  `kindLabel()` genuinely branches on 5 to produce 4 distinct card labels
  ("Suggested for you" vs "New to you" are different things)

`rating` (schema: `loved`/`liked`/`disliked`) and `status` (schema:
`want`/`in_progress`/`done`) are both wider than what the card UI
currently uses — see "Known simplifications" below.

`user_profile` holds onboarding answers (`favorite_authors`,
`favorite_genres`, `loved_books`, `disliked_books`) plus `loved_shows`/
`disliked_shows`, reserved for the same future Shows port.

## Known simplifications (deliberate, not oversights)

- **Card interactions stay binary in v1.** Thumbs are liked/disliked only
  (no `loved` from the card — `loved` books only come from the onboarding
  free-text field, a separate mechanism). Tap-to-toggle is want↔done only
  (no `in_progress` UI trigger). Both are schema-supported for later if a
  richer interaction is ever wanted.
- **Author-group "why" subtitles don't exist here.** The original app's
  author groups had hand-written curation text (e.g. "German Midwife &
  Secret Messenger → both yours already") specific to Juz's list — there's
  no generic way to derive that per-user, so author groups here show just
  the author name.
- **"Other" free-text genres** (from onboarding) get a neutral fallback
  shelf color and are not auto-seeded with AI suggestions — no prompt
  scaffolding exists for an arbitrary genre string. They work fine for
  manually-added books.
- **No AI suggestions on a Shows tab** — there isn't one yet. `/api/books/suggest`
  is books-only.
- **Juz gets no onboarding UI at all.** If the signed-in email matches
  `JUZ_EMAIL` and she has zero book `list_items`, `app/books/page.tsx`
  silently seeds all 70 books (from `lib/books/seedData.ts`, re-derived
  from `the-to-read-shelf/index.html`'s `shelves` array — already
  fact-checked) and renders `/books` directly. Everyone else goes through
  `/onboarding`.

## Data integrity note

`lib/books/seedData.ts` was generated programmatically from
`the-to-read-shelf/index.html`'s live `shelves` array (a script flattened
`groups[].books[]` + `similar[]` into the 70-row list), not retyped by
hand — so it inherits that data's existing fact-checked state without
introducing new transcription errors. If new seed data is ever added
here directly, hold it to the same bar as `the-to-read-shelf/CLAUDE.md`
describes: Juz has caught real attribution errors in this list before.

## Working style notes

Same as `the-to-read-shelf/CLAUDE.md`: no coding background, comfortable
with the Claude Code → GitHub → Vercel loop, prefers verbatim step-by-step
instructions for anything requiring a dashboard or the terminal (see this
folder's own `README.md`), values design coherence over generic UI
patterns, and would rather be asked than have a data or UX judgment call
made silently.
