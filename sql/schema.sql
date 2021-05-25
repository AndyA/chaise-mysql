-- MariaDB dump 10.19  Distrib 10.5.9-MariaDB, for osx10.16 (x86_64)
--
-- Host: localhost    Database: chaise
-- ------------------------------------------------------
-- Server version	10.5.9-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_chaise_view_state`
--

DROP TABLE IF EXISTS `_chaise_view_state`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_chaise_view_state` (
  `view_id` varchar(255) NOT NULL,
  `couch_seq` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`view_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_chaise_view_state`
--

LOCK TABLES `_chaise_view_state` WRITE;
/*!40000 ALTER TABLE `_chaise_view_state` DISABLE KEYS */;
/*!40000 ALTER TABLE `_chaise_view_state` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `known_devices`
--

DROP TABLE IF EXISTS `known_devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `known_devices` (
  `_id` varchar(255) NOT NULL,
  `mac` varchar(1024) DEFAULT NULL,
  `hostname` varchar(1024) DEFAULT NULL,
  `ip` varchar(255) DEFAULT NULL,
  KEY `_id` (`_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `known_devices`
--

LOCK TABLES `known_devices` WRITE;
/*!40000 ALTER TABLE `known_devices` DISABLE KEYS */;
/*!40000 ALTER TABLE `known_devices` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-05-25 17:51:22
