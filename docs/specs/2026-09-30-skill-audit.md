# Báo cáo audit skill và chuẩn viết skill mới

Ngày: 2026-09-30. Trạng thái: **đã thực hiện** (đợt 0–6, bản 4.0.0). Kit còn 26
skill, tất cả qua `npm run check:templates` ở chế độ strict. Phần dưới giữ nguyên
nội dung đề xuất lúc duyệt; kết quả thực tế có vài điểm khác, ví dụ
`react_performance_checker.py` bị xóa thay vì sửa.

Phạm vi: 43 skill trong `templates/.agents/skills/`. Đường dẫn dòng (`file:dòng`)
tính từ thư mục skill, trừ khi ghi khác.

## 0. Tóm tắt

- **43 → 26 skill.** Giữ 12, viết lại 14. Gộp 14 skill vào skill khác, bỏ 3.
- Cả 4 giả thuyết trong prompt đều đúng:
  - Số skill quá nhiều.
  - 70–95% nội dung SKILL.md là kiến thức chung mà model mạnh đã biết.
  - 11 cụm skill chồng chéo, trong đó nhóm frontend **mâu thuẫn trực tiếp**
    với nhau ở 7 điểm.
  - Một số skill còn ép quy tắc trái với `CLAUDE.md`/`AGENTS.md`, ví dụ bắt
    buộc hỏi 3 câu trước khi làm.
- **Tìm thấy 7 script có lỗi**, có cái báo "thành công" mà không kiểm tra gì:
  `react_performance_checker.py` quét 0 file, `type_coverage.py` sai với
  Python, `accessibility_checker.py` luôn báo pass.
- **Chuẩn viết skill:** Claude Code, Codex, Gemini CLI và Antigravity đều đã
  theo chuẩn mở Agent Skills (agentskills.io). Đề xuất làm theo cách của Codex:
  `SKILL.md` chỉ giữ các trường trong chuẩn chung, còn chi tiết riêng của tool
  để ở file phụ `agents/openai.yaml`. Giữ `openai.yaml` nhưng sửa cho đúng
  chuẩn của Codex, và bỏ `allowed-tools`.
- Kế hoạch gồm 7 đợt nhỏ (mục 9), mỗi đợt review riêng được. Đợt 1 chỉ sửa
  script, không đổi tên skill nào.

### Câu trả lời của bạn (dùng làm căn cứ)

| Câu hỏi | Trả lời |
|---|---|
| Agent chính | Antigravity/Gemini, Claude Code, Codex (đã đính chính: có dùng Codex) |
| Stack hằng ngày | React / Next.js, Node.js backend |
| Test | Unit/integration và E2E Playwright |
| Mảng khác | SEO, i18n, DevOps/deploy, tự viết MCP server |
| Quy trình | Trên Claude Code dùng superpowers; skill quy trình của kit chủ yếu phục vụ Antigravity |
| Database | PostgreSQL/Supabase, MongoDB |
| Giao diện | Dùng thư viện component làm nền, rồi để agent chỉnh lại style; ít dùng Figma |
| Skill đã dùng | Không trả lời. Không suy đoán; quyết định dựa trên stack |

---

## 1. Bảng kiểm kê

Chú thích các cột:
- **Dòng:** số dòng của `SKILL.md`.
- **Refs:** tổng số dòng trong `references/`.
- **Desc:** điểm chất lượng `description`, từ 1 đến 5.
- **Chung:** ước lượng tỉ lệ nội dung model mạnh đã tự biết.

Chi tiết từng skill nằm trong ghi chú audit, tóm tắt ở mục 2.

| Skill | Dòng | Refs | Script | Desc | Chung |
|---|---:|---:|---|:-:|:-:|
| api-patterns | 124 | 426 | `api_validator.py` chạy được; bỏ sót `server.js` thường | 4 | 85% |
| app-builder | 141 | 1707 | — | 3 | 80% |
| architecture | 100 | 332 | — | 3 | 90% |
| backend-specialist | 290 | 0 | — | 2 | 90% |
| brainstorming | 210 | 350 | — | 2 | 85% |
| clean-code | 87 | 0 | — | 4 | 60% |
| code-archaeologist | 152 | 0 | — | 2 | 90% |
| code-review-checklist | 173 | 0 | — | 3 | 90% |
| code-review-graph | 377 | 0 | Cần CLI ngoài, chưa cài | 3 | 40% |
| database-architect | 254 | 0 | — | 2 | 90% |
| database-design | 95 | 252 | `schema_validator.py` chạy được, chỉ hỗ trợ Prisma | 2 | 85% |
| debugger | 264 | 0 | — | 3 | 90% |
| devops-engineer | 96 | 0 | — (`assets/` rỗng) | 5 | 60% |
| documentation-writer | 209 | 0 | — | 4 | 85% |
| explorer-agent | 129 | 0 | — | 2 | 90% |
| frontend-design | 433 | 3210 | `ux_audit.py` và `accessibility_checker.py` chạy nhưng **không bao giờ fail** | 3 | 80% |
| frontend-specialist | 655 | 0 | — | 2 | 70% (+20% có hại) |
| i18n-localization | 203 | 0 | `i18n_checker.py` chạy tốt, bắt được lỗi thật | 4 | 85% |
| lint-and-validate | 104 | 0 | `lint_runner.py` chạy được; `type_coverage.py` **sai với Python** | 2 | 75% |
| mcp-builder | 237 | 0 | — | 3 | 90% |
| nextjs-react-expert | 279 | 3295 | `react_performance_checker.py` **hỏng** (quét 0 file); `convert_rules.py` trỏ vào đường dẫn không còn | 3 | 70% (refs 40%) |
| nodejs-best-practices | 366 | 0 | — | 3 | 90% |
| performance-optimizer | 187 | 0 | — | 2 | 90% |
| performance-profiling | 210 | 0 | `lighthouse_audit.py`: `--help` chạy; chưa chạy thật vì cần mạng | 2 | 85% |
| plan-writing | 118 | 0 | — | 5 | 55% |
| playwright-pitfalls | 198 | 0 | — | 4 | 50% |
| playwright-pro-patterns | 127 | 0 | — | 4 | 50% |
| product-manager | 175 | 0 | — | 3 | 90% |
| project-planner | 156 | 0 | — | 5 | 55% |
| python-patterns | 483 | 0 | — | 3 | 90% |
| qa-automation-engineer | 180 | 0 | — | 3 | 85% |
| react-refactor-patterns | 308 | 0 | — | 4 | 40% |
| security-auditor | 207 | 121 | `security_scan.py` chạy; bỏ sót `os.system(input())` | 3 | 75% |
| seo-fundamentals | 210 | 0 | `seo_checker.py` chạy tốt, bắt được lỗi thật | 2 | 90% |
| seo-specialist | 143 | 0 | — | 3 | 90% |
| simplify-code | 172 | 0 | — | 3 | 85% |
| tailwind-patterns | 333 | 0 | — | 3 | 75% |
| tdd-workflow | 213 | 0 | — | 4 | 95% |
| test-engineer | 119 | 0 | — | 3 | 90% |
| testing-patterns | 248 | 0 | `test_runner.py` chạy được | 4 | 95% |
| verify-changes | 108 | 0 | — | 4 | 45% |
| web-design-guidelines | 116 | 0 | — | 4 | 40% |
| webapp-testing | 251 | 0 | `playwright_runner.py`: `--help` chạy; dùng `networkidle` | 2 | 85% |

