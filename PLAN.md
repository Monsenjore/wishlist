# Wishlist Web App — MVP Plan

## Context

The user wants a web app for creating wishlists tied to events, without any account system. Access is entirely link-based: creating a list produces two secret links — an **edit link** (full control) and a **view link** (read-only, for sharing). Whoever holds a link has the corresponding access; there is no login, no password, no user table. The project directory is currently empty — this is a greenfield build.

## Requirements recap (confirmed with user)

- Web app (not native mobile), responsive/mobile-friendly.
- No accounts/login of any kind.
- A list has: title (required), date, description.
- A list has many items; each item has: title (required), description (optional, ≤200 chars), URL (optional).
- List and items are editable **inline** (click text → becomes an input → saves on blur/Enter).
- One browser can have multiple lists (tracked client-side, not via login).
- On creation, a list gets two unique tokens/links:
  - **Edit link** — secret, grants full edit rights (list attrs + items).
  - **View link** — for sharing, read-only.
- Sharing options for the view link: copy to clipboard, email (mailto), native OS share sheet (`navigator.share`), with graceful fallback to copy when share isn't supported.
- Access rule: possession of a link = access at that link's permission level. No further restriction.

## Architecture

- **Framework:** Next.js 14 (App Router, TypeScript) — single codebase for pages + API routes, good fit for a small link-driven app.
- **Styling:** Tailwind CSS.
- **ORM/DB:** Prisma. Start on **SQLite** for local dev (zero external accounts needed to get running today). Schema is written Postgres-compatible so switching the datasource later (e.g. to Supabase/Neon/Vercel Postgres) for production is a one-line config + migration — no code changes. This avoids creating any cloud accounts right now; that decision is deferred to when the user is ready to deploy.
- **No auth library** — access control is just "does this token exist in the DB," checked per request.

## Data model (`prisma/schema.prisma`)

```prisma
model List {
  id          String   @id @default(cuid())
  editToken   String   @unique   // secret, long random — grants edit access
  viewToken   String   @unique   // shared link — grants read-only access
  title       String
  eventDate   DateTime?
  description String?
  items       Item[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Item {
  id          String  @id @default(cuid())
  listId      String
  list        List    @relation(fields: [listId], references: [id], onDelete: Cascade)
  title       String
  description String? // enforce <=200 chars at API layer
  url         String?
  position    Int     @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Tokens generated with `nanoid` (e.g. 24 chars) — unguessable, used directly as URL path segments.

## Routes (pages)

- `/` — landing page. "Create a new wishlist" form (title, date, description) → `POST /api/lists` → redirect to `/list/[editToken]/edit`. Also lists any wishlists previously created **on this browser** (read from `localStorage`, shown as quick links) — pure convenience, not an access-control mechanism.
- `/list/[editToken]/edit` — owner view:
  - Inline-editable list attributes (title, date, description).
  - Inline-editable item rows: add item, edit title/description/url, delete item.
  - Share panel showing the **view link** with: copy button, "email" (`mailto:?subject=...&body=<viewUrl>`), and a "Share" button using `navigator.share` when available (falls back to copy).
  - On mount, saves `{editToken, viewToken, title}` to `localStorage` so it shows up on `/`.
- `/list/[viewToken]` — public read-only view: title/date/description + item list (title, description, link as clickable anchor). No edit affordances, no mention of the edit token.

## API routes (`app/api/...`)

- `POST /api/lists` — body `{title, eventDate?, description?}` → creates List with generated `editToken`/`viewToken`, returns both.
- `GET /api/lists/edit/[editToken]` — returns list + items if token matches, else 404 (don't leak existence).
- `PATCH /api/lists/edit/[editToken]` — update list attributes.
- `POST /api/lists/edit/[editToken]/items` — add item (validate title required, description ≤200 chars).
- `PATCH /api/items/[itemId]` — body includes `editToken` for ownership check → update item.
- `DELETE /api/items/[itemId]` — body/query includes `editToken` for ownership check.
- `GET /api/lists/view/[viewToken]` — returns list + items, read-only, 404 if token invalid.

All "edit" endpoints validate the token against the DB per-request — no sessions, no cookies.

## Inline editing pattern

Reusable small client component: renders text/date as static until clicked, then swaps to an `<input>`/`<textarea>`, saves via `fetch(PATCH ...)` on blur or Enter, reverts to static display with the new value (optimistic update, roll back on error). Applied to: list title, date, description; item title, description, url.

## Sharing panel behavior

- Copy: `navigator.clipboard.writeText(viewUrl)` + toast/checkmark feedback.
- Email: plain `mailto:` link — no email-sending backend needed for MVP.
- Native share: `if (navigator.share) navigator.share({title, url: viewUrl})`, else hide/fallback to copy.

## Scaffolding steps

1. `npx create-next-app@latest` (TypeScript, Tailwind, App Router, `src/` dir) in this directory.
2. Add `prisma`, `@prisma/client`, `nanoid`. `npx prisma init --datasource-provider sqlite`.
3. Write schema above, `npx prisma migrate dev`.
4. Build API routes, then pages, then the shared inline-edit component — styled per the UI Design section below.
5. Manual verification (see below).

## Verification

- `npm run dev`, open `/`, create a list, confirm redirect to `/list/[editToken]/edit`.
- Add 2-3 items inline, edit one inline, delete one inline — confirm persisted via reload.
- Copy the view link, open it in an incognito/private tab (no localStorage) — confirm read-only rendering, no edit controls, and that guessing/omitting the token 404s.
- Test the email and native-share buttons (native share may only work on a real mobile browser/HTTPS — verify it degrades to copy elsewhere).
- Reload `/` — confirm the created list appears in the "your lists" shortcut section via localStorage.

---

# UI Design

Джерело стилю: `DESIGN.md` ("Obviously" / Zams-style: claymation-на-білому, Lustria + DM Sans + Martian Mono, один акцент #7451f2). Маркетингові компоненти референсу (маскоти, persona tabs, integrations grid, trust seals, logo strip) сюди не переносяться — вони не мають функціонального аналога в цьому продукті. Нижче — промпти під фактичні екрани застосунку з розділів вище.

## Global rules (застосовувати до кожного промпту нижче)

- Канвас: Paper White `#ffffff`. Заголовки — Graphite Ink `#272727` у Lustria. Основний текст — Slate `#5d5d5d` у DM Sans, line-height 1.6. Плейсхолдери/мета — Fog `#858585`.
- Один хроматичний акцент на весь застосунок: Iris Violet `#7451f2` — тільки для primary filled button і активних станів (наприклад, фокус інлайн-поля). Ніяких інших кольорів для дії.
- Уппercase мета-лейбли ("EDIT LINK", "VIEW LINK", "SAVED", "YOUR LISTS") — завжди Martian Mono 11px, letter-spacing 0.22px, колір `#858585` або `#5d5d5d`. Ніколи не для довгого тексту.
- Радіуси: 4px на картках/кнопках/інпутах, 100px на пігулках (badges). Інших значень немає.
- Тінь — лише одна на весь застосунок: `rgba(0,0,0,0.2) 0px 2px 4px 0px`, і лише на primary-кнопці. Картки, інпути, нав — без тіней, без градієнтів, без glow.
- Межі — hairline 1px `#e0e0e0` (Mist) скрізь, де потрібна межа (картки айтемів, розділювачі, outline-кнопки, інпути в статичному стані).
- Spacing-скейл: 8/16/24/32/40/48/64/80/104px. Базовий крок 8px, щільність "comfortable".
- Ширина контенту: форми та списки центровані, читабельна ширина ~640–720px (не 1200px full-bleed — це не лендінг).
- Максимум два шрифти на екран (DM Sans + один з Lustria/Martian Mono) — заголовок екрана в Lustria, лейбли в Martian Mono, решта в DM Sans.

