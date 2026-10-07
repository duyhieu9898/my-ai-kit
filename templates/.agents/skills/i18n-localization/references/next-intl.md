# next-intl (Next.js App Router)

Read this when the project uses next-intl or is a Next.js App Router app with
no i18n library yet.

## Setup (v4, App Router)

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

## Typed messages

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

## Messages

next-intl uses ICU syntax in the message files:
`"{count, plural, =0 {No items} one {# item} other {# items}}"`, `select` for
gender or status, and `t.rich` for inline links or bold. Format dates,
numbers, and currency with `useFormatter()` / `getFormatter()`, and set
`timeZone` in `request.ts` so server and client output match.
