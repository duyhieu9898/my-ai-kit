---
name: server-management
description: >-
  Use when managing servers, configuring process managers (PM2/systemd), setting up monitoring, or troubleshooting.
  Server management principles (logs, scaling, health checks).
  NOT for client-side code.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Server Management

> Server management principles for production operations.
> **Learn to THINK, not memorize commands.**

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| _No supplementary files_ | Main server management procedures are in this file | Use this file by default |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Node.js backend patterns | [`nodejs-best-practices`](../nodejs-best-practices/SKILL.md) |
| CPU/Memory profiling and core optimizations | [`performance-optimizer`](../performance-optimizer/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with deploying production instances, configuring auto-recovers, or troubleshooting server outages, strictly follow this step-by-step procedure:

### Step 1: Establish Process Managers
1. Map application types to proper supervisors (PM2 clustering for Node.js, systemd services for native binaries).
2. Configure persistent system reboot settings.

### Step 2: Implement Observability Alerts
1. Setup key system indicators (availability, request throughput, CPU, and RAM limits).
2. Integrate error telemetry (Sentry) and external uptime monitors.

### Step 3: Set up structured Log Rotations
1. Enforce structured JSON logging format.
2. Establish custom log rotation size limits to prevent local disk space exhaustion.

### Step 4: Configure Health Check Endpoints
1. Code deep validation status targets checking active database connectors and external API integrations.
2. Link endpoints with upstream load balancers.

### Step 5: Tighten Security & Verify Checklist
1. Restrict SSH setups to key authentication exclusively.
2. Confirm compliance against the **Quality Audit Checklist** before completing.

---

## 1. Process Management Principles

### Tool Selection

| Scenario | Tool |
|----------|------|
| **Node.js app** | PM2 (clustering, reload) |
| **Any app** | systemd (Linux native) |
| **Containers** | Docker/Podman |
| **Orchestration** | Kubernetes, Docker Swarm |

### Process Management Goals

| Goal | What It Means |
|------|---------------|
| **Restart on crash** | Auto-recovery |
| **Zero-downtime reload** | No service interruption |
| **Clustering** | Use all CPU cores |
| **Persistence** | Survive server reboot |

---

## 2. Monitoring Principles

### What to Monitor

| Category | Key Metrics |
|----------|-------------|
| **Availability** | Uptime, health checks |
| **Performance** | Response time, throughput |
| **Errors** | Error rate, types |
| **Resources** | CPU, memory, disk |

### Alert Severity Strategy

| Level | Response |
|-------|----------|
| **Critical** | Immediate action |
| **Warning** | Investigate soon |
| **Info** | Review daily |

### Monitoring Tool Selection

| Need | Options |
|------|---------|
| Simple/Free | PM2 metrics, htop |
| Full observability | Grafana, Datadog |
| Error tracking | Sentry |
| Uptime | UptimeRobot, Pingdom |

---

## 3. Log Management Principles

### Log Strategy

| Log Type | Purpose |
|----------|---------|
| **Application logs** | Debug, audit |
| **Access logs** | Traffic analysis |
| **Error logs** | Issue detection |

### Log Principles

1. **Rotate logs** to prevent disk fill
2. **Structured logging** (JSON) for parsing
3. **Appropriate levels** (error/warn/info/debug)
4. **No sensitive data** in logs

---

## 4. Scaling Decisions

### When to Scale

| Symptom | Solution |
|---------|----------|
| High CPU | Add instances (horizontal) |
| High memory | Increase RAM or fix leak |
| Slow response | Profile first, then scale |
| Traffic spikes | Auto-scaling |

### Scaling Strategy

| Type | When to Use |
|------|-------------|
| **Vertical** | Quick fix, single instance |
| **Horizontal** | Sustainable, distributed |
| **Auto** | Variable traffic |

---

## 5. Health Check Principles

### What Constitutes Healthy

| Check | Meaning |
|-------|---------|
| **HTTP 200** | Service responding |
| **Database connected** | Data accessible |
| **Dependencies OK** | External services reachable |
| **Resources OK** | CPU/memory not exhausted |

### Health Check Implementation

- Simple: Just return 200
- Deep: Check all dependencies
- Choose based on load balancer needs

---

## 6. Security Principles

| Area | Principle |
|------|-----------|
| **Access** | SSH keys only, no passwords |
| **Firewall** | Only needed ports open |
| **Updates** | Regular security patches |
| **Secrets** | Environment vars, not files |
| **Audit** | Log access and changes |

---

## 7. Troubleshooting Priority

When something's wrong:

1. **Check if running** (process status)
2. **Check logs** (error messages)
3. **Check resources** (disk, memory, CPU)
4. **Check network** (ports, DNS)
5. **Check dependencies** (database, APIs)

---

## ❌ Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| Run as root | Use non-root user |
| Ignore logs | Set up log rotation |
| Skip monitoring | Monitor from day one |
| Manual restarts | Auto-restart config |
| No backups | Regular backup schedule |

---

## ✅ Quality Audit Checklist

Before concluding a server configuration, process management, or operational troubleshooting task, verify compliance with the following:

- [ ] **Non-Root Execution**: Verified that all application processes execute under non-root users.
- [ ] **Auto-Restart Configured**: Set up PM2 clustering or systemd configurations to recover processes automatically on crash.
- [ ] **Log Rotation Policies Met**: Enforced structured JSON logging with custom log rotation limits to prevent disk fills.
- [ ] **Health Check Endpoints Deep**: Implemented status endpoints monitoring database connectivity and dependencies.
- [ ] **Observability Monitored**: Established availability, throughput, error rates, and CPU/memory alerts.
- [ ] **SSH & Firewall Tightened**: Permitted SSH key authorization only, keeping non-essential ports blocked.

---

> **Remember:** A well-managed server is boring. That's the goal.
