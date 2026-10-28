# Hieund AI Kit CLI

CLI cài đặt bộ skill và rule cho AI coding agents vào repository hiện tại.

CLI cài runtime và rule cho các agent bạn chọn (Codex, Gemini Antigravity,
Claude Code) vào cùng một repository; mỗi agent chỉ nhận phần của nó.

## Cài Đặt Nhanh

Không cần cài global — dùng `npx` (khuyến nghị):

Claude Code + Codex (mặc định):

```bash
npx -y hieund-ai-kit init
```

Chọn agent khác, hoặc thêm agent vào project đã cài:

```bash
npx -y hieund-ai-kit init --agent claude,codex,gemini
npx -y hieund-ai-kit install --agent gemini
```

Hoặc trỏ thẳng repo GitHub:

```bash
npx -y github:duyhieu9898/my-ai-kit init
```

> **Lưu ý:** Lệnh `hieund-ai-kit init` (không có `npx`) chỉ chạy được sau khi bạn `npm link` hoặc `npm install -g` trong repo CLI. Nếu terminal báo `command not found`, dùng các lệnh `npx` ở trên.

Mỗi agent được khai báo trong `templates/agents/<agent>.json`; project chỉ
nhận file của các agent đã chọn:

| Tool | Skills | Integration Config | Root Instruction |
|:---|:---|:---|:---|
| Codex | `.agents/skills/` | `.codex/hooks.json` + `.codex/hooks/` | `AGENTS.md` |
| Gemini Antigravity | `.agents/skills/` | `.agents/hooks.json` + `.agents/gemini/hooks/` | `GEMINI.md` |
| Claude Code | `.claude/skills/<name>` → `../../.agents/skills/<name>` | `.claude/settings.json` | `CLAUDE.md` |

`.agents/` chứa `skills/`, `scripts/`, `ARCHITECTURE.md` (agent nào cũng
nhận), và các phần tích hợp của agent đã chọn. CLI **không** tự sửa `.gitignore` — bạn tự quản lý.

