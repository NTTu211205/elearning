-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th4 16, 2026 lúc 10:18 PM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `elearningdatabase`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `class`
--

CREATE TABLE `class` (
  `id` varchar(10) NOT NULL,
  `subject_id` varchar(10) DEFAULT NULL,
  `teacher_id` varchar(10) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `doexam`
--

CREATE TABLE `doexam` (
  `id` varchar(10) NOT NULL,
  `student_id` varchar(10) DEFAULT NULL,
  `test_id` varchar(10) DEFAULT NULL,
  `attendAt` datetime DEFAULT NULL,
  `submitAt` datetime DEFAULT NULL,
  `score` float DEFAULT NULL,
  `turn` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `enrollment`
--

CREATE TABLE `enrollment` (
  `student_id` varchar(10) NOT NULL,
  `class_id` varchar(10) NOT NULL,
  `averageScore` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `subject`
--

CREATE TABLE `subject` (
  `id` varchar(10) NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lessons` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `test`
--

CREATE TABLE `test` (
  `id` varchar(10) NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `class_id` varchar(10) DEFAULT NULL,
  `createBy` varchar(10) DEFAULT NULL,
  `turn` int(11) DEFAULT NULL,
  `startAt` datetime DEFAULT NULL,
  `endAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user`
--

CREATE TABLE `user` (
  `id` varchar(10) NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `role` varchar(10) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `phone` varchar(10) DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `class`
--
ALTER TABLE `class`
  ADD PRIMARY KEY (`id`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `teacher_id` (`teacher_id`);

--
-- Chỉ mục cho bảng `doexam`
--
ALTER TABLE `doexam`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `test_id` (`test_id`);

--
-- Chỉ mục cho bảng `enrollment`
--
ALTER TABLE `enrollment`
  ADD PRIMARY KEY (`student_id`,`class_id`),
  ADD KEY `class_id` (`class_id`);

--
-- Chỉ mục cho bảng `subject`
--
ALTER TABLE `subject`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `test`
--
ALTER TABLE `test`
  ADD PRIMARY KEY (`id`),
  ADD KEY `class_id` (`class_id`),
  ADD KEY `createBy` (`createBy`);

--
-- Chỉ mục cho bảng `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`);

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `class`
--
ALTER TABLE `class`
  ADD CONSTRAINT `class_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subject` (`id`),
  ADD CONSTRAINT `class_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `user` (`id`);

--
-- Các ràng buộc cho bảng `doexam`
--
ALTER TABLE `doexam`
  ADD CONSTRAINT `doexam_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `user` (`id`),
  ADD CONSTRAINT `doexam_ibfk_2` FOREIGN KEY (`test_id`) REFERENCES `test` (`id`);

--
-- Các ràng buộc cho bảng `enrollment`
--
ALTER TABLE `enrollment`
  ADD CONSTRAINT `enrollment_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `user` (`id`),
  ADD CONSTRAINT `enrollment_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `class` (`id`);

--
-- Các ràng buộc cho bảng `test`
--
ALTER TABLE `test`
  ADD CONSTRAINT `test_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `class` (`id`),
  ADD CONSTRAINT `test_ibfk_2` FOREIGN KEY (`createBy`) REFERENCES `user` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
