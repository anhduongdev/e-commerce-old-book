-- =====================================================================
-- DỮ LIỆU MẪU — Comic Store
-- =====================================================================
-- File này CHỈ thêm dữ liệu mẫu (users, categories, series, products,
-- variants) vào schema đã có sẵn (docker/mysql/init/schema.sql). Không
-- tạo bảng, không xóa dữ liệu cũ — chỉ INSERT.
--
-- KHÁC với docker/mysql/init/schema.sql: file đó nằm trong thư mục
-- init/ nên tự chạy khi container MySQL khởi tạo lần đầu. File này CỐ
-- TÌNH đặt ngoài thư mục init/ để không tự động chạy — bạn chủ động
-- chạy khi nào muốn có dữ liệu mẫu (không phải lúc nào cũng muốn seed
-- data giả vào DB, nhất là trên server).
--
-- CÁCH CHẠY
-- ---------
-- Local (MySQL chạy qua Docker, xem README.md):
--   docker exec -i comic_store_mysql mysql -u comic_user -pcomic_password comic_store < docker/mysql/seed-sample-data.sql
--
-- VPS / server (MySQL cài trực tiếp, xem DEPLOY.md Phase 5):
--   mysql -u comic_user -p comic_store < docker/mysql/seed-sample-data.sql
--
-- HeidiSQL: mở tab SQL, dán nội dung file này, F9 để chạy — hoặc
-- File → Load SQL file rồi chạy.
--
-- CHẠY LẠI: mọi slug/sku/email trong file đều UNIQUE trong DB — chạy
-- lần 2 trên dữ liệu đã seed sẽ báo lỗi "Duplicate entry" (đây là hàng
-- rào an toàn có chủ đích, tránh seed trùng). Muốn seed lại từ đầu,
-- xóa dữ liệu mẫu trước bằng khối lệnh cuối file (đang comment sẵn).
--
-- TÀI KHOẢN ĐĂNG NHẬP MẪU (mật khẩu giống nhau cho cả 3, dùng để test)
--   Mật khẩu: Password123!
--   admin@tiemsachxua.site        — role ADMIN, vào được /admin
--   khachhang1@example.com        — role CUSTOMER
--   khachhang2@example.com        — role CUSTOMER
-- =====================================================================

SET NAMES utf8mb4;
START TRANSACTION;


-- =====================================================================
-- 1. USERS
-- =====================================================================
-- password_hash dưới đây là bcrypt (cost 12) của "Password123!" — tạo
-- bằng đúng thư viện backend đang dùng (backend/src/auth/auth.service.ts),
-- nên đăng nhập được ngay, không cần đổi mật khẩu.

INSERT INTO `users` (`full_name`, `email`, `phone`, `password_hash`, `role`, `is_active`, `email_verified_at`)
VALUES ('Quản Trị Viên', 'admin@tiemsachxua.site', '0909000001',
        '$2b$12$mIzymO8HDHBWfvYnM/ewC.BY/.PjhGNrsQkKsMbdBnnZvaWqttzoK',
        'ADMIN', 1, NOW(3));
SET @admin_id := LAST_INSERT_ID();

INSERT INTO `users` (`full_name`, `email`, `phone`, `password_hash`, `role`, `is_active`, `email_verified_at`)
VALUES ('Nguyễn Văn An', 'khachhang1@example.com', '0909000002',
        '$2b$12$mIzymO8HDHBWfvYnM/ewC.BY/.PjhGNrsQkKsMbdBnnZvaWqttzoK',
        'CUSTOMER', 1, NOW(3));
SET @cust1_id := LAST_INSERT_ID();

INSERT INTO `users` (`full_name`, `email`, `phone`, `password_hash`, `role`, `is_active`, `email_verified_at`)
VALUES ('Trần Thị Bình', 'khachhang2@example.com', '0909000003',
        '$2b$12$mIzymO8HDHBWfvYnM/ewC.BY/.PjhGNrsQkKsMbdBnnZvaWqttzoK',
        'CUSTOMER', 1, NOW(3));
SET @cust2_id := LAST_INSERT_ID();

