# SPEC: Multi-Target Registry

> Refactor CLI từ boolean `--gemini` sang target registry pattern.
> Mỗi project chỉ cài 1 tool. Init lại = xóa sạch + cài mới.

## Context

- Entry point: `bin/index.js`
- Current: `getFolderConfig(isGemini)` switch giữa 2 target hardcoded
- Templates: `templates/.codex/`, `templates/.antigravity/`, `templates/root/`
- Stack: Node.js ESM, Commander, Giget, Chalk, Ora

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | `--target <name>` thay `--gemini` flag | Scale cho nhiều tool |
| D2 | Template mirror structure | Copy thẳng, không transform |
| D3 | Convention-based root instruction | Top-level file = root instruction, no manifest |
| D4 | Auto-cleanup khi switch target | Không để file instruction cũ conflict |
| D5 | `update` auto-detect target đang cài | User không cần nhớ target nào đang active |
| D6 | CLI không sửa `.gitignore` | User tự quản lý |
| D7 | Breaking change: đổi tên template folders | Không giữ backward compat cho folder cũ |
| D8 | Marker file `.agents/.kit-target` ghi target đang cài | Detection chính xác, tránh nhầm file root do user tự viết |
| D9 | `GEMINI.md` move hẳn ra root, bỏ bản `.agents/rules/` | Single source, tránh trùng lặp |

## Target Registry

```javascript
const TARGET_REGISTRY = {
  codex: {
    displayName: 'OpenAI Codex Kit',
    bannerColor: chalk.magentaBright,
    tagLine: '✨ Codex Standard (Recommended)',
    description: 'Unified composable skills & cascading rules',
    templateDir: 'codex',
  },
  gemini: {
    displayName: 'Gemini Antigravity Kit',
    bannerColor: chalk.blueBright,
    tagLine: '🚀 Gemini Framework',
    description: 'Multi-agent routing & slash workflows',
    templateDir: 'gemini',
  },
};
```

## Target Detection (marker-based)

CLI ghi 1 marker file `.agents/.kit-target` (nội dung = tên target, ví dụ `codex`) khi cài.
`detectInstalledTarget` đọc marker này thay vì đoán qua tên file root.

```
.agents/.kit-target   → "codex" | "gemini"
```

- Có marker → đọc target từ đó (chính xác)
- Không có marker nhưng có `.agents/` → coi như install cũ/không xác định, fallback null
- Tránh nhầm với `AGENTS.md` ở root do user/Harness tự viết (không phải CLI cài)

## Template Structure (After Migration)

```
templates/
├── codex/
│   ├── AGENTS.md            ← root instruction (top-level file)
│   └── .agents/             ← install folder
│       ├── .kit-target      ← marker, nội dung: "codex"
│       ├── AGENTS.md
│       ├── ARCHITECTURE.md
│       ├── .shared/
│       ├── scripts/
│       └── skills/
└── gemini/
    ├── GEMINI.md            ← root instruction (top-level file)
    └── .agents/             ← install folder
        ├── .kit-target      ← marker, nội dung: "gemini"
        ├── ARCHITECTURE.md
        ├── agents/
        ├── rules/           ← KHÔNG còn GEMINI.md (đã move ra root)
        ├── scripts/
        ├── skills/
        └── workflows/
```

## Implementation Steps

### Step 1: Migrate template folders

**What:** Restructure `templates/` to mirror layout.

| Action | From | To |
|--------|------|----|
| Move | `templates/.codex/` | `templates/codex/.agents/` |
| Move | `templates/root/AGENTS.md` | `templates/codex/AGENTS.md` |
| Move | `templates/.antigravity/` | `templates/gemini/.agents/` |
| Move | `templates/.antigravity/rules/GEMINI.md` | `templates/gemini/GEMINI.md` (move hẳn, xóa bản trong rules/) |
| Create | `templates/codex/.agents/.kit-target` | nội dung: `codex` |
| Create | `templates/gemini/.agents/.kit-target` | nội dung: `gemini` |
| Delete | `templates/root/` | (empty after move) |

**Verify:** `ls templates/codex/AGENTS.md templates/codex/.agents/skills templates/gemini/GEMINI.md templates/gemini/.agents/skills` và xác nhận `templates/gemini/.agents/rules/GEMINI.md` KHÔNG còn tồn tại.

---

### Step 2: Implement TARGET_REGISTRY + helper functions

**What:** Replace `getFolderConfig(isGemini)` trong `bin/index.js`.

**New functions:**

