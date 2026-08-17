-- =====================================================================
-- WEB BÁN TRUYỆN / SÁCH CŨ — MYSQL 8.0 SCHEMA
-- Stack: Next.js + NestJS + MySQL 8 + Prisma
--
-- File này chạy TỰ ĐỘNG khi container MySQL khởi tạo lần đầu (mount vào
-- /docker-entrypoint-initdb.d qua docker-compose.yml). Đây là nguồn sự
-- thật cho cấu trúc bảng — backend/prisma/schema.prisma map 1-1 theo file
-- này để PrismaService dùng (xem comment đầu file đó để biết vài chỗ
-- Prisma không diễn tả được, vẫn do MySQL enforce, ví dụ generated column,
-- FULLTEXT ngram, CHECK constraint).
--
-- LƯU Ý: MySQL chỉ chạy các script trong docker-entrypoint-initdb.d khi
-- data directory (volume mysql_data) đang RỖNG — tức lần đầu tạo container.
-- Nếu đã từng chạy `docker compose up` trước đó, cần `docker compose down -v`
-- (xóa volume) rồi up lại thì thay đổi trong file này mới được áp dụng.
--
-- QUY ƯỚC CHUNG
--   * Engine InnoDB, charset utf8mb4 / collation utf8mb4_0900_ai_ci
--     (ai_ci = accent-insensitive: "truyen" khớp "truyện" khi so sánh/sort)
--   * PK: BIGINT UNSIGNED AUTO_INCREMENT (KHÔNG dùng UUID làm PK —
--     UUID v4 random gây phân mảnh clustered index của InnoDB và làm
--     phình mọi secondary index). Entity nào cần lộ ra ngoài thì có
--     thêm cột code riêng: orders.order_code, payments.payment_code.
--   * Tiền VND: BIGINT UNSIGNED (VND không có phần lẻ). KHÔNG dùng
--     FLOAT/DOUBLE cho tiền.
--   * Thời gian: DATETIME(3) lưu theo UTC, quy đổi ở tầng app.
--     (DATETIME thay vì TIMESTAMP để không dính giới hạn năm 2038.)
--   * Xóa: soft delete (deleted_at) cho catalog vì đơn hàng cũ phải
--     giữ được tham chiếu. Bảng phụ thuộc hoàn toàn thì ON DELETE CASCADE.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Database đã được tạo sẵn bởi MYSQL_DATABASE=comic_store trong
-- docker-compose.yml — chỉ cần USE, không CREATE DATABASE ở đây.
USE `comic_store`;


-- =====================================================================
-- 1. AUTH & NGƯỜI DÙNG
-- =====================================================================

-- Một hệ thống tài khoản chung. ADMIN = CUSTOMER + quyền vào /admin.
-- Không có bảng admins riêng, không có trang login admin riêng.
CREATE TABLE `users` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `full_name`         VARCHAR(150)    NOT NULL,
  `email`             VARCHAR(191)    NULL,
  `phone`             VARCHAR(20)     NULL,
  `password_hash`     VARCHAR(255)    NOT NULL COMMENT 'argon2id hoặc bcrypt cost>=12',
  `role`              ENUM('CUSTOMER','ADMIN') NOT NULL DEFAULT 'CUSTOMER',
  `is_active`         TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '0 = bị khóa, không đăng nhập được',
  `email_verified_at` DATETIME(3)     NULL,
  `last_login_at`     DATETIME(3)     NULL,
  `created_at`        DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`        DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  -- UNIQUE trên cột NULL: MySQL cho phép nhiều NULL, đúng ý đồ
  -- "đăng ký bằng email HOẶC sđt".
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_phone` (`phone`),
  KEY `idx_users_role_active` (`role`, `is_active`),
  CONSTRAINT `chk_users_identity` CHECK (`email` IS NOT NULL OR `phone` IS NOT NULL)
) ENGINE=InnoDB;