## Екран 1 — Landing / Create ("/")

Мінімалістичний центрований екран, без нав-бару в стилі лендінгу (немає що навігувати).

Промпт: Center a single card on a Paper White canvas, max-width ~480px, vertical padding 64px from the top. Headline "Create a wishlist" in Lustria 36px `#272727`, tracking -0.68px. Below it, a form: text input for title (required, placeholder "e.g. Birthday wishlist" in Fog `#858585`), a date input for the event date, a textarea for description — all DM Sans 16px, 1px `#e0e0e0` border, 4px radius, 12px padding, focus ring in Iris Violet `#7451f2` (2px border on focus, no glow). Primary CTA button below the form, full width: `#7451f2` fill, `#ffffff` text, DM Sans 14px weight 600, uppercase, letter-spacing 0.24px, 4px radius, `rgba(0,0,0,0.2) 0px 2px 4px 0px` shadow, label "CREATE LIST". No secondary button here — single action per screen.

Якщо в localStorage вже є списки цього браузера — під формою, розділені hairline `#e0e0e0`: eyebrow "YOUR LISTS" (Martian Mono 11px, `#858585`, uppercase), і під ним — вертикальний список карток-посилань: кожна картка 1px `#e0e0e0` border, 4px radius, 16px padding, з назвою списку (DM Sans 15px weight 500 `#272727`) і датою створення (DM Sans 12px `#858585`), клікабельна — веде на edit-посилання цього списку.

## Екран 2 — Edit view ("/list/[editToken]/edit")

Робочий екран власника: інлайн-редагування атрибутів списку + айтемів + панель поширення.

