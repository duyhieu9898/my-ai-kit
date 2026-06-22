---
trigger: always_on
---

# GEMINI.md - AG Kit

> Tệp cấu hình quy định hành vi và quy trình làm việc của AI trong workspace này.

---

## 🚀 GIAO THỨC PHÁT TRIỂN (DEVELOPMENT PROTOCOL)

> **BẮT BUỘC:** AI phải đọc file Agent chuyên gia tương ứng và các Skill của nó trước khi lập trình. Nguyên tắc ưu tiên: P0 (GEMINI.md) > P1 (Agent .md) > P2 (SKILL.md).

1. **Modular Skill Loading:** Đọc file `SKILL.md` (chỉ mục) đầu tiên, sau đó chỉ đọc các phần cụ thể liên quan trực tiếp đến tác vụ.
2. **Đọc -> Hiểu -> Áp dụng:** Xác định rõ mục tiêu của Agent/Skill, các nguyên tắc bắt buộc, và điểm khác biệt của giải pháp trước khi bắt tay viết code.
3. **Giao thức nhân cách:** AI tự động chọn Agent phù hợp nhất và thông báo trước phản hồi:
   ```markdown
   🤖 **Applying knowledge of `@[agent-name]`...**
   ```
   *(Masters: `project-planner`, `security-auditor`, `backend-specialist`, `frontend-specialist`, `debugger`)*

---

## 📥 PHÂN LOẠI YÊU CẦU & CHẾ ĐỘ (REQUEST CLASSIFIER)

Phân loại yêu cầu của người dùng trước khi thực hiện để chọn đúng chế độ hoạt động:

| Loại yêu cầu | Từ khóa kích hoạt | Chế độ & Kết quả |
| :--- | :--- | :--- |
| **HỎI ĐÁP** | "what is", "how does", "explain" | Chế độ `ask`: Trả lời văn bản trực tiếp. |
| **KHẢO SÁT** | "analyze", "list files", "overview" | Chế độ `ask`/`plan`: Khảo sát hệ thống, không chỉnh sửa file. |
| **SỬA ĐƠN GIẢN** | "fix", "add", "change" (1 file) | Chế độ `edit`: Sửa đổi trực tiếp (Inline Edit). |
| **TÁC VỤ PHỨC TẠP** | "build", "create", "implement", "refactor" | Chế độ `plan` rồi sang `edit`: **Bắt buộc tạo `{task-slug}.md`** |
| **THIẾT KẾ / UI** | "design", "UI", "page", "dashboard" | Chế độ `plan` rồi sang `edit`: **Bắt buộc tạo `{task-slug}.md`** |

> 🔴 **Quy tắc Chế độ:**
> *   **Plan Mode:** Khảo sát ngữ cảnh, đề xuất kiến trúc và viết kế hoạch cài đặt vào `docs/PLAN-{task-slug}.md`. Không sửa đổi code sản phẩm khi đang lên kế hoạch.
> *   **Edit Mode:** Sau khi người dùng duyệt kế hoạch, tạo/cập nhật `task.md` để theo dõi tiến độ và tiến hành sửa đổi.

---

## 🛑 SOCRATIC GATE (HỎI ĐỂ LÀM RÕ)

**Không tự ý đoán mò.** Nếu có bất kỳ điểm nào chưa rõ hoặc tác vụ phức tạp, AI bắt buộc phải hỏi làm rõ trước khi sử dụng công cụ hoặc viết code:
*   **Tính năng mới / Build lớn:** Hỏi ít nhất 3 câu hỏi chiến lược (Mục đích, Đối tượng dùng, Phạm vi).
*   **Sửa lỗi / Code Edit:** Xác nhận lại cách hiểu lỗi và hỏi về mức độ ảnh hưởng (impact).
*   **Proceed trực tiếp:** Nếu người dùng yêu cầu làm luôn, chỉ hỏi 1-2 câu hỏi về trường hợp biên (Edge Case) hoặc rủi ro tiềm ẩn nếu thấy cần thiết.

---

## 🧹 NGUYÊN TẮC PHÁT TRIỂN CHUNG (UNIVERSAL RULES)

*   **Ngôn ngữ (Language):** Phản hồi bằng ngôn ngữ của người dùng (tiếng Việt). Code định danh, biến, bình luận (comments) giữ nguyên tiếng Anh.
*   **Clean Code:** Áp dụng `@[skills/clean-code]`. Viết mã nguồn ngắn gọn, tối giản trừu tượng hóa, tránh suy diễn thiết kế.
*   **File Dependency:** Trước khi sửa file, kiểm tra `.agents/ARCHITECTURE.md` để tìm các file phụ thuộc và cập nhật đồng thời.
*   **System Map:** Đọc `ARCHITECTURE.md` khi bắt đầu phiên làm việc để nắm cấu trúc Agents, Skills, và Scripts.

---

## 🏁 GIAO THỨC KIỂM THỬ (TESTING & VERIFY)

**Chạy các lệnh kiểm thử tỷ lệ thuận với thay đổi thực hiện.** Không tuyên bố thành công khi chưa chạy test kiểm chứng.

### 1. Phân cấp xác thực (Proof Ladder)
*   **Tài liệu (Docs):** Chạy `git diff --check`.
*   **Mã nguồn (Code):** Chạy linter, type check, hoặc test tương ứng với file sửa đổi.
*   **Bộ cài đặt (Installer/Toolkit):** Chạy test-installer.mjs, test-hooks, và check-template-consistency.mjs.

### 2. Thứ tự ưu tiên chạy Checklist (Khi có yêu cầu kiểm tra cuối cùng)
Chạy lệnh kiểm tra dự án: `python3 .agents/scripts/checklist.py .` theo thứ tự ưu tiên:
$$\text{Security} \rightarrow \text{Lint} \rightarrow \text{Schema} \rightarrow \text{Tests} \rightarrow \text{UX} \rightarrow \text{Seo} \rightarrow \text{E2E}$$

---

## 📁 THAM CHIẾU NHANH (QUICK REFERENCE)

*   **Các Scripts kiểm tra chính:**
    *   *Verify toàn bộ:* `.agents/scripts/verify_all.py`
    *   *Security Scan:* `.agents/skills/vulnerability-scanner/scripts/security_scan.py`
    *   *Linter:* `.agents/skills/lint-and-validate/scripts/lint_runner.py`
    *   *Unit Tests:* `.agents/skills/testing-patterns/scripts/test_runner.py`
*   **Thiết kế UI/UX:** Đọc luật tại `.agents/agents/frontend-specialist.md` (Purple Ban: cấm dùng màu tím/violet; Template Ban: cấm thiết kế layout đại trà, lỗi thời).
