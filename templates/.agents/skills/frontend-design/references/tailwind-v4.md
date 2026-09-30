# Tailwind CSS v4 Differences

What changed from v3, and the patterns a restyle needs. Check the project's
installed version (`tailwindcss` in `package.json`) first. A v3 project keeps
`tailwind.config.js`, and none of this applies.

Contents:

1. Setup
2. Theme tokens
3. Dark mode
4. Custom utilities and variants
5. Renamed and changed utilities
6. Container queries
7. Migrating

## 1. Setup

- **Import:** the CSS entry has `@import "tailwindcss";` in place of the
  three `@tailwind` directives.
- **Build tools:** the PostCSS plugin is `@tailwindcss/postcss`, and Vite
  uses `@tailwindcss/vite`.
- **Content detection is automatic.** Files ignored by `.gitignore` are
  skipped. Add other paths with `@source`, for example
  `@source "../node_modules/@acme/ui";`.
- **Legacy config:** a JS config still works only when the CSS loads it:
  `@config "../tailwind.config.js";`. Plugins load with `@plugin`.

## 2. Theme tokens

Tokens are CSS variables in `@theme`, and each one generates its utilities:

```css
@theme {
  --color-brand-500: oklch(0.62 0.19 256);   /* bg-brand-500, text-brand-500 … */
  --font-display: "Satoshi", sans-serif;      /* font-display */
  --radius-card: 0.75rem;                     /* rounded-card */
}
```

When the token values live in other variables that change per theme (the
shadcn/ui pattern), use `@theme inline`. The utility then refers to the
variable, not to a value frozen at build time:

```css
:root  { --primary: oklch(0.21 0.03 264); }
.dark  { --primary: oklch(0.92 0.01 264); }

@theme inline {
  --color-primary: var(--primary);   /* bg-primary follows the active theme */
}
```

- To use a variable in an arbitrary value, write `bg-(--brand-color)`. The
  v3 form `bg-[--brand-color]` is gone.
- The default palette is defined in `oklch`.

## 3. Dark mode

- **Default:** `dark:` follows `prefers-color-scheme`.
- **Class toggle:** a class-based toggle needs a custom variant. Keep
  whichever form the project already uses:

```css
@custom-variant dark (&:where(.dark, .dark *));   /* Tailwind docs */
@custom-variant dark (&:is(.dark *));             /* shadcn/ui default */
```

The v3 `darkMode: 'class' | 'media' | 'selector'` config key does not exist
in CSS-first v4.

## 4. Custom utilities and variants

```css
@utility content-auto { content-visibility: auto; }  /* works with variants: hover:content-auto */
@custom-variant pointer-coarse (@media (pointer: coarse));
```

Use `@utility`, not `@layer utilities`, so that variants apply.

## 5. Renamed and changed utilities

| v3 | v4 |
|---|---|
| `shadow-sm` / `shadow` | `shadow-xs` / `shadow-sm` |
| `rounded-sm` / `rounded` | `rounded-xs` / `rounded-sm` |
| `blur-sm` / `blur` | `blur-xs` / `blur-sm` |
| `outline-none` | `outline-hidden` (`outline-none` now sets `outline-style: none`) |
| `ring` (3px) | `ring-3`; bare `ring` is 1px |
| `!bg-red-500` | `bg-red-500!` (the prefix form still parses but is deprecated) |

Behaviour changes to know:

- **Default border color:** `currentColor`, no longer gray-200. Set a color on
  every `border`.
- **Stacked variants apply left to right:** `*:first:` means "first child",
  in the reverse order of v3.
- **`space-x-*` and `space-y-*`** use a different selector. Prefer `gap-*` in
  flex and grid layouts.

## 6. Container queries

Container queries are built in; no plugin is needed.

```html
<div class="@container/card">
  <div class="flex-col @md/card:flex-row">…</div>
</div>
```

## 7. Migrating

Run `npx @tailwindcss/upgrade` on a clean branch. It rewrites the config into
CSS and renames classes. Then check the table in section 5 by eye in the
browser, because renamed shadow and radius utilities change the look without
any error.
