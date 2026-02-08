const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'lazykanban',
  dialect: 'mysql',
  username: process.env.DB_USER || 'lazykanban',
  password: process.env.DB_PASSWORD || 'your_secure_password_here',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  logging: false,
});

async function syncDatabase() {
  try {
    console.log('Syncing database schema...');

    // Add avatar column to users table
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS avatar VARCHAR(50) DEFAULT 'avatar-1.png'
    `);
    console.log('✅ Added avatar column to users table');

    // Add owner_id and assignee_id to tasks table
    await sequelize.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS owner_id INT NOT NULL DEFAULT 1
    `);
    console.log('✅ Added owner_id column to tasks table');

    await sequelize.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS assignee_id INT NULL
    `);
    console.log('✅ Added assignee_id column to tasks table');

    // Add foreign key constraints if they don't exist
    try {
      await sequelize.query(`
        ALTER TABLE tasks 
        ADD CONSTRAINT fk_tasks_owner 
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      `);
      console.log('✅ Added owner foreign key constraint');
    } catch (e) {
      console.log('ℹ️  Owner foreign key already exists');
    }

    try {
      await sequelize.query(`
        ALTER TABLE tasks 
        ADD CONSTRAINT fk_tasks_assignee 
        FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('✅ Added assignee foreign key constraint');
    } catch (e) {
      console.log('ℹ️  Assignee foreign key already exists');
    }

    // Add is_pinned and pinned_at columns to projects table
    await sequelize.query(`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE
    `);
    console.log('✅ Added is_pinned column to projects table');

    await sequelize.query(`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS pinned_at DATETIME NULL
    `);
    console.log('✅ Added pinned_at column to projects table');

    console.log('\n✅ Database schema synced successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    process.exit(1);
  }
}

syncDatabase();
