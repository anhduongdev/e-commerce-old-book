# AGENTS.md

Comic Store — e-commerce bán truyện/sách cũ. Đọc file này trước khi code.

## Stack

Next.js (App Router) + TS + Tailwind (frontend) · NestJS + TS (backend) · MySQL 8/Docker · Prisma qua `PrismaService`.
KHÔNG dùng: Nx, Turborepo, Microservices, K8s, Redux/Zustand mặc định, React Hook Form mặc định, Repository Pattern mặc định.

## Quy trình & ưu tiên

Requirement → hiểu hệ thống hiện có (trace luồng/code liên quan trước khi sửa) → chọn thiết kế đơn giản nhất đáp ứng đúng yêu cầu → implement → verify → soát lại scope.
Ưu tiên khi có đánh đổi: Correctness → Security/Data integrity → Maintainability → Performance → Simplicity. Không hy sinh maintainability để tối ưu performance sớm; chỉ tối ưu khi có bottleneck/inefficiency rõ ràng.

## Structure

Frontend (khung có sẵn, `features/<domain>/` chỉ tạo khi module đó được yêu cầu):

```
frontend/src/
  app/                      route, page, layout — chỉ compose, không viết logic
  components/ui/            generic, không business logic (Button, Modal...)
  components/common/        dùng chung nhiều nơi (EmptyState...)
  components/layout/        Header, Footer, Sidebar...
  features/products/        VÍ DỤ khi module "products" được yêu cầu:
    components/
    hooks/
    services/
    types/
  services/                 API dùng CHUNG nhiều feature (không phải nơi mặc định)
  lib/  hooks/  types/  constants/
```

Backend (khung có sẵn, `<module>/` chỉ tạo khi module đó được yêu cầu):

```
backend/src/
  main.ts
  app.module.ts
  common/
  config/
  database/
    prisma.service.ts       mọi truy cập DB đi qua đây
    database.module.ts
  products/                 VÍ DỤ khi module "products" được yêu cầu — 4 file, KHÔNG gộp/rút gọn:
    products.module.ts
    products.controller.ts
    products.service.ts
    dto/
      create-product.dto.ts
      update-product.dto.ts

backend/prisma/
  schema.prisma              TOÀN BỘ Prisma model định nghĩa TẬP TRUNG ở đây — 1 file
                              duy nhất, KHÔNG rải model theo từng module trong src/,
                              KHÔNG tạo entity class riêng ở products/entities/.
```

Quy tắc:
- `app/**/page.tsx` chỉ compose feature, không viết logic tại đó.
- `features/`, backend `<module>/`: chỉ tạo khi module đó thực sự được yêu cầu — không dựng sẵn cho module chưa làm.
- `components/ui` = generic, không business logic. `services/` (global, frontend) chỉ cho API dùng chung nhiều feature; API riêng 1 feature → `features/<feature>/services/`.
- Backend KHÔNG có `entities/` hay `models/` trong `src/`. Prisma model chỉ định nghĩa trong `backend/prisma/schema.prisma` — controller/service KHÔNG bao giờ được tạo trong hay cạnh chỗ định nghĩa model.

## Component extraction (frontend)

Tách component khi: có thể tái sử dụng · một phần UI có nhiệm vụ rõ ràng · file bắt đầu dài/khó đọc (fetch+filter+modal+form+table+logic dồn 1 file) · có state/logic riêng.
KHÔNG tách mỗi `<div>`, KHÔNG tách `ProductTitle`/`ProductPrice`... nếu chỉ vài dòng không logic/tái sử dụng. Ưu tiên dễ đọc hơn nhiều file.

## Rendering & SEO (frontend)

Ưu tiên Server Component; chỉ thêm `"use client"` khi thực sự cần state/effect/event handler/browser API. Tránh fetch/render dư thừa và duplicate request.
Trang public (product/category/content) phải index được mặc định trừ khi có lý do nghiệp vụ để `noindex` (cart/checkout/account/search/utility pages luôn `noindex`). Dùng Next.js Metadata API cho title/description/OG/canonical; nội dung chính (đặc biệt product page) phải render ở server, có mặt trong initial HTML — không phụ thuộc client-only rendering.
Semantic HTML + heading hợp lý; cân nhắc structured data (Product/Offer/BreadcrumbList) khi dữ liệu cho phép. Có `sitemap.xml`/`robots.txt`, chỉ chứa URL canonical/indexable. Ảnh khai báo kích thước rõ ràng (tránh layout shift), alt text đúng nội dung (ảnh trang trí: alt rỗng).

## Backend: Service Layer + DI

`Controller → Service → Prisma`. Controller chỉ nhận request/validate(DTO)/gọi service/trả response — KHÔNG business logic dài, KHÔNG query Prisma trực tiếp. Service chứa business logic, gọi `PrismaService`.
Constructor injection cho mọi provider, KHÔNG `new Service()` thủ công. DTO/value object đơn giản không cần DI.

## Design Pattern — mặc định KHÔNG dùng thêm gì ngoài DI + Service Layer

