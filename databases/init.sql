CREATE DATABASE IF NOT EXISTS ElearningDatabase CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
use ElearningDatabase;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE `class` (
  `id` int NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `subject_id` int DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `status` ENUM('active', 'ended') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `doexam` (
  `id` int NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `student_id` int DEFAULT NULL,
  `test_id` int DEFAULT NULL,
  `attendAt` datetime DEFAULT NULL,
  `submitAt` datetime DEFAULT NULL,
  `score` float DEFAULT NULL,
  `turn` int(11) DEFAULT NULL,
  `status` ENUM('DOING', 'DONE', 'PENDING')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `enrollment` (
  `student_id` int NOT NULL,
  `class_id` int NOT NULL,
  `averageScore` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `subject` (
  `id` int NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lessons` int(11) DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `test` (
  `id` int NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `createBy` int DEFAULT NULL,
  `turn` int(11) DEFAULT NULL,
  `startAt` datetime DEFAULT NULL,
  `endAt` datetime DEFAULT NULL,
  `duration` int NOT NULL,
  `num_question` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user` (
  `id` int NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `role` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
  token TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    expires_at DATETIME NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `class`
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `teacher_id` (`teacher_id`);

ALTER TABLE `doexam`
  ADD KEY `student_id` (`student_id`),
  ADD KEY `test_id` (`test_id`);

ALTER TABLE `enrollment`
  ADD PRIMARY KEY (`student_id`,`class_id`),
  ADD KEY `class_id` (`class_id`);

ALTER TABLE `user`
  MODIFY COLUMN `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE `user`
  MODIFY COLUMN `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `test`
  ADD KEY `class_id` (`class_id`),
  ADD KEY `createBy` (`createBy`);

ALTER TABLE `class`
  ADD CONSTRAINT `class_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subject`(`id`),
  ADD CONSTRAINT `class_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `user`(`id`);

ALTER TABLE `class` 
  MODIFY COLUMN `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE `class` 
  MODIFY COLUMN `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;


ALTER TABLE `doexam`
  ADD CONSTRAINT `doexam_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `user` (`id`),
  ADD CONSTRAINT `doexam_ibfk_2` FOREIGN KEY (`test_id`) REFERENCES `test` (`id`);

ALTER TABLE `enrollment`
  ADD CONSTRAINT `enrollment_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `user` (`id`),
  ADD CONSTRAINT `enrollment_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `class` (`id`);

ALTER TABLE `test`
  ADD CONSTRAINT `test_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `class` (`id`),
  ADD CONSTRAINT `test_ibfk_2` FOREIGN KEY (`createBy`) REFERENCES `user` (`id`);
COMMIT;

USE ElearningDatabase;

-- ============================================================
-- SEED DATA - ElearningDatabase
-- Thứ tự insert theo dependency của foreign key:
--   user → subject → class → enrollment → test → doexam → refresh_tokens
-- ============================================================

-- Tắt kiểm tra FK tạm thời để tránh lỗi thứ tự
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. BẢNG user
--    role: 'teacher' | 'student' | 'admin'
--    password hash của '123456' (bcrypt)
-- ============================================================
INSERT INTO `user` (id, name, dob, role, email, phone, status, password, createdAt, updatedAt) VALUES
(1,  'Nguyễn Văn An',    '1985-03-12', 'teacher', 'nguyenvanan@gmail.com',    '0901111001', 1, '$2a$12$oiwwPvK8FuInO4MYtmAzcOYfi7VdRDbh/.vvK//O3IkWdjKG4wP/W', '2025-01-10 08:00:00', '2025-01-10 08:00:00'),
(2,  'Trần Thị Bình',    '1988-07-25', 'teacher', 'tranthihinh@gmail.com',    '0901111002', 1, '$2a$12$oiwwPvK8FuInO4MYtmAzcOYfi7VdRDbh/.vvK//O3IkWdjKG4wP/W', '2025-01-10 08:05:00', '2025-01-10 08:05:00'),
(3,  'Lê Minh Cường',    '1990-11-08', 'teacher', 'leminhcuong@gmail.com',    '0901111003', 1, '$2a$12$oiwwPvK8FuInO4MYtmAzcOYfi7VdRDbh/.vvK//O3IkWdjKG4wP/W', '2025-01-11 09:00:00', '2025-01-11 09:00:00'),
(4,  'Phạm Thị Dung',    '1992-05-18', 'student', 'phamthidung@gmail.com',       '0912222001', 1, '$2a$12$oiwwPvK8FuInO4MYtmAzcOYfi7VdRDbh/.vvK//O3IkWdjKG4wP/W', '2025-02-01 10:00:00', '2025-02-01 10:00:00'),
(5,  'Hoàng Văn Em',     '2003-09-30', 'student', 'hoangvanem@gmail.com',        '0912222002', 1, '$2a$12$oiwwPvK8FuInO4MYtmAzcOYfi7VdRDbh/.vvK//O3IkWdjKG4wP/W', '2025-02-01 10:10:00', '2025-02-01 10:10:00'),
(6,  'Vũ Thị Phương',    '2002-12-14', 'student', 'vuthiphuong@gmail.com',       '0912222003', 1, '$2a$12$oiwwPvK8FuInO4MYtmAzcOYfi7VdRDbh/.vvK//O3IkWdjKG4wP/W', '2025-02-02 08:30:00', '2025-02-02 08:30:00'),
(7,  'Đặng Quốc Huy',    '2003-04-22', 'student', 'dangquochuy@gmail.com',       '0912222004', 1, '$2a$12$oiwwPvK8FuInO4MYtmAzcOYfi7VdRDbh/.vvK//O3IkWdjKG4wP/W', '2025-02-02 09:00:00', '2025-02-02 09:00:00'),
(8,  'Ngô Thị Lan',      '2004-01-05', 'student', 'ngothilan@gmail.com',         '0912222005', 1, '$2a$12$oiwwPvK8FuInO4MYtmAzcOYfi7VdRDbh/.vvK//O3IkWdjKG4wP/W', '2025-02-03 10:15:00', '2025-02-03 10:15:00'),
(9,  'Bùi Văn Minh',     '2003-08-19', 'student', 'buivanminh@gmail.com',        '0912222006', 1, '$2a$12$oiwwPvK8FuInO4MYtmAzcOYfi7VdRDbh/.vvK//O3IkWdjKG4wP/W', '2025-02-03 10:30:00', '2025-02-03 10:30:00'),
(10, 'Đinh Thị Nga',     '2002-06-27', 'student', 'dinhthinag@gmail.com',        '0912222007', 1, '$2a$12$oiwwPvK8FuInO4MYtmAzcOYfi7VdRDbh/.vvK//O3IkWdjKG4wP/W', '2025-02-04 08:00:00', '2025-02-04 08:00:00'),
(11, 'Cao Văn Ổn',       '2004-03-11', 'student', 'caovanon@gmail.com',          '0912222008', 1, '$2a$12$oiwwPvK8FuInO4MYtmAzcOYfi7VdRDbh/.vvK//O3IkWdjKG4wP/W', '2025-02-04 08:30:00', '2025-02-04 08:30:00'),
(12, 'Lý Thị Phượng',    '2003-11-02', 'student', 'lythiphuong@gmail.com',       '0912222009', 1, '$2a$12$oiwwPvK8FuInO4MYtmAzcOYfi7VdRDbh/.vvK//O3IkWdjKG4wP/W', '2025-02-05 09:00:00', '2025-02-05 09:00:00'),
(13, 'Admin Hệ Thống',   '1980-01-01', 'admin',   'admin@gmail.com',          '0900000001', 1, '$2a$12$oiwwPvK8FuInO4MYtmAzcOYfi7VdRDbh/.vvK//O3IkWdjKG4wP/W', '2025-01-01 00:00:00', '2025-01-01 00:00:00');


-- ============================================================
-- 2. BẢNG subject
--    status: 1 = đang mở, 0 = tạm dừng
-- ============================================================
INSERT INTO `subject` (id, name, lessons, status) VALUES
(1, 'Cơ sở dữ liệu',              30, 1),
(2, 'Lập trình hướng đối tượng',  36, 1),
(3, 'Mạng máy tính',              28, 1),
(4, 'Trí tuệ nhân tạo',           32, 1),
(5, 'Phát triển Web',             40, 0);


-- ============================================================
-- 3. BẢNG class
--    subject_id → subject(id)
--    teacher_id → user(id) [role = teacher]
-- ============================================================
INSERT INTO `class` (id, subject_id, teacher_id, quantity, name, status, createdAt, updatedAt) VALUES
(1, 1, 1, 30, 'CSDT-K20A',  'active', '2025-02-10 07:00:00', '2025-02-10 07:00:00'),
(2, 1, 1, 25, 'CSDT-K20B',  'active', '2025-02-10 07:10:00', '2025-02-10 07:10:00'),
(3, 2, 2, 35, 'OOP-K21A',   'active', '2025-02-11 08:00:00', '2025-02-11 08:00:00'),
(4, 2, 2, 28, 'OOP-K21B',   'ended',  '2025-02-11 08:05:00', '2025-05-01 10:00:00'),
(5, 3, 3, 32, 'MMT-K20A',   'active', '2025-02-12 09:00:00', '2025-02-12 09:00:00'),
(6, 4, 1, 20, 'AI-K22A',    'active', '2025-03-01 07:30:00', '2025-03-01 07:30:00');


-- ============================================================
-- 4. BẢNG enrollment
--    student_id → user(id) [role = student]
--    class_id   → class(id)
-- ============================================================
INSERT INTO `enrollment` (student_id, class_id, averageScore) VALUES
-- Lớp CSDT-K20A (class 1)
(4,  1, 8.5),
(5,  1, 7.2),
(6,  1, 9.0),
(7,  1, 6.8),
(8,  1, 7.5),
-- Lớp CSDT-K20B (class 2)
(9,  2, 8.0),
(10, 2, 7.8),
(11, 2, 6.5),
-- Lớp OOP-K21A (class 3)
(4,  3, 9.2),
(5,  3, 8.0),
(6,  3, 7.6),
(12, 3, 8.8),
-- Lớp OOP-K21B (class 4 - ended)
(7,  4, 7.0),
(8,  4, 8.3),
(9,  4, 6.9),
-- Lớp MMT-K20A (class 5)
(10, 5, 7.4),
(11, 5, 8.1),
(12, 5, 9.5),
-- Lớp AI-K22A (class 6)
(4,  6, NULL),
(5,  6, NULL),
(6,  6, NULL);


-- ============================================================
-- 5. BẢNG test
--    class_id  → class(id)
--    createBy  → user(id) [role = teacher]
-- ============================================================
INSERT INTO `test` (id, name, class_id, createBy, turn, startAt, endAt, duration, num_question) VALUES
-- Lớp CSDT-K20A
(1,  'Kiểm tra giữa kỳ - CSDT K20A',   1, 1, 1, '2025-03-15 07:30:00', '2025-03-15 09:30:00', 90, 40),
(2,  'Kiểm tra cuối kỳ - CSDT K20A',   1, 1, 1, '2025-05-10 07:30:00', '2025-05-10 10:00:00', 120, 60),
-- Lớp CSDT-K20B
(3,  'Kiểm tra giữa kỳ - CSDT K20B',   2, 1, 1, '2025-03-16 13:00:00', '2025-03-16 15:00:00', 90, 40),
(4,  'Kiểm tra cuối kỳ - CSDT K20B',   2, 1, 1, '2025-05-11 13:00:00', '2025-05-11 15:30:00', 120, 60),
-- Lớp OOP-K21A
(5,  'Kiểm tra chương 1 - OOP K21A',   3, 2, 1, '2025-03-20 08:00:00', '2025-03-20 09:30:00', 60, 30),
(6,  'Kiểm tra giữa kỳ - OOP K21A',    3, 2, 1, '2025-04-10 08:00:00', '2025-04-10 10:00:00', 90, 45),
-- Lớp OOP-K21B (ended)
(7,  'Kiểm tra giữa kỳ - OOP K21B',    4, 2, 1, '2025-03-21 14:00:00', '2025-03-21 15:30:00', 90, 40),
(8,  'Kiểm tra cuối kỳ - OOP K21B',    4, 2, 1, '2025-04-25 14:00:00', '2025-04-25 16:30:00', 120, 60),
-- Lớp MMT-K20A
(9,  'Kiểm tra lý thuyết - MMT K20A',  5, 3, 1, '2025-04-05 09:00:00', '2025-04-05 10:30:00', 60, 30),
-- Lớp AI-K22A
(10, 'Kiểm tra nhập môn - AI K22A',    6, 1, 1, '2025-05-20 07:30:00', '2025-05-20 09:00:00', 75, 35);


-- ============================================================
-- 6. BẢNG doexam
--    student_id → user(id) [role = student]
--    test_id    → test(id)
--    status: 'DONE' | 'DOING' | 'PENDING'
-- ============================================================
INSERT INTO `doexam` (id, student_id, test_id, attendAt, submitAt, score, turn, status) VALUES
-- Test 1: Giữa kỳ CSDT K20A
(1,  4, 1, '2025-03-15 07:35:00', '2025-03-15 09:00:00', 8.5,  1, 'DONE'),
(2,  5, 1, '2025-03-15 07:32:00', '2025-03-15 09:05:00', 7.0,  1, 'DONE'),
(3,  6, 1, '2025-03-15 07:30:00', '2025-03-15 09:00:00', 9.0,  1, 'DONE'),
(4,  7, 1, '2025-03-15 07:40:00', '2025-03-15 08:55:00', 6.5,  1, 'DONE'),
(5,  8, 1, '2025-03-15 07:35:00', '2025-03-15 09:10:00', 7.5,  1, 'DONE'),
-- Test 2: Cuối kỳ CSDT K20A
(6,  4, 2, '2025-05-10 07:32:00', '2025-05-10 09:28:00', 8.5,  1, 'DONE'),
(7,  5, 2, '2025-05-10 07:35:00', '2025-05-10 09:30:00', 7.5,  1, 'DONE'),
(8,  6, 2, '2025-05-10 07:30:00', '2025-05-10 09:25:00', 9.0,  1, 'DONE'),
(9,  7, 2, '2025-05-10 07:38:00', '2025-05-10 09:20:00', 7.0,  1, 'DONE'),
(10, 8, 2, '2025-05-10 07:33:00', NULL,                  NULL, 1, 'DOING'),
-- Test 3: Giữa kỳ CSDT K20B
(11, 9,  3, '2025-03-16 13:05:00', '2025-03-16 14:55:00', 8.0,  1, 'DONE'),
(12, 10, 3, '2025-03-16 13:02:00', '2025-03-16 14:50:00', 7.5,  1, 'DONE'),
(13, 11, 3, '2025-03-16 13:00:00', '2025-03-16 14:45:00', 6.5,  1, 'DONE'),
-- Test 4: Cuối kỳ CSDT K20B
(14, 9,  4, '2025-05-11 13:03:00', '2025-05-11 15:20:00', 8.0,  1, 'DONE'),
(15, 10, 4, '2025-05-11 13:01:00', '2025-05-11 15:25:00', 8.0,  1, 'DONE'),
(16, 11, 4, '2025-05-11 13:00:00', NULL,                  NULL, 1, 'PENDING'),
-- Test 5: Chương 1 OOP K21A
(17, 4,  5, '2025-03-20 08:02:00', '2025-03-20 08:58:00', 9.5,  1, 'DONE'),
(18, 5,  5, '2025-03-20 08:00:00', '2025-03-20 09:00:00', 8.0,  1, 'DONE'),
(19, 6,  5, '2025-03-20 08:05:00', '2025-03-20 09:02:00', 7.5,  1, 'DONE'),
(20, 12, 5, '2025-03-20 08:01:00', '2025-03-20 08:55:00', 8.5,  1, 'DONE'),
-- Test 6: Giữa kỳ OOP K21A
(21, 4,  6, '2025-04-10 08:00:00', '2025-04-10 09:45:00', 9.0,  1, 'DONE'),
(22, 5,  6, '2025-04-10 08:05:00', '2025-04-10 09:50:00', 8.0,  1, 'DONE'),
(23, 6,  6, '2025-04-10 08:02:00', '2025-04-10 09:40:00', 7.5,  1, 'DONE'),
(24, 12, 6, '2025-04-10 08:03:00', '2025-04-10 09:48:00', 9.0,  1, 'DONE'),
-- Test 7: Giữa kỳ OOP K21B (ended)
(25, 7, 7,  '2025-03-21 14:02:00', '2025-03-21 15:28:00', 7.0,  1, 'DONE'),
(26, 8, 7,  '2025-03-21 14:00:00', '2025-03-21 15:30:00', 8.0,  1, 'DONE'),
(27, 9, 7,  '2025-03-21 14:05:00', '2025-03-21 15:25:00', 6.5,  1, 'DONE'),
-- Test 8: Cuối kỳ OOP K21B (ended)
(28, 7, 8,  '2025-04-25 14:01:00', '2025-04-25 16:20:00', 7.0,  1, 'DONE'),
(29, 8, 8,  '2025-04-25 14:00:00', '2025-04-25 16:25:00', 8.5,  1, 'DONE'),
(30, 9, 8,  '2025-04-25 14:03:00', '2025-04-25 16:28:00', 7.5,  1, 'DONE'),
-- Test 9: Lý thuyết MMT K20A
(31, 10, 9, '2025-04-05 09:02:00', '2025-04-05 10:00:00', 7.5,  1, 'DONE'),
(32, 11, 9, '2025-04-05 09:00:00', '2025-04-05 09:58:00', 8.0,  1, 'DONE'),
(33, 12, 9, '2025-04-05 09:01:00', '2025-04-05 09:55:00', 9.5,  1, 'DONE'),
-- Test 10: Nhập môn AI K22A (chưa thi)
(34, 4, 10, NULL, NULL, NULL, 1, 'PENDING'),
(35, 5, 10, NULL, NULL, NULL, 1, 'PENDING'),
(36, 6, 10, NULL, NULL, NULL, 1, 'PENDING');


-- ============================================================
-- 7. BẢNG refresh_tokens
--    user_id → user(id)
-- ============================================================
INSERT INTO `refresh_tokens` (user_id, token, expires_at, createdAt) VALUES
(1,  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.teacher1.refreshtoken_signed_abc111', '2025-06-10 08:00:00', '2025-05-10 08:00:00'),
(2,  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.teacher2.refreshtoken_signed_abc222', '2025-06-11 09:00:00', '2025-05-11 09:00:00'),
(3,  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.teacher3.refreshtoken_signed_abc333', '2025-06-12 08:30:00', '2025-05-12 08:30:00'),
(4,  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.student4.refreshtoken_signed_abc444', '2025-06-10 10:00:00', '2025-05-10 10:00:00'),
(5,  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.student5.refreshtoken_signed_abc555', '2025-06-10 10:05:00', '2025-05-10 10:05:00'),
(13, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.admin13.refreshtoken_signed_abc999',  '2025-06-01 00:00:00', '2025-05-01 00:00:00');


-- Bật lại kiểm tra FK
SET FOREIGN_KEY_CHECKS = 1;
