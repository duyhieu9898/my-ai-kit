# ⚡ Hieund AI & Codex Kit CLI

> **Bộ công cụ tối ưu hóa năng lực tối tân dành cho AI Agent & OpenAI Codex** - Tự động hóa việc cài đặt các skill, quy tắc (rules) và bộ nhớ ngữ cảnh để AI của bạn đạt hiệu suất vượt trội.

---

## 📋 Giới thiệu

**Hieund AI & Codex Kit CLI** là công cụ dòng lệnh (CLI) tùy chỉnh giúp bạn dễ dàng khởi tạo môi trường mở rộng năng lực cho AI Agent trực tiếp trong dự án của mình. Bộ công cụ hỗ trợ hai kiến trúc tiên tiến nhất hiện nay:

1. **✨ OpenAI Codex Standard (`.agents` - Mặc định/Khuyên dùng):** 
   * Kiến trúc **Composable Skills** hợp nhất toàn bộ Agent Persona và Domain Knowledge thành 66 Kỹ năng độc lập.
   * Kích hoạt động (Implicit Invocation) giúp tiết kiệm đến 90% token.
   * Cài `AGENTS.md` ở thư mục gốc và cài skills/scripts vào `.agents/`.
2. **🚀 Antigravity Framework (`.agents` - qua `--legacy`):** 
   * Phù hợp với các dự án cũ sử dụng 20 Agent chuyên gia riêng biệt và 14 quy trình lệnh gạch chéo `/command` (Slash workflows).
   * Source template nội bộ nằm ở `templates/.antigravity/`, khi cài ra repo vẫn dùng `.agents/`.

---

## 📦 Cài đặt nhanh qua `npx` (Không cần cài đặt trước)

Bạn có thể chạy trực tiếp bộ cài đặt của mình từ GitHub vào bất kỳ dự án mới nào mà không cần cài đặt CLI toàn cục vào máy tính:

### 1. Cài đặt OpenAI Codex thế hệ mới (Mặc định)
```bash
npx -y github:duyhieu9898/my-antigravity-kit init
```

### 2. Cài đặt Antigravity cũ (Legacy)
```bash
npx -y github:duyhieu9898/my-antigravity-kit init --legacy
```

---

## 💻 Cài đặt cục bộ (Dành cho nhà phát triển Kit)

Nếu bạn muốn chỉnh sửa mã nguồn CLI hoặc chạy kiểm thử trực tiếp từ thư mục phát triển hiện tại:

### Bước 1: Liên kết CLI với máy tính
```bash
cd /home/hieund/Documents/hieund-ai-kit-cli
npm link
```

### Bước 2: Chạy trực tiếp từ bất kỳ thư mục dự án nào
```bash
# Khởi tạo Codex mới
hieund-ai-kit init

# Khởi tạo Antigravity cũ
hieund-ai-kit init --legacy
```

---

## 🛠️ Danh sách các câu lệnh CLI

| Lệnh CLI | Tham số / Flags | Mô tả |
| :--- | :--- | :--- |
| `hieund-ai-kit init` | *Không có* | Cài đặt cấu hình Codex vào `.agents/` và `AGENTS.md` ở root dự án. |
| | `--legacy` (hoặc `-l`) | Cài đặt cấu hình Antigravity vào `.agents/` và `GEMINI.md` ở root dự án. |
| | `--force` (hoặc `-f`) | Buộc ghi đè nếu thư mục đích đã tồn tại. |
| | `--path <dir>` (hoặc `-p`)| Chỉ định đường dẫn thư mục dự án mục tiêu. |
| `hieund-ai-kit update`| *Không có* | Cập nhật cấu hình Codex trong `.agents/` lên phiên bản mới nhất từ GitHub. |
| | `--legacy` (hoặc `-l`) | Cập nhật cấu hình Antigravity trong `.agents/` lên bản mới nhất. |
| `hieund-ai-kit status`| *Không có* | Kiểm tra song song tình trạng cài đặt của cả bản Codex và Antigravity trong dự án. |

---

## 🤝 Tùy chỉnh & Nâng cấp Kỹ năng (Personalization)

Để mở rộng hoặc chỉnh sửa năng lực của bộ kit:

1. **Thêm/Sửa Skill cho Codex:** Chỉnh sửa hoặc thêm mới các thư mục kỹ năng trong `templates/.codex/skills/`.
2. **Thêm/Sửa Skill cho Antigravity:** Chỉnh sửa trong `templates/.antigravity/skills/`.
3. **Đẩy cấu hình mới lên GitHub:**
   ```bash
   git add .
   git commit -m "feat: add advanced nextjs performance patterns to codex"
   git push origin main
   ```
4. **Cập nhật ở các dự án:** Di chuyển đến thư mục dự án của bạn và chạy `hieund-ai-kit update` để đồng bộ các cập nhật mới nhất!

---

## 📄 License

MIT License

---

<p align="center">
  Made with ❤️ by <b>Hieu Nguyen Duy</b>
</p>