-- Refresh token / phiên đăng nhập. Token đặt trong HttpOnly cookie,
-- DB chỉ lưu HASH của token (nếu DB rò rỉ thì token không dùng lại được).
CREATE TABLE `user_sessions` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`        BIGINT UNSIGNED NOT NULL,
  `token_hash`     CHAR(64)        NOT NULL COMMENT 'SHA-256 của refresh token',
  `user_agent`     VARCHAR(255)    NULL,
  `ip_address`     VARBINARY(16)   NULL COMMENT 'INET6_ATON(), dùng chung cho IPv4/IPv6',
  `expires_at`     DATETIME(3)     NOT NULL,
  `revoked_at`     DATETIME(3)     NULL,
  `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sessions_token` (`token_hash`),
  KEY `idx_sessions_user` (`user_id`, `revoked_at`),
  KEY `idx_sessions_expires` (`expires_at`) COMMENT 'cho cron dọn phiên hết hạn',
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `password_reset_tokens` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `token_hash` CHAR(64)        NOT NULL,
  `expires_at` DATETIME(3)     NOT NULL,
  `used_at`    DATETIME(3)     NULL,
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_prt_token` (`token_hash`),
  KEY `idx_prt_user` (`user_id`),
  CONSTRAINT `fk_prt_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Sổ địa chỉ. Đơn hàng KHÔNG FK tới bảng này mà copy snapshot,
-- vì khách sửa/xóa địa chỉ không được làm sai lệch đơn cũ.
CREATE TABLE `addresses` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`        BIGINT UNSIGNED NOT NULL,
  `recipient_name` VARCHAR(150)    NOT NULL,
  `phone`          VARCHAR(20)     NOT NULL,
  `province`       VARCHAR(100)    NOT NULL,
  `district`       VARCHAR(100)    NOT NULL,
  `ward`           VARCHAR(100)    NULL,
  `street_address` VARCHAR(255)    NOT NULL,
  `note`           VARCHAR(255)    NULL,
  `is_default`     TINYINT(1)      NOT NULL DEFAULT 0,
  `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at`     DATETIME(3)     NULL,
  PRIMARY KEY (`id`),
  KEY `idx_addresses_user` (`user_id`, `deleted_at`),
  CONSTRAINT `fk_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;
-- Ràng buộc "mỗi user chỉ 1 địa chỉ mặc định" xử lý ở service layer
-- (trong transaction: UPDATE addresses SET is_default=0 WHERE user_id=? rồi mới set cái mới).


-- =====================================================================
-- 2. CATALOG
-- =====================================================================

-- Tối đa 2 cấp: parent_id NULL = cấp 1, có parent_id = cấp 2.
-- Ràng buộc độ sâu enforce ở app (kiểm tra parent.parent_id IS NULL).
CREATE TABLE `categories` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `parent_id`   BIGINT UNSIGNED NULL,
  `name`        VARCHAR(150)    NOT NULL,
  `slug`        VARCHAR(191)    NOT NULL,
  `description` VARCHAR(500)    NULL,
  `image_url`   VARCHAR(500)    NULL,
  `sort_order`  INT             NOT NULL DEFAULT 0,
  `is_active`   TINYINT(1)      NOT NULL DEFAULT 1,
  `is_featured` TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'hiển thị ở widget/khu vực nổi bật trang chủ',
  `search_keywords` JSON        NULL COMMENT 'mảng từ khóa hỗ trợ tìm kiếm, vd ["sách","truyện"]',
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_slug` (`slug`),
  KEY `idx_categories_parent` (`parent_id`, `sort_order`),
  KEY `idx_categories_featured` (`is_featured`, `sort_order`),
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Bộ truyện (One Piece, Conan...). Sách lẻ thì products.series_id = NULL.
CREATE TABLE `series` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(200)    NOT NULL,
  `slug`        VARCHAR(191)    NOT NULL,
  `author`      VARCHAR(150)    NULL,
  `publisher`   VARCHAR(150)    NULL,
  `description` TEXT            NULL,
  `cover_url`   VARCHAR(500)    NULL,
  `total_volumes` SMALLINT UNSIGNED NULL COMMENT 'tổng số tập của bộ (nếu biết)',
  `is_active`   TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at`  DATETIME(3)     NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_series_slug` (`slug`),
  KEY `idx_series_active` (`is_active`, `deleted_at`)
) ENGINE=InnoDB;

