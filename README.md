# Hieund AI Kit CLI

CLI cài đặt bộ skill và rule cho AI coding agents vào repository hiện tại.

Mặc định CLI cài bộ OpenAI Codex. Có thể cài bộ Gemini Antigravity bằng `--gemini`.

## Cài Đặt Nhanh

Codex mặc định:

```bash
npx -y github:duyhieu9898/my-ai-kit init
```

Gemini Antigravity:

```bash
npx -y github:duyhieu9898/my-ai-kit init --gemini
```

Kết quả cài đặt:

| Mode | Runtime Folder | Root Instruction |
|:---|:---|:---|
| Codex | `.agents/` | `AGENTS.md` |
| Gemini Antigravity | `.agents/` | `GEMINI.md` |

`.agents/` chứa `skills/`, `scripts/`, và các tài nguyên runtime cần thiết. Folder này được thêm vào `.gitignore`.

## Lệnh CLI

| Lệnh | Mô tả |
|:---|:---|
| `hieund-ai-kit init` | Cài Codex kit vào repo hiện tại |
| `hieund-ai-kit init --gemini` | Cài Gemini Antigravity kit vào repo hiện tại |
| `hieund-ai-kit init --force` | Ghi đè `.agents/` và root instruction nếu đã tồn tại |
| `hieund-ai-kit init --path <dir>` | Cài vào thư mục chỉ định |
| `hieund-ai-kit update` | Cập nhật Codex kit trong `.agents/` |
| `hieund-ai-kit update --gemini` | Cập nhật Gemini Antigravity kit trong `.agents/` |
| `hieund-ai-kit status` | Kiểm tra trạng thái cài đặt |

## Cài Đặt Local Để Phát Triển

```bash
cd /home/hieund/Documents/hieund-ai-kit-cli
npm install
npm link
```

Sau đó có thể chạy:

```bash
hieund-ai-kit init --path /path/to/project
hieund-ai-kit status --path /path/to/project
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
hieund-ai-kit update
```

## Kiểm Tra

Kiểm tra CLI:

```bash
node --check bin/index.js
node bin/index.js --help
```

Kiểm tra kit đã cài trong project:

```bash
hieund-ai-kit status
```

Chạy kiểm tra runtime sau khi cài:

```bash
python .agents/scripts/checklist.py .
python .agents/scripts/verify_all.py . --url http://localhost:3000
```

## Ghi Chú

Repository: `https://github.com/duyhieu9898/my-ai-kit`

License: MIT
