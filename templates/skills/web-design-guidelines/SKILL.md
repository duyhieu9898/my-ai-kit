---
name: web-design-guidelines
description: >-
  Audits UI code against the Vercel Web Interface Guidelines for
  accessibility, focus, forms, motion, and interaction, with file:line
  findings. Use when asked to review a page or component for accessibility or
  UX quality, or before shipping new UI. Not for restyling (use
  frontend-design).
---

# Web Interface Guidelines Audit

The audit reads the target files, checks them against Vercel's Web Interface
Guidelines, and reports terse `file:line` findings. It reviews; it does not
fix unless the user asks.

## Procedure

1. **Targets:** use the files, folder, or glob the user named. If none, audit
   the files changed in the working tree (`git diff --name-only`) that
   contain UI (`.tsx`, `.jsx`, `.vue`, `.svelte`, `.html`, `.css`). Ask only
   if that is empty too.
2. **Fetch the rules** fresh for each audit:

   ```text
   https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
   ```

   The file is written as a slash command: read its argument placeholder as
   the targets from step 1. Its rules and output format override the fallback
   list below.
3. **If the fetch fails** (no network, blocked domain, non-200), say so in
   the first line of the report ("Guidelines fetch failed; audited against
   the built-in fallback list") and use the fallback list below.
4. **Read each target file** and check it against the rules. Library
   components count: an icon-only `<Button size="icon">` from shadcn/ui still
   needs an `aria-label`. Read the library's source under `components/ui/`
   before reporting a problem that the wrapper may already solve.
5. **Report** in the output format below.

## Fallback rules (use only when the fetch fails)

- Icon-only buttons have `aria-label`; decorative icons have
  `aria-hidden="true"`.
- Every form control has a `<label>` (`htmlFor`) or `aria-label`.
- Actions use `<button>`, navigation uses `<a>` or `<Link>`; no clickable
  `<div>` or `<span>`.
- Images have `alt` (`alt=""` if decorative) and explicit `width` and
  `height`.
- Visible focus on every interactive element: no `outline-none` without a
  `focus-visible:` replacement.
- Headings are in order, and async messages (toasts, validation) use
  `aria-live="polite"`.
- Inputs have the right `type`, `inputmode`, `autocomplete`, and `name`;
  paste is never blocked.
- Errors appear inline next to the field, and focus moves to the first error
  on submit.
- Motion respects `prefers-reduced-motion`, animates only `transform` and
  `opacity`, and never uses `transition: all`.
- Zoom is never disabled (`user-scalable=no`, `maximum-scale=1`).
- Long text truncates or wraps (`min-w-0` on flex children); empty states
  render.
- Lists over about 50 items are virtualized.
- Stateful UI (filters, tabs, pagination) is reflected in the URL.
- Destructive actions need confirmation or undo.
- Dates and numbers use `Intl.*`, not hardcoded formats.
- Dark themes set `color-scheme: dark` on `<html>`.

## Output format

Group by file, one finding per line, no preamble:

```text
## src/components/Toolbar.tsx

src/components/Toolbar.tsx:42 - icon button missing aria-label
src/components/Toolbar.tsx:67 - transition: all → list properties

## src/components/Card.tsx

✓ pass
```

Add an explanation only when the fix is not obvious. The guidelines' copy
rules (Title Case, `…` instead of `...`, curly quotes) are Vercel house style:
report them only if the project follows that style or the user asks.

## Done when

Every target file is listed with findings or `✓ pass`, each finding has a
`file:line`, and the report says whether the fetched guidelines or the
fallback list was used.
