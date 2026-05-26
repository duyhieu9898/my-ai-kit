---
name: app-builder
description: >-
  Use when creating a new full-stack application from scratch, planning project scaffolding, or setting up core files.
  Full-stack application building orchestrator that determines project type, selects tech stack, scaffolds project structure, and coordinates agents.
  NOT for making small, single-file edits to existing codebases.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Agent
---

# App Builder - Application Building Orchestrator

> Analyzes user's requests, determines tech stack, plans structure, and coordinates agents.

## 🎯 Selective Reading Rule

**Read ONLY files relevant to the request!** Check the content map, find what you need.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| [references/project-detection.md](references/project-detection.md) | Keyword matrix, project type detection | Starting new project |
| [references/tech-stack.md](references/tech-stack.md) | 2026 default stack, alternatives | Choosing technologies |
| [references/agent-coordination.md](references/agent-coordination.md) | Agent pipeline, execution order | Coordinating multi-agent work |
| [references/scaffolding.md](references/scaffolding.md) | Directory structure, core files | Creating project structure |
| [references/feature-building.md](references/feature-building.md) | Feature analysis, error handling | Adding features to existing project |
| [references/templates/index.md](references/templates/index.md) | **Project templates index** | Scaffolding new project |

---

## 📦 Templates (13)

Quick-start scaffolding for new projects. **Read the matching template only!**

| Template | Tech Stack | When to Use |
|:---|:---|:---|
| [nextjs-fullstack](references/templates/nextjs-fullstack/TEMPLATE.md) | Next.js + Prisma | Full-stack web app |
| [nextjs-saas](references/templates/nextjs-saas/TEMPLATE.md) | Next.js + Stripe | SaaS product |
| [nextjs-static](references/templates/nextjs-static/TEMPLATE.md) | Next.js + Framer | Landing page |
| [nuxt-app](references/templates/nuxt-app/TEMPLATE.md) | Nuxt 3 + Pinia | Vue full-stack app |
| [express-api](references/templates/express-api/TEMPLATE.md) | Express + JWT | REST API |
| [python-fastapi](references/templates/python-fastapi/TEMPLATE.md) | FastAPI | Python API |
| [react-native-app](references/templates/react-native-app/TEMPLATE.md) | Expo + Zustand | Mobile app |
| [flutter-app](references/templates/flutter-app/TEMPLATE.md) | Flutter + Riverpod | Cross-platform mobile |
| [electron-desktop](references/templates/electron-desktop/TEMPLATE.md) | Electron + React | Desktop app |
| [chrome-extension](references/templates/chrome-extension/TEMPLATE.md) | Chrome MV3 | Browser extension |
| [cli-tool](references/templates/cli-tool/TEMPLATE.md) | Node.js + Commander | CLI app |
| [monorepo-turborepo](references/templates/monorepo-turborepo/TEMPLATE.md) | Turborepo + pnpm | Monorepo |
| [astro-static](references/templates/astro-static/TEMPLATE.md) | Astro + MDX | Blog / Docs |

---

## 🔗 Related Skills

| Skill | Role |
|:---|:---|
| [`project-planner`](../project-planner/SKILL.md) | Task breakdown, dependency graph |
| [`frontend-specialist`](../frontend-specialist/SKILL.md) | UI components, pages |
| [`backend-specialist`](../backend-specialist/SKILL.md) | API, business logic |
| [`database-architect`](../database-architect/SKILL.md) | Schema, migrations |
| [`devops-engineer`](../devops-engineer/SKILL.md) | Deployment, preview |

---

## 🛠️ Instructions / Procedures

When orchestrated to scaffold a new full-stack application from scratch, follow these sequential steps:

### Step 1: Detect Project Type & Template
1. Analyze the user request's functional requirements.
2. Match keywords against the matrix in [references/project-detection.md](references/project-detection.md) to classify the application and select the most appropriate starter template.
3. If critical details are missing, pause and request clarification from the user.

### Step 2: Formulate Technology Stack
1. Select the baseline technologies based on the 2026 default tech stack in [references/tech-stack.md](references/tech-stack.md) (e.g., Next.js 16, Tailwind CSS v4, Postgres with Prisma/Drizzle).
2. If specialized features are requested (real-time updates, payments, search), select the recommended alternatives (e.g., Supabase, Stripe, Algolia).

### Step 3: Scaffold Project Structure
1. Create the project workspace using directory structure patterns documented in [references/scaffolding.md](references/scaffolding.md).
2. Establish essential configuration files (e.g., `.gitignore`, `tsconfig.json`, `package.json`, environment files).
3. Populate directories with initial scaffolding from the corresponding template folder (e.g., `references/templates/nextjs-fullstack/TEMPLATE.md`).

### Step 4: Add Business Logic & Features
1. Incrementally construct application components and routing models.
2. Follow standard error handling patterns and separation of concerns outlined in [references/feature-building.md](references/feature-building.md).

### Step 5: Coordinate Multi-Agent Work
1. Breakdown complex development tasks into distinct, modular assignments.
2. Hand off development chunks to specialized agents (`frontend-specialist`, `backend-specialist`, `database-architect`, `devops-engineer`) using the sequencing pipeline in [references/agent-coordination.md](references/agent-coordination.md).
3. Integrate and review agent code deliverables to ensure cross-module compatibility.

---

## Usage Example

```
User: "Make an Instagram clone with photo sharing and likes"

App Builder Process:
1. Project type: Social Media App
2. Tech stack: Next.js + Prisma + Cloudinary + Clerk
3. Create plan:
   ├─ Database schema (users, posts, likes, follows)
   ├─ API routes (12 endpoints)
   ├─ Pages (feed, profile, upload)
   └─ Components (PostCard, Feed, LikeButton)
4. Coordinate agents
5. Report progress
6. Start preview
```

---

## ❌ Anti-Patterns

**DON'T:**
- Make small, single-file edits to existing codebases.
- Mix different UI and CSS frameworks ad-hoc.
- Proceed without dynamic input validation in endpoints.
- Scaffolding custom file loaders where standard native platform support is available.

---

## ✅ Quality Audit Checklist

Before delivering the completed scaffolded application, verify the following:

- [ ] **Stack Conformance**: The project stack aligns with the 2026 default technologies from `references/tech-stack.md`.
- [ ] **Directory Scaffolding**: Folder hierarchy and boilerplate files follow conventions in `references/scaffolding.md`.
- [ ] **Template Completeness**: Boilerplate files and templates are fully configured and functional, containing no placeholders.
- [ ] **Configuration Verification**: Environment variables, TypeScript settings, and compiler directives are fully defined.
- [ ] **Pipeline Execution**: The coordination pipeline among specialized agents is complete, with all module handoffs resolved (see `references/agent-coordination.md`).
