---
name: i18n-localization
description: >-
  Use when internationalizing an application, structuring locale JSON directories, formatting locale-sensitive dates/numbers, or implementing RTL.
  Internationalization (i18n) and localization covering hardcoded strings, Next.js, and ICU formatting.
  NOT for single-language UI.
allowed-tools:
  - Read
  - Glob
  - Grep
---

# i18n & Localization

> Internationalization (i18n) and Localization (L10n) best practices.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| [scripts/i18n_checker.py](scripts/i18n_checker.py) | Hardcoded string and missing translation checker | Running local i18n validation |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Designing internationalized UX components | [`frontend-design`](../frontend-design/SKILL.md) |
| Server-side i18n middleware setups | [`nodejs-best-practices`](../nodejs-best-practices/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with internationalizing an application, structuring locale JSONs, or adapting layouts for RTL directional flows, strictly follow this step-by-step procedure:

### Step 1: Outline Language Locales
1. Define the target language support matrix (e.g. en-US, tr-TR) and note if any require RTL support (e.g. Arabic, Hebrew).
2. Configure dynamic default fallbacks.

### Step 2: Build JSON Directories
1. Set up logical namespaced directories mapping resource files by module context (`locales/en/common.json`, `locales/en/errors.json`).
2. Populate keys uniformly across all targets.

### Step 3: Implement Translation Hooks
1. Code localized UI templates utilizing framework tools (hooks like `useTranslation` for react-i18next or `useTranslations` for next-intl).
2. Avoid string concatenation; use variables interpolation instead.

### Step 4: Structure RTL CSS Layouts
1. Swap standard hardcoded values (margin-left, padding-right) for logical CSS properties (`margin-inline-start`, `padding-inline-end`).
2. Integrate dynamic directional styling rules.

### Step 5: Analyze Hardcoded Mismatches & Verify Checklist
1. Trigger static detection check scripts (`python scripts/i18n_checker.py <project_path>`).
2. Confirm compliance against the **Quality Audit Checklist** before completing.

---

## 1. Core Concepts

| Term | Meaning |
|------|---------|
| **i18n** | Internationalization - making app translatable |
| **L10n** | Localization - actual translations |
| **Locale** | Language + Region (en-US, tr-TR) |
| **RTL** | Right-to-left languages (Arabic, Hebrew) |

---

## 2. When to Use i18n

| Project Type | i18n Needed? |
|--------------|--------------|
| Public web app | ✅ Yes |
| SaaS product | ✅ Yes |
| Internal tool | ⚠️ Maybe |
| Single-region app | ⚠️ Consider future |
| Personal project | ❌ Optional |

---

## 3. Implementation Patterns

### React (react-i18next)

```tsx
import { useTranslation } from 'react-i18next';

function Welcome() {
  const { t } = useTranslation();
  return <h1>{t('welcome.title')}</h1>;
}
```

### Next.js (next-intl)

```tsx
import { useTranslations } from 'next-intl';

export default function Page() {
  const t = useTranslations('Home');
  return <h1>{t('title')}</h1>;
}
```

### Python (gettext)

```python
from gettext import gettext as _

print(_("Welcome to our app"))
```

---

## 4. File Structure

```
locales/
├── en/
│   ├── common.json
│   ├── auth.json
│   └── errors.json
├── tr/
│   ├── common.json
│   ├── auth.json
│   └── errors.json
└── ar/          # RTL
    └── ...
```

---

## 5. Best Practices

### DO ✅

- Use translation keys, not raw text
- Namespace translations by feature
- Support pluralization
- Handle date/number formats per locale
- Plan for RTL from the start
- Use ICU message format for complex strings

## ❌ Anti-Patterns

- Hardcode strings in components
- Concatenate translated strings
- Assume text length (German is 30% longer)
- Forget about RTL layout
- Mix languages in same file

---

## 6. Common Issues

| Issue | Solution |
|-------|----------|
| Missing translation | Fallback to default language |
| Hardcoded strings | Use linter/checker script |
| Date format | Use Intl.DateTimeFormat |
| Number format | Use Intl.NumberFormat |
| Pluralization | Use ICU message format |

---

## 7. RTL Support

```css
/* CSS Logical Properties */
.container {
  margin-inline-start: 1rem;  /* Not margin-left */
  padding-inline-end: 1rem;   /* Not padding-right */
}

[dir="rtl"] .icon {
  transform: scaleX(-1);
}
```

---

## ✅ Quality Audit Checklist

Before concluding an internationalization setup, locale translation import, or RTL styling patch, verify compliance with the following:

- [ ] **No Hardcoded Strings**: Scanned codebase to ensure all user-facing copy uses namespaced translation keys.
- [ ] **Ecosystem Mocks Verified**: Confirmed translation providers properly fallback to default locales on missing keys.
- [ ] **Intl APIs Applied**: Handled all dynamic dates, times, and currency amounts using the standard global `Intl` interfaces.
- [ ] **RTL Styling Responsive**: Leveraged CSS logical properties (`*-inline-start/end`) instead of strict directional overrides.
- [ ] **ICU Formatting Used**: Managed pluralized strings or complex variables using official ICU brackets layouts.
- [ ] **Checker Run Clean**: Triggered the local validator (`python scripts/i18n_checker.py <project_path>`) and resolved all mismatch exceptions.

---

## Script

| Script | Purpose | Command |
|--------|---------|---------|
| [scripts/i18n_checker.py](scripts/i18n_checker.py) | Detect hardcoded strings & missing translations | `python scripts/i18n_checker.py <project_path>` |
