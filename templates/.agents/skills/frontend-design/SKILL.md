---
name: frontend-design
description: >-
  Restyles and themes UI built on a component library such as shadcn/ui, MUI,
  or Ant through design tokens. Use when changing colors, typography, spacing,
  radius, dark mode, or the overall look of pages or components. Not for
  accessibility audits (use web-design-guidelines).
---

# Frontend Design

The project starts from a component library and changes its look. Good
restyling changes a few tokens and every component follows. Bad restyling
scatters `className` overrides that drift apart.

## Before changing anything

1. **Find the library and where its tokens live:**

   | Library | Tokens | Dark mode |
   |---|---|---|
   | shadcn/ui | CSS variables in `globals.css` (`:root`, `.dark`), mapped to utilities by `@theme inline` | `.dark` class |
   | MUI | `createTheme({ palette, typography, shape })` | `colorSchemes` / `palette.mode` |
   | Ant Design | `ConfigProvider theme={{ token, components }}` | `algorithm: theme.darkAlgorithm` |

2. **Direction:** if the request names none (palette, mood, a reference site),
   ask one question with two or three concrete options. Otherwise proceed.
3. **Libraries:** do not add a second component library, and do not replace
   library components with hand-built ones, without asking.

## Order of changes

1. **Tokens first:** color, font families, radius, spacing scale, shadow.
   Keep the library's semantic names (`primary`, `muted`, `destructive`,
   `ring`…), so every component picks up the change.
2. **Component variants second:** extend the library's variant API (for
   example, the `cva` variants in shadcn components, or MUI `components`
   overrides) instead of passing one-off classes at call sites.
3. **Page layout last.** Keep the existing grid and breakpoints unless the
   request is about layout.

## Rules that are easy to get wrong

- Give every new token a light and a dark value, and check both themes.
- Keep text contrast at least 4.5:1 (3:1 for large text) after a color change.
- Animate only `transform` and `opacity`, and respect
  `prefers-reduced-motion`.
- Once a token exists for a color, components must use the token, not a
  hardcoded hex.
- Tailwind v4 moves configuration into CSS (`@theme`, `@custom-variant`), and
  several utilities were renamed. Read
  [references/tailwind-v4.md](references/tailwind-v4.md) before editing
  Tailwind setup or classes.
- Project-specific bans (colors, the number of fonts or nav items) belong in
  `.agents/ux_audit.json`, which `ux_audit.py` enforces. Do not invent bans
  the project did not ask for.

## Check

Run both scripts on the changed files or folder; do not read their source:

```bash
python3 .agents/skills/frontend-design/scripts/accessibility_checker.py <path>
python3 .agents/skills/frontend-design/scripts/ux_audit.py <path>
```

- Both exit non-zero on blocking problems, such as inputs without labels or
  images without `alt`.
- `ux_audit.py` also prints heuristic warnings. Treat those as suggestions.

Then look at light and dark themes in the browser, at mobile and desktop
widths.

## Done when

The new look comes from token and variant changes, both themes pass contrast,
no call site carries one-off color overrides, and both scripts pass.
