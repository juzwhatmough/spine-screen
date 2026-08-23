# Design Handoff Spec: The To-Read Shelf

Reverse-engineered from the shipped `index.html` — this documents what's
actually built, not a target to build toward. Keep it in sync if the
design changes.

## Overview

A single-page reading list organised into genre "shelves." Fluid,
mobile-first layout (built with `clamp()` rather than a tablet/desktop
breakpoint ladder) — one true breakpoint exists at 640px for a handful of
layout tweaks; everything else scales continuously. Primary usage is a
phone browser, so touch targets and thumb reach were prioritised over
dense desktop layouts.

## Design Tokens

| Token | Value | Usage |
|---|---|---|
| `--paper` | `#F1ECE1` | Page background |
| `--paper-2` | `#E9E2D2` | Stats bar background |
| `--ink` | `#22261F` | Primary text, nav background |
| `--ink-soft` | `#4A4E42` | Secondary text, metadata |
| `--spine` | `#7A2E27` | Primary accent (burgundy) — eyebrow text, active tab, thumbs-down |
| `--spine-2` | `#9C4136` | Reserved secondary accent (defined, not currently used) |
| `--brass` | `#AD8A4E` | Tertiary accent — active nav underline, selection highlight |
| `--sage` | `#5F6E56` | Success/positive accent — thumbs-up, "read" stamp border |
| `--line` | `rgba(34,38,31,0.16)` | All hairline borders/dividers |
| `--card-shadow` | `0 1px 0 rgba(34,38,31,.06), 0 8px 20px -14px rgba(34,38,31,.35)` | Card resting shadow |
| card background | `#FBF8F1` | Unread card (slightly lighter than paper) |
| card-read background | `#F3F0E6` | Read card (slightly darker than unread) |

**Type**
| Token | Family | Used for |
|---|---|---|
| Display | `Fraunces` (var, opsz 9–144) | H1, shelf `h2`, author `h3`, book title |
| Body | `Source Serif 4` | Body copy, book author line, hook text |
| Utility | `IBM Plex Mono` | All caps/label text — eyebrow, nav, stats, kind labels, stamps, buttons |

Loaded via Google Fonts CDN in `<head>`; weights 400/500/600/700 for
Fraunces, 400/500/600 for Source Serif 4, 400/500 for IBM Plex Mono.

**Spacing** — no formal spacing scale/tokens; raw px values used directly
throughout (14px card gap, 24px page gutter, 40px author-group margin,
etc). If this grows into a larger design system, worth extracting a real
scale (e.g. 4/8/12/16/24/32/40/56/64) — flagged here rather than invented,
since the current values weren't chosen against a scale.

## Layout

- `main` capped at `max-width: 1080px`, centered, `24px` side padding
- Cards: CSS grid, `repeat(auto-fill, minmax(230px, 1fr))`, `14px` gap —
  columns are fluid, not fixed per breakpoint
- Shelf nav: horizontal scroll, sticky at `top: 0`, `z-index: 20`,
  scrollbar hidden cross-browser
- `h1` and shelf `h2` use `clamp()` for fluid type scaling instead of
  breakpoint-specific font sizes (`clamp(38px, 7vw, 66px)` for h1)

## Components

| Component | States | Notes |
|---|---|---|
| Shelf nav button | default, hover, `.active` | Active = brass underline (`3px`) + full-opacity text; underline animates via `border-color` transition, `.15s ease` |
| Book card | default, hover, focus-visible, `.read` | Hover lifts `translateY(-2px)`; focus-visible gets `2px` solid spine outline; entire card is one click target |
| Card colour tab | n/a | 4px-wide coloured bar, `::before` pseudo-element, colour set per-shelf via `--tagcolor` custom property |
| Read stamp | default, `.read` | Border/text sage → on read, fills solid spine background, white text, plays `stampIn` animation |
| Thumbs up/down | hidden (unread), visible (read), `.active` | Only rendered visible once card is `.read`; active state fills with sage (up) or spine (down) |
| Refresh button ("🔄 More suggestions") | default, hover, `:disabled` | Disabled state used while the AI request is in flight; label swaps to "Finding more…" |

