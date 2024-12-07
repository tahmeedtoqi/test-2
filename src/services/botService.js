import TelegramBot from 'node-telegram-bot-api';
import { MessageHandler } from './messageHandler.js';
import logger from '../utils/logger.js';

export class BotService {
  constructor(token) {
    this.bot = new TelegramBot(token, { polling: true });
    this.messageHandler = new MessageHandler(this.bot);
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.bot.on('message', (msg) => this.messageHandler.handleIncomingMessage(msg));
    this.bot.on('error', (error) => {
      logger.error('Bot error:', error.message);
    });
    this.bot.on('polling_error', (error) => {
      logger.error('Polling error:', error.message);
    });
    
    logger.info('Bot event handlers initialized');
  }

  async sendCustomMessage(userId, message) {
    try {
      const result = await this.bot.sendMessage(userId, message);
      logger.info(`Sent message to user ${userId}: ${message}`);
      return result;
    } catch (error) {
      logger.error(`Failed to send message to user ${userId}:`, error.message);
      throw error;
    }
  }
}