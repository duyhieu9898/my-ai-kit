---
name: frontend-design
description: >-
  Use when designing component layouts, establishing color palettes, font systems, or writing modern responsive interfaces.
  Design thinking and UX guidelines covering proportional grids, typography, shadow effects, and Next.js Form patterns.
  NOT for native mobile apps.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Frontend Design System

> **Philosophy:** Every pixel has purpose. Restraint is luxury. User psychology drives decisions.
> **Core Principle:** THINK, don't memorize. ASK, don't assume.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| [references/ux-psychology.md](references/ux-psychology.md) | UX Laws, trust indicators, emotional design (**REQUIRED**) | Always read first! |
| [references/color-system.md](references/color-system.md) | Curated palettes, HSL tailoring, primary/accent rules | Determining color systems |
| [references/typography-system.md](references/typography-system.md) | Font selection, pairing, size scales, line readability | Selecting typography |
| [references/visual-effects.md](references/visual-effects.md) | Glassmorphism, shadow elevations, gradient rules | Selecting shadows, borders, backgrounds |
| [references/animation-guide.md](references/animation-guide.md) | Duration curves, easing functions, custom motion guidelines | Implementing animations |
| [references/motion-graphics.md](references/motion-graphics.md) | Advanced animations, SVG paths, 3D particles, Lottie rules | Designing advanced motion graphics |
| [references/decision-trees.md](references/decision-trees.md) | Context-specific structural/aesthetic decision trees | Planning page-level design directions |
| [scripts/ux_audit.py](scripts/ux_audit.py) | UX psychology and accessibility audit script | Auditing implemented web UI |
| [scripts/accessibility_checker.py](scripts/accessibility_checker.py) | Accessibility-focused static checker | Checking contrast, labels, and semantic issues |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Implementing web UI from design guidance | [`frontend-specialist`](../frontend-specialist/SKILL.md) |
| Next.js and React implementation details | [`nextjs-react-expert`](../nextjs-react-expert/SKILL.md) |
| Post-coding layout audit, accessibility, perf | [`web-design-guidelines`](../web-design-guidelines/SKILL.md) |
| Native mobile interface guidance | [`mobile-design`](../mobile-design/SKILL.md) |

---

## 🛠️ Instructions / Procedures

For EVERY design, layout, or visual implementation task, follow this step-by-step procedure:

### Step 1: Execute Constraint Analysis
1. Proactively identify constraints listed in Section 1 (Timeline, Content status, Brand guidelines, Tech stack, and Target Audience).
2. **STOP & ASK**: If colors, style, or layout are vague or unspecified, immediately ask the user the clarification questions listed in the **"ASK BEFORE ASSUMING"** section.

### Step 2: Apply UX Psychology Principles
1. Always read **[references/ux-psychology.md](references/ux-psychology.md)** first.
2. Ensure the UI conforms to Fitts' Law (CTA sizes), Hick's Law (progressive disclosure), and Miller's Law (content chunking).
3. Establish trust indicators (security, social proof) and select emotional design triggers appropriate to the target audience.

### Step 3: Architect Layout & Proportions
1. Apply the Golden Ratio (spacing and headings) and the 8-Point Grid system (spacing and container dimensions) as outlined in Section 3.
2. Set button heights, touch targets, input alignments, and reading widths (45-75 characters) to maximize usability.

### Step 4: Configure Visual Aesthetic (Colors, Typography, Effects)
1. Design a tailored color scheme applying the 60-30-10 rule. If colors are chosen, consult **[references/color-system.md](references/color-system.md)** for HSL parameters.
2. Set font pairings and hierarchy scales using rules in **[references/typography-system.md](references/typography-system.md)**.
3. Plan realistic depth using shadow elevations and safe gradient transitions using **[references/visual-effects.md](references/visual-effects.md)**.

### Step 5: Incorporate Purposeful Motion
1. Determine animation curves, easing types (Ease-in, Ease-out, Bounce), and speed settings based on guides in **[references/animation-guide.md](references/animation-guide.md)**.
2. For advanced SVG, Lottie, or 3D animations, use **[references/motion-graphics.md](references/motion-graphics.md)**.

