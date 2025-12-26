/**
 * Migration script to add Session and OAuthState tables
 * Run this after deploying the new authentication system
 * 
 * Usage: node -r ts-node/register backend/migrations/add-session-tables.ts
 */

import sequelize from '../src/core/config/database';
import { Session, OAuthState } from '../src/core/models';

async function runMigration() {
  try {
    console.log('🔄 Starting migration: Adding Session and OAuthState tables...');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Create Session table
    await Session.sync({ alter: true });
    console.log('✅ Session table created/updated');

    // Create OAuthState table
    await OAuthState.sync({ alter: true });
    console.log('✅ OAuthState table created/updated');

    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
