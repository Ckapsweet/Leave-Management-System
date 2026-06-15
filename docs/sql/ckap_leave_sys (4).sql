-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 11, 2026 at 11:01 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ckap_leave_sys`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `actor_id` int(11) NOT NULL,
  `actor_role` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_type` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_id` int(11) DEFAULT NULL,
  `before_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `after_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `target_type`, `target_id`, `before_data`, `after_data`, `note`, `ip_address`, `user_agent`, `created_at`) VALUES
(109, 2, 'assistant manager', 'event.create', 'event', 1, NULL, '{\"title\":\"test\",\"description\":\"test event\",\"start_date\":\"2026-05-21\",\"end_date\":\"2026-05-25\",\"lead_ids\":[3]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-05-21 11:00:18'),
(110, 3, 'lead', 'event.participants_update', 'event', 1, '{\"participant_ids\":[]}', '{\"participant_ids\":[15,16]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-21 11:02:03'),
(111, 15, 'user', 'event.check_in', 'event', 1, NULL, '{\"check_in_at\":\"2026-05-21T06:13:18.000Z\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '2026-05-21 13:13:18'),
(112, 15, 'user', 'event.check_out', 'event', 1, NULL, '{\"check_out_at\":\"2026-05-21T06:13:45.000Z\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '2026-05-21 13:13:45'),
(113, 15, 'user', 'event.attendance_submit', 'event', 1, NULL, '{\"event_date\":\"2026-05-20\",\"check_in_time\":\"08:30\",\"check_out_time\":\"19:00\",\"attachments\":1}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '2026-05-21 13:42:45'),
(114, 2, 'assistant manager', 'event.create', 'event', 2, NULL, '{\"title\":\"test2\",\"description\":null,\"start_date\":\"2026-05-25\",\"end_date\":\"2026-05-29\",\"lead_ids\":[6,7,3,4,5]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-05-21 13:57:43'),
(115, 2, 'assistant manager', 'event.participants_update', 'event', 2, '{\"participant_ids\":[]}', '{\"participant_ids\":[13,22,12]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-05-21 13:59:28'),
(116, 22, 'user', 'event.attendance_submit', 'event', 2, NULL, '{\"event_date\":\"2026-05-24\",\"check_in_time\":\"08:30\",\"check_out_time\":\"19:00\",\"attachments\":2}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '2026-05-21 14:09:15'),
(117, 6, 'lead', 'event.attendance_approved', 'event_time_log', 3, '{\"status\":\"pending\"}', '{\"status\":\"approved\",\"comment\":null}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-21 14:20:26'),
(118, 6, 'lead', 'event.attendance_submit', 'event', 2, NULL, '{\"event_date\":\"2026-05-24\",\"check_in_time\":\"08:30\",\"check_out_time\":\"19:00\",\"attachments\":2}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-21 14:21:39'),
(119, 2, 'assistant manager', 'event.attendance_approved', 'event_time_log', 4, '{\"status\":\"pending\"}', '{\"status\":\"approved\",\"comment\":null}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-05-21 14:23:20'),
(120, 2, 'assistant manager', 'event.create', 'event', 3, NULL, '{\"title\":\"thaifex\",\"description\":null,\"start_date\":\"2026-05-25\",\"end_date\":\"2026-05-30\",\"lead_ids\":[3,7,6,4,5]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-05-21 15:31:57'),
(121, 2, 'assistant manager', 'event.participants_update', 'event', 3, '{\"participant_ids\":[]}', '{\"participant_ids\":[22,16,12,15]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-05-21 15:32:16'),
(122, 22, 'user', 'event.attendance_submit', 'event', 3, NULL, '{\"event_date\":\"2026-05-24\",\"check_in_time\":\"09:00\",\"check_out_time\":\"19:00\",\"attachments\":2}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '2026-05-21 15:33:38'),
(123, 6, 'lead', 'event.attendance_approved', 'event_time_log', 5, '{\"status\":\"pending\"}', '{\"status\":\"approved\",\"comment\":null}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-21 15:34:14'),
(124, 2, 'assistant manager', 'event.attendance_manual', 'event_time_log', 5, NULL, '{\"user_id\":22,\"event_date\":\"2026-05-24\",\"check_in_time\":\"08:30\",\"check_out_time\":\"17:00\",\"status\":\"approved\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-05-25 15:18:34'),
(125, 2, 'assistant manager', 'event.attendance_manual', 'event_time_log', 7, NULL, '{\"user_id\":12,\"event_date\":\"2026-05-24\",\"check_in_time\":\"08:30\",\"check_out_time\":\"17:00\",\"status\":\"approved\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-05-25 15:18:41'),
(126, 2, 'assistant manager', 'event.attendance_manual', 'event_time_log', 8, NULL, '{\"user_id\":16,\"event_date\":\"2026-05-25\",\"check_in_time\":\"08:30\",\"check_out_time\":\"17:30\",\"status\":\"approved\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-05-25 15:22:24'),
(127, 2, 'assistant manager', 'event.attendance_delete', 'event_time_log', 5, '{\"event_id\":3,\"user_id\":22,\"event_date\":\"2026-05-23T17:00:00.000Z\",\"status\":\"approved\"}', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-05-25 15:27:22'),
(128, 17, 'admin', 'user.create', 'user', 23, NULL, '{\"id\":23,\"employee_code\":\"hr-111\",\"full_name\":\"hr test hr\",\"department\":\"\",\"role\":\"user\",\"supervisor_id\":null}', 'สร้าง user hr-111', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-06-04 10:36:30'),
(129, 2, 'assistant manager', 'event.create', 'event', 4, NULL, '{\"title\":\"test debug\",\"description\":null,\"start_date\":\"2026-05-25\",\"end_date\":\"2026-05-30\",\"lead_ids\":[3]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-06-04 10:58:54'),
(130, 2, 'assistant manager', 'event.participants_update', 'event', 4, '{\"participant_ids\":[]}', '{\"participant_ids\":[3]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-06-04 10:59:05'),
(131, 2, 'assistant manager', 'event.attendance_manual', 'event_time_log', 9, NULL, '{\"user_id\":3,\"event_date\":\"2026-05-25\",\"check_in_time\":\"14:00\",\"check_out_time\":\"18:45\",\"status\":\"approved\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-06-04 10:59:25'),
(132, 2, 'assistant manager', 'event.create', 'event', 5, NULL, '{\"title\":\"test test\",\"description\":null,\"start_date\":\"2026-05-25\",\"end_date\":\"2026-05-30\",\"lead_ids\":[3]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-06-04 11:27:34'),
(133, 2, 'assistant manager', 'event.participants_update', 'event', 5, '{\"participant_ids\":[]}', '{\"participant_ids\":[3]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-06-04 11:27:34'),
(134, 2, 'assistant manager', 'event.attendance_manual', 'event_time_log', 10, NULL, '{\"user_id\":3,\"event_date\":\"2026-05-25\",\"check_in_time\":\"14:00\",\"check_out_time\":\"17:00\",\"status\":\"approved\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-06-04 11:27:57'),
(135, 2, 'assistant manager', 'event.participants_update', 'event', 5, '{\"participant_ids\":[3]}', '{\"participant_ids\":[3,13,11]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-06-04 16:24:07'),
(136, 2, 'assistant manager', 'event.attendance_manual', 'event_time_log', 11, NULL, '{\"user_id\":3,\"event_date\":\"2026-05-26\",\"check_in_time\":\"14:00\",\"check_out_time\":\"18:00\",\"status\":\"approved\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-06-04 16:24:32'),
(137, 2, 'assistant manager', 'event.attendance_manual', 'event_time_log', 12, NULL, '{\"user_id\":3,\"event_date\":\"2026-05-27\",\"check_in_time\":\"14:00\",\"check_out_time\":\"18:00\",\"status\":\"approved\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-06-04 16:24:39'),
(138, 2, 'assistant manager', 'event.attendance_manual', 'event_time_log', 13, NULL, '{\"user_id\":13,\"event_date\":\"2026-05-25\",\"check_in_time\":\"14:00\",\"check_out_time\":\"18:00\",\"status\":\"approved\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-06-04 16:24:50'),
(139, 2, 'assistant manager', 'event.attendance_manual', 'event_time_log', 14, NULL, '{\"user_id\":13,\"event_date\":\"2026-05-26\",\"check_in_time\":\"14:00\",\"check_out_time\":\"18:00\",\"status\":\"approved\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-06-04 16:24:54'),
(140, 2, 'assistant manager', 'event.attendance_manual', 'event_time_log', 15, NULL, '{\"user_id\":11,\"event_date\":\"2026-05-25\",\"check_in_time\":\"14:00\",\"check_out_time\":\"18:00\",\"status\":\"approved\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-06-04 16:25:06'),
(141, 2, 'assistant manager', 'event.attendance_manual', 'event_time_log', 16, NULL, '{\"user_id\":11,\"event_date\":\"2026-05-26\",\"check_in_time\":\"14:00\",\"check_out_time\":\"18:00\",\"status\":\"approved\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-06-04 16:25:10'),
(142, 2, 'assistant manager', 'event.attendance_manual', 'event_time_log', 17, NULL, '{\"user_id\":11,\"event_date\":\"2026-05-28\",\"check_in_time\":\"14:00\",\"check_out_time\":\"18:00\",\"status\":\"approved\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-06-04 16:25:15'),
(143, 2, 'assistant manager', 'event.attendance_manual', 'event_time_log', 18, NULL, '{\"user_id\":11,\"event_date\":\"2026-05-29\",\"check_in_time\":\"14:00\",\"check_out_time\":\"18:45\",\"status\":\"approved\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-06-04 16:32:20'),
(144, 2, 'assistant manager', 'event.participants_update', 'event', 5, '{\"participant_ids\":[3,11,13]}', '{\"participant_ids\":[13,11,3]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-06-08 09:12:48'),
(145, 2, 'assistant manager', 'event.participants_update', 'event', 5, '{\"participant_ids\":[3,11,13]}', '{\"participant_ids\":[13,11,3]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-06-08 09:13:33'),
(146, 2, 'assistant manager', 'event.participants_update', 'event', 5, '{\"participant_ids\":[3,11,13],\"external_participant_names\":[]}', '{\"participant_ids\":[13,11,3],\"external_participant_names\":[\"test debug\"]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-06-08 09:25:32'),
(147, 2, 'assistant manager', 'event.participants_update', 'event', 5, '{\"participant_ids\":[3,11,13],\"external_participant_names\":[\"test debug\"]}', '{\"participant_ids\":[13,11,3],\"external_participant_names\":[\"test debug\"]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-06-08 09:27:00'),
(148, 1, 'manager', 'event.create', 'event', 6, NULL, '{\"title\":\"SMOKE external participant 1780885846233\",\"description\":\"temporary smoke test\",\"start_date\":\"2026-06-08\",\"end_date\":\"2026-06-08\",\"lead_ids\":[3]}', NULL, '127.0.0.1', 'node', '2026-06-08 09:30:46'),
(149, 1, 'manager', 'event.participants_update', 'event', 6, '{\"participant_ids\":[],\"external_participant_names\":[]}', '{\"participant_ids\":[3],\"external_participant_names\":[\"ทดสอบ บุคคลอื่น\"]}', NULL, '127.0.0.1', 'node', '2026-06-08 09:30:46'),
(150, 1, 'manager', 'event.delete', 'event', 6, '{\"title\":\"SMOKE external participant 1780885846233\",\"start_date\":\"2026-06-07T17:00:00.000Z\",\"end_date\":\"2026-06-07T17:00:00.000Z\",\"department\":\"การตลาด\"}', NULL, NULL, '127.0.0.1', 'node', '2026-06-08 09:30:46'),
(151, 2, 'assistant manager', 'event.create', 'event', 7, NULL, '{\"title\":\"new test\",\"description\":null,\"start_date\":\"2026-06-08\",\"end_date\":\"2026-06-12\",\"lead_ids\":[16,15,3,10]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-06-08 09:34:06'),
(152, 2, 'assistant manager', 'event.participants_update', 'event', 7, '{\"participant_ids\":[],\"external_participant_names\":[]}', '{\"participant_ids\":[16,15,3,10],\"external_participant_names\":[]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-06-08 09:34:06'),
(153, 2, 'assistant manager', 'event.attendance_manual', 'event_time_log', 19, NULL, '{\"user_id\":10,\"event_date\":\"2026-06-07\",\"check_in_time\":\"14:00\",\"check_out_time\":\"18:45\",\"status\":\"approved\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-06-08 09:34:20'),
(154, 2, 'assistant manager', 'event.participants_update', 'event', 7, '{\"participant_ids\":[3,10,15,16],\"external_participant_names\":[]}', '{\"participant_ids\":[10,16,3,15],\"external_participant_names\":[\"test test\"]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-06-08 09:34:39'),
(155, 2, 'assistant manager', 'event.participants_update', 'event', 7, '{\"participant_ids\":[3,10,15,16],\"external_participant_names\":[\"test test\"]}', '{\"participant_ids\":[10,16,3,15],\"external_participant_names\":[\"test newuser\"]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-06-08 09:35:49'),
(156, 2, 'assistant manager', 'event.participants_update', 'event', 7, '{\"participant_ids\":[3,10,15,16],\"external_participant_names\":[\"test newuser\"]}', '{\"participant_ids\":[10,16,3,15],\"external_participant_names\":[\"test newuser\",\"test nneeww\"]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-06-08 09:40:40'),
(157, 2, 'assistant manager', 'event.participants_update', 'event', 7, '{\"participant_ids\":[3,10,15,16],\"external_participant_names\":[\"test newuser\",\"test nneeww\"]}', '{\"participant_ids\":[10,16,3,15,22],\"external_participant_names\":[\"test newuser\",\"test nneeww\"]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-06-08 09:41:21'),
(158, 1, 'manager', 'event.create', 'event', 8, NULL, '{\"title\":\"SMOKE external time 1780887333141\",\"description\":\"temporary smoke test\",\"start_date\":\"2026-06-08\",\"end_date\":\"2026-06-08\",\"lead_ids\":[3]}', NULL, '::ffff:127.0.0.1', NULL, '2026-06-08 09:55:33'),
(159, 1, 'manager', 'event.participants_update', 'event', 8, '{\"participant_ids\":[],\"external_participant_names\":[]}', '{\"participant_ids\":[3],\"external_participant_names\":[\"ทดสอบ บันทึกเวลา\"]}', NULL, '::ffff:127.0.0.1', NULL, '2026-06-08 09:55:33'),
(160, 1, 'manager', 'event.create', 'event', 9, NULL, '{\"title\":\"SMOKE external time 1780887370392\",\"description\":\"temporary smoke test\",\"start_date\":\"2026-07-06\",\"end_date\":\"2026-07-06\",\"lead_ids\":[3]}', NULL, '::ffff:127.0.0.1', NULL, '2026-06-08 09:56:10'),
(161, 1, 'manager', 'event.participants_update', 'event', 9, '{\"participant_ids\":[],\"external_participant_names\":[]}', '{\"participant_ids\":[3],\"external_participant_names\":[\"ทดสอบ บันทึกเวลา\"]}', NULL, '::ffff:127.0.0.1', NULL, '2026-06-08 09:56:10'),
(162, 1, 'manager', 'event.attendance_manual', 'event_time_log', 20, NULL, '{\"user_id\":null,\"external_participant_id\":11,\"event_date\":\"2026-07-05\",\"check_in_time\":\"08:00\",\"check_out_time\":\"17:00\",\"status\":\"approved\"}', NULL, '::ffff:127.0.0.1', NULL, '2026-06-08 09:56:10'),
(163, 1, 'manager', 'event.delete', 'event', 9, '{\"title\":\"SMOKE external time 1780887370392\",\"start_date\":\"2026-07-05T17:00:00.000Z\",\"end_date\":\"2026-07-05T17:00:00.000Z\",\"department\":\"การตลาด\"}', NULL, NULL, '::ffff:127.0.0.1', NULL, '2026-06-08 09:56:10'),
(164, 2, 'assistant manager', 'event.participants_update', 'event', 7, '{\"participant_ids\":[3,10,15,16,22],\"external_participant_names\":[\"test newuser\",\"test nneeww\"]}', '{\"participant_ids\":[22,10,16,3,15],\"external_participant_names\":[\"test newuser\",\"test nneeww\",\"test 002\"]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-06-08 10:08:28'),
(165, 2, 'assistant manager', 'event.attendance_manual', 'event_time_log', 21, NULL, '{\"user_id\":null,\"external_participant_id\":14,\"event_date\":\"2026-06-07\",\"check_in_time\":\"14:00\",\"check_out_time\":\"20:00\",\"status\":\"approved\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-06-08 10:09:26'),
(166, 2, 'assistant manager', 'event.attendance_manual', 'event_time_log', 22, NULL, '{\"user_id\":null,\"external_participant_id\":12,\"event_date\":\"2026-06-09\",\"check_in_time\":\"17:00\",\"check_out_time\":\"20:00\",\"status\":\"approved\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-06-08 10:10:36'),
(167, 2, 'assistant manager', 'event.participants_update', 'event', 1, '{\"participant_ids\":[15,16],\"external_participant_names\":[]}', '{\"participant_ids\":[16,15],\"external_participant_names\":[]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-06-08 10:44:29'),
(168, 2, 'assistant manager', 'event.participants_update', 'event', 7, '{\"participant_ids\":[3,10,15,16,22],\"external_participant_names\":[\"test 002\",\"test newuser\",\"test nneeww\"]}', '{\"participant_ids\":[22,10,16,15,3],\"external_participant_names\":[\"test 002\",\"test newuser\",\"test nneeww\",\"user01 test02\"]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-06-08 10:45:36'),
(169, 2, 'assistant manager', 'event.participants_update', 'event', 1, '{\"participant_ids\":[15,16],\"external_participant_names\":[]}', '{\"participant_ids\":[16,15],\"external_participant_names\":[\"test01 user02\"]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-06-08 10:46:05'),
(170, 2, 'assistant manager', 'event.delete', 'event', 1, '{\"title\":\"test\",\"start_date\":\"2026-05-20T17:00:00.000Z\",\"end_date\":\"2026-05-24T17:00:00.000Z\",\"department\":\"การตลาด\"}', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-06-08 10:47:17'),
(171, 17, 'admin', 'user.role_change', 'user', 23, '{\"role\":\"user\"}', '{\"role\":\"hr\"}', 'เปลี่ยน role user → hr', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-10 13:05:17'),
(172, 17, 'admin', 'leave.create', 'leave_request', 42, NULL, '{\"user_id\":2,\"leave_type_id\":3,\"start_date\":\"2026-05-04\",\"end_date\":\"2026-05-05\",\"start_time\":null,\"end_time\":null,\"total_days\":2,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 13:40:51'),
(173, 17, 'admin', 'leave.create', 'leave_request', 43, NULL, '{\"user_id\":2,\"leave_type_id\":3,\"start_date\":\"2026-05-06\",\"end_date\":\"2026-05-06\",\"start_time\":\"08:30\",\"end_time\":\"09:00\",\"total_days\":0.07,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 13:46:20'),
(174, 17, 'admin', 'leave.create', 'leave_request', 44, NULL, '{\"user_id\":2,\"leave_type_id\":3,\"start_date\":\"2026-05-07\",\"end_date\":\"2026-05-07\",\"start_time\":\"08:30\",\"end_time\":\"09:30\",\"total_days\":0.13,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 13:48:43'),
(175, 17, 'admin', 'leave.create', 'leave_request', 45, NULL, '{\"user_id\":3,\"leave_type_id\":3,\"start_date\":\"2026-05-04\",\"end_date\":\"2026-05-04\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 13:49:24'),
(176, 17, 'admin', 'leave.create', 'leave_request', 46, NULL, '{\"user_id\":15,\"leave_type_id\":3,\"start_date\":\"2026-05-04\",\"end_date\":\"2026-05-04\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 13:51:57'),
(177, 17, 'admin', 'leave.create', 'leave_request', 47, NULL, '{\"user_id\":15,\"leave_type_id\":4,\"start_date\":\"2026-05-05\",\"end_date\":\"2026-05-06\",\"start_time\":null,\"end_time\":null,\"total_days\":2,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 13:52:32'),
(178, 17, 'admin', 'leave.create', 'leave_request', 48, NULL, '{\"user_id\":16,\"leave_type_id\":3,\"start_date\":\"2026-05-04\",\"end_date\":\"2026-05-07\",\"start_time\":null,\"end_time\":null,\"total_days\":4,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 13:54:16'),
(179, 17, 'admin', 'leave.create', 'leave_request', 49, NULL, '{\"user_id\":1,\"leave_type_id\":3,\"start_date\":\"2026-05-20\",\"end_date\":\"2026-05-20\",\"start_time\":\"08:00\",\"end_time\":\"12:00\",\"total_days\":0.53,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 13:57:01'),
(180, 17, 'admin', 'leave.cancel', 'leave_request', 49, '{\"user_id\":1,\"leave_type_id\":3,\"status\":\"approved\",\"start_date\":\"2026-05-19T17:00:00.000Z\",\"end_date\":\"2026-05-19T17:00:00.000Z\",\"start_time\":\"08:00:00\",\"end_time\":\"12:00:00\",\"total_days\":\"0.53\",\"reason\":\"บันทึกรายการย้อนหลัง\"}', NULL, 'ลบรายการลาโดยผู้ดูแล', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 14:03:36'),
(181, 17, 'admin', 'leave.create', 'leave_request', 50, NULL, '{\"user_id\":3,\"leave_type_id\":3,\"start_date\":\"2026-06-05\",\"end_date\":\"2026-06-05\",\"start_time\":\"08:00\",\"end_time\":\"12:00\",\"total_days\":0.53,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 14:11:48'),
(182, 17, 'admin', 'leave.cancel', 'leave_request', 50, '{\"user_id\":3,\"leave_type_id\":3,\"status\":\"approved\",\"start_date\":\"2026-06-04T17:00:00.000Z\",\"end_date\":\"2026-06-04T17:00:00.000Z\",\"start_time\":\"08:00:00\",\"end_time\":\"12:00:00\",\"total_days\":\"0.53\",\"reason\":\"บันทึกรายการย้อนหลัง\"}', NULL, 'ลบรายการลาโดยผู้ดูแล', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 14:12:24'),
(183, 17, 'admin', 'leave.create', 'leave_request', 51, NULL, '{\"user_id\":16,\"leave_type_id\":3,\"start_date\":\"2026-05-11\",\"end_date\":\"2026-05-11\",\"start_time\":\"08:00\",\"end_time\":\"12:00\",\"total_days\":0.53,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\\n\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 14:14:48'),
(184, 17, 'admin', 'leave.create', 'leave_request', 52, NULL, '{\"user_id\":1,\"leave_type_id\":3,\"start_date\":\"2026-05-18\",\"end_date\":\"2026-05-18\",\"start_time\":\"08:00\",\"end_time\":\"11:30\",\"total_days\":0.47,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 14:15:37'),
(185, 17, 'admin', 'leave.cancel', 'leave_request', 52, '{\"user_id\":1,\"leave_type_id\":3,\"status\":\"approved\",\"start_date\":\"2026-05-17T17:00:00.000Z\",\"end_date\":\"2026-05-17T17:00:00.000Z\",\"start_time\":\"08:00:00\",\"end_time\":\"11:30:00\",\"total_days\":\"0.47\",\"reason\":\"บันทึกรายการย้อนหลัง\"}', NULL, 'ลบรายการลาโดยผู้ดูแล', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 14:29:24'),
(186, 17, 'admin', 'leave.update', 'leave_request', 51, '{\"user_id\":16,\"leave_type_id\":3,\"start_date\":\"2026-05-10T17:00:00.000Z\",\"end_date\":\"2026-05-10T17:00:00.000Z\",\"start_time\":\"08:00:00\",\"end_time\":\"12:00:00\",\"total_days\":\"0.53\",\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\\n\",\"status\":\"approved\"}', '{\"user_id\":16,\"leave_type_id\":3,\"start_date\":\"2026-05-15\",\"end_date\":\"2026-05-15\",\"start_time\":\"08:00\",\"end_time\":\"09:00\",\"total_days\":0.13,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\\n\",\"status\":\"approved\"}', 'แก้ไขรายการลาโดยผู้ดูแล', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 14:29:46'),
(187, 17, 'admin', 'leave.create', 'leave_request', 53, NULL, '{\"user_id\":4,\"leave_type_id\":3,\"start_date\":\"2026-05-04\",\"end_date\":\"2026-05-07\",\"start_time\":null,\"end_time\":null,\"total_days\":4,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 14:31:08'),
(188, 17, 'admin', 'leave.create', 'leave_request', 54, NULL, '{\"user_id\":4,\"leave_type_id\":3,\"start_date\":\"2026-05-11\",\"end_date\":\"2026-05-11\",\"start_time\":\"08:30\",\"end_time\":\"12:30\",\"total_days\":0.47,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 14:31:55'),
(189, 17, 'admin', 'leave.create', 'leave_request', 55, NULL, '{\"user_id\":1,\"leave_type_id\":3,\"start_date\":\"2026-05-12\",\"end_date\":\"2026-05-12\",\"start_time\":\"08:30\",\"end_time\":\"12:00\",\"total_days\":0.47,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 14:33:31'),
(190, 17, 'admin', 'leave.cancel', 'leave_request', 55, '{\"user_id\":1,\"leave_type_id\":3,\"status\":\"approved\",\"start_date\":\"2026-05-11T17:00:00.000Z\",\"end_date\":\"2026-05-11T17:00:00.000Z\",\"start_time\":\"08:30:00\",\"end_time\":\"12:00:00\",\"total_days\":\"0.47\",\"reason\":\"บันทึกรายการย้อนหลัง\"}', NULL, 'ลบรายการลาโดยผู้ดูแล', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 14:46:22'),
(191, 17, 'admin', 'leave.create', 'leave_request', 56, NULL, '{\"user_id\":1,\"leave_type_id\":3,\"start_date\":\"2026-05-13\",\"end_date\":\"2026-05-13\",\"start_time\":null,\"end_time\":null,\"total_days\":0.5,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 14:47:05'),
(192, 17, 'admin', 'leave.update', 'leave_request', 56, '{\"user_id\":1,\"leave_type_id\":3,\"start_date\":\"2026-05-12T17:00:00.000Z\",\"end_date\":\"2026-05-12T17:00:00.000Z\",\"start_time\":null,\"end_time\":null,\"total_days\":\"0.50\",\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\"}', '{\"user_id\":4,\"leave_type_id\":3,\"start_date\":\"2026-05-13\",\"end_date\":\"2026-05-13\",\"start_time\":null,\"end_time\":null,\"total_days\":0.5,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\"}', 'แก้ไขรายการลาโดยผู้ดูแล', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 14:47:32'),
(193, 17, 'admin', 'leave.create', 'leave_request', 57, NULL, '{\"user_id\":6,\"leave_type_id\":1,\"start_date\":\"2026-05-04\",\"end_date\":\"2026-05-04\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 15:00:35'),
(194, 17, 'admin', 'leave.create', 'leave_request', 58, NULL, '{\"user_id\":7,\"leave_type_id\":1,\"start_date\":\"2026-05-04\",\"end_date\":\"2026-05-05\",\"start_time\":null,\"end_time\":null,\"total_days\":2,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 15:01:01'),
(195, 17, 'admin', 'leave.create', 'leave_request', 59, NULL, '{\"user_id\":1,\"leave_type_id\":3,\"start_date\":\"2026-05-06\",\"end_date\":\"2026-05-06\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 15:01:30'),
(196, 17, 'admin', 'leave.update', 'leave_request', 59, '{\"user_id\":1,\"leave_type_id\":3,\"start_date\":\"2026-05-05T17:00:00.000Z\",\"end_date\":\"2026-05-05T17:00:00.000Z\",\"start_time\":null,\"end_time\":null,\"total_days\":\"1.00\",\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\"}', '{\"user_id\":7,\"leave_type_id\":3,\"start_date\":\"2026-05-07\",\"end_date\":\"2026-05-07\",\"start_time\":\"08:30\",\"end_time\":\"09:30\",\"total_days\":0.13,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\"}', 'แก้ไขรายการลาโดยผู้ดูแล', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 15:02:34'),
(197, 17, 'admin', 'leave.create', 'leave_request', 60, NULL, '{\"user_id\":8,\"leave_type_id\":3,\"start_date\":\"2026-05-04\",\"end_date\":\"2026-05-07\",\"start_time\":null,\"end_time\":null,\"total_days\":4,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 15:03:16'),
(198, 17, 'admin', 'leave.create', 'leave_request', 61, NULL, '{\"user_id\":8,\"leave_type_id\":3,\"start_date\":\"2026-05-18\",\"end_date\":\"2026-05-18\",\"start_time\":\"08:00\",\"end_time\":\"09:00\",\"total_days\":0.13,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 15:04:16'),
(199, 17, 'admin', 'leave.create', 'leave_request', 62, NULL, '{\"user_id\":10,\"leave_type_id\":4,\"start_date\":\"2026-05-19\",\"end_date\":\"2026-05-19\",\"start_time\":\"08:30\",\"end_time\":\"09:00\",\"total_days\":0.07,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 15:05:03'),
(200, 17, 'admin', 'leave.create', 'leave_request', 63, NULL, '{\"user_id\":11,\"leave_type_id\":1,\"start_date\":\"2026-05-18\",\"end_date\":\"2026-05-18\",\"start_time\":\"08:00\",\"end_time\":\"10:30\",\"total_days\":0.33,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 15:06:47'),
(201, 17, 'admin', 'leave.update', 'leave_request', 63, '{\"user_id\":11,\"leave_type_id\":1,\"start_date\":\"2026-05-17T17:00:00.000Z\",\"end_date\":\"2026-05-17T17:00:00.000Z\",\"start_time\":\"08:00:00\",\"end_time\":\"10:30:00\",\"total_days\":\"0.33\",\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\"}', '{\"user_id\":11,\"leave_type_id\":1,\"start_date\":\"2026-05-19\",\"end_date\":\"2026-05-19\",\"start_time\":\"08:30\",\"end_time\":\"10:00\",\"total_days\":0.2,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\"}', 'แก้ไขรายการลาโดยผู้ดูแล', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 15:07:30'),
(202, 17, 'admin', 'leave.create', 'leave_request', 64, NULL, '{\"user_id\":12,\"leave_type_id\":3,\"start_date\":\"2026-05-20\",\"end_date\":\"2026-05-20\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 15:08:17'),
(203, 17, 'admin', 'leave.create', 'leave_request', 65, NULL, '{\"user_id\":22,\"leave_type_id\":3,\"start_date\":\"2026-05-19\",\"end_date\":\"2026-05-19\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 15:08:55'),
(204, 17, 'admin', 'leave.create', 'leave_request', 66, NULL, '{\"user_id\":22,\"leave_type_id\":3,\"start_date\":\"2026-05-21\",\"end_date\":\"2026-05-21\",\"start_time\":\"08:30\",\"end_time\":\"10:30\",\"total_days\":0.27,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 15:09:46'),
(205, 17, 'admin', 'leave.create', 'leave_request', 67, NULL, '{\"user_id\":22,\"leave_type_id\":4,\"start_date\":\"2026-05-19\",\"end_date\":\"2026-05-19\",\"start_time\":\"08:30\",\"end_time\":\"09:00\",\"total_days\":0.07,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 15:10:39'),
(206, 17, 'admin', 'leave.create', 'leave_request', 68, NULL, '{\"user_id\":13,\"leave_type_id\":3,\"start_date\":\"2026-05-20\",\"end_date\":\"2026-05-20\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"request_type\":\"leave\",\"reason\":\"บันทึกรายการย้อนหลัง\",\"status\":\"approved\",\"historical\":true}', 'บันทึกประวัติการลาย้อนหลัง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-11 15:11:13');

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`, `created_at`) VALUES
(2, 'การตลาด', '2026-04-28 06:41:49');

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `created_by` int(11) NOT NULL,
  `lead_id` int(11) NOT NULL,
  `department` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`id`, `title`, `description`, `start_date`, `end_date`, `created_by`, `lead_id`, `department`, `created_at`) VALUES
