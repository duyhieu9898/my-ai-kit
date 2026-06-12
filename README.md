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

| Target | Runtime Folder | Root Instruction |
|:---|:---|:---|
| `codex` | `.agents/` | `AGENTS.md` |
| `gemini` | `.agents/` | `GEMINI.md` |

`.agents/` chứa `skills/`, `scripts/`, các tài nguyên runtime, và marker `.kit-target`
ghi tên target đang cài. CLI **không** tự sửa `.gitignore` — bạn tự quản lý.

## Lệnh CLI

Thay `hieund-ai-kit` bằng `npx -y hieund-ai-kit` nếu chưa cài global.

| Lệnh | Mô tả |
|:---|:---|
| `init` | Cài codex (mặc định) vào repo hiện tại |
| `init --target gemini` | Cài gemini thay vì codex |
| `init --force` | Bỏ qua xác nhận, ghi đè toàn bộ |
| `init --path <dir>` | Cài vào thư mục chỉ định |
| `update` | Cập nhật `.agents/` cho target đang cài (tự nhận diện) |
| `update --target <name>` | Cập nhật target chỉ định (báo lỗi nếu khác target đang cài) |
| `status` | Kiểm tra target nào đang cài |

Khi chuyển target (ví dụ đang codex, chạy `init --target gemini`), CLI sẽ xóa
root instruction cũ (`AGENTS.md`), xóa `.agents/`, rồi cài target mới — có hỏi
xác nhận trừ khi dùng `--force`.

> **Lưu ý:** `--gemini` vẫn dùng được nhưng đã deprecated; nó được map sang
> `--target gemini` kèm cảnh báo.

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
        ├── ARCHITECTURE.md
        ├── agents/
        ├── rules/
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

## Kiểm Tra

Kiểm tra CLI (trong repo `my-ai-kit`):

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
