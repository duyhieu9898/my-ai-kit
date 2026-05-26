---
name: game-development
description: >-
  Use when designing, architecture-planning, or implementing 2D/3D games across PC, mobile, web, or VR/AR.
  Game development orchestrator covering loops, design patterns, input abstractions, and platform routing.
  NOT for standard business non-game applications.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Game Development

> **Orchestrator skill** that provides core principles and routes to specialized sub-skills.

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Game implementation specialist | [`game-developer`](../game-developer/SKILL.md) |
| Designing interactive game frontends | [`frontend-design`](../frontend-design/SKILL.md) |
| Profiling canvas framerates and memory | [`performance-optimizer`](../performance-optimizer/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with designing game architectures, optimizing game loops, or planning asset pipelines, strictly follow this step-by-step procedure:

### Step 1: Plan Platform Adaptation
1. Query client targets and read the platform sub-skill (`references/web-games.md`, `references/mobile-games.md`, `references/pc-games.md`).
2. Identify safe UI areas and viewport ratios.

### Step 2: Establish Spatial Dimensions
1. Select 2D sprite hierarchies (`references/2d-games.md`) or 3D mesh rendering pipelines (`references/3d-games.md`).
2. Choose matching coordinate spaces.

### Step 3: Implement Game Loop fixed ticks
1. Code game loops to run core logic/physics updates on a fixed timestep.
2. Allow rendering frame execution at variable speeds using visual interpolations.

### Step 4: Abstract Key Bindings
1. Map physical keys or taps onto abstract action objects (e.g. Action: "jump").
2. Build support for gamepad or mobile touch buttons overlays.

### Step 5: Budget Frame Budgets & Verify Checklist
1. Optimize graphics render layers using batched draw calls and object pooling.
2. Confirm compliance against the **Quality Audit Checklist** before completing.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| [references/web-games.md](references/web-games.md) | HTML5, WebGL, Phaser, and custom canvas engine principles | Developing games targeting web browsers |
| [references/mobile-games.md](references/mobile-games.md) | Touch inputs, screen orientation, safe areas, and native performance | Developing games targeting iOS or Android devices |
| [references/pc-games.md](references/pc-games.md) | Steam API integration, window resizing, keyboard/mouse controls, and optimization | Developing games targeting desktop and PC platforms |
| [references/vr-ar.md](references/vr-ar.md) | Comfort levels, locomotion, spatial UI, performance budgets, and device controls | Developing games targeting VR or AR headsets |
| [references/2d-games.md](references/2d-games.md) | Tilemaps, sprite sheets, collision boxes, layering, and parallax scrolling | Developing 2D-based games |
| [references/3d-games.md](references/3d-games.md) | Shaders, meshes, lighting, LOD, culling, and camera perspective math | Developing 3D-based games |
| [references/game-design.md](references/game-design.md) | Game Design Documents (GDD), core loops, progression, and player psychology | Planning gameplay, balancing, and game rules |
| [references/multiplayer.md](references/multiplayer.md) | Client-side prediction, server authoritative design, replication, and lag comp | Implementing multiplayer or networked games |
| [references/game-art.md](references/game-art.md) | Art style conventions, animation pipelines, atlas textures, and assets | Creating or integrating 2D sprites, 3D meshes, or animations |
| [references/game-audio.md](references/game-audio.md) | Sound design, background music loops, spatial audio, and adaptive audio channels | Integrating sound effects, music, or audio mixers |

---

## When to Use This Skill

You are working on a game development project. This skill teaches the PRINCIPLES of game development and directs you to the right sub-skill based on context.

---

## Sub-Skill Routing

### Platform Selection

| If the game targets... | Use Sub-Skill |
|------------------------|---------------|
| Web browsers (HTML5, WebGL) | `references/web-games.md` |
| Mobile (iOS, Android) | `references/mobile-games.md` |
| PC (Steam, Desktop) | `references/pc-games.md` |
| VR/AR headsets | `references/vr-ar.md` |

### Dimension Selection

| If the game is... | Use Sub-Skill |
|-------------------|---------------|
| 2D (sprites, tilemaps) | `references/2d-games.md` |
| 3D (meshes, shaders) | `references/3d-games.md` |

### Specialty Areas

| If you need... | Use Sub-Skill |
|----------------|---------------|
| GDD, balancing, player psychology | `references/game-design.md` |
| Multiplayer, networking | `references/multiplayer.md` |
| Visual style, asset pipeline, animation | `references/game-art.md` |
| Sound design, music, adaptive audio | `references/game-audio.md` |

---

## Core Principles (All Platforms)

### 1. The Game Loop

Every game, regardless of platform, follows this pattern:

```
INPUT  → Read player actions
UPDATE → Process game logic (fixed timestep)
RENDER → Draw the frame (interpolated)
```

**Fixed Timestep Rule:**
- Physics/logic: Fixed rate (e.g., 50Hz)
- Rendering: As fast as possible
- Interpolate between states for smooth visuals

---

### 2. Pattern Selection Matrix

| Pattern | Use When | Example |
|---------|----------|---------|
| **State Machine** | 3-5 discrete states | Player: Idle→Walk→Jump |
| **Object Pooling** | Frequent spawn/destroy | Bullets, particles |
| **Observer/Events** | Cross-system communication | Health→UI updates |
| **ECS** | Thousands of similar entities | RTS units, particles |
| **Command** | Undo, replay, networking | Input recording |
| **Behavior Tree** | Complex AI decisions | Enemy AI |

**Decision Rule:** Start with State Machine. Add ECS only when performance demands.

---

### 3. Input Abstraction

Abstract input into ACTIONS, not raw keys:

```
"jump"  → Space, Gamepad A, Touch tap
"move"  → WASD, Left stick, Virtual joystick
```

**Why:** Enables multi-platform, rebindable controls.

---

### 4. Performance Budget (60 FPS = 16.67ms)

| System | Budget |
|--------|--------|
| Input | 1ms |
| Physics | 3ms |
| AI | 2ms |
| Game Logic | 4ms |
| Rendering | 5ms |
| Buffer | 1.67ms |

**Optimization Priority:**
1. Algorithm (O(n²) → O(n log n))
2. Batching (reduce draw calls)
3. Pooling (avoid GC spikes)
4. LOD (detail by distance)
5. Culling (skip invisible)

---

### 5. AI Selection by Complexity

| AI Type | Complexity | Use When |
|---------|------------|----------|
| **FSM** | Simple | 3-5 states, predictable behavior |
| **Behavior Tree** | Medium | Modular, designer-friendly |
| **GOAP** | High | Emergent, planning-based |
| **Utility AI** | High | Scoring-based decisions |

---

### 6. Collision Strategy

| Type | Best For |
|------|----------|
| **AABB** | Rectangles, fast checks |
| **Circle** | Round objects, cheap |
| **Spatial Hash** | Many similar-sized objects |
| **Quadtree** | Large worlds, varying sizes |

---

## ❌ Anti-Patterns

| Don't | Do |
|-------|-----|
| Update everything every frame | Use events, dirty flags |
| Create objects in hot loops | Object pooling |
| Cache nothing | Cache references |
| Optimize without profiling | Profile first |
| Mix input with logic | Abstract input layer |

---

## ✅ Quality Audit Checklist

Before concluding a game prototype, asset engine integration, or graphics pipeline task, verify compliance with the following:

- [ ] **Timestep Logic Decoupled**: Confirmed physics updates run on a fixed timer while rendering frame updates run variable.
- [ ] **GC Spikes Avoided**: Ensured no object instantiations occur within fast loop updates (implemented object pooling for active entities).
- [ ] **Input Actions Abstracted**: Mapped raw touch or key inputs onto high-level logical Actions (jump, slide) for easy rebinds.
- [ ] **Render draw calls Batched**: Optimized canvas render calls using sprite sheets or texture atlases to reduce pipeline lag.
- [ ] **Frame Budget Kept (<16ms)**: Audited execution metrics to guarantee active frames process under target latency limits.
- [ ] **Profile-driven Tuning Done**: Profiled performance CPU bottlenecks before choosing algorithm changes or ECS rewrites.

---

## Routing Examples

### Example 1: "I want to make a browser-based 2D platformer"
→ Start with `references/web-games.md` for framework selection
→ Then `references/2d-games.md` for sprite/tilemap patterns
→ Reference `references/game-design.md` for level design

### Example 2: "Mobile puzzle game for iOS and Android"
→ Start with `references/mobile-games.md` for touch input and stores
→ Use `references/game-design.md` for puzzle balancing

### Example 3: "Multiplayer VR shooter"
→ `references/vr-ar.md` for comfort and immersion
→ `references/3d-games.md` for rendering
→ `references/multiplayer.md` for networking

---

> **Remember:** Great games come from iteration, not perfection. Prototype fast, then polish.