### Vấn đề chung của nhiều skill

1. **Khung trang trí lặp lại.** Skill nào cũng có Content Map, Related Skills,
   Your Mindset và Quality Audit Checklist (25–40 dòng mỗi skill). Checklist
   phần lớn chỉ nhắc lại phần thân.
2. **Văn persona:**
   - "You are a Senior Frontend Architect" (`frontend-specialist:19`)
   - "cynical, destructive" (`qa-automation-engineer:18`)
   - "Elite cybersecurity expert", nằm ngay trong description của `security-auditor`
3. **Ép hỏi trái với `CLAUDE.md` mục "Clarify Minimally":**
   - `brainstorming:60-68`: bắt buộc 3 câu hỏi
   - `backend-specialist:55-68`: 6 chủ đề phải hỏi
   - `explorer-agent:96`: hỏi sau mỗi 20% khám phá
   - `app-builder/references/agent-coordination.md:63`
   - `templates/GEMINI.md:41` (SOCRATIC GATE)
4. **`allowed-tools` lệch hoặc thừa:**
   - 40/43 skill cấp `Write`/`Edit`/`Bash`, và Claude Code **tự duyệt trước**
     các tool này mà không kiểm tra workspace trust.
   - 4 skill bảo chạy lệnh nhưng lại không khai báo Bash hoặc WebFetch:
     i18n-localization, seo-fundamentals, playwright-pitfalls,
     web-design-guidelines.
5. **Mâu thuẫn về quy ước lưu file:**
   - File plan có 3 vị trí: `{task-slug}.md` ở gốc, `docs/PLAN-{slug}.md`, và `PLAN.md`.
   - ADR có 2 vị trí: `docs/architecture/` và `docs/adr/`.
6. **`--help` không in hướng dẫn.** Các script không dùng argparse coi
   `--help` là đường dẫn project.

### Script lỗi (sửa ở đợt 1)

| Script | Lỗi | Dẫn chứng |
|---|---|---|
| `nextjs-react-expert/scripts/react_performance_checker.py` | `rglob('*.{ts,tsx,js,jsx}')`: pathlib không mở rộng `{}`, nên quét 0 file mà vẫn in "[SUCCESS]" | dòng 25, 50, 76, 111, 135, 162 |
| `nextjs-react-expert/scripts/convert_rules.py` | Script chuyển đổi dùng một lần; đọc và ghi vào đường dẫn không còn tồn tại | dòng 189-190 |
| `lint-and-validate/scripts/type_coverage.py` | Hàm có type được đếm hai lần, bù trừ hàm không có type, nên báo 100% sai | dòng 149-150 |
| `frontend-design/scripts/accessibility_checker.py` | Tìm thấy 4 lỗi vẫn trả `"passed": true`, exit 0 | — |
| `frontend-design/scripts/ux_audit.py` | 13 cảnh báo vẫn PASS; khuyên thêm gradient, trái với chính skill (`frontend-design:305`) | — |
| `webapp-testing/scripts/playwright_runner.py` | Dùng `wait_until="networkidle"`, Playwright khuyên không dùng; thư mục ảnh vẫn tên `maestro_screenshots` | quanh dòng 55, 126 |
| `security-auditor/scripts/security_scan.py` | Bỏ sót `os.system(input())`; chỉ bắt `subprocess(..., shell=True)` | dòng 67 |

### Nội dung lỗi thời hoặc sai

- **`python-patterns:442`:** `AsyncClient(app=...)` đã bị gỡ khỏi httpx 0.28.
- **`mcp-builder:94-98`:**
  - Transport SSE đã được thay bằng Streamable HTTP.
  - WebSocket không phải transport chuẩn của MCP.
- **`backend-specialist`:**
  - Dòng 169 gợi ý Lucia, thư viện này đã deprecated.
  - Dòng 166 bảo cần cờ `--experimental-strip-types`; Node hiện tại đã strip type mặc định.
- **`tailwind-patterns:171-176`:** bảng dark mode dùng giá trị config của
  Tailwind v3; v4 dùng `@custom-variant`.
- **`seo-fundamentals:136`:** gợi ý FAQPage mà không nói Google đã giới hạn
  rich result loại này từ 2023.
- **`performance-profiling:45`:**
  - Nói script Lighthouse đo LCP/INP/CLS, nhưng script chỉ trả điểm từng hạng mục.
  - Lighthouse chạy lab nên không đo được INP.
- **`app-builder`:**
  - Ghi Nuxt 3, nhưng template đi kèm là Nuxt 4.
  - Dùng Node 23, bản đã EOL.
- **`react-refactor-patterns:222-230`:** ví dụ lưu token vào localStorage.
- **`playwright-pitfalls` §7:** kiểm tra popup bằng `count()`, không chờ nên
  dễ race. Playwright đã có `page.addLocatorHandler()` cho việc này.

---

## 2. Bảng quyết định

Nhóm: **Giữ** (sửa nhỏ), **Viết lại** (giữ mục đích, làm lại nội dung),
**Gộp → X**, **Bỏ**.

### Giữ (12)