-- PRODUCT = đầu sách hiển thị trên 1 trang chi tiết.
-- Thuộc tính "thư mục học" (tác giả, NXB, mô tả) nằm ở đây.
CREATE TABLE `products` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `series_id`      BIGINT UNSIGNED NULL,
  `name`           VARCHAR(255)    NOT NULL,
  `slug`           VARCHAR(191)    NOT NULL,
  `author`         VARCHAR(150)    NULL,
  `publisher`      VARCHAR(150)    NULL,
  `publish_year`   SMALLINT UNSIGNED NULL,
  `isbn`           VARCHAR(20)     NULL,
  `language`       VARCHAR(50)     NULL DEFAULT 'Tiếng Việt',
  `short_description` VARCHAR(500) NULL,
  `description`    TEXT            NULL,
  `thumbnail_url`  VARCHAR(500)    NULL COMMENT 'denormalize ảnh đại diện để listing không phải JOIN',
  `min_price`      BIGINT UNSIGNED NULL COMMENT 'denormalize MIN(variant.price) — dùng để sort/filter giá',
  `total_stock`    INT             NOT NULL DEFAULT 0 COMMENT 'denormalize SUM(variant.available) — dùng để filter còn/hết',
  `status`         ENUM('DRAFT','ACTIVE','HIDDEN') NOT NULL DEFAULT 'DRAFT',
  `is_featured`    TINYINT(1)      NOT NULL DEFAULT 0,
  `sold_count`     INT UNSIGNED    NOT NULL DEFAULT 0,
  `view_count`     INT UNSIGNED    NOT NULL DEFAULT 0,
  `published_at`   DATETIME(3)     NULL,
  `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at`     DATETIME(3)     NULL COMMENT 'soft delete: không xóa cứng hàng đã có đơn',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_products_slug` (`slug`),
  KEY `idx_products_series` (`series_id`),
  -- index chủ lực cho listing public: lọc trạng thái rồi sort mới nhất
  KEY `idx_products_listing` (`status`, `deleted_at`, `created_at`),
  KEY `idx_products_featured` (`is_featured`, `status`, `created_at`),
  KEY `idx_products_price` (`status`, `min_price`),
  KEY `idx_products_author` (`author`),
  KEY `idx_products_publisher` (`publisher`),
  -- ngram parser: FULLTEXT mặc định có innodb_ft_min_token_size=3,
  -- nhiều từ tiếng Việt chỉ 2 ký tự nên sẽ bị bỏ qua. ngram(n=2) khắc phục.
  FULLTEXT KEY `ft_products_search` (`name`, `author`, `publisher`, `short_description`) WITH PARSER ngram,
  CONSTRAINT `fk_products_series` FOREIGN KEY (`series_id`) REFERENCES `series`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- VARIANT = TẬP truyện (hoặc bản duy nhất của sách lẻ).
-- Đây là đơn vị có GIÁ, TỒN, TÌNH TRẠNG, SKU — tức là thứ được bỏ vào giỏ.
-- Sách lẻ vẫn tạo đúng 1 variant với volume_number = NULL để mọi luồng
-- mua hàng chỉ có MỘT đường đi (không phân nhánh product-vs-variant).
CREATE TABLE `product_variants` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id`       BIGINT UNSIGNED NOT NULL,
  `sku`              VARCHAR(64)     NOT NULL,
  `volume_number`    SMALLINT UNSIGNED NULL COMMENT 'số tập; NULL = sách lẻ',
  `name`             VARCHAR(150)    NULL COMMENT 'ví dụ "Tập 105"; NULL thì hiển thị theo product',
  `price`            BIGINT UNSIGNED NOT NULL COMMENT 'VND',
  `compare_at_price` BIGINT UNSIGNED NULL COMMENT 'giá gạch ngang / giá bìa',
  `condition_grade`  ENUM('NEW','LIKE_NEW','GOOD','FAIR','WORN') NOT NULL DEFAULT 'GOOD',
  `condition_note`   VARCHAR(500)    NULL COMMENT 'mô tả tự do: "ố nhẹ gáy, còn bìa rời"',
  `stock_quantity`   INT             NOT NULL DEFAULT 0 COMMENT 'tồn vật lý',
  `reserved_quantity` INT            NOT NULL DEFAULT 0 COMMENT 'đang bị giữ bởi đơn chờ thanh toán',
  -- cột sinh có index: filter "còn hàng" không cần tính toán runtime
  `available_quantity` INT AS (`stock_quantity` - `reserved_quantity`) STORED,
  `weight_gram`      INT UNSIGNED    NULL COMMENT 'phục vụ tính phí ship sau này',
  `image_url`        VARCHAR(500)    NULL COMMENT 'ảnh riêng của tập',
  `is_active`        TINYINT(1)      NOT NULL DEFAULT 1,
  `sort_order`       INT             NOT NULL DEFAULT 0,
  `created_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at`       DATETIME(3)     NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_variants_sku` (`sku`),
  UNIQUE KEY `uq_variants_product_volume` (`product_id`, `volume_number`),
  KEY `idx_variants_product` (`product_id`, `sort_order`),
  KEY `idx_variants_available` (`is_active`, `available_quantity`),
  CONSTRAINT `fk_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_variants_stock`    CHECK (`stock_quantity` >= 0),
  CONSTRAINT `chk_variants_reserved` CHECK (`reserved_quantity` >= 0 AND `reserved_quantity` <= `stock_quantity`),
  CONSTRAINT `chk_variants_price`    CHECK (`price` > 0)
) ENGINE=InnoDB;

CREATE TABLE `product_images` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `variant_id` BIGINT UNSIGNED NULL COMMENT 'NULL = ảnh chung của product',
  `url`        VARCHAR(500)    NOT NULL,
  `alt`        VARCHAR(255)    NULL,
  `is_real_photo` TINYINT(1)   NOT NULL DEFAULT 1 COMMENT 'ảnh chụp thật vs ảnh bìa nhà xuất bản',
  `sort_order` INT             NOT NULL DEFAULT 0,
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_images_product` (`product_id`, `sort_order`),
  KEY `idx_images_variant` (`variant_id`),
  CONSTRAINT `fk_images_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_images_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- N-N: một cuốn có thể vừa "Manga" vừa "Shounen". Chọn pivot thay vì
-- category_id đơn để không phải migrate đau khi shop mở rộng phân loại.
CREATE TABLE `product_categories` (
  `product_id`  BIGINT UNSIGNED NOT NULL,
  `category_id` BIGINT UNSIGNED NOT NULL,
  `is_primary`  TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'dùng cho breadcrumb',
  PRIMARY KEY (`product_id`, `category_id`),
  KEY `idx_pc_category` (`category_id`, `product_id`) COMMENT 'chiều lọc theo danh mục',
  CONSTRAINT `fk_pc_product`  FOREIGN KEY (`product_id`)  REFERENCES `products`(`id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_pc_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;


