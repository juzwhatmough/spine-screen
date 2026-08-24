@AGENTS.md

# CLAUDE.md — The Shelf (Books & Shows, multi-user)

Context for anyone (human or Claude Code) picking this project up.

## What this is

The account-backed successor to `the-to-read-shelf` (one folder up, still
a separate live static site — see its own CLAUDE.md). Same visual system
and card/read-or-watch/rate interaction, but backed by Supabase auth +
Postgres instead of `localStorage`, so a list follows a user between
devices. Anyone can sign in via magic link and get their own private
Books and Shows shelves — a Books/Shows tab switcher (`components/nav/TabNav.tsx`)
sits in the header of both.

**Books and Shows are close to symmetrical now, with one real
difference:** both have onboarding-free manual add forms, filters, and AI
"🔄 More suggestions" — but Books' onboarding flow (new users answer a few
questions and get an auto-seeded starter shelf) has no Shows equivalent.
Non-Juz Shows users just land on an empty shelf with the always-visible
"Add a show" form. Both tabs give Juz (matched by `JUZ_EMAIL`) a silent,
automatic seed of her existing library on first visit — 70 books, 93
shows — no UI shown to her either way.

**Shows' AI suggestions never assert a streaming platform.** There's no
live Australian streaming-availability data source wired into this
project (no JustWatch API or equivalent), so unlike Books' AI suggestions
(which do carry a real author), every AI-suggested show is inserted with
`creator: "Unconfirmed"` and `meta.unconfirmed: true`, and the card shows
a distinct "⚠ Unconfirmed — verify streaming availability" badge instead
of a platform name. Wiring in a real availability source is a future
batch, explicitly out of scope here — don't have an AI suggestion assert
a platform without one.

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
  layout.tsx, globals.css             fonts + design tokens, ported from index.html/DESIGN_SPEC.md
  page.tsx                            redirect: signed-in -> /books, signed-out -> /login
  login/page.tsx                      magic-link email form
  auth/callback/route.ts               exchanges the auth code for a session
  onboarding/page.tsx                  gate + form (Books only; Juz never sees this)
  books/page.tsx                       gate (auth, onboarding, Juz auto-seed) + groupItems -> BooksShelvesView
  shows/page.tsx                       gate (auth, Juz auto-seed — no onboarding) + groupShowItems -> ShowsShelvesView
  api/books/suggest/route.ts            AI suggestions (real author, real book)
  api/shows/suggest/route.ts             AI suggestions (creator: "Unconfirmed", never a real platform)
components/books/
  BooksShelvesView.tsx                   CLIENT boundary: owns filter state, does the actual filtering,
                                          renders FilterBar + ShelfNav + AddBookForm + shelves/empty-state
  ShelfNav.tsx (shared with Shows), BookShelf.tsx, AuthorGroup.tsx, BookCard.tsx,
  MoreSuggestions.tsx, AddBookForm.tsx
components/shows/
  ShowsShelvesView.tsx                   same pattern as BooksShelvesView.tsx (Genre + Platform)
  ShowShelf.tsx, ShowCard.tsx, AddShowForm.tsx, MoreSuggestionsShow.tsx
components/filters/FilterBar.tsx        shared dropdown-row component — Books and Shows both use this,
                                          don't build a second filter UI
