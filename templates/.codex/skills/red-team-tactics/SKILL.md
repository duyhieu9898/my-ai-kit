---
name: red-team-tactics
description: >-
  Use when conducting penetration testing, adversary simulation, assessing attack surfaces, or evaluating threat detection.
  Red team tactics and adversary simulation based on MITRE ATT&CK.
  NOT for standard audits.
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
---

# Red Team Tactics

> Adversary simulation principles based on MITRE ATT&CK framework.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| _No supplementary files_ | Main red team tactics procedures are in this file | Use this file by default |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Penetration testing and validation assessments | [`penetration-tester`](../penetration-tester/SKILL.md) |
| Defensive security code reviews | [`security-auditor`](../security-auditor/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with conducting adversary simulations, assessing threat detection gap telemetries, or mapping attack surfaces, strictly follow this step-by-step procedure:

### Step 1: Validate ROE & Scopes
1. Confirm active, written authorization and Rules of Engagement (ROE) from the user before executing any actions.
2. Outline clear scan limits.

### Step 2: Run Passive & Active Recon
1. Review exposed domains and DNS ranges.
2. Trace technology stacks to isolate potential vulnerability vectors without triggering active defenses early.

### Step 3: Map Initial Access Vectors
1. Determine appropriate initial vectors (exposed public CVEs, weak authentication).
2. Trace access footholds.

### Step 4: Trace Privilege Escalation & Lateral Paths
1. Map privilege escalation scenarios (Windows unquoted service paths/tokens vs Linux SUID/Sudo configs).
2. Map internal Active Directory paths (Kerberoasting, DCSync) and lateral movements (WinRM, RDP).

### Step 5: Draft Detection Gaps & Verify Checklist
1. Write detailed narratives on how initial access was gained and where defensive telemetry failed.
2. Confirm compliance against the **Quality Audit Checklist** before completing.

---

## 1. MITRE ATT&CK Phases

### Attack Lifecycle

```
RECONNAISSANCE → INITIAL ACCESS → EXECUTION → PERSISTENCE
       ↓              ↓              ↓            ↓
   PRIVILEGE ESC → DEFENSE EVASION → CRED ACCESS → DISCOVERY
       ↓              ↓              ↓            ↓
LATERAL MOVEMENT → COLLECTION → C2 → EXFILTRATION → IMPACT
```

### Phase Objectives

| Phase | Objective |
|-------|-----------|
| **Recon** | Map attack surface |
| **Initial Access** | Get first foothold |
| **Execution** | Run code on target |
| **Persistence** | Survive reboots |
| **Privilege Escalation** | Get admin/root |
| **Defense Evasion** | Avoid detection |
| **Credential Access** | Harvest credentials |
| **Discovery** | Map internal network |
| **Lateral Movement** | Spread to other systems |
| **Collection** | Gather target data |
| **C2** | Maintain command channel |
| **Exfiltration** | Extract data |

---

## 2. Reconnaissance Principles

### Passive vs Active

| Type | Trade-off |
|------|-----------|
| **Passive** | No target contact, limited info |
| **Active** | Direct contact, more detection risk |

### Information Targets

| Category | Value |
|----------|-------|
| Technology stack | Attack vector selection |
| Employee info | Social engineering |
| Network ranges | Scanning scope |
| Third parties | Supply chain attack |

---

## 3. Initial Access Vectors

### Selection Criteria

| Vector | When to Use |
|--------|-------------|
| **Phishing** | Human target, email access |
| **Public exploits** | Vulnerable services exposed |
| **Valid credentials** | Leaked or cracked |
| **Supply chain** | Third-party access |

---

## 4. Privilege Escalation Principles

### Windows Targets

| Check | Opportunity |
|-------|-------------|
| Unquoted service paths | Write to path |
| Weak service permissions | Modify service |
| Token privileges | Abuse SeDebug, etc. |
| Stored credentials | Harvest |

### Linux Targets

| Check | Opportunity |
|-------|-------------|
| SUID binaries | Execute as owner |
| Sudo misconfiguration | Command execution |
| Kernel vulnerabilities | Kernel exploits |
| Cron jobs | Writable scripts |

---

## 5. Defense Evasion Principles

### Key Techniques

| Technique | Purpose |
|-----------|---------|
| LOLBins | Use legitimate tools |
| Obfuscation | Hide malicious code |
| Timestomping | Hide file modifications |
| Log clearing | Remove evidence |

### Operational Security

- Work during business hours
- Mimic legitimate traffic patterns
- Use encrypted channels
- Blend with normal behavior

---

## 6. Lateral Movement Principles

### Credential Types

| Type | Use |
|------|-----|
| Password | Standard auth |
| Hash | Pass-the-hash |
| Ticket | Pass-the-ticket |
| Certificate | Certificate auth |

### Movement Paths

- Admin shares
- Remote services (RDP, SSH, WinRM)
- Exploitation of internal services

---

## 7. Active Directory Attacks

### Attack Categories

| Attack | Target |
|--------|--------|
| Kerberoasting | Service account passwords |
| AS-REP Roasting | Accounts without pre-auth |
| DCSync | Domain credentials |
| Golden Ticket | Persistent domain access |

---

## 8. Reporting Principles

### Attack Narrative

Document the full attack chain:
1. How initial access was gained
2. What techniques were used
3. What objectives were achieved
4. Where detection failed

### Detection Gaps

For each successful technique:
- What should have detected it?
- Why didn't detection work?
- How to improve detection

---
---

## ✅ Quality Audit Checklist

Before concluding a red team exercise, adversary simulation, or detection gap reporting task, verify compliance with the following:

- [ ] **Authorization Secured**: Verified active written authorization and Rules of Engagement before triggering any simulation step.
- [ ] **Scope Enforced**: Ensured all probes, execution actions, and scans remain strictly within the defined scope.
- [ ] **MITRE ATT&CK Framework Aligned**: Traced actions through structured phases (Recon -> Initial Access -> Privilege Escalation).
- [ ] **Detection Gaps Documented**: Highlighted what telemetry controls should have detected the simulation and how to improve.
- [ ] **Data Integrity Respected**: Avoided actual data destruction, modifications, or persistent exfiltrations.
- [ ] **Clean-up Performed**: Removed active footholds, test files, and local log anomalies created during testing.

---

## ❌ Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| Rush to exploitation | Follow methodology |
| Cause damage | Minimize impact |
| Skip reporting | Document everything |
| Ignore scope | Stay within boundaries |

---

> **Remember:** Red team simulates attackers to improve defenses, not to cause harm.
