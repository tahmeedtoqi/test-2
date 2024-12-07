import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const requiredEnvVars = [
  'TELEGRAM_BOT_TOKEN'
];

function validateConfig() {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

try {
  validateConfig();
} catch (error) {
  logger.error(error.message);
  process.exit(1);
}

export const config = {
  botToken: process.env.TELEGRAM_BOT_TOKEN
};