-- Sổ địa chỉ mẫu cho 2 khách hàng (dùng khi test checkout).
INSERT INTO `addresses` (`user_id`, `recipient_name`, `phone`, `province`, `district`, `ward`, `street_address`, `is_default`)
VALUES
  (@cust1_id, 'Nguyễn Văn An', '0909000002', 'TP. Hồ Chí Minh', 'Quận 1', 'Phường Bến Nghé', '12 Nguyễn Huệ', 1),
  (@cust2_id, 'Trần Thị Bình', '0909000003', 'Hà Nội', 'Quận Đống Đa', 'Phường Láng Hạ', '45 Láng Hạ', 1);


-- =====================================================================
-- 2. CATEGORIES (tối đa 2 cấp)
-- =====================================================================

INSERT INTO `categories` (`name`, `slug`, `description`, `sort_order`, `is_featured`, `search_keywords`)
VALUES ('Truyện tranh', 'truyen-tranh', 'Manga và truyện tranh các thể loại', 1, 1, JSON_ARRAY('truyện tranh', 'manga', 'comic'));
SET @cat_truyen_tranh := LAST_INSERT_ID();

INSERT INTO `categories` (`name`, `slug`, `description`, `sort_order`, `is_featured`, `search_keywords`)
VALUES ('Sách', 'sach', 'Sách văn học, kỹ năng sống', 2, 1, JSON_ARRAY('sách', 'sách cũ'));
SET @cat_sach := LAST_INSERT_ID();

INSERT INTO `categories` (`parent_id`, `name`, `slug`, `description`, `sort_order`)
VALUES (@cat_truyen_tranh, 'Manga Shounen', 'manga-shounen', 'Manga hướng đến độc giả nam thiếu niên', 1);
SET @cat_manga_shounen := LAST_INSERT_ID();

INSERT INTO `categories` (`parent_id`, `name`, `slug`, `description`, `sort_order`)
VALUES (@cat_truyen_tranh, 'Manga Shoujo', 'manga-shoujo', 'Manga hướng đến độc giả nữ thiếu niên', 2);
SET @cat_manga_shoujo := LAST_INSERT_ID();

INSERT INTO `categories` (`parent_id`, `name`, `slug`, `description`, `sort_order`)
VALUES (@cat_sach, 'Văn học Việt Nam', 'van-hoc-viet-nam', 'Tác phẩm văn học của tác giả Việt Nam', 1);
SET @cat_van_hoc_vn := LAST_INSERT_ID();

INSERT INTO `categories` (`parent_id`, `name`, `slug`, `description`, `sort_order`)
VALUES (@cat_sach, 'Văn học nước ngoài', 'van-hoc-nuoc-ngoai', 'Tác phẩm văn học dịch từ nước ngoài', 2);
SET @cat_van_hoc_nn := LAST_INSERT_ID();

INSERT INTO `categories` (`parent_id`, `name`, `slug`, `description`, `sort_order`)
VALUES (@cat_sach, 'Sách kỹ năng sống', 'sach-ky-nang-song', 'Sách phát triển bản thân, kỹ năng sống', 3);
SET @cat_ky_nang_song := LAST_INSERT_ID();


-- =====================================================================
-- 3. SERIES (bộ truyện nhiều tập)
-- =====================================================================

INSERT INTO `series` (`name`, `slug`, `author`, `publisher`, `description`, `total_volumes`)
VALUES ('One Piece', 'one-piece', 'Eiichiro Oda', 'NXB Kim Đồng', 'Hành trình trở thành Vua Hải Tặc của Luffy và băng Mũ Rơm.', 105);
SET @series_one_piece := LAST_INSERT_ID();

INSERT INTO `series` (`name`, `slug`, `author`, `publisher`, `description`, `total_volumes`)
VALUES ('Thám Tử Lừng Danh Conan', 'conan', 'Gosho Aoyama', 'NXB Kim Đồng', 'Thám tử học sinh Conan Edogawa phá án cùng các vụ trọng án.', 105);
SET @series_conan := LAST_INSERT_ID();

