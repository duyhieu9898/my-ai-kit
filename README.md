# Hieund AI Kit CLI

CLI cài đặt bộ skill và rule cho AI coding agents vào repository hiện tại.

CLI cài đồng thời runtime và rule cho Codex, Gemini Antigravity, và Claude
Code vào cùng một repository.

## Cài Đặt Nhanh

Không cần cài global — dùng `npx` (khuyến nghị):

Codex + Gemini + Claude Code:

```bash
npx -y hieund-ai-kit init
```

Hoặc trỏ thẳng repo GitHub:

```bash
npx -y github:duyhieu9898/my-ai-kit init
```

> **Lưu ý:** Lệnh `hieund-ai-kit init` (không có `npx`) chỉ chạy được sau khi bạn `npm link` hoặc `npm install -g` trong repo CLI. Nếu terminal báo `command not found`, dùng các lệnh `npx` ở trên.

Kết quả cài đặt:

| Tool | Runtime Folder | Integration Config | Root Instruction |
|:---|:---|:---|:---|
| Codex | `.agents/skills/` | `.codex/hooks.json` | `AGENTS.md` |
| Gemini Antigravity | `.agents/gemini/` | `.agents/hooks.json` | `GEMINI.md` |
| Claude Code | `.agents/claude/` | `.claude/settings.json` | `CLAUDE.md` |

`.agents/` chứa `skills/`, `scripts/`, các tài nguyên runtime dùng chung, và
các phần tích hợp theo tool. CLI **không** tự sửa `.gitignore` — bạn tự quản lý.
Với Codex, `.codex/hooks.json` được merge với hooks hiện có thay vì thay thế
toàn bộ cấu hình `.codex/`. Codex sẽ yêu cầu review/trust hook mới hoặc hook đã
thay đổi trước khi chạy.

Với Gemini Antigravity, `.agents/hooks.json` và các script hook tùy chỉnh hiện
có được giữ lại khi `init` hoặc `update`; kit chỉ thay entry
`hieund-ai-kit-harness-guard` do nó quản lý.

Với Claude Code, `.claude/settings.json` được merge với settings hiện có; kit
chỉ thay các hook group trỏ tới `.agents/claude/hooks/claude_adapter.py`.

## Backlog MCP Cục Bộ

Repository có một MCP server độc lập tại `backlog-mcp/` để dùng chung Backlog
trên workstation. Server này không nằm trong package npm và không được copy vào
project khi chạy `init` hoặc `update`.

Để kết nối với Claude Code, Codex, Claude Desktop hoặc client MCP khác, clone
repository vào một đường dẫn ổn định rồi làm theo
[`backlog-mcp/README.md`](backlog-mcp/README.md). Với Claude Code, server được
đăng ký ở scope `user` và dùng `CLAUDE_PROJECT_DIR` để nhận diện workspace đang
hoạt động.

## Lệnh CLI

Thay `hieund-ai-kit` bằng `npx -y hieund-ai-kit` nếu chưa cài global.

| Lệnh | Mô tả |
|:---|:---|
| `init` | Cài Codex, Gemini, và Claude Code vào repo hiện tại |
| `init --force` | Bỏ qua xác nhận, ghi đè toàn bộ |
| `init --path <dir>` | Cài vào thư mục chỉ định |
| `init --ref <tag\|commit>` | Ghim phiên bản theo git ref (tag, commit, branch) |
| `update` | Cập nhật `.agents/`, hooks/settings, giữ root instructions hiện có |
| `status` | Kiểm tra trạng thái cài đặt |

> **Ghim phiên bản:** Mặc định CLI tải từ nhánh chính của repo. Để tái lập và
> giảm rủi ro supply-chain, ghim theo git ref bằng `--ref`:
>
> ```bash
> npx -y hieund-ai-kit init --ref v2.0.0
> npx -y hieund-ai-kit update --ref <commit-sha>
> ```
>
> `--ref` ưu tiên hơn `--branch` nếu cả hai cùng có.

Ví dụ trong thư mục project:

```bash
npx -y hieund-ai-kit init
npx -y hieund-ai-kit status
```

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
├── AGENTS.md                # Codex root instruction → project/AGENTS.md
├── GEMINI.md                # Gemini root instruction → project/GEMINI.md
├── CLAUDE.md                # Claude Code root instruction → project/CLAUDE.md
├── .codex/                  # Codex hooks → merge vào project/.codex/
├── .claude/                 # Claude settings → merge vào project/.claude/
└── .agents/                 # Shared install folder → project/.agents/
    ├── ARCHITECTURE.md
    ├── .shared/
    ├── scripts/
    ├── skills/              # Codex/open Agent Skills runtime
    ├── gemini/              # Gemini agents/skills/workflows/hooks
    └── claude/              # Claude hook adapter/runtime files
```

## Phát Triển Skill

Codex/Claude reusable skills:

```text
templates/.agents/skills/<skill-name>/SKILL.md
templates/.agents/skills/<skill-name>/agents/openai.yaml
templates/.agents/skills/<skill-name>/references/
templates/.agents/skills/<skill-name>/scripts/
```

Gemini Antigravity skills:

```text
templates/.agents/gemini/skills/<skill-name>/SKILL.md
```

Sau khi sửa template, push lên `main`; các project khác có thể cập nhật bằng:

```bash
npx -y hieund-ai-kit update
```

`update` refresh `.agents/`, merge cấu hình `.codex/`, `.agents/hooks.json`,
và `.claude/settings.json` do kit quản lý, đồng thời giữ nguyên root
instructions hiện có.

Toàn bộ executable scripts dùng chung giữa các runtime, cùng runtime Backlog,
có source chính tại `shared/runtime/`. Chỉ sửa bản shared rồi đồng bộ các bản
template:

```bash
npm run sync:shared-runtime
npm run check:shared-runtime
```

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