`.agents/skills/` chứa mọi skill kit cài: Codex và Antigravity đọc trực tiếp
([docs Antigravity](https://antigravity.google/docs/skills/)), Claude Code chỉ
symlink các skill dùng chung. 9 skill chỉ dành cho Gemini (đánh dấu *) lo các
việc Claude Code và Codex đã tự làm tốt (review code, khám phá codebase, debug,
lint, deploy, MCP server, viết tài liệu, clean code, verify), nên chỉ được cài
khi project chọn agent `gemini`. Project chọn cả Codex lẫn Gemini thì Codex cũng
thấy các skill này, vì hai tool dùng chung `.agents/skills/`.
Với Codex, `.codex/hooks.json` được merge với hooks hiện có thay vì thay thế
toàn bộ cấu hình `.codex/`. Codex sẽ yêu cầu review/trust hook mới hoặc hook đã
thay đổi trước khi chạy.

Với Gemini Antigravity, `.agents/hooks.json` và các script hook tùy chỉnh hiện
có được giữ lại khi `init` hoặc `update`; kit chỉ thay entry
`hieund-ai-kit-harness-guard` do nó quản lý.

Với Claude Code, `.claude/settings.json` được merge với settings hiện có; kit
chỉ thay các hook group trỏ tới `.agents/claude/hooks/claude_adapter.py`.

## Backlog MCP Cục Bộ

MCP server Backlog được tách thành project riêng tại `../hieund-backlog-mcp/`
(cùng cấp với repo này). Server này không nằm trong package npm và không được
copy vào project khi chạy `init` hoặc `update`.

Để kết nối với Claude Code, Codex, Claude Desktop hoặc client MCP khác, xem
[`../hieund-backlog-mcp/README.md`](../hieund-backlog-mcp/README.md). Với Claude
Code, server được đăng ký ở scope `user` và dùng `CLAUDE_PROJECT_DIR` để nhận
diện workspace đang hoạt động.

## Lệnh CLI

Thay `hieund-ai-kit` bằng `npx -y hieund-ai-kit` nếu chưa cài global.

| Lệnh | Mô tả |
|:---|:---|
| `install` | Cài tất cả skill, hooks, và root instructions cho Claude Code + Codex (alias: `init`) |
| `install --agent a,b` | Thêm agent (`claude`, `codex`, `gemini`) cùng file và skill của nó |
| `install --profile a,b` | Thêm skill theo profile khai báo trong `templates/kit.json` |
| `install <skill...>` | Thêm từng skill (skill chỉ dành cho Gemini cần agent `gemini`) |
| `remove <skill...>` | Bỏ skill khỏi lựa chọn và khỏi project |
| `remove --agent a` | Gỡ agent: block `KIT`, hook, file chưa sửa, và skill chỉ dành cho nó |
| `update` | Cập nhật skill do kit quản lý, hooks, và block `KIT` |
| `list` | Liệt kê skill và profile có sẵn |
| `status` | Kiểm tra trạng thái (không cần mạng) |

Tùy chọn chung: `--path <dir>`, `--ref <ref>`, `--source <dir>`, `--link`,
`--dry-run`, `--force`.

> **Ghim phiên bản:** Mặc định CLI tải từ nhánh chính của repo. Để tái lập và
> giảm rủi ro supply-chain, ghim theo git ref bằng `--ref`:
>
> ```bash
> npx -y hieund-ai-kit install --ref v4.0.0
> npx -y hieund-ai-kit update --ref <commit-sha>
> ```

Ví dụ trong thư mục project:

```bash
npx -y hieund-ai-kit install
npx -y hieund-ai-kit status
```

## Profile

Kit có 23 skill: 14 skill dùng chung và 9 skill chỉ dành cho Gemini (đánh
dấu *, chỉ được cài khi project chọn agent `gemini`). Cài theo profile để agent chỉ thấy các skill cần cho project;
description của mọi skill đã cài đều được nạp vào context, nên cài thừa vừa tốn
token vừa dễ làm agent chọn nhầm skill.

| Profile | Skill |
|:---|:---|
| `core` | `clean-code`*, `verify-changes`*, `debugger`*, `explorer-agent`*, `lint-and-validate`*, `code-review-checklist`*, `security-auditor`, `ambiguity-decisions`, `structural-refactor` |
| `main` | `frontend-design`, `web-design-guidelines`, `react-refactor-patterns`, `performance-profiling`, `risk-based-testing`, `webapp-testing` |
| `backend` | `backend-specialist`, `api-patterns`, `database-design` |
| `growth` | `seo-fundamentals`, `performance-profiling`, `i18n-localization` |
| `starter` | Toàn bộ skill của `core`, `main` và `backend` (12 skill; 18 khi có agent `gemini`) |

Ví dụ:

```bash
# Fullstack Next.js + Node (12 skill; 18 khi có agent gemini)
npx -y hieund-ai-kit install --profile core,main,backend
# Landing page / marketing (11 skill; 17 khi có agent gemini)
npx -y hieund-ai-kit install --profile core,main,growth
# MCP server (8 skill; 15 khi thêm agent gemini và mcp-builder)
npx -y hieund-ai-kit install --profile core,backend risk-based-testing webapp-testing
# mcp-builder* cần agent gemini: install --agent gemini mcp-builder
```

`devops-engineer`*, `mcp-builder`* và `documentation-writer`* không thuộc
profile nào; cài bằng tên khi đã có agent `gemini`, ví dụ `install devops-engineer`.

`install` không kèm profile hay tên skill sẽ cài toàn bộ 14 skill dùng chung;
thêm agent `gemini` thì cài đủ 23 skill.

## Nâng Cấp Từ 4.x

Bản 5.0 tinh giản skill cho Claude Code và Codex. Chạy `update` bằng CLI 5.x
(CLI 4.x sẽ báo cần nâng cấp vì `kit.json` lên `formatVersion` 2):

| Skill | Thay đổi |
|:---|:---|
| `code-review-checklist`, `explorer-agent`, `debugger`, `lint-and-validate`, `devops-engineer`, `mcp-builder`, `documentation-writer`, `clean-code`, `verify-changes` | Thành skill chỉ dành cho Gemini: symlink Claude bị gỡ. Project 4.x được giữ đủ 3 agent nên skill vẫn còn; không dùng Gemini thì chạy `remove --agent gemini` |
| `plan-writing`, `project-planner`, `product-manager` | Bỏ hẳn; dùng plan mode có sẵn của tool |
| `architecture` | Bỏ hẳn; profile `planning` cũng bị bỏ |
| `testing-patterns` | Thay bằng `risk-based-testing` (dùng chung cho Claude, Codex, Gemini); `test_runner.py` chuyển sang `.agents/skills/risk-based-testing/scripts/` |
| `nextjs-react-expert` | Gộp vào `performance-profiling` (rule Next.js/React nằm trong `references/`) |

Bản bị sửa cục bộ trong `.agents/skills/` được giữ lại (kèm cảnh báo) cho tới khi
chạy `update --force`. Project 4.x chưa lưu agent nên lần `update` đầu tiên chọn
cả `claude`, `codex`, `gemini` (đúng như những gì 4.x đã cài); gỡ agent không dùng
bằng `remove --agent <tên>`.

## Nâng Cấp Từ 3.x

Bản 4.0 gộp 43 skill thành 26. `update` tự gỡ các skill đã bỏ (kèm cảnh báo);
bản bị sửa cục bộ thì được giữ lại. Nội dung của skill cũ nằm ở:

| Skill cũ | Nay nằm trong |
|:---|:---|
| `test-engineer`, `tdd-workflow` | `testing-patterns` (từ 5.0 là `risk-based-testing`) |
| `qa-automation-engineer`, `playwright-pitfalls`, `playwright-pro-patterns` | `webapp-testing` |
| `frontend-specialist`, `tailwind-patterns` | `frontend-design` |
| `seo-specialist` | `seo-fundamentals` |
| `performance-optimizer` | `performance-profiling` |
| `nodejs-best-practices` | `backend-specialist` |
| `database-architect` | `database-design` |
| `simplify-code` | `clean-code` |
| `code-archaeologist` | `explorer-agent` |
| `python-patterns`, `app-builder`, `code-review-graph`, `brainstorming` | Bỏ, không có skill thay thế |

## Phát Triển Skill Với `--link`

Khi sửa skill trên máy này, link project vào checkout của kit để thấy thay đổi
ngay mà không cần push hay cài lại:

```bash
hieund-ai-kit install --path ~/code/my-project --source ~/code/hieund-ai-kit-cli --link --profile starter
```

Thêm/xóa skill hoặc sửa profile thì chạy `update`. Quay lại bản copy từ GitHub:
`hieund-ai-kit update --ref main`.

Skill trong `.agents/skills/` không có trong `managedSkills` của `.ai-kit.json`
là skill của project; kit không bao giờ sửa hay xóa chúng.

## Cài Đặt Local Để Phát Triển

Clone repo CLI, link binary vào PATH:

```bash
git clone https://github.com/duyhieu9898/my-ai-kit.git
cd my-ai-kit   # hoặc thư mục clone của bạn
npm install
npm link
```

Kiểm tra:

```bash
hieund-ai-kit --help
```

Sau `npm link`, chạy trực tiếp (không cần `npx`):

```bash
cd /path/to/your-project
hieund-ai-kit init
hieund-ai-kit init --path /path/to/other-project
hieund-ai-kit status
```

## Cấu Trúc Template

`templates/` là layout generated được installer copy/merge vào project. CLI
không compose skill trong lúc cài; các bản generated phải được commit sẵn.

```text
templates/
├── kit.json                 # Registry: formatVersion + profiles
├── agents/
│   ├── shared.json          # File agent nào cũng nhận (scripts, ARCHITECTURE.md, ux_audit.json)
│   ├── claude.json          # File, hook, root instruction, symlink skill của Claude Code
│   ├── codex.json           # ... của Codex
│   └── gemini.json          # ... của Gemini, và exclusiveSkills (skill chỉ dành cho Gemini)
├── skills/<skill-name>/     # Mọi skill → project/.agents/skills/
├── instructions/            # AGENTS.md, CLAUDE.md, GEMINI.md → root của project
├── hooks/                   # Đăng ký hook theo định dạng từng tool + guard/adapter (một bản)
├── rules/                   # Rule Antigravity (testing-workflow.md) → project/.agents/rules/
├── scripts/                 # → project/.agents/scripts/
├── ARCHITECTURE.md
└── ux_audit.json
```

## Phát Triển Skill

Mọi skill nằm ở `templates/skills/`; cả Codex, Gemini Antigravity, và Claude
Code đều đọc (Claude Code qua symlink `.claude/skills/<name>`). Skill chỉ dành
cho Gemini là skill có tên trong `exclusiveSkills` của
`templates/agents/gemini.json`. Skill dùng chung chỉ được trỏ `(use <skill>)`
tới skill dùng chung khác, vì skill Gemini thường không được cài.

```text
templates/skills/<skill-name>/SKILL.md
templates/skills/<skill-name>/agents/openai.yaml
templates/skills/<skill-name>/references/
templates/skills/<skill-name>/scripts/
```

Skill đang viết hoặc thử nghiệm nằm ở [`skills-dev/`](skills-dev/README.md):
installer không đọc và npm không đóng gói thư mục này, nên chúng không được
cài vào project nào.

Viết và review skill theo [`docs/skills/SKILL_STANDARD.md`](docs/skills/SKILL_STANDARD.md)
và [`docs/skills/DESCRIPTION_GUIDE.md`](docs/skills/DESCRIPTION_GUIDE.md).
`npm run check:templates` fail khi skill vi phạm chuẩn; dùng
`node scripts/check-template-consistency.mjs --lenient` để chỉ in cảnh báo trong
lúc đang sửa.

Sau khi sửa template, push lên `main`; các project khác có thể cập nhật bằng:

```bash
npx -y hieund-ai-kit update
```

`update` cập nhật skill do kit quản lý (bỏ qua skill đã sửa cục bộ trừ khi
dùng `--force`), merge cấu hình `.codex/`, `.agents/hooks.json`, và
`.claude/settings.json` do kit quản lý, block `KIT` trong root instructions,
đồng thời giữ nguyên phần còn lại của root instructions và mọi skill của
project.

Harness lifecycle guard dùng chung có source chính tại `shared/hooks/`; mỗi
tool giữ một adapter nhỏ cho payload/output native:

```bash
npm run sync:shared-hooks
npm run check:shared-hooks
npm run test:hooks
```

Installer vẫn copy thẳng template đã sinh; không compose file trong lúc cài.

## Kiểm Tra

Kiểm tra CLI (trong repo `my-ai-kit`):

```bash
npm run verify
```

Hoặc chạy từng kiểm tra hẹp hơn:

```bash
node --check bin/index.js
node bin/index.js --help
```

Kiểm tra kit đã cài trong project:

```bash
npx -y hieund-ai-kit status
```

Chạy kiểm tra runtime sau khi cài:

```bash
python3 .agents/scripts/checklist.py .
python3 .agents/scripts/verify_all.py . --url http://localhost:3000
```

## Ghi Chú

Repository: `https://github.com/duyhieu9898/my-ai-kit`

License: MIT
