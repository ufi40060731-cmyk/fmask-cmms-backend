-- F-Mask CMMS 資料庫結構
-- 對應原本存在瀏覽器 localStorage 裡的每一種資料

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  account VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','engineer','supervisor') NOT NULL DEFAULT 'engineer',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS repair_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mes_no VARCHAR(60) NOT NULL,
  iso_no VARCHAR(60),
  machine_name VARCHAR(150),
  machine_code VARCHAR(100),
  request_date DATE,
  repair_days INT DEFAULT 1,
  repair_status VARCHAR(30),
  risk_level VARCHAR(30),
  part_category VARCHAR(100),
  fault_desc TEXT,
  check_result VARCHAR(100),
  technician VARCHAR(100),
  suggested_cycle VARCHAR(30),
  priority VARCHAR(10),
  source VARCHAR(30) DEFAULT 'added',
  created_by INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_mes_no (mes_no),
  KEY idx_request_date (request_date),
  KEY idx_machine (machine_code),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pm_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_date DATE NOT NULL,
  title VARCHAR(200),
  machine VARCHAR(150),
  owner VARCHAR(100),
  required_parts TEXT,
  status VARCHAR(30) DEFAULT '待執行',
  risk_level VARCHAR(30),
  fault TEXT,
  note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_item_date (item_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 自動產生的 PM 建議（依風險分數推算），只記錄「使用者有沒有手動標記完成」
CREATE TABLE IF NOT EXISTS auto_pm_status (
  pm_key VARCHAR(255) PRIMARY KEY,
  status VARCHAR(30) NOT NULL DEFAULT '待執行',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS stock_adjustments (
  part_category VARCHAR(100) PRIMARY KEY,
  qty_adjustment INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS machine_photos (
  machine VARCHAR(150) PRIMARY KEY,
  photo_data LONGTEXT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_account VARCHAR(100),
  message VARCHAR(500),
  KEY idx_event_time (event_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
