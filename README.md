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

| Tool | Skills | Integration Config | Root Instruction |
|:---|:---|:---|:---|
| Codex | `.agents/skills/` | `.codex/hooks.json` + `.codex/hooks/` | `AGENTS.md` |
| Gemini Antigravity | `.agents/skills/` | `.agents/hooks.json` + `.agents/gemini/hooks/` | `GEMINI.md` |
| Claude Code | `.claude/skills/<name>` → `../../.agents/skills/<name>` | `.claude/settings.json` | `CLAUDE.md` |

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
| `install` | Cài tất cả skill, hooks, và root instructions (alias: `init`) |
| `install --profile a,b` | Thêm skill theo profile khai báo trong `templates/kit.json` |
| `install <skill...>` | Thêm từng skill |
| `remove <skill...>` | Bỏ skill khỏi lựa chọn và khỏi project |
| `update` | Cập nhật skill do kit quản lý, hooks, và block `KIT` |
| `list` | Liệt kê skill và profile có sẵn |
| `status` | Kiểm tra trạng thái (không cần mạng) |

Tùy chọn chung: `--path <dir>`, `--ref <ref>`, `--source <dir>`, `--link`,
`--dry-run`, `--force`.

> **Ghim phiên bản:** Mặc định CLI tải từ nhánh chính của repo. Để tái lập và
> giảm rủi ro supply-chain, ghim theo git ref bằng `--ref`:
>
> ```bash
> npx -y hieund-ai-kit install --ref v3.0.0
> npx -y hieund-ai-kit update --ref <commit-sha>
> ```

Ví dụ trong thư mục project:

```bash
npx -y hieund-ai-kit install
npx -y hieund-ai-kit status
```

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
├── AGENTS.md                # Codex root instruction → project/AGENTS.md
├── GEMINI.md                # Gemini root instruction → project/GEMINI.md
├── CLAUDE.md                # Claude Code root instruction → project/CLAUDE.md
├── kit.json                 # Registry: formatVersion + profiles
├── .codex/                  # Codex hooks → merge vào project/.codex/
├── .claude/                 # Claude settings → merge vào project/.claude/
└── .agents/                 # Shared install folder → project/.agents/
    ├── ARCHITECTURE.md
    ├── scripts/
    ├── skills/<skill-name>/ # Skill nguồn duy nhất, Codex + Antigravity đọc trực tiếp
    ├── claude/hooks/         # Claude hook adapter/runtime files
    └── gemini/hooks/         # Gemini hook adapter/runtime files
```

## Phát Triển Skill

Một skill có một nguồn duy nhất; cả Codex, Gemini Antigravity, và Claude Code
đều đọc từ đây (Claude Code qua symlink `.claude/skills/<name>`):

```text
templates/.agents/skills/<skill-name>/SKILL.md
templates/.agents/skills/<skill-name>/agents/openai.yaml
templates/.agents/skills/<skill-name>/references/
templates/.agents/skills/<skill-name>/scripts/
```

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