(2, 'test2', NULL, '2026-05-25', '2026-05-29', 2, 6, 'การตลาด', '2026-05-21 06:57:43'),
(3, 'thaifex', NULL, '2026-05-25', '2026-05-30', 2, 3, 'การตลาด', '2026-05-21 08:31:57'),
(4, 'test debug', NULL, '2026-05-25', '2026-05-30', 2, 3, 'การตลาด', '2026-06-04 03:58:54'),
(5, 'test test', NULL, '2026-05-25', '2026-05-30', 2, 3, 'การตลาด', '2026-06-04 04:27:34'),
(7, 'new test', NULL, '2026-06-08', '2026-06-12', 2, 16, 'การตลาด', '2026-06-08 02:34:06');

-- --------------------------------------------------------

--
-- Table structure for table `event_external_participants`
--

CREATE TABLE `event_external_participants` (
  `id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `department` varchar(255) DEFAULT 'บุคคลอื่นๆ',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `event_external_participants`
--

INSERT INTO `event_external_participants` (`id`, `event_id`, `full_name`, `department`, `created_by`, `created_at`) VALUES
(2, 5, 'test debug', 'บุคคลอื่นๆ', 2, '2026-06-08 02:27:00'),
(15, 7, 'test 002', 'บุคคลอื่นๆ', 2, '2026-06-08 03:45:36'),
(16, 7, 'test newuser', 'บุคคลอื่นๆ', 2, '2026-06-08 03:45:36'),
(17, 7, 'test nneeww', 'บุคคลอื่นๆ', 2, '2026-06-08 03:45:36'),
(18, 7, 'user01 test02', 'บุคคลอื่นๆ', 2, '2026-06-08 03:45:36');

-- --------------------------------------------------------

--
-- Table structure for table `event_leads`
--

CREATE TABLE `event_leads` (
  `id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `lead_id` int(11) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `event_leads`
--

INSERT INTO `event_leads` (`id`, `event_id`, `lead_id`, `assigned_at`) VALUES
(7, 2, 6, '2026-05-21 06:57:43'),
(8, 2, 7, '2026-05-21 06:57:43'),
(9, 2, 3, '2026-05-21 06:57:43'),
(10, 2, 4, '2026-05-21 06:57:43'),
(11, 2, 5, '2026-05-21 06:57:43'),
(13, 3, 3, '2026-05-21 08:31:57'),
(14, 3, 7, '2026-05-21 08:31:57'),
(15, 3, 6, '2026-05-21 08:31:57'),
(16, 3, 4, '2026-05-21 08:31:57'),
(17, 3, 5, '2026-05-21 08:31:57'),
(18, 4, 3, '2026-06-04 03:58:54'),
(19, 5, 3, '2026-06-04 04:27:34'),
(22, 7, 16, '2026-06-08 02:34:06'),
(23, 7, 15, '2026-06-08 02:34:06'),
(24, 7, 3, '2026-06-08 02:34:06'),
(25, 7, 10, '2026-06-08 02:34:06');

-- --------------------------------------------------------

--
-- Table structure for table `event_participants`
--

CREATE TABLE `event_participants` (
  `id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `selected_by_lead_id` int(11) DEFAULT NULL,
  `selected_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `event_participants`
--

INSERT INTO `event_participants` (`id`, `event_id`, `user_id`, `selected_by_lead_id`, `selected_at`) VALUES
(4, 2, 13, 4, '2026-05-21 06:59:28'),
(5, 2, 12, 5, '2026-05-21 06:59:28'),
(6, 2, 22, 6, '2026-05-21 06:59:28'),
(7, 3, 15, 3, '2026-05-21 08:32:16'),
(8, 3, 16, 3, '2026-05-21 08:32:16'),
(9, 3, 12, 5, '2026-05-21 08:32:16'),
(10, 3, 22, 6, '2026-05-21 08:32:16'),
(11, 4, 3, 2, '2026-06-04 03:59:05'),
(25, 5, 3, 2, '2026-06-08 02:27:00'),
(26, 5, 13, 4, '2026-06-08 02:27:00'),
(27, 5, 11, 8, '2026-06-08 02:27:00'),
(76, 7, 3, 2, '2026-06-08 03:45:36'),
(77, 7, 15, 3, '2026-06-08 03:45:36'),
(78, 7, 16, 3, '2026-06-08 03:45:36'),
(79, 7, 22, 6, '2026-06-08 03:45:36'),
(80, 7, 10, 7, '2026-06-08 03:45:36');

-- --------------------------------------------------------

--
-- Table structure for table `event_time_attachments`
--

CREATE TABLE `event_time_attachments` (
  `id` int(11) NOT NULL,
  `event_time_log_id` int(11) NOT NULL,
  `evidence_type` enum('check_in','check_out') NOT NULL DEFAULT 'check_in',
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `size` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `event_time_attachments`
--

INSERT INTO `event_time_attachments` (`id`, `event_time_log_id`, `evidence_type`, `original_name`, `stored_name`, `mime_type`, `size`, `created_at`) VALUES
(2, 3, 'check_in', 'date.png', '1779347355691-512090768.png', 'image/png', 21265, '2026-05-21 07:09:15'),
(3, 3, 'check_out', 'image_0.jpg', '1779347355692-851479387.jpg', 'image/jpeg', 2791601, '2026-05-21 07:09:15'),
(4, 4, 'check_in', 'date (2).png', '1779348099194-824063364.png', 'image/png', 21265, '2026-05-21 07:21:39'),
(5, 4, 'check_out', 'date (1).png', '1779348099194-613089871.png', 'image/png', 21265, '2026-05-21 07:21:39');

-- --------------------------------------------------------

--
-- Table structure for table `event_time_logs`
--

CREATE TABLE `event_time_logs` (
  `id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `external_participant_id` int(11) DEFAULT NULL,
  `event_date` date NOT NULL,
  `check_in_time` time DEFAULT NULL,
  `check_out_time` time DEFAULT NULL,
  `check_in_at` datetime DEFAULT NULL,
  `check_out_at` datetime DEFAULT NULL,
  `status` enum('draft','pending','approved','rejected') NOT NULL DEFAULT 'draft',
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `approval_comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `event_time_logs`
--

INSERT INTO `event_time_logs` (`id`, `event_id`, `user_id`, `external_participant_id`, `event_date`, `check_in_time`, `check_out_time`, `check_in_at`, `check_out_at`, `status`, `approved_by`, `approved_at`, `approval_comment`, `created_at`, `updated_at`) VALUES
(3, 2, 22, NULL, '2026-05-24', '08:30:00', '19:00:00', '2026-05-21 14:09:15', '2026-05-21 14:09:15', 'approved', 6, '2026-05-21 14:20:26', NULL, '2026-05-21 07:09:15', '2026-05-21 07:20:26'),
(4, 2, 6, NULL, '2026-05-24', '08:30:00', '19:00:00', '2026-05-21 14:21:39', '2026-05-21 14:21:39', 'approved', 2, '2026-05-21 14:23:20', NULL, '2026-05-21 07:21:39', '2026-05-21 07:23:20'),
(7, 3, 12, NULL, '2026-05-24', '08:30:00', '17:00:00', '2026-05-24 08:30:00', '2026-05-24 17:00:00', 'approved', 2, '2026-05-25 15:18:41', NULL, '2026-05-25 08:18:41', '2026-05-25 08:18:41'),
(8, 3, 16, NULL, '2026-05-25', '08:30:00', '17:30:00', '2026-05-25 08:30:00', '2026-05-25 17:30:00', 'approved', 2, '2026-05-25 15:22:24', NULL, '2026-05-25 08:22:24', '2026-05-25 08:22:24'),
(9, 4, 3, NULL, '2026-05-25', '14:00:00', '18:45:00', '2026-05-25 14:00:00', '2026-05-25 18:45:00', 'approved', 2, '2026-06-04 10:59:25', NULL, '2026-06-04 03:59:25', '2026-06-04 03:59:25'),
(10, 5, 3, NULL, '2026-05-25', '14:00:00', '17:00:00', '2026-05-25 14:00:00', '2026-05-25 17:00:00', 'approved', 2, '2026-06-04 11:27:57', NULL, '2026-06-04 04:27:57', '2026-06-04 04:27:57'),
(11, 5, 3, NULL, '2026-05-26', '14:00:00', '18:00:00', '2026-05-26 14:00:00', '2026-05-26 18:00:00', 'approved', 2, '2026-06-04 16:24:32', NULL, '2026-06-04 09:24:32', '2026-06-04 09:24:32'),
(12, 5, 3, NULL, '2026-05-27', '14:00:00', '18:00:00', '2026-05-27 14:00:00', '2026-05-27 18:00:00', 'approved', 2, '2026-06-04 16:24:39', NULL, '2026-06-04 09:24:39', '2026-06-04 09:24:39'),
(13, 5, 13, NULL, '2026-05-25', '14:00:00', '18:00:00', '2026-05-25 14:00:00', '2026-05-25 18:00:00', 'approved', 2, '2026-06-04 16:24:50', NULL, '2026-06-04 09:24:50', '2026-06-04 09:24:50'),
(14, 5, 13, NULL, '2026-05-26', '14:00:00', '18:00:00', '2026-05-26 14:00:00', '2026-05-26 18:00:00', 'approved', 2, '2026-06-04 16:24:54', NULL, '2026-06-04 09:24:54', '2026-06-04 09:24:54'),
(15, 5, 11, NULL, '2026-05-25', '14:00:00', '18:00:00', '2026-05-25 14:00:00', '2026-05-25 18:00:00', 'approved', 2, '2026-06-04 16:25:06', NULL, '2026-06-04 09:25:06', '2026-06-04 09:25:06'),
(16, 5, 11, NULL, '2026-05-26', '14:00:00', '18:00:00', '2026-05-26 14:00:00', '2026-05-26 18:00:00', 'approved', 2, '2026-06-04 16:25:10', NULL, '2026-06-04 09:25:10', '2026-06-04 09:25:10'),
(17, 5, 11, NULL, '2026-05-28', '14:00:00', '18:00:00', '2026-05-28 14:00:00', '2026-05-28 18:00:00', 'approved', 2, '2026-06-04 16:25:15', NULL, '2026-06-04 09:25:15', '2026-06-04 09:25:15'),
(18, 5, 11, NULL, '2026-05-29', '14:00:00', '18:45:00', '2026-05-29 14:00:00', '2026-05-29 18:45:00', 'approved', 2, '2026-06-04 16:32:20', NULL, '2026-06-04 09:32:20', '2026-06-04 09:32:20'),
(19, 7, 10, NULL, '2026-06-07', '14:00:00', '18:45:00', '2026-06-07 14:00:00', '2026-06-07 18:45:00', 'approved', 2, '2026-06-08 09:34:20', NULL, '2026-06-08 02:34:20', '2026-06-08 02:34:20');

-- --------------------------------------------------------

--
-- Table structure for table `leave_approvals`
--

CREATE TABLE `leave_approvals` (
  `id` int(11) NOT NULL,
  `leave_request_id` int(11) DEFAULT NULL,
  `approver_id` int(11) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `leave_approvals`
--

INSERT INTO `leave_approvals` (`id`, `leave_request_id`, `approver_id`, `status`, `comment`, `approved_at`) VALUES
(25, 42, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 13:40:51'),
(26, 43, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 13:46:20'),
(27, 44, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 13:48:43'),
(28, 45, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 13:49:24'),
(29, 46, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 13:51:57'),
(30, 47, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 13:52:32'),
(31, 48, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 13:54:16'),
(34, 51, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 14:14:48'),
(36, 53, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 14:31:08'),
(37, 54, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 14:31:55'),
(39, 56, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 14:47:05'),
(40, 57, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:00:35'),
(41, 58, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:01:01'),
(42, 59, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:01:30'),
(43, 60, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:03:16'),
(44, 61, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:04:16'),
(45, 62, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:05:03'),
(46, 63, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:06:47'),
(47, 64, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:08:17'),
(48, 65, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:08:55'),
(49, 66, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:09:46'),
(50, 67, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:10:39'),
(51, 68, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:11:13');

-- --------------------------------------------------------

--
-- Table structure for table `leave_balances`
--

CREATE TABLE `leave_balances` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `leave_type_id` int(11) DEFAULT NULL,
  `total_days` int(11) DEFAULT NULL,
  `used_days` int(11) DEFAULT 0,
  `year` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `leave_balances`
--

INSERT INTO `leave_balances` (`id`, `user_id`, `leave_type_id`, `total_days`, `used_days`, `year`) VALUES
(121, 2, 3, 10, 2, 2026),
(124, 3, 3, 10, 1, 2026),
(125, 15, 3, 10, 1, 2026),
(126, 15, 4, 5, 2, 2026),
(127, 16, 3, 10, 4, 2026),
(128, 1, 3, 10, 1, 2026),
(133, 4, 3, 10, 5, 2026),
(138, 6, 1, 30, 1, 2026),
(139, 7, 1, 30, 2, 2026),
(141, 7, 3, 10, 0, 2026),
(142, 8, 3, 10, 4, 2026),
(144, 10, 4, 5, 0, 2026),
(145, 11, 1, 30, 0, 2026),
(147, 12, 3, 10, 1, 2026),
(148, 22, 3, 10, 1, 2026),
(150, 22, 4, 5, 0, 2026),
(151, 13, 3, 10, 1, 2026);

-- --------------------------------------------------------

--
-- Table structure for table `leave_requests`
--

CREATE TABLE `leave_requests` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `leave_type_id` int(11) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `total_days` decimal(5,2) DEFAULT NULL,
  `request_type` enum('leave','late') NOT NULL DEFAULT 'leave',
  `reason` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `current_assignee_id` int(11) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `leave_requests`
--

INSERT INTO `leave_requests` (`id`, `user_id`, `leave_type_id`, `start_date`, `end_date`, `start_time`, `end_time`, `total_days`, `request_type`, `reason`, `status`, `current_assignee_id`, `approved_by`, `approved_at`, `created_at`) VALUES
(42, 2, 3, '2026-05-04', '2026-05-05', NULL, NULL, 2.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 13:40:51', '2026-06-11 06:40:51'),
(43, 2, 3, '2026-05-06', '2026-05-06', '08:30:00', '09:00:00', 0.07, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 13:46:20', '2026-06-11 06:46:20'),
(44, 2, 3, '2026-05-07', '2026-05-07', '08:30:00', '09:30:00', 0.13, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 13:48:43', '2026-06-11 06:48:43'),
(45, 3, 3, '2026-05-04', '2026-05-04', NULL, NULL, 1.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 13:49:24', '2026-06-11 06:49:24'),
(46, 15, 3, '2026-05-04', '2026-05-04', NULL, NULL, 1.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 13:51:57', '2026-06-11 06:51:57'),
(47, 15, 4, '2026-05-05', '2026-05-06', NULL, NULL, 2.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 13:52:32', '2026-06-11 06:52:32'),
(48, 16, 3, '2026-05-04', '2026-05-07', NULL, NULL, 4.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 13:54:16', '2026-06-11 06:54:16'),
(51, 16, 3, '2026-05-15', '2026-05-15', '08:00:00', '09:00:00', 0.13, 'leave', 'บันทึกรายการย้อนหลัง\n', 'approved', NULL, 17, '2026-06-11 14:14:48', '2026-06-11 07:14:48'),
(53, 4, 3, '2026-05-04', '2026-05-07', NULL, NULL, 4.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 14:31:08', '2026-06-11 07:31:08'),
(54, 4, 3, '2026-05-11', '2026-05-11', '08:30:00', '12:30:00', 0.47, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 14:31:55', '2026-06-11 07:31:55'),
(56, 4, 3, '2026-05-13', '2026-05-13', NULL, NULL, 0.50, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 14:47:05', '2026-06-11 07:47:05'),
(57, 6, 1, '2026-05-04', '2026-05-04', NULL, NULL, 1.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:00:35', '2026-06-11 08:00:35'),
(58, 7, 1, '2026-05-04', '2026-05-05', NULL, NULL, 2.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:01:01', '2026-06-11 08:01:01'),
(59, 7, 3, '2026-05-07', '2026-05-07', '08:30:00', '09:30:00', 0.13, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:01:30', '2026-06-11 08:01:30'),
(60, 8, 3, '2026-05-04', '2026-05-07', NULL, NULL, 4.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:03:16', '2026-06-11 08:03:16'),
(61, 8, 3, '2026-05-18', '2026-05-18', '08:00:00', '09:00:00', 0.13, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:04:16', '2026-06-11 08:04:16'),
(62, 10, 4, '2026-05-19', '2026-05-19', '08:30:00', '09:00:00', 0.07, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:05:03', '2026-06-11 08:05:03'),
(63, 11, 1, '2026-05-19', '2026-05-19', '08:30:00', '10:00:00', 0.20, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:06:47', '2026-06-11 08:06:47'),
(64, 12, 3, '2026-05-20', '2026-05-20', NULL, NULL, 1.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:08:17', '2026-06-11 08:08:17'),
(65, 22, 3, '2026-05-19', '2026-05-19', NULL, NULL, 1.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:08:55', '2026-06-11 08:08:55'),
(66, 22, 3, '2026-05-21', '2026-05-21', '08:30:00', '10:30:00', 0.27, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:09:46', '2026-06-11 08:09:46'),
(67, 22, 4, '2026-05-19', '2026-05-19', '08:30:00', '09:00:00', 0.07, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:10:39', '2026-06-11 08:10:39'),
(68, 13, 3, '2026-05-20', '2026-05-20', NULL, NULL, 1.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:11:13', '2026-06-11 08:11:13');

-- --------------------------------------------------------

--
-- Table structure for table `leave_request_attachments`
--

CREATE TABLE `leave_request_attachments` (
  `id` int(11) NOT NULL,
  `leave_request_id` int(11) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `size` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leave_types`
--

CREATE TABLE `leave_types` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `max_days` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `leave_types`
--

INSERT INTO `leave_types` (`id`, `name`, `description`, `max_days`, `created_at`) VALUES
(1, 'ลาป่วย', 'ลาป่วยตามกฎหมายแรงงาน ม.32', 30, '2024-01-01 00:00:00'),
(2, 'ลากิจ', 'ลากิจส่วนตัว', 3, '2024-01-01 00:00:00'),
(3, 'ลาพักผ่อน', 'วันหยุดพักผ่อนประจำปี', 10, '2024-01-01 00:00:00'),
(4, 'ลาอื่นๆ', 'การลาประเภทอื่นนอกเหนือจากที่กำหนด', 5, '2024-01-01 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `ot_approvals`
--

CREATE TABLE `ot_approvals` (
  `id` int(11) NOT NULL,
  `ot_request_id` int(11) DEFAULT NULL,
  `approver_id` int(11) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ot_requests`
--

CREATE TABLE `ot_requests` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `ot_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `total_hours` decimal(5,2) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `current_assignee_id` int(11) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ot_requests`
--

INSERT INTO `ot_requests` (`id`, `user_id`, `ot_date`, `start_time`, `end_time`, `total_hours`, `reason`, `status`, `current_assignee_id`, `approved_by`, `approved_at`, `created_at`) VALUES
(1, 3, '2025-04-10', '18:00:00', '21:00:00', 3.00, 'งานเร่งด่วนปิดงบประมาณ', 'pending', NULL, NULL, NULL, '2026-04-28 06:41:50');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `employee_code` varchar(50) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('user','lead','assistant manager','manager','hr','admin') NOT NULL DEFAULT 'user',
  `supervisor_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `email` varchar(255) DEFAULT NULL,
  `email_2` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `employee_code`, `full_name`, `department`, `password`, `role`, `supervisor_id`, `created_at`, `email`, `email_2`, `phone`, `is_active`) VALUES
(1, 'MKT-0001', 'นางสาวปวิดา  กาญจนางกูล', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'manager', NULL, '2024-01-10 08:00:00', NULL, '', '', 1),
(2, 'MKT-0002', 'นางสาวภัทรา  พงษ์การุณ', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'assistant manager', 1, '2024-01-10 08:05:00', NULL, '', '', 1),
(3, 'MKT-0003', 'นายพูนศักดิ์  วงศ์มกรพันธ์', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'lead', 2, '2024-01-15 09:00:00', NULL, '', '', 1),
(4, 'MKT-0004', 'นางสาวอนงค์กานต์  เหียดใส', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'lead', 2, '2024-01-15 09:10:00', NULL, '', '', 1),
(5, 'MKT-0005', 'นางสาวพรปวีณ์  เทพวิจิตร์', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'lead', 2, '2024-01-16 09:00:00', NULL, '', '', 1),
(6, 'MKT-0006', 'นางสาวนพวรรณ  ศรีเสริม', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'lead', 2, '2024-01-16 09:15:00', NULL, '', '', 1),
(7, 'MKT-0007', 'นางสาวสุภาภรณ์  จ้อยวงศ์', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'lead', 2, '2024-01-17 09:00:00', NULL, '', '', 1),
(8, 'MKT-0008', 'นางสาวรวิวรรณ  อนุตรี', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'lead', 1, '2024-01-17 09:20:00', NULL, '', '', 1),
(9, 'MKT-0009', 'นางสาวจันทรรัตน์  อดิศรวรกิจ', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', NULL, '2024-01-18 09:00:00', '', '', '', 0),
(10, 'MKT-0010', 'นางสาวอาจรีย์  ทุ่งราช', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', 7, '2024-01-18 09:30:00', NULL, '', '', 1),
(11, 'MKT-0011', 'นางสาวพุทธพร  พัดจีบ', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', 8, '2024-01-18 09:30:00', NULL, '', '', 1),
(12, 'MKT-0012', 'นางสาวนัชนก  ไชยแป้น', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', 5, '2024-01-18 09:30:00', NULL, '', '', 1),
(13, 'MKT-0013', 'นางสาวปานไพลิน  ปินใจ', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', 4, '2024-01-18 09:30:00', NULL, '', '', 1),
(14, 'MKT-0014', 'นางสาวธิษณา  ธัญญวิชยเวช', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', 8, '2024-01-18 09:30:00', NULL, '', '', 1),
(15, 'MKT-0015', 'นายวินัย  ลูกปัด', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', 3, '2024-01-18 09:30:00', '', '', '', 1),
(16, 'MKT-0016', 'นายชยพล  อุ่มเจริญ', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', 3, '2024-01-18 09:30:00', '', '', '', 1),
(17, 'test-0001', 'นายทดสอบระบบ', 'test', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'admin', NULL, '2024-01-18 09:30:00', 'test@test.com', 'test@test.com', '1150', 1),
(18, 'test-002', 'test', 'test', '$2b$10$1jtjQ2/u4YlNQfU24HLCB.zRM6orFD4ps9xH9P.9sB7g9D7c5I7TO', 'manager', 18, '2026-05-05 01:01:23', '', '', '', 1),
(19, 'test-003', 'test2', 'test', '$2b$10$7sqPVmdVrV.GHdXdLHD9fuI00inaJlavy.U4Iu31n5My6/E1wK25y', 'assistant manager', 18, '2026-05-05 01:02:06', '', '', '', 1),
(20, 'test-004', 'test_lead', 'test', '$2b$10$.qnuWz/AUwkD.Lys8JmS0OkPo551kHvIC3u9DgOsuskRWD.Igw4CS', 'lead', 18, '2026-05-05 01:02:28', 'programmer_ckap@outlook.com', '', '', 1),
(21, 'test-005', 'test_user', 'test', '$2b$10$ZXfnR.282qGOvb7kXH3AAeEBwEG3glsvOFWAuxhW1HG7hK62eRtC6', 'user', 18, '2026-05-05 01:02:47', 'teerapong@ckapsweet.com', '', '', 1),
(22, 'MKT-0017', 'นางสาวกนกวรรณ  แซ่ฉั่ว', 'การตลาด', '$2b$10$suCEG1o6.8JvC8h8M7BrleaVdeOIALFRM4cuBwOpUkguyrFA/msv.', 'user', 6, '2026-05-05 06:35:25', NULL, '', '', 1),
(23, 'hr-111', 'hr test hr', '', '$2b$10$GkYdKA.aZwhamOt0rojWqOILZTwA5wLOzs6NBsoq.ZeAzrSk/XI.m', 'hr', NULL, '2026-06-04 03:36:30', NULL, NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `user_leave_pool`
--

CREATE TABLE `user_leave_pool` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `total_days` decimal(6,2) NOT NULL DEFAULT 0.00,
  `used_days` decimal(6,2) NOT NULL DEFAULT 0.00,
  `year` int(11) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_leave_pool`
--

INSERT INTO `user_leave_pool` (`id`, `user_id`, `total_days`, `used_days`, `year`, `updated_at`) VALUES
(22, 2, 10.00, 2.00, 2026, '2026-06-11 06:40:51'),
(25, 3, 10.00, 1.00, 2026, '2026-06-11 07:12:24'),
(26, 15, 15.00, 3.00, 2026, '2026-06-11 06:52:32'),
(28, 16, 10.00, 4.00, 2026, '2026-06-11 07:29:46'),
(29, 1, 10.00, 1.00, 2026, '2026-06-11 08:02:34'),
(37, 4, 10.00, 5.00, 2026, '2026-06-11 07:47:32'),
(44, 6, 30.00, 1.00, 2026, '2026-06-11 08:00:35'),
(45, 7, 40.00, 2.00, 2026, '2026-06-11 08:02:34'),
(49, 8, 10.00, 4.00, 2026, '2026-06-11 08:03:16'),
(51, 10, 5.00, 0.00, 2026, '2026-06-11 08:05:03'),
(52, 11, 30.00, 0.00, 2026, '2026-06-11 08:06:47'),
(54, 12, 10.00, 1.00, 2026, '2026-06-11 08:08:17'),
(55, 22, 15.00, 1.00, 2026, '2026-06-11 08:10:39'),
(58, 13, 10.00, 1.00, 2026, '2026-06-11 08:11:13');

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_audit_logs`
-- (See below for the actual view)
--
CREATE TABLE `v_audit_logs` (
`id` int(11)
,`created_at` datetime
,`action` varchar(60)
,`target_type` varchar(40)
,`target_id` int(11)
,`before_data` longtext
,`after_data` longtext
,`note` text
,`ip_address` varchar(45)
,`actor_id` int(11)
,`actor_role` varchar(20)
,`actor_name` varchar(255)
,`actor_code` varchar(50)
,`actor_dept` varchar(255)
);

-- --------------------------------------------------------

--
-- Structure for view `v_audit_logs`
--
DROP TABLE IF EXISTS `v_audit_logs`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_audit_logs`  AS SELECT `al`.`id` AS `id`, `al`.`created_at` AS `created_at`, `al`.`action` AS `action`, `al`.`target_type` AS `target_type`, `al`.`target_id` AS `target_id`, `al`.`before_data` AS `before_data`, `al`.`after_data` AS `after_data`, `al`.`note` AS `note`, `al`.`ip_address` AS `ip_address`, `al`.`actor_id` AS `actor_id`, `al`.`actor_role` AS `actor_role`, `u`.`full_name` AS `actor_name`, `u`.`employee_code` AS `actor_code`, `u`.`department` AS `actor_dept` FROM (`audit_logs` `al` join `users` `u` on(`u`.`id` = `al`.`actor_id`)) ORDER BY `al`.`created_at` DESC ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_actor` (`actor_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_target` (`target_type`,`target_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_events_lead` (`lead_id`),
  ADD KEY `idx_events_creator` (`created_by`),
  ADD KEY `idx_events_department_dates` (`department`,`start_date`,`end_date`);

--
-- Indexes for table `event_external_participants`
--
ALTER TABLE `event_external_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_event_external_name` (`event_id`,`full_name`),
  ADD KEY `idx_event_external_participants_event` (`event_id`),
  ADD KEY `idx_event_external_participants_creator` (`created_by`);

--
-- Indexes for table `event_leads`
--
ALTER TABLE `event_leads`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_event_lead` (`event_id`,`lead_id`),
  ADD KEY `idx_event_leads_lead` (`lead_id`);

--
-- Indexes for table `event_participants`
--
ALTER TABLE `event_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_event_user` (`event_id`,`user_id`),
  ADD KEY `idx_event_participants_user` (`user_id`),
  ADD KEY `idx_event_participants_lead` (`selected_by_lead_id`);

--
-- Indexes for table `event_time_attachments`
--
ALTER TABLE `event_time_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_event_time_attachments_log` (`event_time_log_id`);

--
-- Indexes for table `event_time_logs`
--
ALTER TABLE `event_time_logs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_event_time_user_date` (`event_id`,`user_id`,`event_date`),
  ADD UNIQUE KEY `uq_event_time_external_date` (`event_id`,`external_participant_id`,`event_date`),
  ADD KEY `idx_event_time_logs_user` (`user_id`),
  ADD KEY `idx_event_time_logs_external_participant` (`external_participant_id`);

--
-- Indexes for table `leave_approvals`
--
ALTER TABLE `leave_approvals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leave_request_id` (`leave_request_id`),
  ADD KEY `approver_id` (`approver_id`);

--
-- Indexes for table `leave_balances`
--
ALTER TABLE `leave_balances`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_leave_balances_user_type_year` (`user_id`,`leave_type_id`,`year`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `leave_type_id` (`leave_type_id`);

--
-- Indexes for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `leave_type_id` (`leave_type_id`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `idx_leave_requests_user_created` (`user_id`,`created_at`),
  ADD KEY `idx_leave_requests_user_status_start` (`user_id`,`status`,`start_date`),
  ADD KEY `idx_leave_requests_status_start_end` (`status`,`start_date`,`end_date`),
  ADD KEY `idx_leave_requests_assignee` (`current_assignee_id`);

--
-- Indexes for table `leave_request_attachments`
--
ALTER TABLE `leave_request_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leave_request_id` (`leave_request_id`);

--
-- Indexes for table `leave_types`
--
ALTER TABLE `leave_types`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ot_approvals`
--
ALTER TABLE `ot_approvals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ot_request_id` (`ot_request_id`),
  ADD KEY `approver_id` (`approver_id`);

--
-- Indexes for table `ot_requests`
--
ALTER TABLE `ot_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `idx_ot_requests_user_created` (`user_id`,`created_at`),
  ADD KEY `idx_ot_requests_user_status_date` (`user_id`,`status`,`ot_date`),
  ADD KEY `idx_ot_requests_user_date_time` (`user_id`,`ot_date`,`start_time`,`end_time`),
  ADD KEY `idx_ot_requests_status_date` (`status`,`ot_date`),
  ADD KEY `idx_ot_requests_assignee` (`current_assignee_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_user_supervisor` (`supervisor_id`),
  ADD KEY `idx_users_is_active` (`is_active`),
  ADD KEY `idx_users_department_active_role` (`department`,`is_active`,`role`),
  ADD KEY `idx_users_role_department_active` (`role`,`department`,`is_active`),
  ADD KEY `idx_users_employee_active` (`employee_code`,`is_active`);

--
-- Indexes for table `user_leave_pool`
--
ALTER TABLE `user_leave_pool`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_year` (`user_id`,`year`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=207;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `event_external_participants`
--
ALTER TABLE `event_external_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `event_leads`
--
ALTER TABLE `event_leads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `event_participants`
--
ALTER TABLE `event_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- AUTO_INCREMENT for table `event_time_attachments`
--
ALTER TABLE `event_time_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `event_time_logs`
--
ALTER TABLE `event_time_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `leave_approvals`
--
ALTER TABLE `leave_approvals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `leave_balances`
--
ALTER TABLE `leave_balances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=152;

--
-- AUTO_INCREMENT for table `leave_requests`
--
ALTER TABLE `leave_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT for table `leave_request_attachments`
--
ALTER TABLE `leave_request_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `leave_types`
--
ALTER TABLE `leave_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `ot_approvals`
--
ALTER TABLE `ot_approvals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ot_requests`
--
ALTER TABLE `ot_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `user_leave_pool`
--
ALTER TABLE `user_leave_pool`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=59;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_actor_fk` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `events`
--
ALTER TABLE `events`
  ADD CONSTRAINT `events_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `events_lead_fk` FOREIGN KEY (`lead_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `event_external_participants`
--
ALTER TABLE `event_external_participants`
  ADD CONSTRAINT `event_external_participants_creator_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `event_external_participants_event_fk` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `event_leads`
--
ALTER TABLE `event_leads`
  ADD CONSTRAINT `event_leads_event_fk` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `event_leads_lead_fk` FOREIGN KEY (`lead_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `event_participants`
--
ALTER TABLE `event_participants`
  ADD CONSTRAINT `event_participants_event_fk` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `event_participants_lead_fk` FOREIGN KEY (`selected_by_lead_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `event_participants_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `event_time_attachments`
--
ALTER TABLE `event_time_attachments`
  ADD CONSTRAINT `event_time_attachments_log_fk` FOREIGN KEY (`event_time_log_id`) REFERENCES `event_time_logs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `event_time_logs`
--
ALTER TABLE `event_time_logs`
  ADD CONSTRAINT `event_time_logs_event_fk` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `event_time_logs_external_participant_fk` FOREIGN KEY (`external_participant_id`) REFERENCES `event_external_participants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `event_time_logs_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `leave_approvals`
--
ALTER TABLE `leave_approvals`
  ADD CONSTRAINT `leave_approvals_ibfk_1` FOREIGN KEY (`leave_request_id`) REFERENCES `leave_requests` (`id`),
  ADD CONSTRAINT `leave_approvals_ibfk_2` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `leave_balances`
--
ALTER TABLE `leave_balances`
  ADD CONSTRAINT `leave_balances_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `leave_balances_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`);

--
-- Constraints for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `leave_requests_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`),
  ADD CONSTRAINT `leave_requests_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `leave_request_attachments`
--
ALTER TABLE `leave_request_attachments`
  ADD CONSTRAINT `leave_request_attachments_ibfk_1` FOREIGN KEY (`leave_request_id`) REFERENCES `leave_requests` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ot_approvals`
--
ALTER TABLE `ot_approvals`
  ADD CONSTRAINT `ot_approvals_ibfk_1` FOREIGN KEY (`ot_request_id`) REFERENCES `ot_requests` (`id`),
  ADD CONSTRAINT `ot_approvals_ibfk_2` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `ot_requests`
--
ALTER TABLE `ot_requests`
  ADD CONSTRAINT `ot_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `ot_requests_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_user_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `user_leave_pool`
--
ALTER TABLE `user_leave_pool`
  ADD CONSTRAINT `user_leave_pool_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
