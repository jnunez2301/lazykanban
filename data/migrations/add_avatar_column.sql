-- Add avatar column to users table
ALTER TABLE users ADD COLUMN avatar VARCHAR(50) DEFAULT 'avatar-1.png';
