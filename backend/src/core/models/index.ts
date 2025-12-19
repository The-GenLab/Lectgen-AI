import sequelize from '../config/database';
import User from './User';
import Conversation from './Conversation';
import Message from './Message';
import TemplateFile from './TemplateFile';

// Export all models
export { User, Conversation, Message, TemplateFile };

// Sync database (development only)
export const syncDatabase = async (force: boolean = false) => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    if (force) {
      console.log('⚠️  Dropping all tables...');
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
