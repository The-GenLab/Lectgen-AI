import sequelize from '../config/database';
import User from './User';
import Conversation from './Conversation';
import Message from './Message';
import TemplateFile from './TemplateFile';
import UsageLog from './UsageLog';
import Session from './Session';
import SystemSettings from './SystemSettings';
import Payment from './Payment';

// Define associations (after all models are imported to avoid circular dependencies)
User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });

// Export all models
export { User, Conversation, Message, TemplateFile, UsageLog, Session, SystemSettings, Payment };

// Sync database (development only)
export const syncDatabase = async (force: boolean = false) => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    if (force) {
      console.log('⚠️  Dropping all tables...');
    } else {
      // Handle migration for sessions table: delete existing sessions before adding refreshToken NOT NULL constraint
      try {
        const [results] = await sequelize.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'sessions' 
          AND column_name = 'refreshToken'
        `);
        
        // If refreshToken column doesn't exist yet, delete existing sessions
        // because they won't have refreshToken values and will violate NOT NULL constraint
        if (!Array.isArray(results) || results.length === 0) {
          console.log('🔄 Preparing sessions table migration: deleting existing sessions...');
          await sequelize.query('DELETE FROM sessions');
          console.log('✅ Existing sessions deleted.');
        }
      } catch (migrationError) {
        // Table might not exist yet, ignore the error
        console.log('ℹ️  Sessions table migration check skipped (table may not exist yet)');
      }
    }

    await sequelize.sync({ force, alter: !force });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

// Close database connection
export const closeDatabase = async () => {
  await sequelize.close();
  console.log('✅ Database connection closed.');
};

export default sequelize;