- Repository: chỉ khi data access phức tạp/nhiều nguồn dữ liệu/query quá lớn.
- Strategy: chỉ khi có ≥2 implementation thật (hiện chỉ có SePay → không dùng).
- Factory/Observer/Event: chỉ khi nghiệp vụ thật sự cần.
- Trước khi thêm pattern: *nó giải quyết vấn đề gì? Bỏ đi code có thực sự khó maintain không?* Chưa có vấn đề thật → KHÔNG thêm.
- Cấm tự tạo (trừ lý do rõ ràng): `BaseRepository/Service/Controller`, `AbstractFactory`, `GenericCRUDService`, `EventBus`, `DomainEvent`, `CQRS`, `UnitOfWork`.

## Database (Prisma)

- `schema.prisma` đã có đủ model theo thiết kế DB hiện tại (xem comment đầu file để biết vài ngoại lệ Prisma không diễn tả được — generated column, FULLTEXT ngram, CHECK constraint — vẫn do MySQL enforce qua `docker/mysql/init/schema.sql`). Thêm bảng/field mới thì sửa CẢ hai file này cho khớp nhau.
- Mọi truy cập DB qua `PrismaService`, không `new PrismaClient()` nơi khác.
- Transaction chỉ khi 1 nghiệp vụ đổi nhiều dữ liệu liên quan cần cùng thành công/rollback (vd order+stock+payment).
- Tồn kho: chống overselling bằng atomic update/transaction, không `SELECT` rồi `UPDATE` rời rạc.
- List có thể lớn (products/orders/customers): luôn pagination, filter/search/sort ở backend qua query params — không `findMany()` vô hạn, không tải hết rồi filter ở frontend.

## API / Validation / Error

- Prefix `/api`, RESTful (`GET/POST/PATCH/DELETE /products`, không `/getAllProducts`). Health: `GET /api/health` → `{status:"ok"}`.
- DTO dùng `class-validator`+`class-transformer`. Global `ValidationPipe({whitelist,transform,forbidNonWhitelisted:true})`.
- Lỗi HTTP dùng exception NestJS (`BadRequestException`, `NotFoundException`...), KHÔNG `throw new Error()`.
- Sửa API (route/payload/response) → kiểm tra và cập nhật frontend consumer liên quan, giữ contract khớp nhau.

## Security

- Không tin dữ liệu nhạy cảm từ frontend: `price`, `total`, `stock`, `payment status`, `userId`, `role` — backend luôn tự xác định (frontend chỉ gửi intent: `productId`+`quantity`).
- Authorization luôn kiểm tra ở backend; frontend guard chỉ phục vụ UX, không phải cơ chế bảo mật.
- Invariant nghiệp vụ quan trọng phải được bảo vệ ở backend/DB (vd: stock không âm, paid order không tự quay lại pending, cancelled order không tự thành paid).
- Payment chỉ SePay, frontend không được tự set `payment=paid`. Flow: Order → Pending Payment → VietQR → SePay Webhook → Backend verify → Paid.
- Upload (khi implement): validate MIME+size, không tin extension client, generate filename riêng, lưu URL trong DB.
- Không hard-code secret — dùng env var, chỉ commit `.env.example`. Không log password/token/secret. Không `console.log()` rải rác — dùng NestJS `Logger`.

## Conventions

State (frontend): local → lift → Context → library; chỉ thêm Zustand/TanStack Query khi thật sự cần, không cài trước.
Naming: component `PascalCase.tsx`, function `camelCase`, backend file theo Nest convention (`products.service.ts`), DTO `create-product.dto.ts`.
TypeScript strict mode, không `any`/`as any` trừ khi bắt buộc.

## Thêm module mới

Chỉ tạo đúng module được yêu cầu (vd yêu cầu Product thì KHÔNG lan sang Cart/Order).
Backend: `products/{products.module.ts, products.controller.ts, products.service.ts, dto/}`. Frontend: `features/products/{components,services,hooks,types}` + `app/products/page.tsx` (chỉ compose).

## AI CODING RULES

**Trước khi code**: đọc AGENTS.md → xem cấu trúc/module hiện có, trace luồng code liên quan đến task → tìm/tái sử dụng implementation sẵn có trước khi tạo file mới, không tạo duplicate → không đổi kiến trúc nếu task không yêu cầu.

**Trong khi code**: đặt file đúng module, không over-engineer, không tự thêm feature/package/module ngoài yêu cầu (vd task chỉ về Product thì không lan sang Cart/Order/Payment/Auth; cần package mới phải có lý do rõ ràng), không sửa file không liên quan.

**Sau khi code — checklist bắt buộc**:
1. Lint pass
2. TypeScript build pass (frontend + backend)
3. Test liên quan pass (nếu có)
4. Không import lỗi / unused code
5. API và frontend khớp nhau (endpoint, payload)
6. Không secret hard-code
7. Task liên quan DB → kiểm tra lại schema/migration
8. Soát lại thay đổi ngoài scope yêu cầu (file/module không liên quan bị sửa)
9. Tóm tắt file đã tạo/sửa và lý do