| Skill | Lý do |
|---|---|
| clean-code | Mới viết lại, có thứ tự ưu tiên quy ước (`:19-28`) và "Heuristics, Not Quotas" (`:70-77`). Được `CLAUDE.md:48`, `AGENTS.md` và profile starter tham chiếu. Nhận thêm mục "giảm độ phức tạp" từ simplify-code |
| verify-changes | Mới viết lại, có bảng bằng chứng tương xứng (`:43-49`) và tích hợp Harness. Chỉ cần ghi rõ đường dẫn `docs/HARNESS.md` và `docs/TEST_MATRIX.md` |
| devops-engineer | Description tốt nhất bộ; có ranh giới "git push không phải deploy" (`:27`, `:81-96`). Bạn có làm DevOps. Xóa `assets/` rỗng |
| plan-writing | Mới viết lại, ranh giới rõ với project-planner (`:15-23`). Cần chốt đường dẫn plan |
| project-planner | Mới viết lại, không phụ thuộc stack, cấm tham chiếu skill chưa cài (`:23-24`). Được kiểm tra bởi `check-template-consistency.mjs` |
| security-auditor | Danh sách OWASP 2025 là kiến thức có mốc phiên bản (`:108-121`). Script được `checklist.py` gọi. Bỏ persona, ghi rõ bước quét dependency cần mạng |
| debugger | Trên Antigravity đây là skill quy trình debug duy nhất. Rút còn khoảng 60 dòng, thu hẹp trigger (hiện có cả "fix"). Xem bản mẫu 8.1 |
| api-patterns | Có script và reference về hợp đồng API. Trở thành nơi duy nhất quyết định kiểu API (`backend-specialist:151-158` đang chép lại) |
| architecture | Trở thành nơi duy nhất chứa ADR (chốt `docs/decisions/` như repo này đang dùng) |
| documentation-writer | Có cổng "chỉ khi được yêu cầu" hữu ích. Sửa code fence lồng nhau hỏng (`:67-100`), giao phần ADR cho architecture |
| web-design-guidelines | Audit theo guideline của Vercel và bắt buộc output dạng `file:line` (`:58`). Cần thêm WebFetch, phương án khi fetch lỗi, và bỏ phần Usage bị lặp |
| react-refactor-patterns | Ít kiến thức chung nhất (40%): bảng phân vai React Query/Zustand, ngưỡng tách component. Sửa ví dụ token và thêm câu "theo thư viện data project đang dùng" |

### Viết lại (14)

| Skill | Lý do và hướng viết lại |
|---|---|
| frontend-design | Nhận nội dung của frontend-specialist và tailwind-patterns. Tập trung vào đúng cách bạn làm: **chỉnh style trên nền thư viện component** qua design token. Bỏ bộ luật "cấm xanh / cấm bento / bắt buộc animation". Xem bản mẫu 8.3 |
| nextjs-react-expert | Giá trị nằm ở `references/`, nên giữ references. Rút SKILL.md còn khoảng 60 dòng. Sửa số rule (ghi 57, thực tế 58), bỏ heading bị lặp, kiểm tra lại `revalidateTag` trên Next.js 16, sửa hoặc bỏ script hỏng |
| i18n-localization | Viết mỏng, xoay quanh `i18n_checker.py`. Thêm cạm bẫy thật của next-intl (routing, middleware, định kiểu message key) |
| seo-fundamentals | Skill SEO duy nhất, nhận phần GEO từ seo-specialist. Bổ sung lưu ý về FAQPage |
| performance-profiling | Skill hiệu năng duy nhất, nhận cây quyết định từ performance-optimizer. Sửa claim về INP; cho script trả LCP/TBT/CLS |
| testing-patterns | Skill unit/integration duy nhất. Nhận phần chọn runner từ test-engineer và mục "sửa bug bằng test fail trước" (khoảng 15 dòng) từ tdd-workflow |
| webapp-testing | Skill E2E duy nhất. Hai skill Playwright chuyển thành `references/`. Xem bản mẫu 8.2 |
| backend-specialist | Nhận nodejs-best-practices, chỉ giữ cạm bẫy runtime Node và các mốc phiên bản. Bỏ persona và cổng hỏi 6 câu |
| database-design | Nhận các quy tắc migration an toàn từ database-architect (`:189-196`). Thêm mục MongoDB và lưu ý Supabase. Sửa đường dẫn script tương đối (`:84`) |
| explorer-agent | Skill khám phá code duy nhất, nhận code-archaeologist. Thêm lệnh khảo cổ git (`git log -L`, `-S`, `blame`). Bỏ quy tắc "hỏi sau mỗi 20%" |
| lint-and-validate | Chỉ còn là lớp bọc mỏng quanh 2 script, nhường quyết định cho verify-changes. Bỏ "MANDATORY after EVERY change", `--fix` tự động và `npm audit` |
| code-review-checklist | Viết thành quy trình ngắn theo mức nghiêm trọng: đúng đắn trước, ngưỡng tin cậy, trỏ sang security-auditor và verify-changes. Cần cho Antigravity vì Antigravity không có plugin code-review |
| product-manager | Nơi duy nhất làm yêu cầu. Nhận định dạng câu hỏi P0/P1/P2 kèm giá trị mặc định từ brainstorming (`brainstorming:95-112`). Bỏ phần "Recommend Best Agent" |
| mcp-builder | Bạn tự viết MCP server. Viết lại theo spec hiện hành: Streamable HTTP, outputSchema, tool annotations, auth |

### Gộp (14)

| Skill nguồn | → Skill đích | Mang sang |
|---|---|---|
| frontend-specialist | frontend-design, react-refactor-patterns | Luật "hỏi trước khi dùng shadcn/Radix" (`:288-297`) sang frontend-design; thứ tự quản lý state (`:500-506`) sang react-refactor-patterns. Phần còn lại mâu thuẫn hoặc có hại (`:350-352`, `:408-416`) |
| tailwind-patterns | frontend-design (`references/tailwind-v4.md`) | Chỉ phần khác biệt của v4: `@theme`, `@custom-variant dark`, `@container`, cạm bẫy khi migrate |
| seo-specialist | seo-fundamentals | Bảng SEO và GEO (`:79-84`). Các bước 1-4 gần như chép lại fundamentals (`:42-56`) |
| performance-optimizer | performance-profiling | Cây quyết định (`:91-110`). Bảng CWV trùng hoàn toàn |
| test-engineer | testing-patterns | Phần phát hiện framework. Phần "Deep Audit" trùng với webapp-testing |
| tdd-workflow | testing-patterns | Khoảng 15 dòng "viết test fail trước khi sửa bug". Phần còn lại 95% là kiến thức chung; trên Claude Code thì superpowers đã có TDD |
| qa-automation-engineer | webapp-testing | Bảng unhappy path (`:113-119`) và cách chia smoke/regression |
| playwright-pitfalls | webapp-testing (`references/playwright-rules.md`) | Trùng 6/7 mục với pro-patterns, gộp thành một file luật |
| playwright-pro-patterns | webapp-testing (`references/playwright-rules.md`) | Như trên |
| nodejs-best-practices | backend-specialist | Mốc phiên bản Node, cạm bẫy async. Bảng status code trùng với `api-patterns/references/rest.md` |
| database-architect | database-design | Migration an toàn. 90% còn lại trùng với references của database-design |
| simplify-code | clean-code | Bảng "When NOT to Simplify" (`:141-150`). Bỏ các hạn mức cứng (`:44`) vì trái với clean-code |
| code-archaeologist | explorer-agent | Cổng characterization test (`:67-71`) |
| brainstorming | product-manager | Định dạng câu hỏi P0/P1/P2. Bỏ phần bắt buộc 3 câu hỏi, bảng trạng thái emoji, và tham chiếu `.agents/memory/` không còn tồn tại |

