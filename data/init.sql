-- Create database
CREATE DATABASE IF NOT EXISTS lazykanban;
USE lazykanban;

-- Users Table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  ui_mode ENUM('dev', 'regular') DEFAULT 'regular',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  avatar VARCHAR(255) DEFAULT 'avatar-1.png'
);

-- Projects Table
CREATE TABLE projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id INT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  pinned_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_owner (owner_id),
  INDEX idx_projects_pinned_name (is_pinned, name)
);

-- Groups Table
CREATE TABLE `groups` (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE KEY unique_group_per_project (project_id, name),
  INDEX idx_project (project_id)
);

-- Group Members Table
CREATE TABLE group_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('admin', 'manager', 'member', 'viewer') DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_per_group (group_id, user_id),
  INDEX idx_group (group_id),
  INDEX idx_user (user_id)
);

-- Permissions Table
CREATE TABLE permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  group_id INT NOT NULL,
  can_create_tasks BOOLEAN DEFAULT FALSE,
  can_edit_tasks BOOLEAN DEFAULT FALSE,
  can_delete_tasks BOOLEAN DEFAULT FALSE,
  can_manage_tags BOOLEAN DEFAULT FALSE,
  can_manage_members BOOLEAN DEFAULT FALSE,
  can_edit_project BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  UNIQUE KEY unique_permission_per_group (group_id)
);

-- Tags Table
CREATE TABLE tags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#6B7280',
  is_default BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE KEY unique_tag_per_project (project_id, name),
  INDEX idx_project (project_id)
);

-- Tasks Table
CREATE TABLE tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id INT NOT NULL,
  assignee_id INT,
  tag_id INT,
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  due_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE SET NULL,
  INDEX idx_project (project_id),
  INDEX idx_owner (owner_id),
  INDEX idx_assignee (assignee_id),
  INDEX idx_tag (tag_id)
);

-- Task Assignments History Table
CREATE TABLE task_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id INT NOT NULL,
  assigned_by INT NOT NULL,
  assigned_to INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_task (task_id)
);
