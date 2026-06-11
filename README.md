# Hieund AI Kit CLI

CLI cài đặt bộ skill và rule cho AI coding agents vào repository hiện tại.

Mặc định CLI cài bộ OpenAI Codex. Có thể cài bộ Gemini Antigravity bằng `--gemini`.

## Cài Đặt Nhanh

Không cần cài global — dùng `npx` (khuyến nghị):

Codex mặc định:

```bash
npx -y hieund-ai-kit init
```

Gemini Antigravity:

```bash
npx -y hieund-ai-kit init --gemini
```

Hoặc trỏ thẳng repo GitHub:

```bash
npx -y github:duyhieu9898/my-ai-kit init
npx -y github:duyhieu9898/my-ai-kit init --gemini
```

> **Lưu ý:** Lệnh `hieund-ai-kit init` (không có `npx`) chỉ chạy được sau khi bạn `npm link` hoặc `npm install -g` trong repo CLI. Nếu terminal báo `command not found`, dùng các lệnh `npx` ở trên.

Kết quả cài đặt:

| Mode | Runtime Folder | Root Instruction |
|:---|:---|:---|
| Codex | `.agents/` | `AGENTS.md` |
| Gemini Antigravity | `.agents/` | `GEMINI.md` |

`.agents/` chứa `skills/`, `scripts/`, và các tài nguyên runtime cần thiết. Folder này được thêm vào `.gitignore`.

## Lệnh CLI

Thay `hieund-ai-kit` bằng `npx -y hieund-ai-kit` nếu chưa cài global.

| Lệnh | Mô tả |
|:---|:---|
| `init` | Cài Codex kit vào repo hiện tại |
| `init --gemini` | Cài Gemini Antigravity kit vào repo hiện tại |
| `init --force` | Ghi đè `.agents/` và root instruction nếu đã tồn tại |
| `init --path <dir>` | Cài vào thư mục chỉ định |
| `update` | Cập nhật Codex kit trong `.agents/` |
| `update --gemini` | Cập nhật Gemini Antigravity kit trong `.agents/` |
| `status` | Kiểm tra trạng thái cài đặt |

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

```text
templates/
├── .codex/          # Source template cho Codex
└── .antigravity/    # Source template cho Gemini Antigravity
```

Khi cài vào project, cả hai source template đều được copy ra `.agents/`.

Codex template:

```text
.agents/
├── skills/
├── scripts/
├── .shared/
└── ARCHITECTURE.md
AGENTS.md
```

Gemini Antigravity template:

```text
.agents/
├── agents/
├── skills/
├── workflows/
├── scripts/
├── rules/
└── ARCHITECTURE.md
GEMINI.md
```

## Phát Triển Skill

Codex skills:

```text
templates/.codex/skills/<skill-name>/SKILL.md
templates/.codex/skills/<skill-name>/agents/openai.yaml
templates/.codex/skills/<skill-name>/references/
templates/.codex/skills/<skill-name>/scripts/
```

Gemini Antigravity skills:

```text
templates/.antigravity/skills/<skill-name>/SKILL.md
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
