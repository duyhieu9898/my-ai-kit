---
name: seo-fundamentals
description: >-
  Audits and fixes technical SEO for public web pages, including metadata,
  Open Graph, structured data, sitemaps, robots rules, and AI search
  visibility. Use when a page must rank, be shared, or be cited by AI
  assistants, or when adding or changing public routes. Not for page speed
  (use performance-profiling).
---

# SEO Fundamentals

Crawlers and AI assistants see the **server-rendered HTML**. Metadata set only
on the client, after hydration, might as well not exist. Every check below is
about what the HTML response actually contains.

## Next.js App Router defaults

- **Metadata:** `export const metadata` for static pages, and
  `generateMetadata()` for dynamic ones.
- **`metadataBase`:** set it once in the root layout. Without it, relative
  Open Graph and canonical URLs are not absolute.
- **Canonical and language variants:** `alternates: { canonical,
  languages }`. Every locale lists all its variants, which renders
  `hreflang`.
- **Files instead of handwritten tags:** `app/sitemap.ts`, `app/robots.ts`,
  and `opengraph-image.tsx`.
- **JSON-LD:** render it in the page as
  `<script type="application/ld+json">`, with the value
  `JSON.stringify(data).replace(/</g, '\\u003c')`. The replace stops content
  from closing the script tag.

For other stacks, apply the same outputs: a unique `<title>` and meta
description per page, a canonical URL, OG tags, a sitemap, and robots rules.

## Facts that are easy to get wrong

- **Title and description** are cut by pixel width, at roughly 60 and 155
  characters. Put the distinguishing words first.
- **Meta keywords** are ignored by Google.
- **FAQPage rich results** are shown only for authoritative government and
  health sites, since 2023. **HowTo rich results** were removed. Use these
  types only when the data is genuinely a FAQ or how-to, not for SERP
  features.
- **`robots.txt` controls crawling, not indexing.** A blocked URL can still be
  indexed from links. To keep a page out of search, use
  `<meta name="robots" content="noindex">` or the `X-Robots-Tag` header, and
  do not block that URL in `robots.txt`.
- **Core Web Vitals** are LCP, INP (which replaced FID in March 2024), and
  CLS. See `performance-profiling`.

## AI search visibility (GEO)

- **Crawler access** is a product decision; ask when it is unclear. Each
  vendor documents its user agents, for example `GPTBot` and `OAI-SearchBot`
  (OpenAI), `ClaudeBot` (Anthropic), and `PerplexityBot`. `Google-Extended`
  controls use for Gemini training, not Google Search. Check each vendor's
  current list before writing rules.
- **Content that gets cited:** a clear definition near the top, original
  numbers with their source and date, comparison tables, and a named author
  with credentials. All of it must be in the HTML, not behind client-side
  tabs.
- **`llms.txt`** is a proposal with no confirmed use by major search engines.
  Add it only if the user asks.

## Check

1. Run the checker; do not read its source:

   ```bash
   python3 .agents/skills/seo-fundamentals/scripts/seo_checker.py <project>
   ```

   - It checks public page files for title, meta description, OG tags, H1,
     and image `alt`, and exits non-zero on issues.
   - Next.js `generateMetadata` cannot be evaluated statically, so it is
     flagged for runtime checking.
2. For the runtime check, fetch the rendered page and read the head:
   `curl -s <url> | grep -iE '<title|name="description"|property="og:|rel="canonical"|ld\+json'`.
3. Validate structured data with Google's Rich Results Test or the
   schema.org validator. Both need network access, so ask before using them.

## Done when

Every changed public route renders a unique title, description, canonical,
and OG tags in its HTML response. Structured data, where added, validates. The
checker passes.