-- =====================================================================
-- 3. GIỎ HÀNG & YÊU THÍCH
-- =====================================================================

-- Hỗ trợ cả giỏ khách vãng lai (guest_token trong cookie) lẫn giỏ user.
-- Khi login: merge guest cart vào user cart rồi xóa guest cart.
CREATE TABLE `carts` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT UNSIGNED NULL,
  `guest_token` CHAR(36)        NULL COMMENT 'UUID trong cookie cho khách chưa đăng nhập',
  `expires_at`  DATETIME(3)     NULL COMMENT 'cron dọn giỏ guest cũ',
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_carts_user`  (`user_id`),
  UNIQUE KEY `uq_carts_guest` (`guest_token`),
  CONSTRAINT `fk_carts_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_carts_owner` CHECK (`user_id` IS NOT NULL OR `guest_token` IS NOT NULL)
) ENGINE=InnoDB;

-- CỐ TÌNH KHÔNG lưu giá trong giỏ. Giá luôn đọc live từ variant lúc
-- render và lúc checkout — tránh khách giữ giỏ 3 tuần rồi mua giá cũ,
-- và tránh frontend gửi giá lên.
CREATE TABLE `cart_items` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `cart_id`    BIGINT UNSIGNED NOT NULL,
  `variant_id` BIGINT UNSIGNED NOT NULL,
  `quantity`   INT UNSIGNED    NOT NULL DEFAULT 1,
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cart_items` (`cart_id`, `variant_id`) COMMENT 'thêm lại cùng tập thì UPSERT tăng quantity',
  KEY `idx_cart_items_variant` (`variant_id`),
  CONSTRAINT `fk_cart_items_cart`    FOREIGN KEY (`cart_id`)    REFERENCES `carts`(`id`)            ON DELETE CASCADE,
  CONSTRAINT `fk_cart_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_cart_items_qty` CHECK (`quantity` > 0)
) ENGINE=InnoDB;

CREATE TABLE `wishlist_items` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wishlist` (`user_id`, `product_id`),
  KEY `idx_wishlist_product` (`product_id`),
  CONSTRAINT `fk_wishlist_user`    FOREIGN KEY (`user_id`)    REFERENCES `users`(`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_wishlist_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;


-- =====================================================================
-- 4. ĐƠN HÀNG
-- =====================================================================

-- HAI TRỤC TRẠNG THÁI ĐỘC LẬP (đúng yêu cầu "tách payment và fulfillment"):
--   payment_status : PENDING -> PAID | EXPIRED | REFUNDED   (chỉ backend/webhook đổi)
--   status         : PENDING_PAYMENT -> AWAITING_CONFIRMATION -> CONFIRMED
--                    -> SHIPPING -> COMPLETED | CANCELLED    (admin đổi)
-- Admin KHÔNG có quyền set payment_status = PAID.
CREATE TABLE `orders` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_code`     VARCHAR(32)     NOT NULL COMMENT 'mã public: ORD10025',
  `user_id`        BIGINT UNSIGNED NOT NULL,

  `status`         ENUM('PENDING_PAYMENT','AWAITING_CONFIRMATION','CONFIRMED','SHIPPING','COMPLETED','CANCELLED')
                   NOT NULL DEFAULT 'PENDING_PAYMENT',
  `payment_status` ENUM('PENDING','PAID','EXPIRED','REFUNDED')
                   NOT NULL DEFAULT 'PENDING',

  -- Toàn bộ số tiền do BACKEND tính, không nhận từ client.
  `subtotal`       BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `shipping_fee`   BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `discount_total` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `grand_total`    BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `item_count`     INT UNSIGNED    NOT NULL DEFAULT 0,

  -- SNAPSHOT địa chỉ: copy tại thời điểm đặt, không FK sang addresses.
  `receiver_name`  VARCHAR(150)    NOT NULL,
  `receiver_phone` VARCHAR(20)     NOT NULL,
  `receiver_email` VARCHAR(191)    NULL,
  `province`       VARCHAR(100)    NOT NULL,
  `district`       VARCHAR(100)    NOT NULL,
  `ward`           VARCHAR(100)    NULL,
  `street_address` VARCHAR(255)    NOT NULL,
  `customer_note`  VARCHAR(500)    NULL,

  `admin_note`     VARCHAR(500)    NULL,
  `tracking_code`  VARCHAR(100)    NULL COMMENT 'mã vận đơn, nhập sau cũng được',
  `cancel_reason`  VARCHAR(500)    NULL,

  `stock_hold_expires_at` DATETIME(3) NULL COMMENT 'hết hạn giữ tồn cho đơn chưa thanh toán',
  `paid_at`        DATETIME(3)     NULL,
  `confirmed_at`   DATETIME(3)     NULL,
  `shipped_at`     DATETIME(3)     NULL,
  `completed_at`   DATETIME(3)     NULL,
  `cancelled_at`   DATETIME(3)     NULL,
  `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_orders_code` (`order_code`),
  KEY `idx_orders_user`    (`user_id`, `created_at`)      COMMENT '"Đơn hàng của tôi"',
  KEY `idx_orders_queue`   (`payment_status`, `status`, `created_at`) COMMENT 'hàng đợi admin: paid + chờ xác nhận',
  KEY `idx_orders_expire`  (`payment_status`, `stock_hold_expires_at`) COMMENT 'cron nhả tồn đơn quá hạn',
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_orders_total` CHECK (`grand_total` = `subtotal` + `shipping_fee` - `discount_total`)
) ENGINE=InnoDB;

