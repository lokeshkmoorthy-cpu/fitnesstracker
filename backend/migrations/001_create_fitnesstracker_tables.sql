-- MySQL 8+ migration
-- Creates tables equivalent to the existing Google Sheets tabs.

CREATE TABLE IF NOT EXISTS users (
  userId CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  displayName VARCHAR(120) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  lastLoginAt DATETIME(3) NULL,
  telegramChatId VARCHAR(64) NULL,
  telegramUsername VARCHAR(64) NULL,
  telegramLinkedAt DATETIME(3) NULL,
  phoneNumber VARCHAR(32) NULL,
  address VARCHAR(255) NULL,
  goals TEXT NULL,
  PRIMARY KEY (userId),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_active (role, isActive),
  KEY idx_users_telegram_chat (telegramChatId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  sessionId CHAR(36) NOT NULL,
  userId CHAR(36) NOT NULL,
  tokenHash CHAR(64) NOT NULL,
  expiresAt DATETIME(3) NOT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  revokedAt DATETIME(3) NULL,
  ip VARCHAR(64) NULL,
  userAgent VARCHAR(512) NULL,
  PRIMARY KEY (sessionId),
  UNIQUE KEY uq_sessions_token_hash (tokenHash),
  KEY idx_sessions_user (userId),
  KEY idx_sessions_expires (expiresAt),
  CONSTRAINT fk_sessions_user
    FOREIGN KEY (userId) REFERENCES users(userId)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workouts (
  workoutId BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  userId CHAR(36) NOT NULL,
  username VARCHAR(120) NOT NULL,
  date DATE NOT NULL,
  muscle VARCHAR(120) NOT NULL,
  variation TEXT NULL,
  reps VARCHAR(120) NULL,
  notes TEXT NULL,
  PRIMARY KEY (workoutId),
  KEY idx_workouts_user_date (userId, date),
  KEY idx_workouts_username_date (username, date),
  CONSTRAINT fk_workouts_user
    FOREIGN KEY (userId) REFERENCES users(userId)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_log (
  eventId CHAR(36) NOT NULL,
  userId CHAR(36) NULL,
  eventType VARCHAR(80) NOT NULL,
  targetId VARCHAR(120) NULL,
  metadataJson JSON NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (eventId),
  KEY idx_audit_user_created (userId, createdAt),
  KEY idx_audit_type_created (eventType, createdAt),
  CONSTRAINT fk_audit_user
    FOREIGN KEY (userId) REFERENCES users(userId)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS goals (
  goalId CHAR(36) NOT NULL,
  userId CHAR(36) NOT NULL,
  username VARCHAR(120) NOT NULL,
  goalName VARCHAR(120) NOT NULL,
  period ENUM('daily', 'weekly') NOT NULL,
  stepsGoal INT UNSIGNED NOT NULL DEFAULT 0,
  distanceGoalKm DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  caloriesGoal INT UNSIGNED NOT NULL DEFAULT 0,
  activeMinutesGoal INT UNSIGNED NOT NULL DEFAULT 0,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  description TEXT NULL,
  targetValue DECIMAL(10,2) NULL,
  targetUnit VARCHAR(32) NULL,
  PRIMARY KEY (goalId),
  KEY idx_goals_user_active (userId, isActive),
  KEY idx_goals_period (period),
  CONSTRAINT fk_goals_user
    FOREIGN KEY (userId) REFERENCES users(userId)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity (
  activityId BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  userId CHAR(36) NOT NULL,
  username VARCHAR(120) NOT NULL,
  date DATE NOT NULL,
  steps INT UNSIGNED NOT NULL DEFAULT 0,
  distanceKm DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  calories INT UNSIGNED NOT NULL DEFAULT 0,
  activeMinutes INT UNSIGNED NOT NULL DEFAULT 0,
  notes TEXT NULL,
  PRIMARY KEY (activityId),
  UNIQUE KEY uq_activity_user_date (userId, date),
  KEY idx_activity_username_date (username, date),
  CONSTRAINT fk_activity_user
    FOREIGN KEY (userId) REFERENCES users(userId)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bot_commands (
  command VARCHAR(64) NOT NULL,
  response TEXT NOT NULL,
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (command)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance (
  attendanceId BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  date DATE NOT NULL,
  time TIME NULL,
  day VARCHAR(16) NULL,
  userId CHAR(36) NULL,
  chatId VARCHAR(64) NULL,
  PRIMARY KEY (attendanceId),
  UNIQUE KEY uq_attendance_user_date (userId, date),
  KEY idx_attendance_name_date (name, date),
  CONSTRAINT fk_attendance_user
    FOREIGN KEY (userId) REFERENCES users(userId)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS motivation_quotes (
  quoteId BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  quote TEXT NOT NULL,
  author VARCHAR(120) NULL,
  language ENUM('ta', 'en', 'fr') NOT NULL DEFAULT 'en',
  PRIMARY KEY (quoteId),
  KEY idx_quotes_language (language)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