INSERT INTO `series` (`name`, `slug`, `author`, `publisher`, `description`, `total_volumes`)
VALUES ('Doraemon', 'doraemon', 'Fujiko F. Fujio', 'NXB Kim Đồng', 'Chú mèo máy đến từ tương lai và cậu bé Nobita.', 45);
SET @series_doraemon := LAST_INSERT_ID();

INSERT INTO `series` (`name`, `slug`, `author`, `publisher`, `description`, `total_volumes`)
VALUES ('Naruto', 'naruto', 'Masashi Kishimoto', 'NXB Kim Đồng', 'Hành trình trở thành Hokage của ninja Naruto Uzumaki.', 72);
SET @series_naruto := LAST_INSERT_ID();


-- =====================================================================
-- 4. PRODUCTS + VARIANTS
-- =====================================================================
-- min_price / total_stock KHÔNG insert ở đây (để NULL / mặc định 0) —
-- Phase 5 cuối file tự tính lại chính xác từ product_variants sau khi
-- toàn bộ variant đã có, không cộng tay dễ sai.

-- ---- P1. One Piece (bộ nhiều tập) ----
INSERT INTO `products` (`series_id`, `name`, `slug`, `author`, `publisher`, `short_description`, `status`, `is_featured`, `sold_count`, `view_count`, `published_at`)
VALUES (@series_one_piece, 'One Piece', 'one-piece', 'Eiichiro Oda', 'NXB Kim Đồng', 'Truyện tranh One Piece bản tiếng Việt, sách cũ còn đẹp.', 'ACTIVE', 1, 42, 530, DATE_SUB(NOW(3), INTERVAL 5 DAY));
SET @p_one_piece := LAST_INSERT_ID();
INSERT INTO `product_categories` (`product_id`, `category_id`, `is_primary`) VALUES (@p_one_piece, @cat_manga_shounen, 1);
INSERT INTO `product_variants` (`product_id`, `sku`, `volume_number`, `name`, `price`, `condition_grade`, `stock_quantity`, `sort_order`) VALUES
  (@p_one_piece, 'OP-098', 98, 'Tập 98', 25000, 'GOOD',     5, 0),
  (@p_one_piece, 'OP-099', 99, 'Tập 99', 25000, 'LIKE_NEW', 3, 1),
  (@p_one_piece, 'OP-100', 100, 'Tập 100', 28000, 'NEW',    8, 2),
  (@p_one_piece, 'OP-101', 101, 'Tập 101', 28000, 'GOOD',   4, 3);

-- ---- P2. Thám Tử Lừng Danh Conan (bộ nhiều tập) ----
INSERT INTO `products` (`series_id`, `name`, `slug`, `author`, `publisher`, `short_description`, `status`, `is_featured`, `sold_count`, `view_count`, `published_at`)
VALUES (@series_conan, 'Thám Tử Lừng Danh Conan', 'conan', 'Gosho Aoyama', 'NXB Kim Đồng', 'Truyện tranh Conan bản tiếng Việt, sách cũ.', 'ACTIVE', 1, 37, 410, DATE_SUB(NOW(3), INTERVAL 8 DAY));
SET @p_conan := LAST_INSERT_ID();
INSERT INTO `product_categories` (`product_id`, `category_id`, `is_primary`) VALUES (@p_conan, @cat_manga_shounen, 1);
INSERT INTO `product_variants` (`product_id`, `sku`, `volume_number`, `name`, `price`, `condition_grade`, `stock_quantity`, `sort_order`) VALUES
  (@p_conan, 'CN-100', 100, 'Tập 100', 22000, 'GOOD',     6, 0),
  (@p_conan, 'CN-101', 101, 'Tập 101', 22000, 'FAIR',     2, 1),
  (@p_conan, 'CN-102', 102, 'Tập 102', 25000, 'LIKE_NEW', 5, 2);