-- SNAPSHOT sản phẩm. product_id/variant_id chỉ để link tham khảo và
-- có thể NULL nếu sau này catalog bị dọn — dữ liệu hiển thị đã copy sẵn.
CREATE TABLE `order_items` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`        BIGINT UNSIGNED NOT NULL,
  `product_id`      BIGINT UNSIGNED NULL,
  `variant_id`      BIGINT UNSIGNED NULL,
  `product_name`    VARCHAR(255)    NOT NULL,
  `variant_name`    VARCHAR(150)    NULL,
  `sku`             VARCHAR(64)     NOT NULL,
  `condition_grade` VARCHAR(30)     NULL,
  `image_url`       VARCHAR(500)    NULL,
  `unit_price`      BIGINT UNSIGNED NOT NULL COMMENT 'giá tại thời điểm mua — KHÔNG BAO GIỜ đổi',
  `quantity`        INT UNSIGNED    NOT NULL,
  `line_total`      BIGINT UNSIGNED NOT NULL,
  `created_at`      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order`   (`order_id`),
  KEY `idx_order_items_variant` (`variant_id`) COMMENT 'thống kê bán chạy',
  CONSTRAINT `fk_order_items_order`   FOREIGN KEY (`order_id`)   REFERENCES `orders`(`id`)           ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)         ON DELETE SET NULL,
  CONSTRAINT `fk_order_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_order_items_qty`  CHECK (`quantity` > 0),
  CONSTRAINT `chk_order_items_line` CHECK (`line_total` = `unit_price` * `quantity`)
) ENGINE=InnoDB;

-- Audit trail: ai đổi trạng thái gì, lúc nào. Cần khi khách khiếu nại.
CREATE TABLE `order_status_histories` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`     BIGINT UNSIGNED NOT NULL,
  `track`        ENUM('PAYMENT','FULFILLMENT') NOT NULL,
  `from_status`  VARCHAR(40)     NULL,
  `to_status`    VARCHAR(40)     NOT NULL,
  `actor_type`   ENUM('SYSTEM','WEBHOOK','ADMIN','CUSTOMER') NOT NULL,
  `actor_user_id` BIGINT UNSIGNED NULL,
  `note`         VARCHAR(500)    NULL,
  `created_at`   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_osh_order` (`order_id`, `created_at`),
  CONSTRAINT `fk_osh_order` FOREIGN KEY (`order_id`)      REFERENCES `orders`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_osh_actor` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`)  ON DELETE SET NULL
) ENGINE=InnoDB;


-- =====================================================================
-- 5. TỒN KHO
-- =====================================================================