components/onboarding/                 OnboardingForm, GenrePicker (Books only)
components/nav/TabNav.tsx              Books/Shows tab switcher, used by both pages' headers
lib/supabase/                          client.ts (browser), server.ts (RSC/actions), proxy.ts (session refresh)
lib/books/                             genres.ts, kindLabel.ts, groupItems.ts, seedData.ts (Juz's 70 books)
lib/shows/                             genres.ts, groupItems.ts, seedData.ts (Juz's 93 shows)
lib/anthropic/                          suggestBooks.ts, suggestShows.ts (mirror each other; suggestShows
                                          never solicits a platform field at all — see prompt text)
lib/actions/listItems.ts               toggleRead/setRating (shared, generic across media_type),
                                          addManualBook, addManualShow — both validate genre against
                                          the canonical GENRE_TAGS/SHOW_GENRE_TAGS list (no free-text genre)
lib/actions/                           onboarding.ts, seedJuz.ts, seedJuzShows.ts (all Server Actions)
types/database.ts                     hand-written — regenerate with `supabase gen types typescript` if the CLI ever gets wired up
```

## Filtering architecture

`app/books/page.tsx` and `app/shows/page.tsx` are Server Components that
fetch + group data as before, but no longer render shelves directly — they
hand the full grouped array to `BooksShelvesView`/`ShowsShelvesView`
(Client Components), which own filter state and do plain `.filter()`
logic client-side (no reload, no server round-trip). `BookShelf` /
`AuthorGroup` / `ShowShelf` have no server-only imports, so they're safe
to render from inside a Client Component even without a `"use client"`
directive of their own — Next.js just bundles them for the client since
nothing forces them server-side. Filter dropdown options are always
derived from the *full* unfiltered dataset (not narrowed by the other
active filter) — a standard, simpler filter UX than trying to keep
cross-filter option lists in sync.

## Content model

`list_items` (RLS: a user only ever sees/writes their own rows) holds both
books (`media_type = 'book'`) and shows (`media_type = 'show'`).

Mapping from the original prototype's fields:
- card "read"/"watched" (stamped) -> `status = 'done'`
- 👍 -> `rating = 'liked'`, 👎 -> `rating = 'disliked'`
- book `hook` -> `meta.hook`; book `source_status` -> `meta.source_status`
  — kept as **5** values (`want`/`more`/`discover`/`ai`/`ai-known`), not
  the 3 a planning doc for the Books work originally described, because
  the original app's `kindLabel()` genuinely branches on 5 to produce 4
  distinct card labels ("Suggested for you" vs "New to you" are different
  things)
- **Shows only:** `creator` stores the streaming **platform**, not an
  author (shows don't have one) — this is a deliberate reuse of an
  existing column rather than a schema change, so the
  `list_items_user_unique_title` dedup index (which includes `creator`)
  still works correctly. `ShowCard.tsx` reads `item.creator` into the
  `.kind` badge instead of rendering an author line. Show `note` and
  `currentlyStreaming` live in `meta` (see `types/database.ts`'s
  `ListItemMeta`) — there was no natural column for either.

`rating` (schema: `loved`/`liked`/`disliked`) and `status` (schema:
`want`/`in_progress`/`done`) are both wider than what the card UI
currently uses — see "Known simplifications" below.

`user_profile` holds Books onboarding answers (`favorite_authors`,
`favorite_genres`, `loved_books`, `disliked_books`) plus `loved_shows`/
`disliked_shows` — the latter two are unused placeholders; Shows never
got (and doesn't need) an onboarding flow to write them from.

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
- **Shows still has no onboarding** (unlike Books) — that's unchanged.
  What *did* change: Shows now has AI suggestions and a manual add form,
  same as Books, just without the platform claim (see above).
- **Manual add forms (`AddBookForm`, `AddShowForm`) both require genre to
  match an existing canonical shelf** — no free-text "Other" like
  onboarding's `GenrePicker` allows. Enforced both client-side (dropdown
  only offers real options) and server-side in `lib/actions/listItems.ts`
  (throws if the genre isn't in `GENRE_TAGS`/`SHOW_GENRE_TAGS`).
- **`MoreSuggestionsShow.tsx` is a near-duplicate of `MoreSuggestions.tsx`**,
  not a shared component — same fetch/loading/error logic, different
  endpoint. Deliberate: "port the same architecture" was read as porting
  the pattern, not refactoring the working, tested Books component to
  share code with a new, less-proven one.
- **Juz gets no onboarding UI at all, for either tab.** If the signed-in
  email matches `JUZ_EMAIL`, `app/books/page.tsx` silently seeds her 70
  books (`lib/books/seedData.ts`) and `app/shows/page.tsx` silently seeds
  her 93 shows (`lib/shows/seedData.ts`) — both re-derived from
  `the-to-read-shelf/index.html`'s live data, already fact-checked.
  Everyone else: Books sends them through `/onboarding`; Shows just shows
  them an empty shelf.

## Data integrity note

`lib/books/seedData.ts` and `lib/shows/seedData.ts` were both generated
programmatically from `the-to-read-shelf/index.html`'s live `shelves`/
`shows` arrays (a script flattened/copied the data), not retyped by hand
— so they inherit that data's existing fact-checked state (including the
Nightingale `currentlyStreaming` fix documented in that project's
DESIGN_SPEC.md) without introducing new transcription errors. If new seed
data is ever added here directly, hold it to the same bar as
`the-to-read-shelf/CLAUDE.md` describes: Juz has caught real attribution
errors in this list before.

## Working style notes

Same as `the-to-read-shelf/CLAUDE.md`: no coding background, comfortable
with the Claude Code → GitHub → Vercel loop, prefers verbatim step-by-step
instructions for anything requiring a dashboard or the terminal (see this
folder's own `README.md`), values design coherence over generic UI
patterns, and would rather be asked than have a data or UX judgment call
made silently.
