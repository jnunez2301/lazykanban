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

async function addProjectPinningColumns() {
  try {
    console.log('Adding project pinning columns...');

    // Check if is_pinned column exists
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'projects' 
        AND COLUMN_NAME = 'is_pinned'
    `);

    if (columns.length === 0) {
      await sequelize.query(`
        ALTER TABLE projects 
        ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT FALSE AFTER description
      `);
      console.log('✅ Added is_pinned column to projects table');
    } else {
      console.log('ℹ️  is_pinned column already exists');
    }

    // Check if pinned_at column exists
    const [pinnedAtColumns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'projects' 
        AND COLUMN_NAME = 'pinned_at'
    `);

    if (pinnedAtColumns.length === 0) {
      await sequelize.query(`
        ALTER TABLE projects 
        ADD COLUMN pinned_at DATETIME NULL AFTER is_pinned
      `);
      console.log('✅ Added pinned_at column to projects table');
    } else {
      console.log('ℹ️  pinned_at column already exists');
    }

    console.log('\n✅ Project pinning columns added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding columns:', error);
    process.exit(1);
  }
}

addProjectPinningColumns();