-- Giữ tồn cho đơn chưa thanh toán. Khi tạo order: tăng reserved_quantity
-- + tạo reservation. Khi PAID: COMMITTED (trừ stock_quantity, giảm reserved).
-- Khi hết hạn/hủy: RELEASED (chỉ giảm reserved).
CREATE TABLE `stock_reservations` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`   BIGINT UNSIGNED NOT NULL,
  `variant_id` BIGINT UNSIGNED NOT NULL,
  `quantity`   INT UNSIGNED    NOT NULL,
  `status`     ENUM('HELD','COMMITTED','RELEASED') NOT NULL DEFAULT 'HELD',
  `expires_at` DATETIME(3)     NOT NULL,
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_reservation` (`order_id`, `variant_id`),
  KEY `idx_reservation_sweep` (`status`, `expires_at`) COMMENT 'cron quét đơn quá hạn',
  KEY `idx_reservation_variant` (`variant_id`, `status`),
  CONSTRAINT `fk_reservation_order`   FOREIGN KEY (`order_id`)   REFERENCES `orders`(`id`)           ON DELETE CASCADE,
  CONSTRAINT `fk_reservation_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Sổ cái tồn kho — mọi thay đổi stock_quantity đều ghi 1 dòng.
-- Khi số tồn "sai" (chuyện chắc chắn xảy ra), đây là thứ cứu bạn.
CREATE TABLE `stock_movements` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `variant_id`     BIGINT UNSIGNED NOT NULL,
  `type`           ENUM('IMPORT','SALE','RETURN','ADJUSTMENT','CANCEL_RESTOCK') NOT NULL,
  `quantity_change` INT            NOT NULL COMMENT 'âm = giảm tồn',
  `quantity_after` INT             NOT NULL,
  `reference_type` VARCHAR(50)     NULL COMMENT 'ORDER / MANUAL / ...',
  `reference_id`   BIGINT UNSIGNED NULL,
  `note`           VARCHAR(500)    NULL,
  `created_by`     BIGINT UNSIGNED NULL,
  `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_movements_variant` (`variant_id`, `created_at`),
  KEY `idx_movements_ref` (`reference_type`, `reference_id`),
  CONSTRAINT `fk_movements_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_movements_user`    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)            ON DELETE SET NULL
) ENGINE=InnoDB;


-- =====================================================================
-- 6. THANH TOÁN SEPAY
-- =====================================================================

-- Một order có thể có nhiều payment (đơn cũ hết hạn, sinh QR mới) nhưng
-- tối đa 1 payment PENDING tại một thời điểm.
CREATE TABLE `payments` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`        BIGINT UNSIGNED NOT NULL,
  `payment_code`    VARCHAR(32)     NOT NULL COMMENT 'nội dung chuyển khoản, ví dụ DH10025 — DUY NHẤT',
  `provider`        ENUM('SEPAY')   NOT NULL DEFAULT 'SEPAY',
  `amount`          BIGINT UNSIGNED NOT NULL COMMENT 'phải khớp orders.grand_total',
  `status`          ENUM('PENDING','PAID','EXPIRED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  `bank_code`       VARCHAR(50)     NULL COMMENT 'snapshot cấu hình lúc tạo QR',
  `bank_account_no` VARCHAR(50)     NULL,
  `bank_account_name` VARCHAR(150)  NULL,
  `qr_url`          VARCHAR(1000)   NULL COMMENT 'VietQR đã điền sẵn amount + content',
  `paid_amount`     BIGINT UNSIGNED NULL COMMENT 'số tiền thực nhận',
  `paid_at`         DATETIME(3)     NULL,
  `expires_at`      DATETIME(3)     NULL,
  `created_at`      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payments_code` (`payment_code`) COMMENT 'khóa để khớp giao dịch từ webhook',
  KEY `idx_payments_order`  (`order_id`, `status`),
  KEY `idx_payments_expire` (`status`, `expires_at`),
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- MỌI webhook nhận được đều ghi vào đây, kể cả khi không khớp order nào.
-- UNIQUE(provider, external_transaction_id) chính là cơ chế IDEMPOTENT:
-- SePay gửi lại 5 lần thì lần 2..5 dính duplicate key -> trả 200, bỏ qua.
CREATE TABLE `payment_transactions` (
  `id`                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `provider`                ENUM('SEPAY')   NOT NULL DEFAULT 'SEPAY',
  `external_transaction_id` VARCHAR(100)    NOT NULL COMMENT 'id giao dịch từ SePay',
  `payment_id`              BIGINT UNSIGNED NULL COMMENT 'NULL = chưa khớp được order',
  `gateway_account_no`      VARCHAR(50)     NULL,
  `amount_in`               BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `amount_out`              BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `accumulated`             BIGINT UNSIGNED NULL,
  `transfer_content`        VARCHAR(500)    NULL COMMENT 'nội dung CK thô, để dò payment_code',
  `matched_payment_code`    VARCHAR(32)     NULL,
  `match_status`            ENUM('MATCHED','UNMATCHED','AMOUNT_MISMATCH','DUPLICATE','ALREADY_PAID')
                            NOT NULL DEFAULT 'UNMATCHED',
  `transaction_date`        DATETIME(3)     NULL COMMENT 'thời điểm ngân hàng ghi nhận',
  `raw_payload`             JSON            NOT NULL COMMENT 'giữ nguyên payload để đối soát/replay',
  `received_at`             DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_txn_provider_external` (`provider`, `external_transaction_id`),
  KEY `idx_txn_payment` (`payment_id`),
  KEY `idx_txn_code`    (`matched_payment_code`),
  KEY `idx_txn_status`  (`match_status`, `received_at`) COMMENT 'màn hình đối soát của admin',
  CONSTRAINT `fk_txn_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;


-- =====================================================================
-- 7. YÊU CẦU BÁN SÁCH (THU MUA)
-- =====================================================================

-- Không bắt buộc đăng nhập -> user_id nullable.
CREATE TABLE `sell_requests` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`           VARCHAR(32)     NOT NULL COMMENT 'mã public để khách tra cứu',
  `user_id`        BIGINT UNSIGNED NULL,
  `full_name`      VARCHAR(150)    NOT NULL,
  `phone`          VARCHAR(20)     NOT NULL,
  `email`          VARCHAR(191)    NULL,
  `area`           VARCHAR(150)    NULL COMMENT 'khu vực / tỉnh thành',
  `book_description` TEXT          NOT NULL,
  `quantity_estimate` INT UNSIGNED NULL,
  `expected_price` BIGINT UNSIGNED NULL,
  `status`         ENUM('NEW','CONTACTED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'NEW',
  `admin_note`     VARCHAR(1000)   NULL,
  `handled_by`     BIGINT UNSIGNED NULL,
  `handled_at`     DATETIME(3)     NULL,
  `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sell_code` (`code`),
  KEY `idx_sell_status` (`status`, `created_at`),
  KEY `idx_sell_phone`  (`phone`),
  CONSTRAINT `fk_sell_user`    FOREIGN KEY (`user_id`)    REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sell_handler` FOREIGN KEY (`handled_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE `sell_request_images` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sell_request_id` BIGINT UNSIGNED NOT NULL,
  `url`             VARCHAR(500)    NOT NULL,
  `sort_order`      INT             NOT NULL DEFAULT 0,
  `created_at`      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_sri_request` (`sell_request_id`, `sort_order`),
  CONSTRAINT `fk_sri_request` FOREIGN KEY (`sell_request_id`) REFERENCES `sell_requests`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;


-- =====================================================================
-- 8. NỘI DUNG (CMS ĐƠN GIẢN)
-- =====================================================================

CREATE TABLE `posts` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`         VARCHAR(255)    NOT NULL,
  `slug`          VARCHAR(191)    NOT NULL,
  `excerpt`       VARCHAR(500)    NULL,
  `content`       LONGTEXT        NULL,
  `thumbnail_url` VARCHAR(500)    NULL,
  `status`        ENUM('DRAFT','PUBLISHED') NOT NULL DEFAULT 'DRAFT',
  `author_id`     BIGINT UNSIGNED NULL,
  `view_count`    INT UNSIGNED    NOT NULL DEFAULT 0,
  `published_at`  DATETIME(3)     NULL,
  `created_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at`    DATETIME(3)     NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_posts_slug` (`slug`),
  KEY `idx_posts_public` (`status`, `published_at`),
  CONSTRAINT `fk_posts_author` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Trang tĩnh: giới thiệu, chính sách giao hàng/đổi trả/bảo mật, liên hệ.
CREATE TABLE `pages` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`            VARCHAR(255)    NOT NULL,
  `slug`             VARCHAR(191)    NOT NULL,
  `content`          LONGTEXT        NULL,
  `meta_description` VARCHAR(300)    NULL,
  `is_active`        TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pages_slug` (`slug`)
) ENGINE=InnoDB;

CREATE TABLE `banners` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`      VARCHAR(255)    NULL,
  `image_url`  VARCHAR(500)    NOT NULL,
  `link_url`   VARCHAR(500)    NULL,
  `position`   ENUM('HOME_HERO','HOME_SUB','SIDEBAR') NOT NULL DEFAULT 'HOME_HERO',
  `sort_order` INT             NOT NULL DEFAULT 0,
  `is_active`  TINYINT(1)      NOT NULL DEFAULT 1,
  `start_at`   DATETIME(3)     NULL,
  `end_at`     DATETIME(3)     NULL,
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_banners_display` (`position`, `is_active`, `sort_order`)
) ENGINE=InnoDB;


