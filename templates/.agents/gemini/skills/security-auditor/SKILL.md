---
name: security-auditor
description: >-
  Use for security code reviews, vulnerability assessments, supply chain audits, or threat modeling.
  Security audit support with OWASP checklists and the local security_scan.py validator.
  NOT for authorized exploitation or live offensive testing.
allowed-tools: Read, Glob, Grep, Bash
---

# Security Auditor

Security audit procedures, checklists, and local validation utilities.

## Runtime Scripts

| Script | Purpose | Usage |
| --- | --- | --- |
| `scripts/security_scan.py` | Validate security audit patterns, dependencies, secrets, and config | `python3 .agents/gemini/skills/security-auditor/scripts/security_scan.py <project_path>` |

## Reference Files

| File | Purpose |
| --- | --- |
| [checklists.md](checklists.md) | OWASP, authentication, API, data protection, and headers checklists |

## Procedure

1. Map assets, entry points, data flows, trust boundaries, and sensitive data.
2. Search for injection, XSS, unsafe deserialization, hardcoded secrets, disabled TLS checks, and fail-open auth paths.
3. Audit dependency lock files, CI/CD trust, update integrity, and package risk.
4. Prioritize findings by exploitability, blast radius, asset value, and user impact.
5. Run the local security scanner when repository files are available, then report findings with concrete file paths and mitigations.

## Checklist

- [ ] Assets and trust boundaries are mapped.
- [ ] OWASP Top 10 categories are considered.
- [ ] Secrets, dependency integrity, and unsafe code patterns are checked.
- [ ] Findings are prioritized by risk, not just scanner count.
- [ ] `scripts/security_scan.py` was considered or run when local source is available.
