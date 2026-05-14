# 🚀 Hieund AG Kit

> **Custom AI Agent Capability Expansion Toolkit** - Bộ công cụ tối ưu hóa năng lực cho AI Agent với các skill, rule và workflow cá nhân hóa.

---

## 📋 Giới thiệu

**Hieund AG Kit** là phiên bản tùy chỉnh của Antigravity Kit, được thiết kế để giúp AI Agent của bạn thông minh hơn, làm việc có quy trình và hiểu sâu về các công nghệ bạn đang sử dụng.

Bộ công cụ bao gồm:
- **Skills**: Các module kiến thức chuyên sâu (React, Node.js, Database, Testing, UI/UX...).
- **Rules**: Các quy tắc và ràng buộc định hướng hành vi của Agent.
- **Workflows**: Quy trình từng bước cho các tác vụ phức tạp.

---

## 📦 Cài đặt

### 1. Cài đặt cục bộ (Dành cho máy hiện tại)

Để sử dụng lệnh `hieund-ag-kit` ở bất kỳ đâu trên máy tính của bạn:

```bash
cd /home/hieund/Documents/hieund-ag-kit-cli
npm link
```

### 2. Khởi tạo trong dự án mới

Sau khi đã link, bạn chỉ cần di chuyển đến thư mục dự án mới và chạy:

```bash
hieund-ag-kit init
```

Lệnh này sẽ tự động tải bộ cấu hình `.agent` từ GitHub [duyhieu9898/my-antigravity-kit](https://github.com/duyhieu9898/my-antigravity-kit) về dự án của bạn.

---

## 🛠️ Lệnh CLI

| Lệnh | Mô tả |
|---------|-------------|
| `hieund-ag-kit init` | Cài đặt thư mục `.agent` vào dự án hiện tại |
| `hieund-ag-kit update` | Cập nhật `.agent` lên phiên bản mới nhất từ GitHub |
| `hieund-ag-kit status` | Kiểm tra tình trạng cài đặt |

---

## 🤝 Tùy chỉnh (Personalization)

Để thêm skill hoặc rule mới cho bộ kit của bạn:

1.  Chỉnh sửa trong thư mục `templates/.agent/` của repo này.
2.  Push thay đổi lên GitHub:
    ```bash
    git add .
    git commit -m "Add new custom skill"
    git push origin main
    ```
3.  Sử dụng lệnh `update` ở các dự án đã cài đặt để cập nhật cấu hình mới nhất.

---

## 📄 License

MIT License

---

<p align="center">
  Made with ❤️ by <b>Hieu Nguyen Duy</b>
</p>
