-- Forum Database Schema

CREATE DATABASE IF NOT EXISTS forum_db;
USE forum_db;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `created_by`, `created_at`) VALUES
(1, 'Testing', 'Still no clue', NULL, NULL, '2026-04-17 13:38:04'),
(2, 'General', 'general', 'General discussion', NULL, '2026-04-27 12:30:33'),
(3, 'Tech', 'tech', 'Programming and tech', NULL, '2026-04-27 12:30:33'),
(4, 'Gaming', 'gaming', 'Video games', NULL, '2026-04-27 12:30:33');

-- --------------------------------------------------------

--
-- Table structure for table `comments`
--

CREATE TABLE `comments` (
  `id` int(11) NOT NULL,
  `content` text NOT NULL,
  `author_id` int(11) NOT NULL,
  `thread_id` int(11) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `image_url` varchar(500) DEFAULT NULL,
  `is_hidden_by_ban` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `comments`
--

INSERT INTO `comments` (`id`, `content`, `author_id`, `thread_id`, `parent_id`, `is_deleted`, `created_at`, `updated_at`, `image_url`, `is_hidden_by_ban`) VALUES
(7, 'Ok sick then thats great', 7, 11, NULL, 0, '2026-05-19 08:11:05', '2026-05-19 08:11:05', NULL, 0),
(8, 'AAAAAAAHHHHH', 7, 11, NULL, 0, '2026-05-19 08:11:16', '2026-05-19 08:11:16', NULL, 0),
(9, 'Oh I should have tested this before', 7, 11, 7, 0, '2026-05-19 08:11:35', '2026-05-19 08:11:35', NULL, 0),
(10, 'Je l\'ai vu hier et j\'ai adoré. Inde Navarette était incroyable ; j\'ai adoré la rapidité avec laquelle elle passait de « ici » à « ICI ! ».\n\nLa scène de l\'appel téléphonique était troublante, et celle où elle parlait en dormant aussi.', 7, 12, NULL, 0, '2026-05-19 09:06:22', '2026-05-19 09:06:22', NULL, 0),
(11, 'C\'est une performance qui va marquer un tournant dans sa carrière. Elle est sur le point d\'exploser.', 9, 12, 10, 0, '2026-05-19 09:07:30', '2026-05-19 09:07:30', NULL, 0),
(12, 'Oui, je le pense aussi.', 8, 12, 11, 0, '2026-05-19 09:07:47', '2026-05-19 09:07:47', NULL, 0),
(13, 'Jusqu\'à présent, c\'est sa prestation que j\'ai préférée dans tous les films d\'horreur de cette année. J\'ai adoré la scène de la fête aussi.', 8, 12, 10, 0, '2026-05-19 09:11:39', '2026-05-19 09:11:39', NULL, 0),
(14, 'Lorsqu\'elle a lu son histoire lors de la scène de la fête, j\'ai immédiatement su que cette performance méritait une nomination aux Oscars.', 10, 12, 13, 0, '2026-05-19 09:14:09', '2026-05-19 09:14:09', NULL, 0),
(15, 'Une nomination aux Oscars serait formidable pour elle. On verra bien.', 8, 12, 14, 0, '2026-05-19 09:14:35', '2026-05-19 09:14:35', NULL, 0),
(16, 'Ce film m\'a fait penser à ceci', 11, 12, NULL, 1, '2026-05-19 09:15:58', '2026-05-19 09:16:31', 'https://cf.preview.redd.it/klx27aga5q1h1.gif?width=245&format=mp4&s=c89c2afb39f37beed2e962551f9a7ae25436d155', 0),
(17, 'Ce film m\'a fait penser à ceci', 11, 12, NULL, 0, '2026-05-19 09:16:26', '2026-05-19 09:16:26', 'https://i.redd.it/klx27aga5q1h1.gif', 0),
(18, 'Haha, c\'est tout à fait approprié !', 8, 12, 17, 0, '2026-05-19 09:16:55', '2026-05-19 09:16:55', NULL, 0),
(19, 'Je ne sais pas si quelqu\'un a déjà publié cette image, mais je pense qu\'il s\'agit d\'un moment très important de l\'histoire du sport… Jesse Owens battant les nazis aux Jeux olympiques de 1936.', 8, 14, NULL, 0, '2026-05-29 07:41:44', '2026-05-29 07:41:44', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-mf8is64e0y3h1.png?width=640&crop=smart&auto=webp&s=8cec758e5bd15d495e8f6eb838ec40cd9a8abc74', 0),
(20, 'Il faudrait quelques pixels de plus', 7, 14, NULL, 0, '2026-05-29 07:42:50', '2026-05-29 07:42:50', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-chux0j3xtx3h1.png?width=208&format=png&auto=webp&s=c4649ddbf90996d62b2e5a81209ed4f73069e6f6', 0),
(21, '', 10, 14, 20, 0, '2026-05-29 07:46:17', '2026-05-29 07:46:17', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-y6oxf8d27y3h1.jpeg?width=640&crop=smart&auto=webp&s=1ca209ba0e5826f86998e9236b6e7d71e5cb33c5', 0),
(22, '', 10, 14, 20, 0, '2026-05-29 07:46:40', '2026-05-29 07:46:40', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-c3nuobi16y3h1.jpeg?width=274&format=pjpg&auto=webp&s=419bdb9bb263224843316f3721315194e242e960', 0),
(23, '', 11, 14, 22, 0, '2026-05-29 07:49:57', '2026-05-29 07:49:57', 'https://external-preview.redd.it/s5JtGqFj3SP037WopJ8kbNCJgtTnSrek9VTMDJfOYzE.gif?auto=webp&s=a90b5ee556205f9a34b5b37a3898907fea8474b6', 0),
(24, 'Il faut agir', 8, 14, 20, 0, '2026-05-29 07:51:01', '2026-05-29 07:51:01', 'https://external-preview.redd.it/go1pUHP_iChK41djGGN2u2IMZDZpFoW9_CEtaSAs6-M.gif?auto=webp&s=810c9c214c3ddcaa31b3401181c54a273ae873b8', 0),
(25, '', 7, 14, 20, 0, '2026-05-29 07:51:33', '2026-05-29 07:51:33', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-93h44qu05y3h1.jpeg?width=1164&format=pjpg&auto=webp&s=51a617979f972ec6dff4798d7c7515ac02c4780e', 0),
(26, '', 11, 14, 20, 0, '2026-05-29 07:51:53', '2026-05-29 07:51:53', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-ylh1psfu9y3h1.jpeg?width=245&format=pjpg&auto=webp&s=4817d3fbd15fca2dded2787190e13053e71b8d32', 0),
(27, 'Je déteste ce type et la façon dont il ridiculise la boxe. À mon avis, cette image illustre parfaitement le principe de « on récolte ce qu\'on sème ». J\'étais ravi après ce match et j\'espère qu\'il ne remettra plus jamais les gants.', 10, 14, 20, 0, '2026-05-29 07:52:45', '2026-05-29 07:52:45', NULL, 0),
(28, '', 7, 14, NULL, 0, '2026-05-29 07:53:24', '2026-05-29 07:53:24', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-xafs7li3qx3h1.jpeg?width=1296&format=pjpg&auto=webp&s=fcb44e8cb8c82954b893beaf4deb95b96263aad9', 0),
(29, 'Peut-être celui ci', 9, 14, NULL, 0, '2026-05-29 07:55:25', '2026-05-29 07:55:25', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-bdg63zhrox3h1.png?width=1000&format=png&auto=webp&s=ef65feb5f40e9a5c66e52c5c3167bc772b9c3d24', 0),
(30, '', 11, 14, NULL, 0, '2026-05-29 07:56:07', '2026-05-29 07:56:07', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-sh3s6whv5y3h1.jpeg?width=690&format=pjpg&auto=webp&s=c55fd9c1d482c7593f62d4d95a667ec4a462b098', 0),
(31, '', 10, 14, NULL, 0, '2026-05-29 07:56:34', '2026-05-29 07:56:34', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-4y5kgsynux3h1.jpeg?width=960&format=pjpg&auto=webp&s=232e40084998b534922abf51b595e7d84ab39868', 0),
(32, '', 11, 14, NULL, 0, '2026-05-29 07:57:10', '2026-05-29 07:57:10', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-rap9fxafux3h1.jpeg?width=640&crop=smart&auto=webp&s=2f6c569329871272990add2df3fc0f7dd1f25eba', 0),
(33, '', 10, 14, 32, 0, '2026-05-29 07:57:34', '2026-05-29 07:57:34', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-2ap2vds94y3h1.jpeg?width=640&crop=smart&auto=webp&s=5dbd53179f31acae061aca26b7d5b7c0c89f20c8', 0),
(34, 'Je ne comprends pas pourquoi tu publies des images de mauvaise qualité générées par IA alors que voici la véritable image de ce moment :', 11, 14, NULL, 0, '2026-05-29 07:59:35', '2026-05-29 07:59:35', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-ofk74fa7sx3h1.png?width=320&crop=smart&auto=webp&s=87faeb0bc1cba4011a00a85084786d39775adfb3', 0),
(35, '', 10, 14, NULL, 0, '2026-05-29 08:00:31', '2026-05-29 08:00:31', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-grhlr99eux3h1.png?width=640&crop=smart&auto=webp&s=097f19681628b2c5e2911383d23cab27a34ef48d', 0),
(36, 'Le « boop » entendu dans le monde entier', 11, 14, 35, 0, '2026-05-29 08:00:52', '2026-05-29 08:00:52', NULL, 0),
(37, '', 10, 14, NULL, 0, '2026-05-29 08:01:15', '2026-05-29 08:01:15', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-met98u2xxx3h1.jpeg?width=640&crop=smart&auto=webp&s=04c1892cdcbde74e793f3496050b34ac281803c4', 0),
(38, 'J\'ai cru que mon frère était sorti d\'un portail', 11, 14, 37, 0, '2026-05-29 08:01:40', '2026-05-29 08:01:40', NULL, 0),
(39, '', 8, 14, NULL, 0, '2026-05-29 08:01:59', '2026-05-29 08:01:59', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-xbp9bx8fqx3h1.png?width=320&crop=smart&auto=webp&s=e1f376664538c667c268ac65e77cd4be75e3b725', 0),
(40, '', 10, 14, NULL, 0, '2026-05-29 08:02:30', '2026-05-29 08:02:30', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-socik7f6ux3h1.jpeg?width=640&crop=smart&auto=webp&s=c96566138ddd0637dae0dff0c5cfcaecc5482673', 0),
(41, '', 12, 14, NULL, 0, '2026-05-29 08:04:06', '2026-05-29 08:04:06', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-q6557l76rx3h1.jpeg?width=640&crop=smart&auto=webp&s=a89037877dbba0242262c19cb926f74a6241afb1', 0),
(42, 'Même pas sa photo la plus emblématique :', 12, 14, 41, 0, '2026-05-29 08:04:33', '2026-05-29 08:04:33', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-7bml6s317y3h1.png?width=640&crop=smart&auto=webp&s=7c8a15baf4609eaac7bd5646bb0b547b9e38dddb', 0),
(43, '', 12, 14, NULL, 1, '2026-05-29 08:05:04', '2026-05-29 08:05:12', 'https://external-preview.redd.it/H8cw_pIOWufgLPECe265JJU9m08sa-SIjBqWh0Nv8w8.gif?width=264&format=mp4&s=a8ac4933968329cf3d8f739cf9c04dede9a26609', 0),
(44, 'c\'était emblématique', 12, 14, NULL, 0, '2026-05-29 08:05:21', '2026-05-29 08:05:45', 'https://external-preview.redd.it/H8cw_pIOWufgLPECe265JJU9m08sa-SIjBqWh0Nv8w8.gif?auto=webp&s=0a5f2c78ab2213d5d09cdd67a0e7401981b134bd', 0),
(45, 'Les GIF créés par la suite étaient de très haute qualité.', 12, 14, 44, 0, '2026-05-29 08:06:11', '2026-05-29 08:06:11', 'https://external-preview.redd.it/RiIvuaAGQKX06l3orct4TmLdTT-Cq1IHiYmECy5Wnvo.gif?auto=webp&s=6b424946a0b4b8ec4a20749fc90803ce7f95748e', 0),
(46, 'Impossible de faire mieux.', 12, 14, NULL, 0, '2026-05-29 08:06:48', '2026-05-29 08:06:48', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-ye31m6y8ux3h1.jpeg?width=1032&format=pjpg&auto=webp&s=ecf8fe8cc2a6f58a34c638e918d0912dcf0d3d95', 0),
(47, 'Un marathon par jour pendant 143 jours. Soit un total de 5 373 kilomètres (3 339 miles).', 12, 14, 46, 0, '2026-05-29 08:07:18', '2026-05-29 08:07:18', NULL, 0),
(48, '', 12, 14, NULL, 0, '2026-05-29 08:07:33', '2026-05-29 08:07:33', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-p14azczvvx3h1.jpeg?width=600&format=pjpg&auto=webp&s=c6885535740dcbc00d35143f2728aaf7e6d41b6b', 0),
(49, '', 12, 14, 48, 0, '2026-05-29 08:07:47', '2026-05-29 08:07:47', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-aa9vwcle1y3h1.jpeg?width=640&crop=smart&auto=webp&s=eaa614aaba9a2f420484b2d539f7f4ccba8915f3', 0),
(50, 'Bobby Orr', 12, 14, NULL, 0, '2026-05-29 08:08:13', '2026-05-29 08:08:13', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-eazbdno43y3h1.jpeg?width=640&crop=smart&auto=webp&s=827b7ac32de22dbcd6e5d6ac9dc5b51aa2b2e902', 0),
(51, '', 12, 14, NULL, 0, '2026-05-29 08:08:28', '2026-05-29 08:08:28', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-61hvs4rcrx3h1.jpeg?width=320&crop=smart&auto=webp&s=aac301a489abccf046303a24477bb9d4ce2ef513', 0),
(52, 'L\'HOMME ! LE MYTHE ! LA LÉGENDE !!!', 12, 14, NULL, 0, '2026-05-29 08:08:51', '2026-05-29 08:08:51', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-4avjp9rjvx3h1.jpeg?width=640&crop=smart&auto=webp&s=b3953cd6363bc2804c8f9443ae5db66d3909ce9a', 0),
(53, 'Le roi.', 12, 14, NULL, 0, '2026-05-29 08:09:18', '2026-05-29 08:09:18', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-ofi6hpwdpx3h1.jpeg?width=320&crop=smart&auto=webp&s=8bf7a1bd4be4a9730a25d86f854afbe7731405bc', 0);

-- --------------------------------------------------------

--
-- Table structure for table `friendships`
--

CREATE TABLE `friendships` (
  `id` int(11) NOT NULL,
  `requester_id` int(11) NOT NULL,
  `addressee_id` int(11) NOT NULL,
  `status` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int(11) NOT NULL,
  `reporter_id` int(11) NOT NULL,
  `target_type` enum('thread','comment','user') NOT NULL,
  `target_id` int(11) NOT NULL,
  `reason` varchar(500) NOT NULL,
  `status` enum('open','reviewed','dismissed') NOT NULL DEFAULT 'open',
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `reports`
--

INSERT INTO `reports` (`id`, `reporter_id`, `target_type`, `target_id`, `reason`, `status`, `reviewed_by`, `reviewed_at`, `created_at`, `updated_at`) VALUES
(1, 12, 'thread', 11, 'Je n\'ap pas l\'impression que ca devrait etre visible', 'reviewed', 8, '2026-05-29 08:22:41', '2026-05-29 08:22:21', '2026-05-29 08:22:41'),
(2, 11, 'thread', 11, 'Je ne pense pas qu\'il devrait être visible', 'dismissed', 8, '2026-05-29 08:26:13', '2026-05-29 08:26:01', '2026-05-29 08:26:13'),
(3, 9, 'user', 13, 'Il fait des tests :(', 'reviewed', 8, '2026-05-29 08:30:32', '2026-05-29 08:30:17', '2026-05-29 08:30:32');

-- --------------------------------------------------------

--
-- Table structure for table `tags`
--

CREATE TABLE `tags` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `slug` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `tags`
--

INSERT INTO `tags` (`id`, `name`, `slug`) VALUES
(1, 'javascript', 'javascript'),
(2, 'nodejs', 'nodejs'),
(3, 'mysql', 'mysql'),
(4, 'help', 'help'),
(5, 'Films', 'films'),
(6, 'Forza', 'forza'),
(7, 'Gaming', 'gaming'),
(8, 'Voitures', 'voitures'),
(9, 'Sports', 'sports');

-- --------------------------------------------------------

--
-- Table structure for table `threads`
--

CREATE TABLE `threads` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `author_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `is_pinned` tinyint(1) DEFAULT '0',
  `is_locked` tinyint(1) DEFAULT '0',
  `is_deleted` tinyint(1) DEFAULT '0',
  `view_count` int(11) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `image_url` varchar(500) DEFAULT NULL,
  `is_hidden_by_ban` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `threads`
--

INSERT INTO `threads` (`id`, `title`, `slug`, `content`, `author_id`, `category_id`, `is_pinned`, `is_locked`, `is_deleted`, `view_count`, `created_at`, `updated_at`, `image_url`, `is_hidden_by_ban`) VALUES
(11, 'TEST', 'test-1779178199668', 'This to test upvotes and things', 7, 1, 0, 0, 0, 25, '2026-05-19 08:09:59', '2026-05-29 08:26:04', NULL, 0),
(12, 'Obsession (2026)', 'obsession-2026-1779181140263', 'Je dois avouer qu\'Obsession m\'a paru sceptique malgré toutes les critiques élogieuses reçues après les festivals. Pourtant, cet engouement est justifié.\n\nObsession réussit à moderniser l\'histoire classique de « La Patte de singe ». Le protagoniste, Bear (Michael Johnston), est un jeune homme solitaire et détaché des autres, incapable d\'exprimer ses sentiments pour Nikki (Inde Navarrette), son amour d\'enfance. Après avoir répété un discours sur ses sentiments, il rate complètement l\'occasion de les lui déclarer et se tourne vers le « Saule à un vœu ». Son vœu ? Qu\'elle l\'aime plus que quiconque au monde.\n\nComme il s\'agit d\'une réinterprétation de « La Patte de singe », le vœu tourne au désastre. Nikki devient obsédée, au point de menacer la vie de leur collègue, Sarah (Megan Lawless), qui a peut-être un faible pour Bear. Elle scotche également la porte pour empêcher Bear de partir travailler le lendemain matin, et elle sème la panique dans leur entourage. Son comportement devient de plus en plus erratique et terrifiant.\n\nNavarrette est fantastique dans ce film et le transcende. Elle a cité la performance de Toni Collette dans Hérédité et le rôle principal de Mia Goth dans Pearl comme influences majeures, et si vous voyez le film, vous comprendrez pourquoi. Elle est complètement déjantée dans le rôle de Nikki, et c\'est exactement ce qu\'il y a de mieux dans un film d\'horreur.\n\nDe plus, Barker n\'a pas peur d\'aller loin. Il repousse vraiment les limites avec certaines scènes violentes, et c\'est une excellente raison de voir ce film au cinéma. Il y a quelques séquences vraiment troublantes et surprenantes.\n\nEn résumé, Obsession est l\'un des meilleurs films d\'horreur de l\'année, porté par la performance magistrale de Navarrette.', 8, 1, 0, 0, 0, 30, '2026-05-19 08:59:00', '2026-05-29 08:22:56', 'https://media.pathe.fr/movie/mx/50502/lg/2/media', 0),
(13, 'Playground Games ne sait que créer des chefs-d\'œuvre.', 'playground-games-ne-sait-que-cr-er-des-chefs-d-uvre-1779182594824', '', 7, 4, 0, 0, 0, 8, '2026-05-19 09:23:14', '2026-05-29 07:26:51', 'https://cf.preview.redd.it/playground-games-only-knows-how-to-make-masterpieces-v0-3fy522kawb1h1.jpeg?width=1080&crop=smart&auto=webp&s=31b8af85e7688a6ffdbff9b0cb08e7253cfc9397', 0),
(14, 'Trouvez-moi une photo de sport plus emblématique... J\'attends ☕️', 'trouvez-moi-une-photo-de-sport-plus-embl-matique-j-attends-1780040455922', '', 9, 2, 0, 0, 0, 34, '2026-05-29 07:40:55', '2026-05-29 08:36:21', 'https://cf.preview.redd.it/find-me-a-more-iconic-sports-pic-ill-wait-v0-i0chscrnox3h1.jpeg?auto=webp&s=99ce14320901604393265bf7df04188138764f8b', 0);

-- --------------------------------------------------------

--
-- Table structure for table `thread_tags`
--

CREATE TABLE `thread_tags` (
  `thread_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `thread_tags`
--

INSERT INTO `thread_tags` (`thread_id`, `tag_id`) VALUES
(11, 1),
(12, 5),
(13, 6),
(13, 7),
(13, 8),
(14, 9);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('user','moderator','admin') DEFAULT 'user',
  `avatar_url` varchar(255) DEFAULT NULL,
  `bio` text,
  `is_banned` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `avatar_url`, `bio`, `is_banned`, `created_at`, `updated_at`) VALUES
(7, 'Bob', 'bob@email.com', '$2b$12$6lmeXYheT6uudn9j8tE8KeLfZiyMkgkBSFScpSWdaYXGSszY3xBqa', 'user', NULL, NULL, 0, '2026-05-19 07:33:18', '2026-05-28 08:12:36'),
(8, 'Garchilla', 'garchilla@email.com', '$2b$12$puWF7YNS0TwPxpVO7hZXJ.6lWSmfZYLhXSn8ejHkQu/8bkBIfjPwO', 'admin', 'https://cdn.prod.website-files.com/67164b123871e451cc470cea/6741af74cd1483085c793f0f_7b85a8c653087935c9e34be973e5cebc2df4f701-872x720.jpeg', 'Admin du forum.', 0, '2026-05-19 07:52:55', '2026-05-22 09:59:53'),
(9, 'forcefivepod', 'five@email.com', '$2b$12$LA4LU6ZmZ50CpbNhQlENPONJ/kYLu.sbSNiudnMGS/D.h8I9KURvq', 'user', NULL, NULL, 0, '2026-05-19 09:07:09', '2026-05-19 09:07:09'),
(10, 'Kelldoza', 'kelldoza@email.com', '$2b$12$a0meev9tuziGS26LXXXZIe/V1DYPi1ytCgpvvCpKjsq6K/ipbFuvq', 'user', NULL, NULL, 0, '2026-05-19 09:13:40', '2026-05-19 09:13:40'),
(11, 'electriclightthemoon', 'electric@email.com', '$2b$12$kmImFVqZPJ2jGLyFZyDN6.3LJbNkqBjmUp43UEElZqBBm97O2xkIy', 'user', NULL, NULL, 0, '2026-05-19 09:15:12', '2026-05-19 09:15:12'),
(12, 'UserTest', 'usertest@email.com', '$2b$12$aj45EuaWkDwVnIkb17oCBexc6ObuZW1tRBjjII6B8n/sDoGxdk.ey', 'user', 'https://cdn-icons-png.flaticon.com/512/11789/11789135.png', NULL, 0, '2026-05-29 08:03:55', '2026-05-29 08:03:55'),
(13, 'testBan', 'testban@email.com', '$2b$12$su3cFjspBU9twfSfloXtUekFp91rahK.aH.4x4KTx/Q6Dk7cwfwdW', 'user', 'https://cdn-icons-png.flaticon.com/512/11789/11789135.png', NULL, 0, '2026-05-29 08:29:28', '2026-05-29 08:31:39');

-- --------------------------------------------------------

--
-- Table structure for table `votes`
--

CREATE TABLE `votes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `target_type` enum('thread','comment') NOT NULL,
  `target_id` int(11) NOT NULL,
  `value` tinyint(4) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `votes`
--

INSERT INTO `votes` (`id`, `user_id`, `target_type`, `target_id`, `value`, `created_at`) VALUES
(34, 7, 'comment', 7, 1, '2026-05-19 08:11:08'),
(44, 8, 'comment', 11, 1, '2026-05-19 09:11:57');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `author_id` (`author_id`),
  ADD KEY `thread_id` (`thread_id`),
  ADD KEY `parent_id` (`parent_id`);

--
-- Indexes for table `friendships`
--
ALTER TABLE `friendships`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_friendship_direction` (`requester_id`,`addressee_id`),
  ADD KEY `idx_friendships_requester_status` (`requester_id`,`status`),
  ADD KEY `idx_friendships_addressee_status` (`addressee_id`,`status`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reports_status_created` (`status`,`created_at`),
  ADD KEY `idx_reports_target` (`target_type`,`target_id`),
  ADD KEY `idx_reports_reporter` (`reporter_id`),
  ADD KEY `reviewed_by` (`reviewed_by`);

--
-- Indexes for table `tags`
--
ALTER TABLE `tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `threads`
--
ALTER TABLE `threads`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `author_id` (`author_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `thread_tags`
--
ALTER TABLE `thread_tags`
  ADD PRIMARY KEY (`thread_id`,`tag_id`),
  ADD KEY `tag_id` (`tag_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `votes`
--
ALTER TABLE `votes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_vote` (`user_id`,`target_type`,`target_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT for table `friendships`
--
ALTER TABLE `friendships`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tags`
--
ALTER TABLE `tags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `threads`
--
ALTER TABLE `threads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `votes`
--
ALTER TABLE `votes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`thread_id`) REFERENCES `threads` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_ibfk_3` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `threads`
--
ALTER TABLE `threads`
  ADD CONSTRAINT `threads_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `threads_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `thread_tags`
--
ALTER TABLE `thread_tags`
  ADD CONSTRAINT `thread_tags_ibfk_1` FOREIGN KEY (`thread_id`) REFERENCES `threads` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `thread_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `votes`
--
ALTER TABLE `votes`
  ADD CONSTRAINT `votes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