### Bỏ (3)

| Skill | Lý do |
|---|---|
| code-review-graph | Là tài liệu của một tool bên thứ ba chưa cài (`which` không thấy). Hai con số tiết kiệm tự mâu thuẫn (6.8x ở `:16`, 8.2x ở `:77`). Bảo agent tự chạy `code-review-graph build` mà không hỏi (`:86`) |
| app-builder | Bạn dùng thư viện component làm nền, không cần scaffold từ template riêng. Template lỗi thời (Nuxt 3/4, Node 23, React 18). Mặc định Express, trái với chính các skill backend. Không có dependency cứng |
| python-patterns | Không thuộc stack của bạn. 90% là kiến thức chung, có ví dụ httpx đã hỏng. Script `type_coverage.py` vẫn xử lý Python mà không cần skill này |

---

## 3. Ràng buộc khi gộp hoặc bỏ

Chọn skill đích là skill đang sở hữu script nên **không đường dẫn script nào
phải đổi**. Các script sau vẫn giữ nguyên:
- `testing-patterns/scripts/test_runner.py`
- `frontend-design/scripts/*`
- `seo-fundamentals/scripts/seo_checker.py`
- `performance-profiling/scripts/lighthouse_audit.py`
- `webapp-testing/scripts/playwright_runner.py`
- `i18n-localization/scripts/i18n_checker.py`
- `lint-and-validate/scripts/*`
- `database-design/scripts/schema_validator.py`
- `security-auditor/scripts/security_scan.py`
- `api-patterns/scripts/api_validator.py`

Các file phải sửa cùng đợt với việc gộp hoặc bỏ:

| File | Lý do |
|---|---|
| `templates/.agents/ARCHITECTURE.md:14,37,74` | Chứa dòng "43 Composable Skills". `scripts/check-template-consistency.mjs:175-208` kiểm tra số thư mục skill phải khớp với con số này |
| `templates/GEMINI.md:19` | Danh sách "Masters" có frontend-specialist |
| `templates/GEMINI.md:41` | SOCRATIC GATE, trái với `AGENTS.md`/`CLAUDE.md` |
| `templates/kit.json` | Profile starter: clean-code, debugger, verify-changes. Cả ba được giữ |
| `scripts/check-template-consistency.mjs:167-170,310-331` | Kiểm tra `project-planner/agents/openai.yaml`. Giữ nguyên, sẽ mở rộng để kiểm tra mọi file `openai.yaml` |
| `scripts/test-installer.mjs`, `test/resolve.test.js` | Fixture dùng clean-code, debugger, security-auditor. Cả ba được giữ |

**Ảnh hưởng tới project đang dùng kit** (đây là thay đổi phá vỡ, nên tăng
major version):
- Project chọn `all` sẽ được bỏ các skill đã gộp hoặc bị bỏ, kèm cảnh báo. Bản
  managed bị xóa; bản bạn đã sửa tay được giữ lại.
- Project chọn đích danh tên skill đã bỏ sẽ bị loại tên đó khỏi selection,
  kèm cảnh báo (cơ chế của commit `da85b0c`).
- Không cần sửa `bin/` hay `lib/`.

---

## 4. Chồng chéo với superpowers trên Claude Code

Trên Claude Code bạn dùng superpowers. Nhiều skill của kit trùng vai với skill
của superpowers, và description của cả hai đều được nạp vào context:

| Skill của kit | Trùng với superpowers |
|---|---|
| debugger | systematic-debugging |
| plan-writing | writing-plans |
| testing-patterns (mục TDD) | test-driven-development |
| product-manager (phần câu hỏi) | brainstorming |
| verify-changes | verification-before-completion |

Đề xuất:

1. **Trước mắt (không đổi code):**
   - Viết description của kit hẹp và cụ thể hơn để bớt tranh nhau. Ví dụ
     debugger chỉ dùng khi có triệu chứng lỗi cụ thể; plan-writing dùng khi cần
     file plan trong repo.
   - Không đặt trùng tên với superpowers. Bỏ `brainstorming` của kit là hợp lý
     vì trùng cả tên.
2. **Đề xuất cho installer (chưa làm, ngoài phạm vi báo cáo):**
   - Cho `kit.json` khai báo một danh sách skill *không* tạo symlink vào
     `.claude/skills/`, chẳng hạn `"targets": {"claude": {"exclude": [...]}}`.
   - Khi đó Claude Code chỉ thấy skill của superpowers cho quy trình, còn
     Antigravity vẫn thấy skill của kit.
   - Cần một ADR riêng.

---

## 5. Đề xuất profile cho `templates/kit.json`

