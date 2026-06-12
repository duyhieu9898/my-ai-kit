---
name: tailwind-patterns
description: >-
  Use when designing or coding modern responsive web layouts, CSS theme tokens, or container queries.
  Tailwind CSS v4 CSS-first design and layout patterns.
  NOT for legacy Tailwind v3 JS configs.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Tailwind CSS Patterns (v4 - 2025)

> Modern utility-first CSS with CSS-native configuration.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| _No supplementary files_ | Main Tailwind pattern procedures are in this file | Use this file by default |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Core Web Vitals optimization techniques | [`performance-optimizer`](../performance-optimizer/SKILL.md) |
| Custom design search tools | [`ui-ux-pro-max`](../ui-ux-pro-max/SKILL.md) |
| Designing clean frontend styles and systems | [`frontend-design`](../frontend-design/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with generating Tailwind CSS layouts, extending color scales, or auditing custom responsive systems, strictly follow this step-by-step procedure:

### Step 1: Detect Tailwind Engine constraints
1. Confirm the compiler is v4-ready and declare configuration variables within CSS `@theme` directives rather than legacy `tailwind.config.js` setups.
2. Ensure you have clean entry styles.

### Step 2: Establish Semantic Token scales
1. Build OKLCH semantic tokens (`--color-primary`, `--color-surface`) to support unified design rules.
2. Outline custom layout spacing scales and display font stacks.

### Step 3: Implement Mobile-First Responsive layouts
1. Map base screens first (no prefix) followed by tablet and laptop breakpoint overrides (`md:`, `lg:`).
2. For reusable contexts, map parent elements as `@container` paths and childrens utilizing `@md:` container sizes.

### Step 4: Refactor Grids & Animations
1. Choose auto-fit columns or asymmetric Bento setups rather than legacy symmetric tables.
2. Configure micro-interactions using standard transition variables (`transition-colors duration-200`) to prevent visual layout thrashes.

### Step 5: Verify Dark themes & Checklist
1. Verify transparent opacities (`bg-white/80`), contrast colors, and dark mode borders.
2. Confirm compliance against the **Quality Audit Checklist** before completing.

---

## 1. Tailwind v4 Architecture

### What Changed from v3

| v3 (Legacy) | v4 (Current) |
|-------------|--------------|
| `tailwind.config.js` | CSS-based `@theme` directive |
| PostCSS plugin | Oxide engine (10x faster) |
| JIT mode | Native, always-on |
| Plugin system | CSS-native features |
| `@apply` directive | Still works, discouraged |

### v4 Core Concepts

| Concept | Description |
|---------|-------------|
| **CSS-first** | Configuration in CSS, not JavaScript |
| **Oxide Engine** | Rust-based compiler, much faster |
| **Native Nesting** | CSS nesting without PostCSS |
| **CSS Variables** | All tokens exposed as `--*` vars |

---

## 2. CSS-Based Configuration

### Theme Definition

```css
@theme {
  /* Colors - use semantic names */
  --color-primary: oklch(0.7 0.15 250);
  --color-surface: oklch(0.98 0 0);
  --color-surface-dark: oklch(0.15 0 0);
  
  /* Spacing scale */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 2rem;
  
  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### When to Extend vs Override

| Action | Use When |
|--------|----------|
| **Extend** | Adding new values alongside defaults |
| **Override** | Replacing default scale entirely |
| **Semantic tokens** | Project-specific naming (primary, surface) |

---

## 3. Container Queries (v4 Native)

### Breakpoint vs Container

| Type | Responds To |
|------|-------------|
| **Breakpoint** (`md:`) | Viewport width |
| **Container** (`@container`) | Parent element width |

### Container Query Usage

| Pattern | Classes |
|---------|---------|
| Define container | `@container` on parent |
| Container breakpoint | `@sm:`, `@md:`, `@lg:` on children |
| Named containers | `@container/card` for specificity |

### When to Use

| Scenario | Use |
|----------|-----|
| Page-level layouts | Viewport breakpoints |
| Component-level responsive | Container queries |
| Reusable components | Container queries (context-independent) |

---

## 4. Responsive Design

### Breakpoint System

| Prefix | Min Width | Target |
|--------|-----------|--------|
| (none) | 0px | Mobile-first base |
| `sm:` | 640px | Large phone / small tablet |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Laptop |
| `xl:` | 1280px | Desktop |
| `2xl:` | 1536px | Large desktop |

### Mobile-First Principle

1. Write mobile styles first (no prefix)
2. Add larger screen overrides with prefixes
3. Example: `w-full md:w-1/2 lg:w-1/3`

---

## 5. Dark Mode

### Configuration Strategies

| Method | Behavior | Use When |
|--------|----------|----------|
| `class` | `.dark` class toggles | Manual theme switcher |
| `media` | Follows system preference | No user control |
| `selector` | Custom selector (v4) | Complex theming |

### Dark Mode Pattern

| Element | Light | Dark |
|---------|-------|------|
| Background | `bg-white` | `dark:bg-zinc-900` |
| Text | `text-zinc-900` | `dark:text-zinc-100` |
| Borders | `border-zinc-200` | `dark:border-zinc-700` |

---

## 6. Modern Layout Patterns

### Flexbox Patterns

| Pattern | Classes |
|---------|---------|
| Center (both axes) | `flex items-center justify-center` |
| Vertical stack | `flex flex-col gap-4` |
| Horizontal row | `flex gap-4` |
| Space between | `flex justify-between items-center` |
| Wrap grid | `flex flex-wrap gap-4` |

### Grid Patterns

| Pattern | Classes |
|---------|---------|
| Auto-fit responsive | `grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))]` |
| Asymmetric (Bento) | `grid grid-cols-3 grid-rows-2` with spans |
| Sidebar layout | `grid grid-cols-[auto_1fr]` |

> **Note:** Prefer asymmetric/Bento layouts over symmetric 3-column grids.

---

## 7. Modern Color System

### OKLCH vs RGB/HSL

| Format | Advantage |
|--------|-----------|
| **OKLCH** | Perceptually uniform, better for design |
| **HSL** | Intuitive hue/saturation |
| **RGB** | Legacy compatibility |

### Color Token Architecture

| Layer | Example | Purpose |
|-------|---------|---------|
| **Primitive** | `--blue-500` | Raw color values |
| **Semantic** | `--color-primary` | Purpose-based naming |
| **Component** | `--button-bg` | Component-specific |

---

## 8. Typography System

### Font Stack Pattern

| Type | Recommended |
|------|-------------|
| Sans | `'Inter', 'SF Pro', system-ui, sans-serif` |
| Mono | `'JetBrains Mono', 'Fira Code', monospace` |
| Display | `'Outfit', 'Poppins', sans-serif` |

### Type Scale

| Class | Size | Use |
|-------|------|-----|
| `text-xs` | 0.75rem | Labels, captions |
| `text-sm` | 0.875rem | Secondary text |
| `text-base` | 1rem | Body text |
| `text-lg` | 1.125rem | Lead text |
| `text-xl`+ | 1.25rem+ | Headings |

---

## 9. Animation & Transitions

### Built-in Animations

| Class | Effect |
|-------|--------|
| `animate-spin` | Continuous rotation |
| `animate-ping` | Attention pulse |
| `animate-pulse` | Subtle opacity pulse |
| `animate-bounce` | Bouncing effect |

### Transition Patterns

| Pattern | Classes |
|---------|---------|
| All properties | `transition-all duration-200` |
| Specific | `transition-colors duration-150` |
| With easing | `ease-out` or `ease-in-out` |
| Hover effect | `hover:scale-105 transition-transform` |

---

## 10. Component Extraction

### When to Extract

| Signal | Action |
|--------|--------|
| Same class combo 3+ times | Extract component |
| Complex state variants | Extract component |
| Design system element | Extract + document |

### Extraction Methods

| Method | Use When |
|--------|----------|
| **React/Vue component** | Dynamic, JS needed |
| **@apply in CSS** | Static, no JS needed |
| **Design tokens** | Reusable values |

---

## ❌ Anti-Patterns

| Don't | Do |
|-------|-----|
| Arbitrary values everywhere | Use design system scale |
| `!important` | Fix specificity properly |
| Inline `style=` | Use utilities |
| Duplicate long class lists | Extract component |
| Mix v3 config with v4 | Migrate fully to CSS-first |
| Use `@apply` heavily | Prefer components |

---

## 12. Performance Principles

| Principle | Implementation |
|-----------|----------------|
| **Purge unused** | Automatic in v4 |
| **Avoid dynamism** | No template string classes |
| **Use Oxide** | Default in v4, 10x faster |
| **Cache builds** | CI/CD caching |

---

## ✅ Quality Audit Checklist

Before concluding a responsive styling, custom theme creation, or CSS component extraction task, verify compliance with the following:

- [ ] **CSS-First Theme Configured**: Declared semantic color scales, spacing systems, and custom fonts under native `@theme` directives.
- [ ] **Mobile-First Responsive Met**: Ensured small screen base styling overrides transition gracefully into larger breakpoints.
- [ ] **Container Queries Applied**: Used `@container` on parents and `@md:` container rules on nested children cards.
- [ ] **OKLCH Uniform Color System**: Configured primitive, semantic, and component variables utilizing uniform OKLCH values.
- [ ] **No Arbitrary Value Bloat**: Avoided inline dynamic template class strings, inline styles, or heavy `@apply` dependencies.
- [ ] **Dark Mode Contrasts Passing**: Verified border visibilities, transparent glass opacities, and body text contrast scales in both dark and light modes.

---

> **Remember:** Tailwind v4 is CSS-first. Embrace CSS variables, container queries, and native features. The config file is now optional.
