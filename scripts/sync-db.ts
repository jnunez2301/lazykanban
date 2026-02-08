import sequelize from '../src/lib/sequelize';
import '../src/models'; // Import all models

async function syncDatabase() {
  try {
    console.log('Syncing database schema with Sequelize...');

    // Sync all models with database
    // alter: true will add missing columns without dropping tables
    await sequelize.sync({ alter: true });

    console.log('✅ Database schema synced successfully!');
    console.log('All missing columns have been added.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    process.exit(1);
  }
}

syncDatabase();
