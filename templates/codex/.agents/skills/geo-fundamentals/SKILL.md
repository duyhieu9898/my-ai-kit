---
name: geo-fundamentals
description: >-
  Use when optimizing content for ChatGPT, Claude, Perplexity, or Gemini citations, structuring FAQ schema, or configuring robots.txt.
  Generative Engine Optimization (GEO) principles covering citable data, RAG retrieval, and AI Crawler access.
  NOT for standard keyword SEO.
allowed-tools:
  - Read
  - Glob
  - Grep
---

# GEO Fundamentals

> Optimization for AI-powered search engines.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| [scripts/geo_checker.py](scripts/geo_checker.py) | GEO audit and AI citation readiness checker | Running local GEO validation |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Traditional search engine optimization rules | [`seo-fundamentals`](../seo-fundamentals/SKILL.md) |
| Semantic search content optimization pipelines | [`seo-specialist`](../seo-specialist/SKILL.md) |
| AI-friendly documentation structures | [`documentation-templates`](../documentation-templates/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with optimizing web pages for LLM searches, building citation value, or managing AI crawler policies, strictly follow this step-by-step procedure:

### Step 1: Identify Citation Targets
1. Evaluate major target generative engines (Perplexity, ChatGPT, Claude, Gemini) and understand their respective source extraction behaviors.
2. Outline core entity objectives.

### Step 2: Inject Citable Structural Elements
1. Insert semantic summaries and direct answers (Q&A sections) at high-visibility nodes.
2. Embed structured comparison tables, original metrics, and clear expert quotes.

### Step 3: Implement JSON-LD Schema
1. Build highly-detailed Article, Person, and FAQPage metadata schemas.
2. Bind author profile entities to external author portfolios.

### Step 4: Configure Crawler Permissions
1. Edit `robots.txt` to explicitly grant or selectively deny access to specific AI agents (GPTBot, Claude-Web, PerplexityBot).
2. Maintain indexing crawl frequencies.

### Step 5: Perform GEO Scans & Verify Checklist
1. Run local citation checkers (`python3 scripts/geo_checker.py <project_path>`).
2. Confirm compliance against the **Quality Audit Checklist** before completing.

---

## 1. What is GEO?

**GEO** = Generative Engine Optimization

| Goal | Platform |
|------|----------|
| Be cited in AI responses | ChatGPT, Claude, Perplexity, Gemini |

### SEO vs GEO

| Aspect | SEO | GEO |
|--------|-----|-----|
| Goal | #1 ranking | AI citations |
| Platform | Google | AI engines |
| Metrics | Rankings, CTR | Citation rate |
| Focus | Keywords | Entities, data |

---

## 2. AI Engine Landscape

| Engine | Citation Style | Opportunity |
|--------|----------------|-------------|
| **Perplexity** | Numbered [1][2] | Highest citation rate |
| **ChatGPT** | Inline/footnotes | Custom GPTs |
| **Claude** | Contextual | Long-form content |
| **Gemini** | Sources section | SEO crossover |

---

## 3. RAG Retrieval Factors

How AI engines select content to cite:

| Factor | Weight |
|--------|--------|
| Semantic relevance | ~40% |
| Keyword match | ~20% |
| Authority signals | ~15% |
| Freshness | ~10% |
| Source diversity | ~15% |

---

## 4. Content That Gets Cited

| Element | Why It Works |
|---------|--------------|
| **Original statistics** | Unique, citable data |
| **Expert quotes** | Authority transfer |
| **Clear definitions** | Easy to extract |
| **Step-by-step guides** | Actionable value |
| **Comparison tables** | Structured info |
| **FAQ sections** | Direct answers |

---

## 5. GEO Content Checklist

### Content Elements

- [ ] Question-based titles
- [ ] Summary/TL;DR at top
- [ ] Original data with sources
- [ ] Expert quotes (name, title)
- [ ] FAQ section (3-5 Q&A)
- [ ] Clear definitions
- [ ] "Last updated" timestamp
- [ ] Author with credentials

### Technical Elements

- [ ] Article schema with dates
- [ ] Person schema for author
- [ ] FAQPage schema
- [ ] Fast loading (< 2.5s)
- [ ] Clean HTML structure

---

## 6. Entity Building

| Action | Purpose |
|--------|---------|
| Google Knowledge Panel | Entity recognition |
| Wikipedia (if notable) | Authority source |
| Consistent info across web | Entity consolidation |
| Industry mentions | Authority signals |

---

## 7. AI Crawler Access

### Key AI User-Agents

| Crawler | Engine |
|---------|--------|
| GPTBot | ChatGPT/OpenAI |
| Claude-Web | Claude |
| PerplexityBot | Perplexity |
| Googlebot | Gemini (shared) |

### Access Decision

| Strategy | When |
|----------|------|
| Allow all | Want AI citations |
| Block GPTBot | Don't want OpenAI training |
| Selective | Allow some, block others |

---

## 8. Measurement

| Metric | How to Track |
|--------|--------------|
| AI citations | Manual monitoring |
| "According to [Brand]" mentions | Search in AI |
| Competitor citations | Compare share |
| AI-referred traffic | UTM parameters |

---

## ❌ Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| Publish without dates | Add timestamps |
| Vague attributions | Name sources |
| Skip author info | Show credentials |
| Thin content | Comprehensive coverage |

---

## ✅ Quality Audit Checklist

Before concluding a generative search optimization, crawler configuration change, or FAQ schema deployment, verify compliance with the following:

- [ ] **Structured Metadata Complete**: Verified that ArticlePage, FAQPage, and Person schema fields match exactly.
- [ ] **TL;DR Summary Injected**: Confirmed a high-relevance semantic summary sits at the top of long-form articles.
- [ ] **Citations Easy to Extract**: Leveraged clean tables, definitions lists, or numbered points for rapid RAG parsers crawling.
- [ ] **Crawlers Access Declared**: Checked `robots.txt` rules to verify that AI User-Agents (e.g. GPTBot, PerplexityBot) are explicitly permitted or blocked.
- [ ] **Authority Signals Met**: Authenticated content with clear credentials, publication timestamps, and author background.
- [ ] **GEO Checker Run**: Triggered local diagnostic runner (`python3 scripts/geo_checker.py <project_path>`) and verified zero citation warnings.

---

## Script

| Script | Purpose | Command |
|:---|:---|:---|
| [scripts/geo_checker.py](scripts/geo_checker.py) | GEO audit (AI citation readiness) | `python3 scripts/geo_checker.py <project_path>` |

---

> **Remember:** AI cites content that's clear, authoritative, and easy to extract. Be the best answer.
