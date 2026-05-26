---
name: seo-fundamentals
description: >-
  Use when optimizing web pages for search visibility, meta tags, page speed, sitemaps or robots.txt.
  SEO fundamentals covering E-E-A-T, Core Web Vitals, and Schema.
  NOT for visual layout styling.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# SEO Fundamentals

> Principles for search engine visibility.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| [scripts/seo_checker.py](scripts/seo_checker.py) | Python SEO validation utility | Running local SEO validation |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Advanced search and citation optimization (GEO) | [`seo-specialist`](../seo-specialist/SKILL.md) |
| Core Web Vitals optimization techniques | [`performance-optimizer`](../performance-optimizer/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with optimizing web assets for search crawler rankings, constructing schema blocks, or auditing technical tags, strictly follow this step-by-step procedure:

### Step 1: Audit Technical Sitemaps
1. Confirm sitemaps.xml, robots.txt, canonical headers, and secure HTTPS routes are configured.
2. Verify clean URL patterns.

### Step 2: Enforce Heading Hierarchies
1. Check title lengths (50-60 characters) and meta descriptions (150-160 characters).
2. Guarantee exactly one H1 tags and logical nested header configurations.

### Step 3: Implement Schema Metadata
1. Build specific JSON-LD structures (Organization, Person, FAQ) to back author credentials.
2. Outline clear definitions in content to support AI indexing.

### Step 4: Run Core Web Vitals audits
1. Trace page loading metrics (LCP < 2.5s), visual shifts (CLS < 0.1), and interaction latency (INP < 200ms).
2. Plan image compression.

### Step 5: Run scan validations & Checklist
1. Trigger local Python validation checkers (`python scripts/seo_checker.py`).
2. Confirm compliance against the **Quality Audit Checklist** before completing.

---

## 1. E-E-A-T Framework

| Principle | Signals |
|-----------|---------|
| **Experience** | First-hand knowledge, real examples |
| **Expertise** | Credentials, depth of knowledge |
| **Authoritativeness** | Backlinks, mentions, industry recognition |
| **Trustworthiness** | HTTPS, transparency, accurate info |

---

## 2. Core Web Vitals

| Metric | Target | Measures |
|--------|--------|----------|
| **LCP** | < 2.5s | Loading performance |
| **INP** | < 200ms | Interactivity |
| **CLS** | < 0.1 | Visual stability |

---

## 3. Technical SEO Principles

### Site Structure

| Element | Purpose |
|---------|---------|
| XML sitemap | Help crawling |
| robots.txt | Control access |
| Canonical tags | Prevent duplicates |
| HTTPS | Security signal |

### Performance

| Factor | Impact |
|--------|--------|
| Page speed | Core Web Vital |
| Mobile-friendly | Ranking factor |
| Clean URLs | Crawlability |

---

## 4. Content SEO Principles

### Page Elements

| Element | Best Practice |
|---------|---------------|
| Title tag | 50-60 chars, keyword front |
| Meta description | 150-160 chars, compelling |
| H1 | One per page, main keyword |
| H2-H6 | Logical hierarchy |
| Alt text | Descriptive, not stuffed |

### Content Quality

| Factor | Importance |
|--------|------------|
| Depth | Comprehensive coverage |
| Freshness | Regular updates |
| Uniqueness | Original value |
| Readability | Clear writing |

---

## 5. Schema Markup Types

| Type | Use |
|------|-----|
| Article | Blog posts, news |
| Organization | Company info |
| Person | Author profiles |
| FAQPage | Q&A content |
| Product | E-commerce |
| Review | Ratings |
| BreadcrumbList | Navigation |

---

## 6. AI Content Guidelines

### What Google Looks For

| ✅ Do | ❌ Don't |
|-------|----------|
| AI draft + human edit | Publish raw AI content |
| Add original insights | Copy without value |
| Expert review | Skip fact-checking |
| Follow E-E-A-T | Keyword stuffing |

---

## 7. Ranking Factors (Prioritized)

| Priority | Factor |
|----------|--------|
| 1 | Quality, relevant content |
| 2 | Backlinks from authority sites |
| 3 | Page experience (Core Web Vitals) |
| 4 | Mobile optimization |
| 5 | Technical SEO fundamentals |

---

## 8. Measurement

| Metric | Tool |
|--------|------|
| Rankings | Search Console, Ahrefs |
| Traffic | Analytics |
| Core Web Vitals | PageSpeed Insights |
| Indexing | Search Console |
| Backlinks | Ahrefs, Semrush |

---

## ❌ Anti-Patterns

- Publishing raw AI-generated content without expert review or original value.
- Keyword stuffing titles, headings, alt text, or schema fields.
- Optimizing visual copy while ignoring sitemap, robots.txt, canonicals, HTTPS, and Core Web Vitals.
- Adding schema markup that does not match visible page content.

---

## ✅ Quality Audit Checklist

Before concluding a search optimization, Schema metadata configuration, or technical audit task, verify compliance with the following:

- [ ] **Technical files verified**: Confirmed XML sitemaps, robots.txt access limits, canonical endpoints, and HTTPS routing.
- [ ] **Content Hierarchies Correct**: Verified exactly one `<h1>` tag per page and proper hierarchical heading nesting (`<h2>` to `<h6>`).
- [ ] **Metadata Boundaries Met**: Checked titles (50-60 chars) and meta descriptions (150-160 chars).
- [ ] **E-E-A-T schemas implemented**: Embedded Person/Organization JSON-LD schema blocks to validate credentials.
- [ ] **Core Web Vitals Checked**: Assured LCP remains under 2.5s, INP under 200ms, and CLS under 0.1.
- [ ] **Local Checker Executed**: Run target scan verification suites (`python scripts/seo_checker.py`) and recorded findings.

---

## Script

| Script | Purpose | Command |
|--------|---------|---------|
| [scripts/seo_checker.py](scripts/seo_checker.py) | Python SEO validation utility | `python scripts/seo_checker.py` |

---

> **Remember:** SEO is a long-term game. Quality content + technical excellence + patience = results.
