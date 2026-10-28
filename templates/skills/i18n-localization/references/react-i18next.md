# react-i18next (Vite, CRA, and other React apps)

Read this when the project uses i18next with react-i18next. Written against
i18next 26 and react-i18next 17; check `package.json` before relying on a
version-specific option.

## Setup

One module, for example `src/i18n.ts`, imported once before the app renders
(`import './i18n'` in `main.tsx`):

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en/translation.json';
import vi from '@/locales/vi/translation.json';

i18n.use(initReactI18next).init({
  lng: savedLanguage ?? 'vi',
  fallbackLng: 'en',
  supportedLngs: ['en', 'vi'],
  resources: { en: { translation: en }, vi: { translation: vi } },
  interpolation: { escapeValue: false }, // React already escapes
});

export default i18n;
```

- **Bundled vs lazy:** bundling every locale is fine for a few small files.
  When they grow, load per language with `i18next-resources-to-backend` and
  ``import(`./locales/${lng}/${ns}.json`)``, so Vite splits a chunk per locale.
  Lazy loading suspends the first render: keep a `<Suspense>` boundary
  above the app, or set `react: { useSuspense: false }` and check `ready`.
- **Language detection:** `i18next-browser-languagedetector` with
  `detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] }`
  replaces hand-written localStorage reads. Set `supportedLngs`, so a browser
  locale such as `vi-VN` resolves to `vi` and a lazy backend never requests
  files for unsupported languages.
- **Switching:** `i18n.changeLanguage(lng)` re-renders every `useTranslation`
  consumer. Also set `document.documentElement.lang` and `dir` from
  `i18n.dir(lng)` in a `languageChanged` listener.
- **`returnObjects: true`** globally makes every `t()` call able to return an
  object, which weakens typing. Leave it off and pass `{ returnObjects: true }`
  on the few calls that read an array or object.

## Typed keys

Declare the default locale's resources once, for example in
`src/@types/i18next.d.ts`:

```ts
import 'i18next';
import translation from '@/locales/en/translation.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof translation };
  }
}
```

Unknown keys in `t('...')` then fail type checking. For very large message
files, `enableSelector: 'optimize'` with the `t(($) => $.Checkout.submit)`
form keeps the IDE fast.

## Messages

- **Namespaces:** one `translation` namespace is enough for a small app.
  Split by feature (`locales/<lng>/checkout.json`) when files grow, and use
  `useTranslation('checkout')` or `{ keyPrefix: 'form' }` to shorten keys.
- **Plurals are key suffixes, not ICU:** with the default
  `compatibilityJSON: 'v4'`, write `"item_one": "{{count}} item"` and
  `"item_other": "{{count}} items"`, then call `t('item', { count })`. The
  suffixes follow `Intl.PluralRules`: Vietnamese and Japanese need only
  `_other`, Arabic needs `_zero` through `_many`. ICU syntax works only with
  the `i18next-icu` plugin.
- **Interpolation:** `{{name}}`, not `{name}`. Use `context` for gender or
  status (`"friend_male"`, `t('friend', { context: 'male' })`).
- **Inline markup:** `<Trans i18nKey="terms" components={{ link: <a href="/terms" /> }} />`
  with `"terms": "Read the <link>terms</link>"`; never split a sentence into
  several keys around a link.
- **Formatting:** built-in formatters use `Intl`:
  `"{{amount, currency(VND)}}"`, `"{{date, datetime}}"`, `"{{n, number}}"`,
  `"{{items, list}}"`, `"{{days, relativetime}}"`.
