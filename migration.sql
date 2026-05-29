CREATE TABLE IF NOT EXISTS friendships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requester_id INT NOT NULL,
  addressee_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'declined') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP NULL DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_friendship_direction (requester_id, addressee_id),
  INDEX idx_friendships_requester_status (requester_id, status),
  INDEX idx_friendships_addressee_status (addressee_id, status)
);