```javascript
// Lookup target config, exit on unknown
function getTargetConfig(targetName) { ... }

// Get root instruction file names from template top-level
function getRootInstructionFiles(templatePath) { ... }

// Detect installed target by reading .agents/.kit-target marker
function detectInstalledTarget(projectDir) { ... }  // returns target name | null

// Copy template → project (mirror), writes .kit-target marker
function mirrorCopy(templatePath, destDir, { overwriteRootInstruction }) { ... }

// Delete old target's root instruction files
function cleanupOldTarget(projectDir, oldTargetName) { ... }
```

**Detection logic:**
```javascript
function detectInstalledTarget(projectDir) {
  const markerPath = path.join(projectDir, '.agents', '.kit-target');
  if (!fs.existsSync(markerPath)) return null;
  const target = fs.readFileSync(markerPath, 'utf-8').trim();
  return TARGET_REGISTRY[target] ? target : null;
}
```

**Remove:** `getFolderConfig()`, `copyTemplateFolder()`, `copyRootInstruction()`, `updateGitignore()`

**Verify:** `node --check bin/index.js`

---

### Step 3: Rewrite `initCommand`

**Flow:**
1. Parse `--target` (default: `codex`)
2. Handle deprecated `--gemini` → warn + map to `--target gemini`
3. `getTargetConfig(target)`
4. `detectInstalledTarget(projectDir)`
5. Conflict check:
   - Same target installed → prompt "overwrite?" (skip if `--force`)
   - Different target → prompt "switch A→B?" (skip if `--force`)
   - Root instruction collision → prompt (skip if `--force`)
   - No install → proceed
6. If confirmed:
   - `cleanupOldTarget()` if switching
   - Download repo via giget
   - `mirrorCopy(templatePath, projectDir, { overwriteRootInstruction: true })`
   - Cleanup temp
7. Display success

**Verify:** `node bin/index.js init --help` shows `--target` option

---

### Step 4: Rewrite `updateCommand`

**Flow:**
1. Parse `--target` (optional)
2. If no `--target`: `detectInstalledTarget(projectDir)`
   - None found → error "run init first"
3. If `--target` provided: detect installed, check mismatch
   - Mismatch → error "use init --target <name>"
4. Download + `mirrorCopy(templatePath, projectDir, { overwriteRootInstruction: false })`
5. Display success

**Verify:** `node bin/index.js update --help` shows `--target` option

---

### Step 5: Rewrite `statusCommand`

**Flow:**
1. `detectInstalledTarget(projectDir)`
2. If found → display target name, description, file stats
3. If not → "no target installed", suggest init

**Verify:** Run `node bin/index.js status` in a test directory

---

### Step 6: Update CLI option definitions

**Changes to Commander setup:**
- Remove `--gemini` / `-g` from `init` and `update`
- Add `--target <name>` / `-t` to `init` and `update`
- Keep `--force`, `--path`, `--branch` unchanged
- Remove `--gemini` from `status` (không cần)

---

### Step 7: Update docs

- `README.md`: new commands, examples, template structure
- `docs/ARCHITECTURE.md`: new registry pattern, installation boundaries
- `package.json`: verify `files` field includes `templates/codex/` and `templates/gemini/`

---

### Step 8: Validation

```bash
# Syntax check
node --check bin/index.js

# Help output
node bin/index.js --help
node bin/index.js init --help
node bin/index.js update --help

# Dry run init (in temp dir)
mkdir /tmp/test-project && cd /tmp/test-project
node /path/to/bin/index.js init
node /path/to/bin/index.js status
node /path/to/bin/index.js init --target gemini --force
node /path/to/bin/index.js status
node /path/to/bin/index.js update

# Package check
npm pack --dry-run --json | jq '.[0].files[].path' | grep templates
```

## Conflict Matrix

| Scenario | Behavior |
|----------|----------|
| `init` same target | Prompt → overwrite all |
| `init` different target | Prompt → cleanup old + install new |
| `init --force` | Skip prompt, overwrite |
| `update` same target | Overwrite `.agents/`, keep root instruction |
| `update` different target | ERROR → suggest `init --target` |
| `update` no target installed | ERROR → suggest `init` |
| Root file collision (not from CLI) | Prompt → overwrite |

## Error Handling

| Error | Exit Code | Message |
|-------|-----------|---------|
| Unknown target | 1 | `Unknown target: "x". Valid: codex, gemini` |
| Template dir missing | 1 | `Template not found: templates/x/` |
| Network failure | 1 | Download error + cleanup temp |
| Update no install | 1 | `No target installed. Run: init` |
| Update mismatch | 1 | `Installed: codex. Use: init --target gemini` |
| User declines | 0 | `Operation cancelled.` |
| Deprecated --gemini | warn | `⚠️ --gemini is deprecated. Use --target gemini` |

## Out of Scope

- Claude Code target (future — chỉ cần thêm 1 entry + 1 folder)
- `.gitignore` management
- Skill selection (cài full bộ)
- Multi-target parallel install
