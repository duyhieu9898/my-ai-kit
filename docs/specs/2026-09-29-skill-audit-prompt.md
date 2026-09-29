# Prompt: Nghiên cứu nên bỏ skill nào và viết lại ra sao

> Dán nguyên phần dưới đây vào một phiên mới, mở tại thư mục repo
> `hieund-ai-kit-cli`.

---

Tôi cần bạn nghiên cứu bộ skill của repo này để quyết định **giữ, gộp, bỏ, hay
viết lại** từng skill, và đề xuất **chuẩn viết skill** mới cho kit. Đây là giai
đoạn **nghiên cứu và đề xuất**: chưa sửa, xóa hay viết lại skill nào cho tới khi
tôi duyệt báo cáo.

## Bối cảnh (đã xong, không cần làm lại)

- Kiến trúc phân phối skill vừa được tái cấu trúc. Đọc
  `docs/specs/2026-09-29-skill-distribution-design.md` và
  `docs/decisions/0015-single-skill-source-and-manifest-installer.md`.
- Chỉ còn **một nguồn skill**: `templates/.agents/skills/<name>/` (43 skill).
  Codex và Gemini/Antigravity đọc `.agents/skills/`; Claude Code đọc qua symlink
  `.claude/skills/<name>`. Không còn bản riêng cho Gemini.
- `templates/kit.json` khai báo profile; profile `starter` hiện chỉ là mẫu.
- Mỗi skill hiện có `SKILL.md` (frontmatter `name`, `description`,
  `allowed-tools`), `agents/openai.yaml` (sidecar của Codex), và tùy skill có
  `references/`, `scripts/`, `assets/`.
- 14 skill dạng "persona" được chuyển từ agent Gemini sang (debugger,
  backend-specialist, frontend-specialist, database-architect, devops-engineer,
  documentation-writer, explorer-agent, code-archaeologist,
  performance-optimizer, product-manager, project-planner,
  qa-automation-engineer, security-auditor, seo-specialist, test-engineer).
- Các chuẩn cũ nằm ở `docs/skills/` (CODEX_SKILL_STANDARD.md,
  ANTIGRAVITY_SKILL_STANDARD.md, ANTIGRAVITY_CODEX_SKILL_CONVERSION.md); chúng
  viết cho thời còn hai bản skill và có thể đã lỗi thời.

## Quan sát của tôi (dùng làm giả thuyết, cần kiểm chứng)

- Số skill quá nhiều. `description` của **mọi** skill đã cài đều được nạp vào
  context của agent, nên skill thừa vừa tốn token vừa làm agent chọn nhầm skill.
- Model hiện nay mạnh hơn nhiều so với lúc viết các skill này. Skill chỉ nhắc lại
  "best practice" chung chung mà model đã biết thì có thể không còn giá trị.
- Gemini khá "lười": chỉ đọc skill gần nhất, không theo routing phức tạp. Codex
  dùng skill chuẩn nhất. Claude Code tôi chưa dùng với bộ này nhiều.
- Nhiều skill chồng chéo, ví dụ:
  - debugger ↔ (quy trình debug nói chung)
  - frontend-specialist ↔ frontend-design ↔ web-design-guidelines ↔ tailwind-patterns
  - test-engineer ↔ qa-automation-engineer ↔ testing-patterns ↔ tdd-workflow ↔ webapp-testing ↔ playwright-pitfalls ↔ playwright-pro-patterns
  - seo-specialist ↔ seo-fundamentals
  - performance-optimizer ↔ performance-profiling
  - database-architect ↔ database-design
  - backend-specialist ↔ api-patterns ↔ nodejs-best-practices
  - project-planner ↔ plan-writing ↔ brainstorming
  - code-review-checklist ↔ code-review-graph
  - clean-code ↔ simplify-code
  - explorer-agent ↔ code-archaeologist

## Việc cần làm