## States & Interactions

| Element | State | Behaviour |
|---|---|---|
| Card | Click/tap (anywhere on card) | Toggles read state; unmarking a card also clears its rating |
| Card | Keyboard | `tabindex="0"`, responds to `Enter` and `Space` same as click |
| Thumb button | Click | `event.stopPropagation()` so it doesn't also toggle the card's read state; clicking an already-active thumb clears the rating |
| Refresh button | Click | Disables itself, label → "Finding more…", re-enables with original label in a `finally` block regardless of success/failure |
| Refresh button | No results returned | `alert()` — "No new suggestions came back — try again in a moment." |
| Refresh button | Request fails | `alert()` — "Could not fetch new suggestions right now — please try again." |
| Nav button | Section scroll | `IntersectionObserver` with `rootMargin: '-40% 0px -55% 0px'` toggles `.active` as shelves cross the viewport midline |

## Responsive Behaviour

Fluid by default via `clamp()`. One explicit breakpoint:

| Breakpoint | Changes |
|---|---|
| `max-width: 640px` | Header padding reduces (`64px 24px 40px` → `48px 20px 32px`); spine-strip width reduces (`14px` → `9px`); author-row switches from horizontal (name + "why" side by side) to stacked vertical; author-why text-align switches from right to left |
| Above 640px | Default desktop/tablet layout — no further breakpoints exist; grid columns and type scale continue to adjust fluidly rather than stepping |

If a true tablet-specific layout is ever needed, there's currently no
`768–1024px` breakpoint to hook into — would need to be added.

## Content Rules

- **Card `kind` label** — set by book status: `want` → "From your list",
  `more` → "More by this author", `ai-known` → "More by this author" (AI
  suggestion matching an existing shelf author), `ai` → "Suggested for
  you", `discover` (default/fallback) → "New to you"
- **Hook text** — no enforced character limit in code, but existing
  copy is kept to roughly one sentence, under ~30 words, to fit the card's
  `min-height: 150px` without overflow
- **Empty state** — not designed; the app assumes `shelves` always has
  content since it's hand-authored data, not user-generated

## Animation / Motion

| Element | Trigger | Animation | Duration | Easing |
|---|---|---|---|---|
| Card | Hover | `translateY(-2px)` | `.12s` | ease |
| Read stamp | Marked read | `stampIn` keyframes: scale 1.6→0.95→1, rotate -8deg→2deg→0deg, opacity 0→1 | `.28s` | ease |
| Thumb button | Hover | `translateY(-1px)` | `.1s` | ease |
| Nav underline | Active state change | `border-color` transition | `.15s` | ease |
| Refresh/nav buttons | Hover | `background` transition | `.15s` | ease |

`@media (prefers-reduced-motion: reduce)` forces all animation/transition
durations to `0.001ms` globally — already implemented, not a gap.

## Accessibility Notes

- Cards are keyboard-operable (`tabindex="0"` + `Enter`/`Space` handling)
  and have a visible `:focus-visible` outline
- Thumb buttons have `aria-label` ("Thumbs up" / "Thumbs down") and
  `title` attributes
- Reduced-motion is respected globally
- **Gaps, worth knowing**: nav buttons and the refresh button don't yet
  have explicit `aria-label`s beyond their visible text (their text is
  descriptive enough to likely pass a quick audit, but hasn't been
  screen-reader tested); no live region announces when new AI suggestion
  cards are added to the DOM, so a screen reader user may not know new
  content appeared after tapping "More suggestions"

## Edge Cases (currently unhandled — flagged, not fixed)

- **Very long titles/hooks**: no truncation logic; a very long book title
  or hook could overflow or unbalance a card's `min-height`
- **Empty shelf**: no fallback copy if a shelf's `groups` and `similar`
  arrays were both empty
- **Many "More suggestions" clicks**: cards only ever accumulate (no
  removal), so repeated clicks on the same shelf could produce a long
  scroll of AI cards — no pagination or collapse