-- =====================================================================
-- 9. CÀI ĐẶT
-- =====================================================================

-- Key-value cho thông tin shop, tài khoản nhận tiền, phí ship, thời gian
-- giữ tồn... SECRET của SePay NÊN để trong ENV, không để DB. Nếu buộc
-- phải lưu DB thì mã hóa ở tầng app (AES-GCM với key từ ENV) và
-- is_secret = 1 để API trả về dạng che (****1234).
CREATE TABLE `settings` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `group_name`  VARCHAR(50)     NOT NULL COMMENT 'shop | bank | sepay | shipping | order',
  `setting_key` VARCHAR(100)    NOT NULL,
  `value`       TEXT            NULL,
  `value_type`  ENUM('STRING','NUMBER','BOOLEAN','JSON') NOT NULL DEFAULT 'STRING',
  `is_secret`   TINYINT(1)      NOT NULL DEFAULT 0,
  `updated_by`  BIGINT UNSIGNED NULL,
  `updated_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_settings_key` (`setting_key`),
  KEY `idx_settings_group` (`group_name`),
  CONSTRAINT `fk_settings_user` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;


-- =====================================================================
-- SEED CẤU HÌNH TỐI THIỂU
-- =====================================================================
INSERT INTO `settings` (`group_name`, `setting_key`, `value`, `value_type`, `is_secret`) VALUES
  ('shop',     'shop_name',              'Shop Sách Cũ',   'STRING',  0),
  ('shop',     'hotline',                '',               'STRING',  0),
  ('shop',     'email',                  '',               'STRING',  0),
  ('shop',     'address',                '',               'STRING',  0),
  ('bank',     'bank_code',              '',               'STRING',  0),
  ('bank',     'bank_account_no',        '',               'STRING',  0),
  ('bank',     'bank_account_name',      '',               'STRING',  0),
  ('sepay',    'webhook_api_key',        '',               'STRING',  1),
  ('sepay',    'payment_code_prefix',    'DH',             'STRING',  0),
  ('shipping', 'default_shipping_fee',   '30000',          'NUMBER',  0),
  ('shipping', 'free_shipping_threshold','500000',         'NUMBER',  0),
  ('order',    'stock_hold_minutes',     '30',             'NUMBER',  0);