1. **Kiểm kê.** Với từng skill, ghi lại:
   - số dòng
   - chất lượng `description` (có nói rõ *khi nào* dùng và *khi nào không* không)
   - có script/reference/asset không; script có chạy được không (chạy thử script
     ở chế độ an toàn hoặc với `--help` nếu có)
   - nội dung là kiến thức chung model đã biết, hay là thứ model *không* tự biết
     (quy ước riêng của tôi, quy trình, script, cạm bẫy thực tế)
2. **Nghiên cứu chuẩn hiện hành.** Tra tài liệu mới nhất (dùng context7 hoặc
   web) về cách viết skill cho:
   - Claude Code (skills, frontmatter được hỗ trợ, progressive disclosure)
   - OpenAI Codex (skills, `agents/openai.yaml`)
   - Google Antigravity/Gemini
   - Chuẩn mở Agent Skills nếu có
   Tìm phần giao nhau để **một `SKILL.md` chạy tốt trên cả ba**. Nêu rõ trường
   nào chỉ một tool hiểu (ví dụ `allowed-tools`), và có nên giữ `openai.yaml`
   không. Nếu có skill `superpowers:writing-skills` hoặc `skill-creator`, dùng
   hướng dẫn của chúng làm tham chiếu.
3. **Đánh giá từng skill** và xếp vào một trong các nhóm:
   - **Giữ** (đã tốt, chỉ sửa nhỏ)
   - **Viết lại** (giữ mục đích, nội dung cần làm lại)
   - **Gộp vào X** (nêu rõ gộp vào skill nào)
   - **Bỏ** (model đã biết, hoặc trùng lặp, hoặc không dùng)
   Mỗi quyết định kèm một câu lý do có dẫn chứng (file, dòng, hoặc tài liệu).
4. **Hỏi tôi** trước khi chốt: skill nào tôi thực sự hay dùng, stack tôi làm
   hằng ngày. Đừng đoán thói quen dùng của tôi. Hỏi từng câu một, ưu tiên câu
   hỏi trắc nghiệm.
5. **Đề xuất profile** cho `templates/kit.json` (ví dụ `core`, `web`,
   `backend`, `testing`), mỗi profile nhỏ gọn, dựa trên câu trả lời của tôi.
6. **Đề xuất chuẩn viết skill** của kit (thay cho 3 file trong `docs/skills/`):
   cấu trúc thư mục, frontmatter, cách viết `description`, giới hạn độ dài,
   khi nào tách `references/`, khi nào cần `scripts/`, cách viết để model mạnh
   dùng tốt (ngắn, nêu điều model không tự biết, không giảng lại kiến thức
   chung).
7. **Chọn 2–3 skill làm mẫu** và phác thảo bản viết lại (chỉ trong báo cáo,
   chưa ghi đè file) để tôi thấy chuẩn mới trông ra sao.

## Kết quả cần giao

Một báo cáo tại `docs/specs/<ngày>-skill-audit.md` gồm:

- bảng kiểm kê
- bảng quyết định (skill → nhóm → lý do)
- danh sách gộp (skill nguồn → skill đích)
- đề xuất profile
- chuẩn viết skill
- 2–3 bản viết lại mẫu
- kế hoạch thực hiện theo từng đợt nhỏ, mỗi đợt có thể review riêng

Trình bày báo cáo cho tôi duyệt. **Chưa** xóa, sửa skill hay sửa `kit.json`.

## Ràng buộc

- Không đổi cơ chế cài đặt (`bin/`, `lib/`); nếu thấy cần, ghi thành đề xuất.
- Giữ nguyên Harness (`docs/HARNESS*.md`, `scripts/bin/harness-cli`).
- Tên skill phải trùng tên thư mục. Bỏ hoặc đổi tên skill là thay đổi phá vỡ với
  project đang dùng; ghi rõ ảnh hưởng. Cơ chế hiện tại xử lý skill bị xóa ở
  phía kit bằng cách cảnh báo rồi bỏ khỏi lựa chọn.
- Khi cần thử skill trên project thật, dùng chế độ link:
  `node bin/index.js install --path <project> --source . --link --profile <p>`.
- Trả lời bằng tiếng Việt; tên kỹ thuật giữ nguyên.
