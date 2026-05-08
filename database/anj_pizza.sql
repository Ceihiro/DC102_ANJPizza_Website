-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 08, 2026 at 01:28 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `anj_pizza`
--

-- --------------------------------------------------------

--
-- Table structure for table `addons`
--

CREATE TABLE `addons` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `available` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `addons`
--

INSERT INTO `addons` (`id`, `name`, `price`, `created_at`, `available`) VALUES
(1, 'Mushroom', 20.00, '2026-03-27 04:13:39', 0),
(2, 'Bell Pepper', 20.00, '2026-03-27 04:13:39', 1),
(3, 'Onion', 20.00, '2026-03-27 04:13:39', 1),
(4, 'Pineapple', 20.00, '2026-03-27 04:13:39', 1),
(5, 'Bacon', 25.00, '2026-03-27 04:13:39', 1),
(6, 'Cheese', 30.00, '2026-03-27 04:13:39', 1),
(7, 'Beef', 30.00, '2026-03-27 04:13:39', 1),
(8, 'Ham', 30.00, '2026-03-27 04:13:39', 1),
(9, 'Pepperoni', 30.00, '2026-03-27 04:13:39', 1);

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id`, `username`, `password`) VALUES
(1, 'admin', '$2y$10$aSW3AX81ZUKnQDJs82ZCZ.btXI9eF98CZjB/dpqB10DnC08SS3ge6');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `order_number` varchar(10) NOT NULL,
  `status` enum('Pending','Preparing','Ready','Done') DEFAULT 'Pending',
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `order_number`, `status`, `total`, `created_at`, `updated_at`) VALUES
(102, '#0001', 'Done', 105.00, '2026-04-28 03:48:27', '2026-04-28 03:48:54'),
(103, '#0002', 'Pending', 110.00, '2026-04-28 03:48:36', '2026-04-28 03:48:36'),
(104, '#0003', 'Pending', 430.00, '2026-04-28 03:50:26', '2026-04-28 03:50:26'),
(105, '#0004', 'Pending', 130.00, '2026-04-28 04:08:55', '2026-04-28 04:08:55'),
(106, '#0005', 'Pending', 105.00, '2026-04-28 04:51:27', '2026-04-28 04:51:27'),
(107, '#0006', 'Pending', 155.00, '2026-04-28 04:58:44', '2026-04-28 04:58:44'),
(108, '#0007', 'Done', 355.00, '2026-04-28 04:59:46', '2026-04-28 05:02:22');

-- --------------------------------------------------------

--
-- Table structure for table `order_code`
--

CREATE TABLE `order_code` (
  `id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_code`
--

INSERT INTO `order_code` (`id`, `code`) VALUES
(1, '1234');

-- --------------------------------------------------------

--
-- Table structure for table `order_counter`
--

CREATE TABLE `order_counter` (
  `id` int(11) NOT NULL,
  `counter` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_counter`
--

INSERT INTO `order_counter` (`id`, `counter`) VALUES
(1, 7);

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `item_name` varchar(100) NOT NULL,
  `item_type` enum('pizza','addon') NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `qty` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `item_name`, `item_type`, `price`, `qty`) VALUES
(99, 102, 'Cheesy Pizza', 'pizza', 105.00, 1),
(100, 103, 'Ham & Cheese', 'pizza', 110.00, 1),
(101, 104, 'Cheesy Pizza', 'pizza', 105.00, 2),
(102, 104, 'Ham & Cheese', 'pizza', 110.00, 2),
(103, 105, 'Veggies', 'pizza', 130.00, 1),
(104, 106, 'Cheesy Pizza', 'pizza', 105.00, 1),
(105, 107, 'Hawaiian', 'pizza', 135.00, 1),
(106, 107, 'Bell Pepper', 'addon', 20.00, 1),
(107, 108, 'Ham & Cheese', 'pizza', 110.00, 1);

-- --------------------------------------------------------

--
-- Table structure for table `pizzas`
--

CREATE TABLE `pizzas` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `badge` varchar(50) DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `available` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pizzas`
--

INSERT INTO `pizzas` (`id`, `name`, `price`, `badge`, `created_at`, `available`) VALUES
(1, 'Cheesy Pizza', 105.00, '', '2026-03-27 04:13:39', 1),
(2, 'Ham & Cheese', 110.00, '', '2026-03-27 04:13:39', 1),
(3, 'Hawaiian', 115.00, 'Best Seller', '2026-03-27 04:13:39', 1),
(4, 'Veggies', 130.00, '', '2026-03-27 04:13:39', 1),
(5, 'Delight', 135.00, '', '2026-03-27 04:13:39', 1),
(6, 'Pepperoni', 140.00, '', '2026-03-27 04:13:39', 1),
(7, 'Beef w/ Ham', 140.00, '', '2026-03-27 04:13:39', 1),
(8, 'Bacon w/ Ham', 140.00, '', '2026-03-27 04:13:39', 1),
(9, 'Supreme', 140.00, 'Best Seller', '2026-03-27 04:13:39', 1),
(10, 'AnJ Pizza', 145.00, 'Best Seller', '2026-03-27 04:13:39', 1),
(11, 'Best Overload', 145.00, 'Best Seller', '2026-03-27 04:13:39', 1),
(12, 'All Meat', 160.00, '', '2026-03-27 04:13:39', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `addons`
--
ALTER TABLE `addons`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `order_code`
--
ALTER TABLE `order_code`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `order_counter`
--
ALTER TABLE `order_counter`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

--
-- Indexes for table `pizzas`
--
ALTER TABLE `pizzas`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `addons`
--
ALTER TABLE `addons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=109;

--
-- AUTO_INCREMENT for table `order_code`
--
ALTER TABLE `order_code`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `order_counter`
--
ALTER TABLE `order_counter`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=110;

--
-- AUTO_INCREMENT for table `pizzas`
--
ALTER TABLE `pizzas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
