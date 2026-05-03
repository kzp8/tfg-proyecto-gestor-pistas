-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         8.4.3 - MySQL Community Server - GPL
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para gestor_polideportivo
CREATE DATABASE IF NOT EXISTS `gestor_polideportivo` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `gestor_polideportivo`;

-- Volcando estructura para tabla gestor_polideportivo.pistas
CREATE TABLE IF NOT EXISTS `pistas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `estado` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla gestor_polideportivo.pistas: ~5 rows (aproximadamente)
INSERT INTO `pistas` (`id`, `nombre`, `tipo`, `estado`) VALUES
	(1, 'Pista de Pádel 1', 'Pádel', 1),
	(2, 'Fútbol 7 (Pista 1)', 'Fútbol', 1),
	(3, 'Cancha Baloncesto', 'Baloncesto', 1),
	(4, 'Pista de Pádel 2', 'Pádel', 0),
	(5, 'Pista Pádel 3', 'Pádel', 1);

-- Volcando estructura para tabla gestor_polideportivo.reservas
CREATE TABLE IF NOT EXISTS `reservas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int DEFAULT NULL,
  `id_pista` int DEFAULT NULL,
  `fecha` date NOT NULL,
  `hora_fin` time NOT NULL,
  `hora_inicio` time NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_pista` (`id_pista`),
  CONSTRAINT `reservas_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `reservas_ibfk_2` FOREIGN KEY (`id_pista`) REFERENCES `pistas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla gestor_polideportivo.reservas: ~5 rows (aproximadamente)
INSERT INTO `reservas` (`id`, `id_usuario`, `id_pista`, `fecha`, `hora_fin`, `hora_inicio`) VALUES
	(14, 2, 1, '2026-05-03', '11:00:00', '10:00:00'),
	(18, 3, 3, '2026-05-05', '10:00:00', '09:00:00'),
	(19, 4, 1, '2026-05-10', '19:00:00', '18:00:00'),
	(20, 5, 3, '2026-05-03', '12:00:00', '11:00:00'),
	(21, 6, 2, '2026-05-04', '10:00:00', '09:00:00'),
	(22, 3, 1, '2026-05-01', '12:00:00', '11:00:00'),
	(23, 4, 1, '2026-05-02', '18:00:00', '17:00:00'),
	(24, 5, 4, '2026-05-03', '10:00:00', '09:00:00'),
	(25, 6, 5, '2026-05-03', '20:00:00', '19:00:00'),
	(26, 3, 2, '2026-05-06', '17:00:00', '16:00:00'),
	(27, 4, 3, '2026-05-07', '21:00:00', '20:00:00'),
	(28, 5, 1, '2026-05-08', '09:00:00', '08:00:00'),
	(29, 2, 4, '2026-05-09', '11:00:00', '10:00:00');

-- Volcando estructura para tabla gestor_polideportivo.usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('user','admin') DEFAULT 'user',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla gestor_polideportivo.usuarios: ~2 rows (aproximadamente)
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `rol`) VALUES
	(1, 'admin', 'admin@admin.com', 'admin', 'admin'),
	(2, 'David Raul Rus', 'davidraulrus2006@gmail.com', 'davidraulrus2006@gmail.com', 'user'),
	(3, 'Carlos Gomez', 'carlos@email.com', '1234', 'user'),
	(4, 'Lucia Fernandez', 'lucia@email.com', '1234', 'user'),
	(5, 'Marcos Ruiz', 'marcos@email.com', '1234', 'user'),
	(6, 'Elena Sanz', 'elena@email.com', '1234', 'user');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