-- ---- P3. Doraemon (bộ nhiều tập) ----
INSERT INTO `products` (`series_id`, `name`, `slug`, `author`, `publisher`, `short_description`, `status`, `is_featured`, `sold_count`, `view_count`, `published_at`)
VALUES (@series_doraemon, 'Doraemon', 'doraemon', 'Fujiko F. Fujio', 'NXB Kim Đồng', 'Truyện tranh Doraemon bản tiếng Việt, sách cũ.', 'ACTIVE', 0, 58, 620, DATE_SUB(NOW(3), INTERVAL 15 DAY));
SET @p_doraemon := LAST_INSERT_ID();
INSERT INTO `product_categories` (`product_id`, `category_id`, `is_primary`) VALUES (@p_doraemon, @cat_manga_shounen, 1);
INSERT INTO `product_variants` (`product_id`, `sku`, `volume_number`, `name`, `price`, `condition_grade`, `condition_note`, `stock_quantity`, `sort_order`) VALUES
  (@p_doraemon, 'DR-001', 1, 'Tập 1', 18000, 'WORN', 'Ố nhẹ gáy, còn đủ trang', 3, 0),
  (@p_doraemon, 'DR-002', 2, 'Tập 2', 18000, 'GOOD', NULL, 4, 1),
  (@p_doraemon, 'DR-003', 3, 'Tập 3', 20000, 'NEW',  NULL, 10, 2);

-- ---- P4. Naruto (bộ nhiều tập, có 1 tập hết hàng để test UI "Hết hàng") ----
INSERT INTO `products` (`series_id`, `name`, `slug`, `author`, `publisher`, `short_description`, `status`, `is_featured`, `sold_count`, `view_count`, `published_at`)
VALUES (@series_naruto, 'Naruto', 'naruto', 'Masashi Kishimoto', 'NXB Kim Đồng', 'Truyện tranh Naruto bản tiếng Việt, sách cũ.', 'ACTIVE', 0, 29, 340, DATE_SUB(NOW(3), INTERVAL 20 DAY));
SET @p_naruto := LAST_INSERT_ID();
INSERT INTO `product_categories` (`product_id`, `category_id`, `is_primary`) VALUES (@p_naruto, @cat_manga_shounen, 1);
INSERT INTO `product_variants` (`product_id`, `sku`, `volume_number`, `name`, `price`, `condition_grade`, `stock_quantity`, `sort_order`) VALUES
  (@p_naruto, 'NR-070', 70, 'Tập 70', 20000, 'GOOD',     5, 0),
  (@p_naruto, 'NR-071', 71, 'Tập 71', 20000, 'GOOD',     5, 1),
  (@p_naruto, 'NR-072', 72, 'Tập 72', 22000, 'LIKE_NEW', 0, 2);

-- ---- P5. Nhà Giả Kim (sách lẻ) ----
INSERT INTO `products` (`name`, `slug`, `author`, `publisher`, `publish_year`, `short_description`, `status`, `is_featured`, `sold_count`, `view_count`, `published_at`)
VALUES ('Nhà Giả Kim', 'nha-gia-kim', 'Paulo Coelho', 'NXB Văn học', 2020, 'Hành trình đi tìm kho báu và bài học về ước mơ.', 'ACTIVE', 1, 65, 700, DATE_SUB(NOW(3), INTERVAL 3 DAY));
SET @p_nha_gia_kim := LAST_INSERT_ID();
INSERT INTO `product_categories` (`product_id`, `category_id`, `is_primary`) VALUES (@p_nha_gia_kim, @cat_van_hoc_nn, 1);
INSERT INTO `product_variants` (`product_id`, `sku`, `name`, `price`, `compare_at_price`, `condition_grade`, `stock_quantity`, `sort_order`) VALUES
  (@p_nha_gia_kim, 'NGK-001', 'Bản duy nhất', 45000, 90000, 'LIKE_NEW', 7, 0);

-- ---- P6. Tôi Thấy Hoa Vàng Trên Cỏ Xanh (sách lẻ) ----
INSERT INTO `products` (`name`, `slug`, `author`, `publisher`, `publish_year`, `short_description`, `status`, `is_featured`, `sold_count`, `view_count`, `published_at`)
VALUES ('Tôi Thấy Hoa Vàng Trên Cỏ Xanh', 'toi-thay-hoa-vang-tren-co-xanh', 'Nguyễn Nhật Ánh', 'NXB Trẻ', 2018, 'Ký ức tuổi thơ trong trẻo ở một làng quê Việt Nam.', 'ACTIVE', 1, 51, 480, DATE_SUB(NOW(3), INTERVAL 6 DAY));
SET @p_hoa_vang := LAST_INSERT_ID();
INSERT INTO `product_categories` (`product_id`, `category_id`, `is_primary`) VALUES (@p_hoa_vang, @cat_van_hoc_vn, 1);
INSERT INTO `product_variants` (`product_id`, `sku`, `name`, `price`, `compare_at_price`, `condition_grade`, `stock_quantity`, `sort_order`) VALUES
  (@p_hoa_vang, 'HVCX-001', 'Bản duy nhất', 40000, 85000, 'GOOD', 6, 0);