-- =====================================================================
-- PHỤ LỤC A — TRUY VẤN THEN CHỐT (viết sẵn để kiểm chứng index)
-- =====================================================================

-- A1. Listing có filter danh mục + khoảng giá + còn hàng, sort mới nhất
-- SELECT p.id, p.name, p.slug, p.thumbnail_url, p.min_price
-- FROM products p
-- JOIN product_categories pc ON pc.product_id = p.id AND pc.category_id = ?
-- WHERE p.status = 'ACTIVE' AND p.deleted_at IS NULL
--   AND p.min_price BETWEEN ? AND ?
--   AND p.total_stock > 0
-- ORDER BY p.created_at DESC
-- LIMIT 24 OFFSET ?;

-- A2. Search (ngram fulltext)
-- SELECT p.id, p.name, MATCH(p.name, p.author, p.publisher, p.short_description)
--        AGAINST (? IN NATURAL LANGUAGE MODE) AS score
-- FROM products p
-- WHERE p.status = 'ACTIVE' AND p.deleted_at IS NULL
--   AND MATCH(p.name, p.author, p.publisher, p.short_description)
--       AGAINST (? IN NATURAL LANGUAGE MODE)
-- ORDER BY score DESC LIMIT 24;

-- A3. Hàng đợi xử lý của admin (đơn đã trả tiền, chờ xác nhận)
-- SELECT o.* FROM orders o
-- WHERE o.payment_status = 'PAID' AND o.status = 'AWAITING_CONFIRMATION'
-- ORDER BY o.paid_at ASC;

-- A4. Cron nhả tồn đơn quá hạn (chạy mỗi phút)
-- SELECT r.* FROM stock_reservations r
-- WHERE r.status = 'HELD' AND r.expires_at < NOW(3)
-- LIMIT 200;


-- =====================================================================
-- PHỤ LỤC B — HAI TRANSACTION QUAN TRỌNG NHẤT (pseudo-SQL)
-- =====================================================================

-- B1. TẠO ĐƠN (checkout) — REPEATABLE READ, khóa bi quan trên variant
--   START TRANSACTION;
--   -- khóa theo thứ tự variant_id TĂNG DẦN để không deadlock
--   SELECT id, price, stock_quantity, reserved_quantity
--     FROM product_variants
--    WHERE id IN (...) ORDER BY id FOR UPDATE;
--   -- app kiểm tra: quantity <= stock_quantity - reserved_quantity
--   INSERT INTO orders (...);                     -- grand_total do backend tính
--   INSERT INTO order_items (...);                -- snapshot giá LẤY TỪ DB, không từ client
--   UPDATE product_variants
--      SET reserved_quantity = reserved_quantity + ? WHERE id = ?;
--   INSERT INTO stock_reservations (..., status='HELD', expires_at = NOW() + INTERVAL 30 MINUTE);
--   INSERT INTO payments (payment_code, amount, status='PENDING', expires_at=...);
--   COMMIT;

-- B2. XỬ LÝ WEBHOOK SEPAY — idempotent bằng UNIQUE KEY
--   START TRANSACTION;
--   INSERT INTO payment_transactions (provider, external_transaction_id, raw_payload, ...)
--     -- nếu ném lỗi duplicate key => webhook lặp => ROLLBACK, trả 200, DỪNG
--   SELECT * FROM payments WHERE payment_code = ? FOR UPDATE;
--   -- chỉ set PAID khi: payment.status='PENDING' AND amount_in = payment.amount
--   UPDATE payments SET status='PAID', paid_at=NOW(3), paid_amount=?;
--   UPDATE orders SET payment_status='PAID', status='AWAITING_CONFIRMATION', paid_at=NOW(3);
--   UPDATE product_variants
--      SET stock_quantity = stock_quantity - ?, reserved_quantity = reserved_quantity - ?
--    WHERE id = ?;                                -- chốt tồn thật
--   UPDATE stock_reservations SET status='COMMITTED' WHERE order_id = ?;
--   INSERT INTO stock_movements (type='SALE', ...);
--   INSERT INTO order_status_histories (actor_type='WEBHOOK', ...);
--   COMMIT;
--   -- Không khớp số tiền => match_status='AMOUNT_MISMATCH', KHÔNG set PAID,
--   --   để admin xử lý tay trong màn hình đối soát.