Промпт: Centered column, max-width ~680px, top padding 48px. At the top, an eyebrow in Martian Mono 11px `#858585` uppercase reading "EDIT MODE" — signals this is the private link. Below it, the list title rendered as static Lustria 32px `#272727` text until clicked, then swaps to a borderless DM Sans 32px input with a 1px `#7451f2` underline while editing, saving on blur. Directly under the title: a horizontal row with the event date (DM Sans 14px `#5d5d5d`, click-to-edit date picker, same inline pattern) and a small "SAVED" tag in Martian Mono 11px `#858585` that fades in for 2s after a successful save. Description follows as a DM Sans 16px `#5d5d5d` paragraph, click-to-edit into a textarea, same inline-edit affordance (dotted underline on hover to hint editability, 1px `#e0e0e0` border only while active).

Below a 32px gap and a hairline `#e0e0e0` divider: item list. Each item is a row card — 1px `#e0e0e0` border, 4px radius, padding 16px, gap 8px between rows — containing three inline-editable fields stacked: title (DM Sans 15px weight 500 `#272727`, required — show a small `#0072c6` "required" hint only if left empty on blur), description (DM Sans 14px `#5d5d5d`, max 200 chars, live character counter in Fog `#858585` bottom-right of the textarea once it exceeds 160), and URL (DM Sans 14px `#333333` Charcoal Hairline, rendered as a link icon + truncated hostname once saved). A small ghost delete icon-button (outline, no fill, `#5d5d5d` icon) sits top-right of each row. Below the list, an outlined secondary button "+ ADD ITEM" — transparent background, 1px `#5952a1` border, `#272727` text, DM Sans 14px weight 500, 4px radius, no shadow.

At the very bottom, a Soft Snow `#f6f6f6` panel (4px radius, 16-24px padding, no border) titled with eyebrow "SHARE" (Martian Mono 11px `#858585`): shows the read-only view link in a monospace-ish DM Sans 14px `#333333` truncated string, with three actions in a row — primary violet "COPY LINK" button (fills on click briefly to a checkmark state), and two outlined secondary buttons "EMAIL" and "SHARE" (native share, hidden if `navigator.share` unsupported).

## Екран 3 — Public view ("/list/[viewToken]")

Read-only, без жодного edit affordance, без згадки edit-посилання.

Промпт: Centered column, max-width ~680px, top padding 64px. List title in Lustria 42px `#272727`, tracking -2.02px. Event date directly below in DM Sans 14px `#858585` (formatted, e.g. "OCT 12, 2026" — could sit as a small pill: `#ffffff` background, 1px `#e0e0e0` border, 100px radius, Martian Mono 11px uppercase). Description as a DM Sans 16px `#5d5d5d` paragraph, line-height 1.6, max-width ~560px. 32px gap, then a hairline `#e0e0e0` divider, then the item list: each item is a static (non-editable) row — 1px `#e0e0e0` border, 4px radius, 16px padding — title in DM Sans 15px weight 600 `#272727`, description in DM Sans 14px `#5d5d5d` below it, and if a URL exists, an outlined pill-style link button below the description: text `#333333`, 1px `#e0e0e0` border, 4px radius, DM Sans 13px weight 500, opens in a new tab, label defaults to the URL's hostname (e.g. "amazon.com ↗"). No CTA buttons anywhere on this screen — it is purely informational.

## Компонент — Inline-editable field (спільний для екрану 2)

Промпт: A text/textarea/date field that renders as plain styled text by default (matching its target typography — Lustria for the list title, DM Sans for everything else) with no visible border. On hover, show a 1px dotted `#e0e0e0` underline to hint it's editable. On click/focus, swap to a real input/textarea with a 1px solid `#7451f2` border (no glow, no shadow), 4px radius, 8-12px padding, keeping the same font-size as the static state so there's no layout jump. Save on blur or Enter (Shift+Enter for newline in textarea); on save, briefly show a small Martian Mono 11px `#858585` "SAVED" tag next to the field that fades out after 2s. On save error, revert to the previous value and show a 1px `#0072c6`-tinted inline error caption in DM Sans 12px below the field.

## Компонент — Share button group (спільний для екрану 2)

Промпт: Three buttons in a row, 8px gap. "COPY LINK" — primary filled: `#7451f2` background, `#ffffff` DM Sans 13px weight 600 text, 4px radius, `rgba(0,0,0,0.2) 0px 2px 4px 0px` shadow, padding 10px 16px; on click, swap label to "COPIED ✓" for 1.5s without changing size. "EMAIL" and "SHARE" — outlined secondary: transparent background, 1px `#5d5d5d` border, `#272727` DM Sans 13px weight 500 text, 4px radius, no shadow, same padding. "SHARE" button hidden entirely (not disabled — removed from layout) when `navigator.share` is unavailable, so the row collapses to two buttons on desktop.

## Порожні стани (empty states)

Промпт: When a list has zero items (edit or view screen), replace the item list with a centered block: a single-line DM Sans 14px `#858585` caption ("No gifts yet — add the first one." on edit, "This list doesn't have any items yet." on view), no illustration, no icon — keep it text-only and quiet, consistent with the system's "imagery punctuates, doesn't dominate" principle scaled down for a utility screen.
