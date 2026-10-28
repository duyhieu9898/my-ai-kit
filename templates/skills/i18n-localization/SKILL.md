---
name: i18n-localization
description: >-
  Internationalizes web apps with next-intl or react-i18next: locale routing,
  message files, plurals, Intl formatting, and RTL layout. Use when adding
  a language, extracting hardcoded UI strings, or fixing missing translation
  keys. Not for hreflang or localized SEO metadata (use seo-fundamentals).
---

# i18n and Localization

Follow the project's existing i18n library and message layout. If there is
none: next-intl for Next.js App Router, react-i18next elsewhere, with
top-level keys per feature (`"Checkout": {...}`).

Read the reference for the library in use before changing setup or message
syntax; the two differ in plural and interpolation format:

| Library | Reference | Plural | Variable |
|---|---|---|---|
| next-intl | [references/next-intl.md](references/next-intl.md) | ICU `{count, plural, one {...} other {...}}` | `{name}` |
| i18next / react-i18next | [references/react-i18next.md](references/react-i18next.md) | Key suffixes `item_one`, `item_other` | `{{name}}` |

## Messages and formatting

- Plurals through the library's plural format, never `count === 1 ? ...` in
  code. Vietnamese and Japanese have only `other`; Arabic and Polish need
  more categories.
- One message per whole sentence with values passed in, and rich-text
  helpers (`t.rich`, `<Trans>`) for inline links or bold. Keys are stable
  names (`Checkout.submit`), not English text.
- Dates, numbers, and currency through `Intl` or the library's formatter,
  never formatted by hand.
- RTL locales: `dir="rtl"` on `<html>` and logical properties only (Tailwind
  `ms-*`, `pe-*`, `start-*`, `text-start`, `rtl:` for exceptions).

## Check

Run it on the project root; do not read the source:

```bash
python3 .agents/skills/i18n-localization/scripts/i18n_checker.py [path]
```

- It compares keys across locales. It supports `locales/<lang>/<ns>.json`
  and flat `messages/<lang>.json` layouts, and reports keys that any locale
  is missing.
- It also flags likely hardcoded UI strings in any script, Vietnamese and CJK
  included, in `.tsx`, `.jsx`, `.ts`, `.js`, `.vue`, and `.py` files,
  skipping paths containing `test`, `spec`, `dist`, or `build`. A file that
  uses any i18n call is not flagged, and text starting with an ASCII
  lowercase letter is ignored, so it is a smoke test, not proof of full
  coverage.
- It exits 1 on missing keys, or on hardcoded strings when locale files exist.
  In a project with no locale files, hardcoded strings are only warnings and
  it exits 0.

## Done when

Every user-facing string in the changed code comes from a message key, all
locales have the same keys, plurals and dates use the library's plural format
and `Intl`, RTL
locales render with logical properties, and the checker exits 0.
