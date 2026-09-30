---
name: security-auditor
description: >-
  Audits code for exploitable flaws against the OWASP Top 10:2025, including
  secrets, access control, injection, and supply chain, and ranks findings
  with fixes. Use when asked for a security review, threat model, or
  pre-release audit. Not for general code review (use code-review-checklist).
---

# Security Auditor

A security audit is only useful if each finding is real, reachable, and
ranked. Start from what an attacker can reach, confirm each suspicion in the
code, and report fewer, proven findings rather than a pattern dump. The
work is defensive: review code and configuration, and do not run exploits
against systems the user does not own.

## Procedure

1. **Map the surface.** List entry points (route handlers, server actions,
   webhooks, queue consumers, MCP tools, cron jobs), the data each touches,
   and where trust changes (browser to server, server to database, server
   to third party). For a threat model, record assets, actors, and entry
   points in the report.
2. **Run the scanner** (below) for leads, then confirm or discard each lead
   by reading the code.
3. **Review by category** using the OWASP list and the stack pitfalls.
   Follow data from each entry point to its sink; check authorization at the
   object level, not only the route.
4. **Rank** each confirmed finding (below) and write the report.

## OWASP Top 10:2025

| ID | Category | Look for |
|---|---|---|
| A01 | Broken Access Control | IDOR / missing per-object checks, SSRF (now part of A01), CORS with credentials |
| A02 | Security Misconfiguration | Debug on, default credentials, missing headers, verbose errors |
| A03 | Software Supply Chain Failures (new) | Missing or ignored lockfile, install scripts, unpinned CI actions, typosquats |
| A04 | Cryptographic Failures | Weak hashing, secrets in code, tokens in `localStorage`, no TLS |
| A05 | Injection | SQL/NoSQL string building, shell commands, XSS, template injection |
| A06 | Insecure Design | Missing rate limits on costly flows, trust in client-side checks |
| A07 | Authentication Failures | Weak session handling, no brute-force limit, unsafe JWT verification |
| A08 | Software or Data Integrity Failures | Unsigned webhooks, unsafe deserialization, unverified updates |
| A09 | Security Logging and Alerting Failures | No audit trail for auth and admin actions, secrets in logs |
| A10 | Mishandling of Exceptional Conditions (new) | Fail-open `catch`, unchecked errors that skip auth, leaked stack traces |

Read [references/checklists.md](references/checklists.md) when a report
needs a per-category checklist, or for the authentication, API, data
protection, and header checklists.

## Stack pitfalls (Next.js, Node, Supabase, MongoDB)

- **Server actions** are public POST endpoints reachable without the UI.
  Each one validates input and checks the session and the object owner.
- **Middleware-only auth** is not enough: check authorization again where
  data is read. Next.js before 15.2.3 (and matching 14.x/13.x/12.x patches)
  let the `x-middleware-subrequest` header skip middleware
  (CVE-2025-29927).
- **`NEXT_PUBLIC_*`** variables are compiled into the browser bundle. Any
  secret with that prefix is leaked.
- **Supabase:** tables in an exposed schema without RLS are readable with the
  anon key; the `service_role` key must never reach the client; RLS
  policies using `user_metadata` trust data the user can edit.
- **MongoDB operator injection:** a body like `{"password": {"$ne": null}}`
  passes into a query unless input is schema-validated to scalar types.
- **JWT:** verify with a library and a fixed algorithm list; never decode
  without verifying.
- **Webhooks:** verify the signature over the raw body before parsing.
- **Outbound fetch of a user-supplied URL** (previews, imports, webhooks):
  allow-list hosts and block private and metadata addresses
  (`169.254.169.254`), including after redirects.
- **Install scripts:** npm packages run lifecycle scripts on install, the
  route used by the 2025 npm worm attacks. pnpm 10+ blocks dependency
  scripts unless allow-listed (`onlyBuiltDependencies`); with npm, CI
  installs should use `npm ci`.

## Scanner

`python3 .agents/skills/security-auditor/scripts/security_scan.py [project_path] [--scan-type all|deps|secrets|patterns|config] [--output json|summary]`

Run it; do not read the source. Defaults: `.`, `all`, `json`. Use
`--output summary` for a short readout.

- **`secrets`:** regexes for API keys, tokens, passwords, AWS keys,
  connection strings, private keys, and JWTs in code and config files. It
  reports file, type, and count, not the value. It skips files named `.env`
  or `.env.local` (their suffix does not match), so check those and git
  history separately.
- **`patterns`:** line regexes for `eval`, `exec`, `child_process.exec`,
  `execSync`, `os.system`, `shell=True`, `dangerouslySetInnerHTML`,
  `innerHTML`, SQL string building, `verify=False`, `pickle`, and unsafe
  `yaml.load`. Expect false positives such as `regex.exec(` and sanitized
  HTML.
- **`config`:** debug flags, `NODE_ENV=development`, CORS wildcards, and
  whether a header config (`next.config.*`, `middleware.ts`, `nginx.conf`)
  exists at the root.
- **`deps`:** lockfile presence at the project root only, then
  `npm audit --json` when `package.json` exists. **This part needs network
  access** to the npm registry; offline, or after the 60 s timeout, it is
  skipped silently. It checks each package manager separately, so a pnpm
  project also gets "npm/yarn: no lock file" findings; ignore those for
  managers the project does not use. For pnpm or yarn, run `pnpm audit` or
  `yarn npm audit` yourself if network use is acceptable.

The scanner exits 0 whatever it finds (1 only if the path is not a
directory). Read `summary.overall_status` and the per-scan `findings`; they
are leads, not confirmed vulnerabilities.

## Ranking

- **Critical:** exploitable remotely without authentication, or leading to
  code execution, auth bypass, or bulk data exposure.
- **High:** exploitable by any logged-in user against other users' data, or
  a leaked live secret.
- **Medium:** needs unusual conditions or gives limited data.
- **Low:** hardening or defense in depth.

For a dependency CVE, raise priority when it is in the CISA KEV catalog or
has a high EPSS score, and lower it when the vulnerable function is not
reachable from this code. A dev-only dependency is rarely above Medium.

## Report

For each finding: title, severity, `file:line`, how an attacker reaches it
(one concrete request or input), impact, and the fix. List what was reviewed
and what was not (for example, "infrastructure and git history not
reviewed"). A leaked secret must be rotated, not only removed from code.

## Done when

Every entry point in scope was checked for authentication, per-object
authorization, and input validation; each reported finding was confirmed in
the code and ranked; scanner leads were confirmed or dismissed; and the
report states its coverage and the dependency-audit result or why it was
not run.
