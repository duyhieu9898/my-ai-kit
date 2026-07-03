# Hieund AI Kit CLI

CLI cài đặt bộ skill và rule cho AI coding agents vào repository hiện tại.

CLI chọn tool qua option `--target <name>`. Mặc định là `codex`. Hỗ trợ hiện tại: `codex`, `gemini`.

Mỗi project chỉ cài 1 target tại một thời điểm. `init` lại sẽ xóa target cũ và cài target mới.

## Cài Đặt Nhanh

Không cần cài global — dùng `npx` (khuyến nghị):

Codex (mặc định):

```bash
npx -y hieund-ai-kit init
```

Gemini Antigravity:

```bash
npx -y hieund-ai-kit init --target gemini
```

Hoặc trỏ thẳng repo GitHub:

```bash
npx -y github:duyhieu9898/my-ai-kit init
npx -y github:duyhieu9898/my-ai-kit init --target gemini
```

> **Lưu ý:** Lệnh `hieund-ai-kit init` (không có `npx`) chỉ chạy được sau khi bạn `npm link` hoặc `npm install -g` trong repo CLI. Nếu terminal báo `command not found`, dùng các lệnh `npx` ở trên.

Kết quả cài đặt:

| Target | Runtime Folder | Integration Config | Root Instruction |
|:---|:---|:---|:---|
| `codex` | `.agents/` | `.codex/` hooks | `AGENTS.md` |
| `gemini` | `.agents/` | `.agents/hooks.json` | `GEMINI.md` |

`.agents/` chứa `skills/`, `scripts/`, các tài nguyên runtime, và marker `.kit-target`
ghi tên target đang cài. CLI **không** tự sửa `.gitignore` — bạn tự quản lý.
Với Codex, `.codex/hooks.json` được merge với hooks hiện có thay vì thay thế
toàn bộ cấu hình `.codex/`. Codex sẽ yêu cầu review/trust hook mới hoặc hook đã
thay đổi trước khi chạy.

Với Gemini Antigravity, `.agents/hooks.json` và các script hook tùy chỉnh hiện
có được giữ lại khi `init` hoặc `update`; kit chỉ thay entry
`hieund-ai-kit-harness-guard` do nó quản lý.

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
| `init` | Cài codex (mặc định) vào repo hiện tại |
| `init --target gemini` | Cài gemini thay vì codex |
| `init --force` | Bỏ qua xác nhận, ghi đè toàn bộ |
| `init --path <dir>` | Cài vào thư mục chỉ định |
| `init --ref <tag\|commit>` | Ghim phiên bản theo git ref (tag, commit, branch) |
| `update` | Cập nhật `.agents/` cho target đang cài (tự nhận diện) |
| `update --target <name>` | Cập nhật target chỉ định (báo lỗi nếu khác target đang cài) |
| `status` | Kiểm tra target nào đang cài |

Khi chuyển target (ví dụ đang codex, chạy `init --target gemini`), CLI sẽ xóa
root instruction cũ (`AGENTS.md`), xóa `.agents/`, rồi cài target mới — có hỏi
xác nhận trừ khi dùng `--force`.

> **Lưu ý:** `--gemini` vẫn dùng được nhưng đã deprecated; nó được map sang
> `--target gemini` kèm cảnh báo.

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

Mỗi target là một folder **mirror** đúng cấu trúc sẽ copy vào project. CLI chỉ
việc copy thẳng, không transform.

```text
templates/
├── codex/
│   ├── AGENTS.md            # Root instruction → copy ra project root
│   ├── .codex/              # Codex hooks → merge vào project/.codex/
│   │   ├── hooks.json
│   │   └── hooks/
│   │       └── harness_guard.py
│   └── .agents/             # Install folder → copy vào project/.agents/
│       ├── .kit-target      # Marker, nội dung: "codex"
│       ├── AGENTS.md
│       ├── ARCHITECTURE.md
│       ├── .shared/
│       ├── scripts/
│       └── skills/
└── gemini/
    ├── GEMINI.md            # Root instruction → copy ra project root
    └── .agents/             # Install folder → copy vào project/.agents/
        ├── .kit-target      # Marker, nội dung: "gemini"
        ├── hooks.json       # Antigravity lifecycle hooks → merge theo entry
        ├── hooks/
        │   ├── harness_guard.py
        │   └── gemini_adapter.py
        ├── ARCHITECTURE.md
        ├── agents/
        ├── scripts/
        ├── skills/
        └── workflows/
```

Thêm target mới (ví dụ `claude`): thêm 1 entry vào `TARGET_REGISTRY` trong
`bin/index.js` và tạo folder `templates/claude/` theo đúng cấu trúc mirror.

## Phát Triển Skill

Codex skills:

```text
templates/codex/.agents/skills/<skill-name>/SKILL.md
templates/codex/.agents/skills/<skill-name>/agents/openai.yaml
templates/codex/.agents/skills/<skill-name>/references/
templates/codex/.agents/skills/<skill-name>/scripts/
```

Gemini Antigravity skills:

```text
templates/gemini/.agents/skills/<skill-name>/SKILL.md
```

Sau khi sửa template, push lên `main`; các project khác có thể cập nhật bằng:

```bash
npx -y hieund-ai-kit update
```

`update` thay thế `.agents/`, merge cấu hình `.codex/` do kit quản lý, và giữ
nguyên root instruction hiện có.

Toàn bộ executable scripts dùng chung giữa Codex và Gemini, cùng runtime
Backlog, có source chính tại `shared/runtime/`. Chỉ sửa bản shared rồi đồng bộ
các bản template:

```bash
npm run sync:shared-runtime
npm run check:shared-runtime
```

Harness lifecycle guard dùng chung có source chính tại `shared/hooks/`; mỗi
target giữ một adapter nhỏ cho payload/output native:

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