-- ---- P7. Mắt Biếc (sách lẻ) ----
INSERT INTO `products` (`name`, `slug`, `author`, `publisher`, `publish_year`, `short_description`, `status`, `is_featured`, `sold_count`, `view_count`, `published_at`)
VALUES ('Mắt Biếc', 'mat-biec', 'Nguyễn Nhật Ánh', 'NXB Trẻ', 2017, 'Câu chuyện tình yêu đơn phương buồn của Ngạn dành cho Hà Lan.', 'ACTIVE', 0, 33, 390, DATE_SUB(NOW(3), INTERVAL 12 DAY));
SET @p_mat_biec := LAST_INSERT_ID();
INSERT INTO `product_categories` (`product_id`, `category_id`, `is_primary`) VALUES (@p_mat_biec, @cat_van_hoc_vn, 1);
INSERT INTO `product_variants` (`product_id`, `sku`, `name`, `price`, `condition_grade`, `stock_quantity`, `sort_order`) VALUES
  (@p_mat_biec, 'MB-001', 'Bản duy nhất', 38000, 'GOOD', 4, 0);

-- ---- P8. Đắc Nhân Tâm (sách lẻ) ----
INSERT INTO `products` (`name`, `slug`, `author`, `publisher`, `publish_year`, `short_description`, `status`, `is_featured`, `sold_count`, `view_count`, `published_at`)
VALUES ('Đắc Nhân Tâm', 'dac-nhan-tam', 'Dale Carnegie', 'NXB Tổng hợp TP.HCM', 2019, 'Sách kỹ năng sống bán chạy nhất mọi thời đại.', 'ACTIVE', 0, 80, 810, DATE_SUB(NOW(3), INTERVAL 10 DAY));
SET @p_dac_nhan_tam := LAST_INSERT_ID();
INSERT INTO `product_categories` (`product_id`, `category_id`, `is_primary`) VALUES (@p_dac_nhan_tam, @cat_ky_nang_song, 1);
INSERT INTO `product_variants` (`product_id`, `sku`, `name`, `price`, `compare_at_price`, `condition_grade`, `stock_quantity`, `sort_order`) VALUES
  (@p_dac_nhan_tam, 'DNT-001', 'Bản duy nhất', 42000, 88000, 'LIKE_NEW', 9, 0);

-- ---- P9. Người Giàu Có Nhất Thành Babylon (sách lẻ) ----
INSERT INTO `products` (`name`, `slug`, `author`, `publisher`, `publish_year`, `short_description`, `status`, `is_featured`, `sold_count`, `view_count`, `published_at`)
VALUES ('Người Giàu Có Nhất Thành Babylon', 'nguoi-giau-co-nhat-thanh-babylon', 'George S. Clason', 'NXB Tổng hợp TP.HCM', 2016, 'Những bài học quản lý tài chính cá nhân kinh điển.', 'ACTIVE', 0, 19, 210, DATE_SUB(NOW(3), INTERVAL 18 DAY));
SET @p_babylon := LAST_INSERT_ID();
INSERT INTO `product_categories` (`product_id`, `category_id`, `is_primary`) VALUES (@p_babylon, @cat_ky_nang_song, 1);
INSERT INTO `product_variants` (`product_id`, `sku`, `name`, `price`, `condition_grade`, `stock_quantity`, `sort_order`) VALUES
  (@p_babylon, 'NGCNTB-001', 'Bản duy nhất', 35000, 'FAIR', 2, 0);

