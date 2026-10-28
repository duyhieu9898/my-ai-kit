# Security Checklists

> Checklists for security audit reports. Numbering follows the OWASP Top 10:2025.

---

## OWASP Top 10:2025 Audit Checklist

### A01: Broken Access Control
- [ ] Authorization on all protected routes and server actions
- [ ] Per-object ownership checks (no IDOR)
- [ ] Deny by default
- [ ] CORS does not combine credentials with a wildcard or reflected origin
- [ ] SSRF: outbound URLs allow-listed; private and metadata addresses blocked

### A02: Security Misconfiguration
- [ ] Unnecessary features and debug modes disabled
- [ ] Error messages sanitized
- [ ] Security headers configured
- [ ] Default credentials changed

### A03: Software Supply Chain Failures
- [ ] Lockfile committed and used in CI (`npm ci`, `pnpm install --frozen-lockfile`)
- [ ] No known vulnerable dependencies on reachable paths
- [ ] Dependency install scripts restricted
- [ ] CI actions pinned; unused dependencies removed

### A04: Cryptographic Failures
- [ ] Passwords hashed (argon2id, or bcrypt cost 12+)
- [ ] Sensitive data encrypted at rest
- [ ] TLS 1.2+ for all connections
- [ ] No secrets in code, logs, or `NEXT_PUBLIC_*` variables

### A05: Injection
- [ ] Parameterized queries; NoSQL input validated to scalar types
- [ ] Input validation on all user data
- [ ] Output encoding for XSS
- [ ] No eval() or shell commands built from input

### A06: Insecure Design
- [ ] Threat modeling done
- [ ] Rate limits on login, reset, and costly flows
- [ ] Business logic validated on the server

### A07: Authentication Failures
- [ ] MFA available
- [ ] Session invalidation on logout
- [ ] Session timeout implemented
- [ ] Brute force protection

### A08: Software or Data Integrity Failures
- [ ] Webhook signatures verified
- [ ] No unsafe deserialization
- [ ] CI/CD pipeline and update mechanism secured

### A09: Security Logging and Alerting Failures
- [ ] Security events logged
- [ ] Logs protected
- [ ] No sensitive data in logs
- [ ] Alerting configured

### A10: Mishandling of Exceptional Conditions
- [ ] Errors fail closed (a failed check denies access)
- [ ] No stack traces or internals in responses
- [ ] Resource limits and timeouts on external calls

---

## Authentication Checklist

- [ ] Strong password policy
- [ ] Account lockout
- [ ] Secure password reset
- [ ] Session management
- [ ] Token expiration
- [ ] Logout invalidation

---

## API Security Checklist

- [ ] Authentication required
- [ ] Authorization per endpoint
- [ ] Input validation
- [ ] Rate limiting
- [ ] Output sanitization
- [ ] Error handling

---

## Data Protection Checklist

- [ ] Encryption at rest
- [ ] Encryption in transit
- [ ] Key management
- [ ] Data minimization
- [ ] Secure deletion

---

## Security Headers

| Header | Purpose |
|--------|---------|
| **Content-Security-Policy** | XSS prevention |
| **X-Content-Type-Options** | MIME sniffing |
| **X-Frame-Options** | Clickjacking (or CSP `frame-ancestors`) |
| **Strict-Transport-Security** | Force HTTPS |
| **Referrer-Policy** | Referrer control |

---

## Quick Audit Commands

| Check | What to Look For |
|-------|------------------|
| Secrets in code | password, api_key, secret |
| Dangerous patterns | eval, innerHTML, SQL concat |
| Dependency issues | npm audit, snyk |

---

> **Usage:** Copy relevant checklists into the plan or security report.
