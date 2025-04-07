// Script to run the MySQL setup manually
import { setupMysqlDatabase } from './setup-mysql';

async function runSetup() {
  try {
    console.log('Starting database setup...');
    await setupMysqlDatabase();
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up the database:', error);
    process.exit(1);
  }
}

runSetup();