-- ---- P10. Số Đỏ (sách lẻ) ----
INSERT INTO `products` (`name`, `slug`, `author`, `publisher`, `publish_year`, `short_description`, `status`, `is_featured`, `sold_count`, `view_count`, `published_at`)
VALUES ('Số Đỏ', 'so-do', 'Vũ Trọng Phụng', 'NXB Văn học', 2015, 'Tiểu thuyết trào phúng kinh điển của văn học Việt Nam.', 'ACTIVE', 0, 12, 150, DATE_SUB(NOW(3), INTERVAL 25 DAY));
SET @p_so_do := LAST_INSERT_ID();
INSERT INTO `product_categories` (`product_id`, `category_id`, `is_primary`) VALUES (@p_so_do, @cat_van_hoc_vn, 1);
INSERT INTO `product_variants` (`product_id`, `sku`, `name`, `price`, `condition_grade`, `condition_note`, `stock_quantity`, `sort_order`) VALUES
  (@p_so_do, 'SD-001', 'Bản duy nhất', 30000, 'WORN', 'Bìa cũ, có vài vết ố nhưng chữ rõ', 1, 0);


-- =====================================================================
-- 5. CHỐT LẠI min_price / total_stock (denormalize)
-- =====================================================================
-- Tính lại chính xác từ product_variants thay vì tin vào số cộng tay ở
-- trên — đúng cách hệ thống thật sẽ tự làm sau mỗi lần đổi giá/tồn.

UPDATE `products` p
JOIN (
  SELECT `product_id`,
         MIN(`price`) AS `min_price`,
         SUM(GREATEST(`stock_quantity` - `reserved_quantity`, 0)) AS `total_stock`
  FROM `product_variants`
  WHERE `is_active` = 1 AND `deleted_at` IS NULL
  GROUP BY `product_id`
) v ON v.`product_id` = p.`id`
SET p.`min_price` = v.`min_price`,
    p.`total_stock` = v.`total_stock`
WHERE p.`slug` IN (
  'one-piece', 'conan', 'doraemon', 'naruto',
  'nha-gia-kim', 'toi-thay-hoa-vang-tren-co-xanh', 'mat-biec',
  'dac-nhan-tam', 'nguoi-giau-co-nhat-thanh-babylon', 'so-do'
);

COMMIT;

-- Kiểm tra nhanh sau khi chạy xong:
SELECT (SELECT COUNT(*) FROM `users`) AS users,
       (SELECT COUNT(*) FROM `categories`) AS categories,
       (SELECT COUNT(*) FROM `series`) AS series,
       (SELECT COUNT(*) FROM `products`) AS products,
       (SELECT COUNT(*) FROM `product_variants`) AS variants;


-- =====================================================================
-- DỌN DỮ LIỆU MẪU (nếu cần seed lại từ đầu) — ĐANG COMMENT, bỏ comment
-- để chạy. Xóa products sẽ tự CASCADE variants/images/product_categories;
-- xóa users sẽ tự CASCADE addresses/sessions liên quan.
-- =====================================================================
-- DELETE FROM `products` WHERE `slug` IN (
--   'one-piece', 'conan', 'doraemon', 'naruto',
--   'nha-gia-kim', 'toi-thay-hoa-vang-tren-co-xanh', 'mat-biec',
--   'dac-nhan-tam', 'nguoi-giau-co-nhat-thanh-babylon', 'so-do'
-- );
-- DELETE FROM `series` WHERE `slug` IN ('one-piece', 'conan', 'doraemon', 'naruto');
-- -- Xóa category con trước (fk_categories_parent là ON DELETE RESTRICT,
-- -- xóa cha trước khi con còn tồn tại sẽ báo lỗi khóa ngoại):
-- DELETE FROM `categories` WHERE `slug` IN (
--   'manga-shounen', 'manga-shoujo', 'van-hoc-viet-nam',
--   'van-hoc-nuoc-ngoai', 'sach-ky-nang-song'
-- );
-- DELETE FROM `categories` WHERE `slug` IN ('truyen-tranh', 'sach');
-- DELETE FROM `users` WHERE `email` IN (
--   'admin@tiemsachxua.site', 'khachhang1@example.com', 'khachhang2@example.com'
-- );
