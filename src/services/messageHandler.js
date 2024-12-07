import logger from '../utils/logger.js';

export class MessageHandler {
  constructor(bot) {
    this.bot = bot;
  }

  async handleIncomingMessage(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    
    logger.info(`Received message from ${chatId}: ${msg.text}`);
    
    try {
      await this.sendResponse(chatId, msg.text);
      await this.addReaction(chatId, messageId);
    } catch (error) {
      logger.error('Error handling message:', error.message);
    }
  }

  async sendResponse(chatId, text) {
    try {
      await this.bot.sendMessage(chatId, `Received: ${text}`);
      logger.info(`Sent response to ${chatId}`);
    } catch (error) {
      logger.error('Failed to send response:', error.message);
      throw error;
    }
  }

  async addReaction(chatId, messageId) {
    try {
      await this.bot.setMessageReaction(chatId, messageId, ['👍']);
      logger.info(`Added reaction to message ${messageId}`);
    } catch (error) {
      logger.warn('Could not add reaction:', error.message);
    }
  }
}