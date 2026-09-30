---
name: i18n-localization
description: >-
  Internationalizes web apps with next-intl or react-i18next: locale routing,
  message files, ICU plurals, Intl formatting, and RTL layout. Use when adding
  a language, extracting hardcoded UI strings, or fixing missing translation
  keys. Not for hreflang or localized SEO metadata (use seo-fundamentals).
---

# i18n and Localization

Follow the project's existing i18n library and message layout. If there is
none: next-intl for Next.js App Router, react-i18next elsewhere, and one JSON
file per locale (`messages/en.json`) with top-level keys per feature
(`"Checkout": {...}`).

## next-intl setup (v4, App Router)

1. **Routing:** `src/i18n/routing.ts` exports
   `defineRouting({ locales: ['en', 'vi'], defaultLocale: 'en' })`. Every
   other file imports `routing`; do not repeat the locale list.
2. **Proxy:** `src/proxy.ts` (Next.js 16; `middleware.ts` on 15) exports
   `createMiddleware(routing)` from `next-intl/middleware` with
   `matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'`. A matcher that is too
   narrow leaves pages without a locale; one that is too wide rewrites API and
   static-file requests.
3. **Request config:** `src/i18n/request.ts` uses
   `getRequestConfig(async ({ requestLocale }) => ...)`. Narrow the value with
   `hasLocale(routing.locales, requested)`, fall back to `defaultLocale`, and
   return `{ locale, messages }`.
4. **Plugin:** wrap `next.config.ts` with `createNextIntlPlugin()` from
   `next-intl/plugin`.
5. **Layout:** `app/[locale]/layout.tsx` calls `notFound()` when
   `hasLocale` fails, sets `<html lang={locale} dir={...}>`, and wraps children
   in `<NextIntlClientProvider>`. In v4 it inherits messages from
   `request.ts`; do not pass `messages` again.
6. **Static rendering:** add `generateStaticParams` returning
   `routing.locales`, and call `setRequestLocale(locale)` in each layout and
   page before any next-intl call. Without it the route turns dynamic.
7. **Navigation:** import `Link`, `redirect`, `useRouter`, and `usePathname`
   from `src/i18n/navigation.ts` (`createNavigation(routing)`), not from
   `next/link` or `next/navigation`, or links drop the locale prefix.

## Typed messages (next-intl)

Declare the default locale's messages once, for example in `global.d.ts`:

```ts
import messages from './messages/en.json';
import { routing } from '@/i18n/routing';

declare module 'next-intl' {
  interface AppConfig {
    Messages: typeof messages;
    Locale: (typeof routing.locales)[number];
  }
}
```

Unknown keys in `t('...')` then fail type checking. For typed ICU arguments
too, set `experimental: { createMessagesDeclaration: './messages/en.json' }`
in `createNextIntlPlugin` and `"allowArbitraryExtensions": true` in
`tsconfig.json`. Git-ignore the generated `.d.json.ts`.

## Messages and formatting

- **Plurals:** ICU, never `count === 1 ? ... : ...` in code:
  `"{count, plural, =0 {No items} one {# item} other {# items}}"`.
  Vietnamese has only `other`; Arabic and Polish need more categories.
  Use `select` for gender or status.
- **Whole sentences:** pass values into one message instead of joining
  fragments, since word order differs. Use `t.rich` for inline links or bold.
- **Keys:** stable and descriptive (`Checkout.submit`), not the English text.
- **Dates, numbers, currency:** `Intl.DateTimeFormat`, `Intl.NumberFormat`
  (`style: 'currency'`), `Intl.RelativeTimeFormat`, `Intl.ListFormat`, or
  next-intl's `useFormatter()` / `getFormatter()`. Never format by hand.
  Set `timeZone` in `request.ts` so server and client output match.

## RTL

- Logical properties only: `margin-inline-start`, `padding-inline-end`,
  `inset-inline-start`, `text-align: start`; in Tailwind `ms-*`, `me-*`,
  `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, plus `rtl:` for
  exceptions.
- `dir="rtl"` on `<html>` for Arabic, Hebrew, Persian, and Urdu.
- Mirror directional icons (`rtl:-scale-x-100`), not logos or media controls.
- Leave room for text 30-40% longer than English (German, Finnish).

## Check

Run it on the project root; do not read the source:

```bash
python3 .agents/skills/i18n-localization/scripts/i18n_checker.py [path]
```

- It compares keys across locales. It supports `locales/<lang>/<ns>.json`
  and flat `messages/<lang>.json` layouts, and reports keys that any locale
  is missing.
- It also flags likely hardcoded UI strings in `.tsx`, `.jsx`, `.ts`, `.js`,
  `.vue`, and `.py` files, skipping paths containing `test`, `spec`, `dist`,
  or `build`. It scans at most 50 files, and a file that uses any i18n call is
  not flagged, so it is a smoke test, not proof of full coverage.
- It exits 1 on missing keys, or on hardcoded strings when locale files exist.
  In a project with no locale files, hardcoded strings are only warnings and
  it exits 0.

## Done when

Every user-facing string in the changed code comes from a message key, all
locales have the same keys, plurals and dates use ICU and `Intl`, RTL
locales render with logical properties, and the checker exits 0.
