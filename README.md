# Comic Store

E-commerce bán truyện/sách cũ. Đây là bộ khung project (skeleton) — infrastructure và cấu trúc thư mục, chưa implement chức năng nghiệp vụ.

## Tech stack

- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS
- Backend: NestJS + TypeScript
- Database: MySQL 8 (Docker)
- ORM: Prisma

## Yêu cầu

- Node.js >= 20
- Docker + Docker Compose

## Cài đặt

Tại thư mục root:

```bash
npm install
```

Lệnh này cài dependencies cho cả `frontend` và `backend` thông qua npm workspaces.

Sao chép file môi trường:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

## Khởi động MySQL

```bash
npm run db:up
```

Các lệnh khác:

```bash
npm run db:down    # dừng MySQL
npm run db:reset   # xoá volume và khởi động lại MySQL (mất toàn bộ data)
```

## Khởi tạo Prisma Client

```bash
npm run --prefix backend prisma:generate
```

## Chạy development

Tại root:

```bash
npm run dev
```

Lệnh này chạy song song frontend và backend, không cần mở 2 terminal.

### URLs

| Service  | URL                              |
| -------- | --------------------------------- |
| Frontend | http://localhost:3000             |
| Backend  | http://localhost:3001             |
| Health   | http://localhost:3001/api/health  |
| MySQL    | localhost:3306                    |

Trang chủ (`/`) hiển thị "Comic Store" và trạng thái kết nối tới backend (`Backend: connected` hoặc lỗi kết nối).

## Cấu trúc project

```
project-root/
├── frontend/               Next.js app (App Router, TypeScript, Tailwind)
│   └── src/
│       ├── app/             route, page, layout
│       ├── components/      ui/, common/, layout/
│       ├── features/        code theo nghiệp vụ (chưa có module nào)
│       ├── services/        API/service dùng chung toàn app
│       ├── lib/
│       ├── hooks/
│       ├── types/
│       └── constants/
│
├── backend/                NestJS app
│   └── src/
│       ├── common/
│       ├── config/          cấu hình tập trung (ConfigModule)
│       ├── database/        PrismaService, DatabaseModule
│       └── ...              module nghiệp vụ sẽ thêm sau (products/, orders/...)
│   └── prisma/
│       └── schema.prisma    chưa có model
│
├── docker/mysql/init/
├── docker-compose.yml       chỉ chạy MySQL
├── package.json             root, npm workspaces + concurrently
├── AGENTS.md                quy tắc phát triển — đọc trước khi code
└── README.md
```

## Files quan trọng

- `AGENTS.md` — quy tắc kiến trúc, coding convention, quy tắc dành cho AI khi phát triển tiếp project. Đọc trước khi thêm code mới.
- `DEPLOY.md` — hướng dẫn setup VPS và deploy lên server (lần đầu và các lần sau).
- `docker-compose.yml` — chạy MySQL 8 kèm healthcheck và named volume `mysql_data`.
- `backend/src/database/` — `PrismaService` dùng Dependency Injection của NestJS, các module khác inject `PrismaService` thay vì tạo `PrismaClient` riêng.
- `frontend/src/features/` — nơi chính chứa code theo nghiệp vụ khi các module (products, cart, orders...) được implement.

## Chưa implement

Project hiện tại CHƯA có các module nghiệp vụ sau (sẽ làm khi được yêu cầu):

- Authentication
- Users
- Products / Categories / Series / Volumes
- Cart
- Orders
- Payments (SePay)
- Wishlist
- Blog
- Admin CRUD