### Step 6: Review & Audit
1. Execute `python scripts/ux_audit.py <project_path>` to detect accessibility and cognitive load issues.
2. Run the **Quality Audit Checklist** to ensure compliance with modern guidelines before final delivery.

---

## 🔧 Runtime Scripts

**Execute these for audits (don't read, just run):**

| Script | Purpose | Usage |
|:---|:---|:---|
| [scripts/ux_audit.py](scripts/ux_audit.py) | UX Psychology & Accessibility Audit | `python scripts/ux_audit.py <project_path>` |
| [scripts/accessibility_checker.py](scripts/accessibility_checker.py) | Accessibility static checks | `python scripts/accessibility_checker.py <project_path>` |

---

## ⚠️ CRITICAL: ASK BEFORE ASSUMING (MANDATORY)

> **STOP! If the user's request is open-ended, DO NOT default to your favorites.**

### When User Prompt is Vague, ASK:

**Color not specified?** Ask:
> "What color palette do you prefer? (blue/green/orange/neutral/other?)"

**Style not specified?** Ask: 
> "What style are you going for? (minimal/bold/retro/futuristic/organic?)"

**Layout not specified?** Ask:
> "Do you have a layout preference? (single column/grid/asymmetric/full-width?)"

### ⛔ DEFAULT TENDENCIES TO AVOID (ANTI-SAFE HARBOR):

| AI Default Tendency | Why It's Bad | Think Instead |
|:---|:---|:---|
| **Bento Grids (Modern Cliché)** | Used in every AI design | Why does this content NEED a grid? |
| **Hero Split (Left/Right)** | Predictable & Boring | How about Massive Typography or Vertical Narrative? |
| **Mesh/Aurora Gradients** | The "new" lazy background | What's a radical color pairing? |
| **Glassmorphism** | AI's idea of "premium" | How about solid, high-contrast flat? |
| **Deep Cyan / Fintech Blue** | Safe harbor from purple ban | Why not Red, Black, or Neon Green? |
| **"Orchestrate / Empower"** | AI-generated copywriting | How would a human say this? |
| **Dark background + neon glow** | Overused, "AI look" | What does the BRAND actually need? |
| **Rounded everything** | Generic/Safe | Where can I use sharp, brutalist edges? |

> 🔴 **"Every 'safe' structure you choose brings you one step closer to a generic template. TAKE RISKS."**

---

## 1. Constraint Analysis

Before any design work, ANSWER THESE or ASK USER:

| Constraint | Question | Why It Matters |
|:---|:---|:---|
| **Timeline** | How much time? | Determines complexity |
| **Content** | Ready or placeholder? | Affects layout flexibility |
| **Brand** | Existing guidelines? | May dictate colors/fonts |
| **Tech** | What stack? | Affects capabilities |
| **Audience** | Who exactly? | Drives all visual decisions |

### Audience → Design Approach

| Audience | Think About |
|:---|:---|
| **Gen Z** | Bold, fast, mobile-first, authentic |
| **Millennials** | Clean, minimal, value-driven |
| **Gen X** | Familiar, trustworthy, clear |
| **Boomers** | Readable, high contrast, simple |
| **B2B** | Professional, data-focused, trust |
| **Luxury** | Restrained elegance, whitespace |

---

## 2. UX Psychology Principles

### Core Laws (Internalize These)

| Law | Principle | Application |
|:---|:---|:---|
| **Hick's Law** | More choices = slower decisions | Limit options, use progressive disclosure |
| **Fitts' Law** | Bigger + closer = easier to click | Size CTAs appropriately |
| **Miller's Law** | ~7 items in working memory | Chunk content into groups |
| **Von Restorff** | Different = memorable | Make CTAs visually distinct |
| **Serial Position** | First/last remembered most | Key info at start/end |

### Emotional Design Levels

```
VISCERAL (instant)  → First impression: colors, imagery, overall feel
BEHAVIORAL (use)    → Using it: speed, feedback, efficiency
REFLECTIVE (memory) → After: "I like what this says about me"
```

### Trust Building

- Security indicators on sensitive actions
- Social proof where relevant
- Clear contact/support access
- Consistent, professional design
- Transparent policies

---

## 3. Layout Principles

### Golden Ratio (φ = 1.618)

```
Use for proportional harmony:
├── Content : Sidebar = roughly 62% : 38%
├── Each heading size = previous × 1.618 (for dramatic scale)
└── Spacing can follow: sm → md → lg (each × 1.618)
```

### 8-Point Grid Concept

```
All spacing and sizing in multiples of 8:
├── Tight: 4px (half-step for micro)
├── Small: 8px
├── Medium: 16px
├── Large: 24px, 32px
├── XL: 48px, 64px, 80px
└── Adjust based on content density
```

### Key Sizing Principles

| Element | Consideration |
|:---|:---|
| **Touch targets** | Minimum comfortable tap size |
| **Buttons** | Height based on importance hierarchy |
| **Inputs** | Match button height for alignment |
| **Cards** | Consistent padding, breathable |
| **Reading width** | 45-75 characters optimal |

---

## 4. Color Principles

### 60-30-10 Rule

```
60% → Primary/Background (calm, neutral base)
30% → Secondary (supporting areas)
10% → Accent (CTAs, highlights, attention)
```

### Color Psychology (For Decision Making)

| If You Need... | Consider Hues | Avoid |
|:---|:---|:---|
| Trust, calm | Blue family | Aggressive reds |
| Growth, nature | Green family | Industrial grays |
| Energy, urgency | Orange, red | Passive blues |
| Luxury, creativity | Deep Teal, Gold, Emerald | Cheap-feeling brights |
| Clean, minimal | Neutrals | Overwhelming color |

### Selection Process

1. **What's the industry?** (narrows options)
2. **What's the emotion?** (picks primary)
3. **Light or dark mode?** (sets foundation)
4. **ASK USER** if not specified

For detailed color theory: see `references/color-system.md`

---

## 5. Typography Principles

### Scale Selection

| Content Type | Scale Ratio | Feel |
|:---|:---|:---|
| Dense UI | 1.125-1.2 | Compact, efficient |
| General web | 1.25 | Balanced (most common) |
| Editorial | 1.333 | Readable, spacious |
| Hero/display | 1.5-1.618 | Dramatic impact |

### Pairing Concept

```
Contrast + Harmony:
├── DIFFERENT enough for hierarchy
├── SIMILAR enough for cohesion
└── Usually: display + neutral, or serif + sans
```

### Readability Rules

- **Line length**: 45-75 characters optimal
- **Line height**: 1.4-1.6 for body text
- **Contrast**: Check WCAG requirements
- **Size**: 16px+ for body on web

For detailed typography: see `references/typography-system.md`

---

## 6. Visual Effects Principles

### Glassmorphism (When Appropriate)

```
Key properties:
├── Semi-transparent background
├── Backdrop blur
├── Subtle border for definition
└── ⚠️ **WARNING:** Standard blue/white glassmorphism is a modern cliché. Use it radically or not at all.
```

### Shadow Hierarchy

```
Elevation concept:
├── Higher elements = larger shadows
├── Y-offset > X-offset (light from above)
├── Multiple layers = more realistic
└── Dark mode: may need glow instead
```

### Gradient Usage

```
Harmonious gradients:
├── Adjacent colors on wheel (analogous)
├── OR same hue, different lightness
├── Avoid harsh complementary pairs
├── 🚫 **NO Mesh/Aurora Gradients** (floating blobs)
└── VARY from project to project radically
```

For complete effects guide: see `references/visual-effects.md`

---

## 7. Animation Principles

### Timing Concept

```
Duration based on:
├── Distance (further = longer)
├── Size (larger = slower)
├── Importance (critical = clear)
└── Context (urgent = fast, luxury = slow)
```

### Easing Selection

| Action | Easing | Why |
|:---|:---|:---|
| Entering | Ease-out | Decelerate, settle in |
| Leaving | Ease-in | Accelerate, exit |
| Emphasis | Ease-in-out | Smooth, deliberate |
| Playful | Bounce | Fun, energetic |

### Performance

- Animate only transform and opacity
- Respect reduced-motion preference
- Test on low-end devices

For animation patterns: see `references/animation-guide.md`, for advanced: `references/motion-graphics.md`

---

## 8. Next.js 16+ Modern Form Patterns

> [!IMPORTANT]
> For Next.js 16+ projects, use the native `next/form` component instead of standard HTML `<form>` for all GET-based search/filter operations.

### The `<Form>` Component Advantage
- **Automatic Client Navigation:** Performs client-side transitions on submit.
- **Progressive Enhancement:** Works even without JavaScript.
- **URL Sync:** Automatically encodes input values into search params.

### Implementation Example (Search Bar)
```tsx
import Form from 'next/form'

export default function SearchBar() {
  return (
    <Form action="/search" className="flex gap-2">
      <input 
        name="q" 
        placeholder="Search products..." 
        className="border p-2"
      />
      <button type="submit">Search</button>
    </Form>
  )
}
```

### When to use `<Form>` vs. standard `<form>`:
- **Use `next/form`** for: Search, Filtering, Sorting, Pagination (GET requests).
- **Use standard `<form>`** for: Mutations, Login, Data Entry (POST requests via Server Actions).

---

## ❌ Anti-Patterns

### ❌ Lazy Design Indicators
- Default system fonts without consideration.
- Stock imagery that doesn't match the brand's aesthetic.
- Inconsistent grid and margin spacing.
- Too many competing colors breaking the 60-30-10 rule.
- Walls of text without hierarchical weight.
- Inaccessible visual contrasts.

### ❌ AI Tendency Patterns (AVOID!)
- **Same colors every project**
- **Dark + neon as default**
- **Purple/violet everything (PURPLE BAN ✅)**
- **Bento grids for simple landing pages**
- **Mesh Gradients & Glow Effects**
- **Same layout structure / Vercel clone**
- **Not asking user preferences**

### ❌ Dark Patterns (Unethical)
- Hidden transactional costs at checkout.
- Deceptive visual cues and fake urgency clocks.
- Forced actions or hidden opt-outs.
- Confirmshaming copywriting.

---

## ✅ Quality Audit Checklist

Before delivering any user interface or layout designs, verify compliance with the following:

- [ ] **No Unvetted Defaults**: Avoided generic bento grids, boring left/right splits, mesh gradients, fintech blue, and standard white glassmorphism unless strictly proven to be the absolute best choice for the brand.
- [ ] **Proportional Rhythm**: Checked spacing and sizes against the 8-point grid, and heading scales against Golden Ratio proportions.
- [ ] **Linguistic Cleanliness**: Ensure copywriting is authentic and free of AI filler terms (e.g. "orchestrate", "empower").
- [ ] **Contrast & Accessibility**: Text contrast passes WCAG AA requirements, font size for body is 16px+, and target touch sizes are comfortable.
- [ ] **Motion Performance**: Animations are smooth, responsive to reduced-motion preferences, and use only transform and opacity changes.
- [ ] **Next.js Form Alignment**: GET-based search/filtering forms are implemented using the native Next.js `<Form>` component.

---

## 🔄 Post-Design Workflow

After implementing your design, run the audit:

```
1. DESIGN   → Read frontend-design principles ← YOU ARE HERE
2. CODE     → Implement the design
3. AUDIT    → Run web-design-guidelines review
4. FIX      → Address findings from audit
```

> **Next Step:** After coding, use `web-design-guidelines` skill to audit your implementation for accessibility, focus states, animations, and performance issues.

---

> **Remember:** Design is THINKING, not copying. Every project deserves fresh consideration based on its unique context and users. **Avoid the Modern SaaS Safe Harbor!**