Mỗi profile nhỏ, dựa trên stack bạn đã chọn. Script trong `checklist.py` tự bỏ
qua khi skill chứa nó không được cài (`checklist.py`: "Script not found,
skipping"), nên cài theo profile không làm hỏng checklist.

```json
{
  "formatVersion": 1,
  "profiles": {
    "core": ["clean-code", "verify-changes", "debugger", "explorer-agent",
             "lint-and-validate", "code-review-checklist", "security-auditor"],
    "web": ["frontend-design", "web-design-guidelines", "nextjs-react-expert",
            "react-refactor-patterns", "performance-profiling"],
    "backend": ["backend-specialist", "api-patterns", "database-design"],
    "testing": ["testing-patterns", "webapp-testing"],
    "planning": ["plan-writing", "project-planner", "product-manager", "architecture"],
    "growth": ["seo-fundamentals", "i18n-localization"],
    "ops": ["devops-engineer"],
    "mcp": ["mcp-builder"],
    "docs": ["documentation-writer"],
    "starter": ["clean-code", "debugger", "verify-changes"]
  }
}
```

Tổ hợp cho các loại project:

| Loại project | Lệnh cài | Số skill |
|---|---|---:|
| Fullstack Next.js + Node hằng ngày | `--profile core,web,backend,testing` | 17 |
| Landing page hoặc marketing | `--profile core,web,growth` | 14 |
| MCP server | `--profile core,backend,mcp,testing` | 13 |

Giữ `starter` để không phá project đang dùng.

---

## 6. Chuẩn viết skill của kit

Chuẩn này thay cho 3 file trong `docs/skills/`. Đề xuất gom lại thành một file
`docs/skills/SKILL_STANDARD.md`.

### 6.1 Căn cứ

- Claude Code, Codex, Gemini CLI và Antigravity đều tuyên bố theo chuẩn
  [Agent Skills](https://agentskills.io/specification):
  - [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills)
  - [learn.chatgpt.com/docs/build-skills](https://learn.chatgpt.com/docs/build-skills)
  - [geminicli.com/docs/cli/skills](https://geminicli.com/docs/cli/skills.md)
  - [antigravity.google/docs/skills](https://antigravity.google/docs/skills)
- **Claude Code không đọc `.agents/skills`**, chỉ đọc `.claude/skills`. Vì vậy
  symlink mà installer đang tạo là bắt buộc, không phải tùy chọn.
- **Gemini CLI bỏ qua skill thiếu `name` hoặc `description`**, và chỉ quét sâu
  một cấp.
- **Mỗi tool có ngân sách riêng cho danh sách description:**
  - Claude Code: 1% context. Description nào dài quá 1.536 ký tự bị cắt; khi
    thiếu chỗ thì bỏ description của skill ít dùng trước.
  - Codex: 2% context, hoặc 8.000 ký tự khi không biết kích thước context;
    description bị rút ngắn trước.
  - Càng nhiều skill thì description càng bị cắt, đúng như giả thuyết của bạn.
- **Claude Code sau khi compact** chỉ giữ 5.000 token đầu của mỗi skill.

### 6.2 Cấu trúc thư mục

```text
templates/.agents/skills/<name>/
├── SKILL.md           # bắt buộc
├── references/        # tùy chọn: tài liệu tra cứu, sâu một cấp, có link từ SKILL.md
├── scripts/           # tùy chọn: thao tác cần kết quả xác định; gọi bằng `python3 scripts/x.py`
├── assets/            # tùy chọn: template, file mẫu. Không để thư mục rỗng
└── agents/openai.yaml # chi tiết riêng cho Codex (xem mục 7)
```

Không để README hay CHANGELOG trong skill.

### 6.3 Công thức cho Claude Code và Codex

Kit chỉ tối ưu cho Claude Code và Codex. Antigravity đọc cùng `.agents/skills/`,
chỉ cần `name` và `description`, nên chạy được theo công thức này mà không cần
viết riêng.

1. **Frontmatter chỉ gồm `name` và `description`.**
2. **Phần thân chỉ dùng Markdown thường.** Không dùng `$ARGUMENTS`,
   `` !`cmd` `` hay `${CLAUDE_SKILL_DIR}` (riêng của Claude; Codex đọc thành
   chữ).
3. **Đường dẫn script tính từ gốc project:**
   `python3 .agents/skills/<name>/scripts/x.py`. Agent chạy lệnh từ gốc
   project, và đường dẫn này có ở cả hai tool.
4. **`agents/openai.yaml` chỉ có 3 trường giao diện:** `display_name`,
   `short_description`, `default_prompt`.
5. **Skill chỉ chạy khi được gọi đích danh là trường hợp duy nhất phải cấu hình
   cho cả hai tool:** `disable-model-invocation: true` trong `SKILL.md` cho
   Claude, và `policy.allow_implicit_invocation: false` trong `openai.yaml` cho
   Codex. Chỉ dùng khi có lý do, và ghi lý do đó trong phần thân.

Không làm:
- `allowed-tools` và các trường chỉ Claude hiểu (`when_to_use`, `context`,
  `paths`...).
- Script sinh `openai.yaml`.
- Bản viết riêng cho Antigravity.

### 6.3.1 Frontmatter

```yaml
---
name: webapp-testing
description: >-
  Writes, debugs, and stabilizes Playwright end-to-end tests for web apps.
  Use when adding a browser test, fixing a flaky or failing E2E run, or
  reviewing a Playwright suite. Not for unit or integration tests (use
  testing-patterns).
---
```

- **Chỉ dùng `name` và `description`.** Đây là phần giao nhau mà cả bốn tool
  đều đọc.
- **Chi tiết riêng của từng tool không đưa vào `SKILL.md`.** Làm theo cách của
  Codex: `SKILL.md` chỉ giữ chuẩn chung, còn phần riêng của Codex để trong
  `agents/openai.yaml`. Claude Code thì ngược lại, nhét trường riêng vào
  frontmatter, nên kit không theo cách đó.
- **`name` phải trùng tên thư mục:** chữ thường, số và dấu gạch; tối đa 64 ký
  tự; không chứa `claude` hay `anthropic`.
- **Bỏ `allowed-tools`.** Trong Claude Code, trường này tự duyệt trước tool mà
  không qua kiểm tra workspace trust; các tool khác bỏ qua nó. Cấp
  Write/Edit/Bash sẵn cho 40 skill là mở rộng quyền một cách âm thầm.
- **Không dùng các trường riêng của Claude Code:** `disable-model-invocation`,
  `when_to_use`, `context`, `paths`...
  - Chúng chỉ có tác dụng ở Claude Code, nên hành vi sẽ khác nhau giữa các tool.
  - Khi upload lên claude.ai hoặc Skills API, trường lạ gây lỗi cứng.
  - Nếu một skill thật sự cần trường như vậy, ghi lý do trong ADR.
- **Dùng `>-`** khi description có dấu `:`.

### 6.4 Cách viết `description`

Quy tắc đầy đủ, rubric chấm điểm và cách kiểm thử trigger nằm ở
[`docs/skills/DESCRIPTION_GUIDE.md`](../skills/DESCRIPTION_GUIDE.md). Tóm tắt:

1. **Dài 150–300 ký tự, kit giới hạn cứng 400** (chuẩn chung cho 1024). Đặt trigger chính ở câu đầu, vì phần
   cuối là phần bị cắt trước.
2. **Viết ở ngôi thứ ba:** nói skill làm gì, rồi "Use when …" kèm hành động cụ
   thể mà người dùng sẽ nói, như "fixing a flaky E2E run". Không liệt kê chủ đề
   chung chung kiểu "react, ui, css".
3. **Chỉ thêm câu "Not for … (use X)"** khi có một skill anh em dễ bị chọn
   nhầm, và luôn nêu tên skill thay thế.
4. **Không tóm tắt quy trình trong description**, vì agent có thể làm theo bản
   tóm tắt mà không đọc phần thân.
5. **Không viết persona**, kiểu "Expert in…", "Elite…".

### 6.5 Phần thân

- **Giới hạn:** tối đa **200 dòng**, mục tiêu 60–120 dòng. Chuẩn chung cho
  phép 500 dòng, nhưng kit đặt chặt hơn vì Gemini đọc lướt và Claude chỉ giữ
  5.000 token sau khi compact.
- **Chỉ viết thứ model không tự biết:**
  - quy ước riêng của kit hoặc repo
  - lệnh chính xác và đường dẫn script
  - cạm bẫy thực tế
  - mốc phiên bản
  - định nghĩa "xong"
- **Không giảng lại kiến thức chung,** như test pyramid, AAA, 5 Whys, luật
  Fitts, SOLID.
- **Đưa ra mặc định, không đưa ra danh sách lựa chọn.** Viết "dùng project's
  existing X; nếu chưa có thì dùng Y", thay vì bảng 5 framework.
- **Mức cứng của quy tắc tương xứng với độ rủi ro:**
  - thao tác dễ hỏng hoặc có tác dụng phụ (deploy, xóa, migration) thì viết
    lệnh cụ thể và cổng xác nhận
  - việc mở (thiết kế, review) thì viết heuristic
- **Giải thích lý do** thay vì chồng MUST/NEVER viết hoa.
- **Luôn nhường cho quy ước của project.** Không được ghi đè `AGENTS.md` hay
  `CLAUDE.md`: không ép hỏi, không ép chạy mọi validator.
- **Kiểm tra dùng chung một chỗ.** Mọi skill trỏ về `verify-changes`, không tự
  mang "Quality Control Loop (MANDATORY)" với lệnh viết cứng.
- **Bố cục gợi ý:**
  1. một đoạn mục đích
  2. mặc định và quy ước
  3. quy trình (nếu có)
  4. cạm bẫy
  5. xong là khi…
- **Bỏ các mục trang trí:** Content Map, Related Skills, Your Mindset,
  Quality Audit Checklist, emoji ở heading.

### 6.6 Khi nào tách `references/`

- **Tách** khi nội dung chỉ cần cho một nhánh việc, như luật Playwright hay
  rule hiệu năng Next.js, hoặc khi SKILL.md sắp vượt 200 dòng.
- **Link trực tiếp từ SKILL.md** kèm điều kiện đọc, ví dụ: "Đọc
  `references/playwright-rules.md` trước khi viết hoặc sửa test."
- **File dài hơn 100 dòng** thì có mục lục ở đầu file.

### 6.7 Khi nào cần `scripts/`

- **Chỉ dùng cho thao tác cần kết quả xác định và lặp lại,** như kiểm tra
  i18n, SEO, schema, hay lint.
- **Yêu cầu với mỗi script:**
  - có `--help` bằng argparse
  - **exit khác 0 khi có lỗi** (hiện có 2 script luôn pass)
  - output ngắn, dễ đọc cho model
  - không tự cài package hay gọi mạng khi chưa có cờ bật rõ ràng
- **Có regression test** trong `scripts/test-*.py` cho mọi script được
  `checklist.py` gọi.
- **SKILL.md ghi rõ chạy hay đọc script:** "Run `python3 scripts/x.py <path>`;
  do not read the source."

### 6.8 Kiểm tra tự động

Đề xuất mở rộng `scripts/check-template-consistency.mjs` (sửa trong đợt 0):
- `name` trùng tên thư mục; frontmatter chỉ có `name` và `description`.
- description qua các kiểm tra tự động ở mục 4 của `DESCRIPTION_GUIDE.md` (tối đa 400 ký tự, có `Use when`, không persona, `Not for` phải nêu skill thay thế).
- SKILL.md tối đa 200 dòng.
- mọi link tương đối đều tồn tại; không còn tên skill đã bị gộp hoặc bỏ.
- không có thư mục rỗng hay `__pycache__`.
- `agents/openai.yaml`:
  - `short_description` dài 25–64 ký tự.
  - `default_prompt` là một câu có nhắc tới `$<name>`.
  - không ghi lại giá trị mặc định (`allow_implicit_invocation: true`).

### 6.9 Những gì sai trong 3 file cũ ở `docs/skills/`

- **Premise của `ANTIGRAVITY_CODEX_SKILL_CONVERSION.md` không còn đúng.** Cả
  hai tool đã đọc cùng một `SKILL.md`, nên không cần chuyển đổi. Bước
  `rm -rf agents/` là thừa, và việc chuyển trigger từ description vào phần
  thân làm skill khó được chọn đúng hơn.
- **"Sidecar `openai.yaml` bắt buộc" là sai.** Codex coi nó là tùy chọn và bỏ
  qua nếu file lỗi.
- **Các con số cho openai.yaml sai:**
  - `short_description`: file cũ ghi ≤80 ký tự; chuẩn là 25–64.
  - `default_prompt`: file cũ ghi `"$skill"`; chuẩn là một câu ví dụ có nhắc
    tới `$skill`.
- **"Quy tắc 100 ký tự" và Content Map bắt buộc** không có nguồn chính thức nào.
- **`when_to_use` bị gọi là "legacy",** nhưng đây là trường hiện hành của
  Claude Code, chỉ là không dùng chung được cho các tool khác.
- **Đường dẫn global của Antigravity đã đổi** thành `~/.gemini/config/skills/`.

---

## 7. Chính sách cho `agents/openai.yaml`

Bạn có dùng Codex, nên **giữ file này nhưng làm lại cho đúng chuẩn của Codex**.
Đây là nơi chứa các chi tiết chỉ Codex hiểu, để `SKILL.md` giữ đúng chuẩn chung.
Claude Code, Gemini và Antigravity đều bỏ qua file này, nên giữ lại không gây
hại cho các tool đó.

Chuẩn lấy theo tài liệu và skill-creator của Codex:
[learn.chatgpt.com/docs/build-skills](https://learn.chatgpt.com/docs/build-skills)
và `codex-rs/skills/src/assets/samples/skill-creator/references/openai_yaml.md`.

```yaml
interface:
  display_name: "Web App Testing"
  short_description: "Write and stabilize Playwright E2E tests"   # 25–64 ký tự
  default_prompt: "Use $webapp-testing to add an E2E test for the checkout flow."
policy:
  allow_implicit_invocation: false   # chỉ ghi khi skill cần gọi đích danh
dependencies:
  tools:
    - type: mcp                      # chỉ ghi khi skill cần MCP server
      value: backlog
```

Quy tắc:
- File chỉ ảnh hưởng giao diện Codex và ChatGPT app, và cách gọi skill. Việc
  model chọn skill vẫn dựa trên `name` và `description` trong `SKILL.md`.
- **`short_description` dài 25–64 ký tự.** Hiện 24/43 file quá 64 ký tự.
- **`default_prompt` là một câu ví dụ có nhắc `$<name>`,** không phải chỉ
  `"$clean-code"`. Hiện chỉ 4 file viết đúng.
- **Không ghi `allow_implicit_invocation: true`,** vì đó là giá trị mặc định.
- **`allow_implicit_invocation: false`** dùng cho skill chỉ nên gọi khi được
  yêu cầu. Ứng viên: documentation-writer (skill này đã ghi "chỉ khi được yêu
  cầu" trong phần thân mà chưa có cờ). Lưu ý cờ này chỉ Codex hiểu; trên
  Claude Code và Antigravity, phần thân vẫn phải tự chặn.
- **Không bắt buộc mỗi skill phải có file.** Skill không cần tên hiển thị riêng
  hay policy thì bỏ qua được, vì Codex vẫn chạy bình thường khi thiếu file.
  Tuy vậy, kit giữ file cho mọi skill để giao diện Codex hiển thị đồng đều.
- **Tránh sửa tay 26 file:** có thể sinh bằng `scripts/generate_openai_yaml.py`
  trong skill-creator của Codex, hoặc bằng một script nhỏ trong repo đọc từ
  frontmatter.

---

## 8. Bản viết lại mẫu

Đây chỉ là bản nháp để bạn xem chuẩn mới trông thế nào; chưa ghi đè file nào.

### 8.1 `debugger`: rút gọn từ 264 dòng xuống khoảng 50

```markdown
---
name: debugger
description: >-
  Finds the root cause of a concrete failure — an error message, stack trace,
  failing test, crash, or wrong output — before any fix is written. Use when
  something that should work does not, especially when it is intermittent or
  only fails in one environment. Not for slowness without an error (use
  performance-profiling).
---

# Debugger

Find the cause before changing code. A fix that is not explained by a cause is
a guess, and guesses in this codebase tend to land as extra conditionals that
hide the next bug.

## Procedure

1. **Reproduce.** Write down the exact command or steps, expected vs. actual
   output, and how often it fails. If you cannot reproduce it, say so and
   collect evidence (logs, versions, env diff) instead of fixing blind.
2. **Isolate.** Narrow with one tool at a time: a focused test, a log line,
   `git bisect run <cmd>` for regressions, or removing half the input.
   Revert each experiment that did not confirm a hypothesis before trying the
   next one.
3. **Explain.** State the cause in one sentence that accounts for both the
   symptom and the trigger ("fails only on CI because X"). If the sentence
   needs "maybe", keep isolating.
4. **Fix the cause** with the smallest change. Add a regression test that fails
   before the fix when the project has a test runner.
5. **Prove it** by rerunning the original reproduction, then hand off to
   `verify-changes` for the proportional checks.

## Gotchas

- "Works locally, fails in CI/prod": diff Node version, env vars, lockfile, and
  timezone before reading code.
- Intermittent failures: look for shared state between tests, unawaited
  promises, and time/ordering assumptions before adding retries or sleeps.
- Never silence the error (empty catch, `?.` chains, `|| []`) as the fix.

## Done when

The report names the cause, the change, the reproduction rerun result, and the
regression test (or why none was feasible).
```

Thay đổi chính:
- Bỏ khung ASCII, bảng 5 Whys, bảng "By Symptom" và Related Skills, vì đó là
  kiến thức chung.
- Giữ lại "Strict Debugging Protocol" (`debugger:116-124`), viết thành quy trình.
- Thêm các cạm bẫy có thật và định nghĩa "xong".
- Description bỏ trigger "fix", để debugger không bị chọn cho mọi lần sửa code.

### 8.2 `webapp-testing`: mẫu gộp 4 skill thành 1 skill và 1 reference

Cấu trúc sau khi gộp:

```text
webapp-testing/
├── SKILL.md                       # ~70 dòng
├── references/playwright-rules.md # gộp pitfalls + pro-patterns, bỏ trùng (~120 dòng)
└── scripts/playwright_runner.py   # sửa networkidle → load + web-first wait
```

```markdown
---
name: webapp-testing
description: >-
  Writes, debugs, and stabilizes Playwright end-to-end tests for web apps. Use
  when adding a browser test for a user flow, fixing a flaky or failing E2E
  run, or reviewing a Playwright suite. Not for unit or integration tests (use
  testing-patterns).
---

# Web App Testing (Playwright)

Read `references/playwright-rules.md` before writing or changing a test; it
holds the locator, waiting, isolation, and mocking rules this project follows.

## Defaults

- Follow the project's existing `playwright.config.*`, fixtures, and folder
  layout. Create a Page Object only when the same locators are used in more
  than one file.
- Locators: `getByRole` / `getByLabel` / `getByTestId`. No CSS classes.
- Waiting: rely on auto-wait and web-first `expect(...)`; wait on URL or
  response for navigation. Never `waitForTimeout`.
- Data: each test creates its own data with a unique suffix and cleans it up
  through the API. No module-level `let`, no data-heavy `beforeAll`.
- Mocks: stub third parties (payments, analytics, chat). Hit the real backend
  for happy paths; mock it only to force error states.

## Writing a test

1. Cover the happy path, then the unhappy paths that matter for the flow:
   expired session mid-form, double submit, server 500, empty state.
2. Group phases with `test.step()`; keep `describe` nesting to two levels.
3. Run just that file: `npx playwright test <file> --project=<one>`; run it
   three times with `--repeat-each=3` before calling it stable.

## Debugging a failure

1. Rerun with `--trace on` and open `npx playwright show-trace`. Read the
   trace before editing the test.
2. Decide whether the app or the test is wrong. A test that needs a sleep to
   pass is hiding an app race; report it.
3. Overlays that appear sometimes (cookie banners, tours): register
   `page.addLocatorHandler()` once, not `if (await loc.count())` checks.

## Quick smoke without a suite

`python3 scripts/playwright_runner.py <url>` opens the page, captures console
errors and a screenshot. Requires the Python `playwright` package.

## Done when

The new or fixed test passes three repeats locally, uses no fixed sleeps, and
leaves no data behind.
```

Thay đổi chính:
- 7 skill kiểm thử còn 2 (skill này và testing-patterns).
- Luật Playwright chỉ còn một nguồn.
- Sửa cạm bẫy `count()` bằng `addLocatorHandler()`.
- Bỏ persona "cynical, destructive" và phần "route audit" chung chung.

### 8.3 `frontend-design`: viết lại theo cách bạn làm UI

```markdown
---
name: frontend-design
description: >-
  Restyles and themes web UI built on a component library (shadcn/ui, Radix,
  MUI, Ant) to match a requested look, through design tokens rather than
  one-off overrides. Use when changing colors, typography, spacing, radius,
  dark mode, or the overall visual feel of pages or components, including
  Tailwind v4 theming. Not for accessibility audits of existing UI (use
  web-design-guidelines).
---

# Frontend Design

The project starts from a component library and changes its look. Good
restyling changes a few tokens and every component follows; bad restyling
scatters `className` overrides that drift apart.

## Before changing anything

1. Identify the library and where its tokens live: shadcn → CSS variables in
   `globals.css` (`:root` and `.dark`) mapped by `@theme inline`; MUI →
   `createTheme`; Ant → `ConfigProvider` `theme.token`.
2. If the request names no direction (palette, mood, reference site), ask one
   question with 2–3 concrete options. Otherwise proceed.
3. Do not add a second component library or replace components without asking.

## Order of changes

1. **Tokens first:** color (keep the library's semantic names: `primary`,
   `muted`, `destructive`...), font families, radius, spacing scale, shadow.
2. **Component variants second:** extend the library's variant API (e.g. `cva`
   variants in shadcn components) instead of passing ad-hoc classes at call
   sites.
3. **Page layout last.** Keep the existing grid and breakpoints unless the
   request is about layout.

## Rules that are easy to get wrong

- Define both light and dark values for every token you add; check both.
- Keep text contrast ≥ 4.5:1 (3:1 for large text) after changing colors.
- Animate only `transform` and `opacity`; respect `prefers-reduced-motion`.
- Tailwind v4: tokens go in CSS (`@theme`), dark mode via
  `@custom-variant dark (&:where(.dark, .dark *))`; there is no
  `tailwind.config.js` unless the project already uses `@config`. See
  `references/tailwind-v4.md`.
- No hardcoded hex in components once a token exists for it.

## Check

Run `python3 scripts/accessibility_checker.py <path>` and
`python3 scripts/ux_audit.py <path>`, then view light and dark in the browser
at mobile and desktop widths.

## Done when

The new look comes from token and variant changes, both themes pass contrast,
and no call site carries one-off color overrides.
```

Thay đổi chính:
- Bỏ toàn bộ bộ luật mâu thuẫn: cấm xanh, cấm bento, cấm Inter, bắt buộc
  animation, "delete your code".
- Bám đúng quy trình của bạn: thư viện component → token → variant.
- tailwind-patterns chuyển thành reference.
- Thay khoảng 1.400 dòng (frontend-design, frontend-specialist,
  tailwind-patterns) bằng khoảng 70 dòng và một reference.

---

## 9. Kế hoạch thực hiện theo đợt

Mỗi đợt là một commit hoặc PR riêng. Mỗi đợt chạy `npm run verify` và
`python3 .agents/scripts/checklist.py .`, rồi thử bằng chế độ link trên một
project thật:
`node bin/index.js install --path <project> --source . --link --profile <p>`.

| Đợt | Nội dung | Đổi tên hoặc bỏ skill? | Review cần xem |
|---|---|---|---|
| 0 | Viết `docs/skills/SKILL_STANDARD.md`, xóa 3 file cũ, mở rộng `check-template-consistency.mjs` (lúc đầu chỉ cảnh báo) | Không | Nội dung chuẩn |
| 1 | Sửa 7 script lỗi ở mục 1, kèm regression test; xóa `convert_rules.py` và `__pycache__` | Không | Diff script và test |
| 2 | **Cụm testing:** gộp 7 skill thành 2 (bản mẫu 8.2); sửa `ARCHITECTURE.md` | Có (−5) | So sánh với bản mẫu |
| 3 | **Cụm frontend, SEO, performance:** frontend-design (bản mẫu 8.3), bỏ frontend-specialist, gộp tailwind, seo-specialist, performance-optimizer; sửa `GEMINI.md` Masters | Có (−4) | Kiểm tra hành vi restyle trên project shadcn thật |
| 4 | **Cụm backend, DB, chất lượng code, khám phá, lập kế hoạch:** gộp nodejs, database-architect, simplify-code, code-archaeologist, brainstorming; bỏ code-review-graph, app-builder, python-patterns; chốt đường dẫn plan và ADR | Có (−8) | Đường dẫn plan/ADR |
| 5 | **Rút gọn các skill giữ lại theo chuẩn mới:** bỏ persona, `allowed-tools`, khung trang trí; làm lại `openai.yaml` theo mục 7; bỏ SOCRATIC GATE trong `GEMINI.md`; bật kiểm tra ở đợt 0 thành lỗi | Không | Diff từng skill |
| 6 | Profile mới trong `kit.json` (mục 5); cập nhật README; tăng major version | Không | Thử `--profile core,web,backend,testing` |

Đề xuất tách riêng, cần ADR: cho kit bỏ qua symlink `.claude/skills` với
từng skill, để tránh tranh vai với superpowers (mục 4).

## 10. Những điểm chưa kiểm chứng

- Antigravity bỏ qua hay từ chối trường frontmatter lạ: tài liệu chỉ nói về
  `name` và `description`.
- `revalidateTag` một tham số trên Next.js 16 và mô tả profile `default` trong
  `nextjs-react-expert/references`: cần đối chiếu tài liệu Next.js ở đợt 3.
- URL guideline của Vercel mà `web-design-guidelines` dùng còn hoạt động không:
  chưa fetch.
- `lighthouse_audit.py` và `playwright_runner.py` chưa chạy thật, vì cần mạng
  hoặc package chưa cài.
