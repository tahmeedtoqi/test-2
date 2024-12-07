import logger from '../utils/logger.js';

export class MessageService {
  constructor(bot) {
    this.bot = bot;
    this.activeUsers = new Set();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.bot.on('message', (msg) => {
      const userId = msg.from.id.toString();
      this.activeUsers.add(userId);
      logger.info(`Received message from user ${userId} (@${msg.from.username || 'no username'})`);
    });
  }

  async verifyUserAccess(userId) {
    try {
      // Remove @ if username is provided
      const cleanUserId = userId.startsWith('@') ? userId.substring(1) : userId.toString();
      
      // Log the attempt
      logger.info(`Attempting to verify access for user: ${cleanUserId}`);
      
      // Try to get chat information
      const chat = await this.bot.getChat(cleanUserId);
      
      // Log successful verification
      logger.info(`Successfully verified access for user ${cleanUserId}`);
      logger.info(`Chat details: ID=${chat.id}, Type=${chat.type}`);
      
      return true;
    } catch (error) {
      logger.error(`Verification failed for user ${userId}`);
      logger.error(`Error details: ${error.message}`);
      
      if (error.response?.body) {
        logger.error(`Telegram response: ${JSON.stringify(error.response.body)}`);
      }
      
      logger.info('\nTroubleshooting steps:');
      logger.info('1. Verify the User ID is correct');
      logger.info('2. Make sure the user has started the bot');
      logger.info('3. Check if the bot token is valid');
      logger.info('4. Ensure the user hasn\'t blocked the bot\n');
      
      return false;
    }
  }

  async sendDirectMessage(userId, message) {
    try {
      logger.info(`Attempting to send message to user: ${userId}`);
      
      // First verify user access
      if (!(await this.verifyUserAccess(userId))) {
        throw new Error('User verification failed');
      }

      // Try to resolve username to ID if a username was provided
      let targetId = userId;
      if (userId.startsWith('@')) {
        logger.info(`Resolving username: ${userId}`);
        const chat = await this.bot.getChat(userId.substring(1));
        targetId = chat.id;
        logger.info(`Resolved username ${userId} to ID ${targetId}`);
      }

      // Log the actual sending attempt
      logger.info(`Sending message to ID: ${targetId}`);
      
      // Attempt to send the message
      const result = await this.bot.sendMessage(targetId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });
      
      logger.info(`✓ Message sent successfully to ${userId}`);
      logger.info(`Message ID: ${result.message_id}`);
      
      // Try to add reaction
      await this.addReaction(targetId, result.message_id);
      
      return result;
    } catch (error) {
      logger.error('Failed to send message:');
      logger.error(`Error type: ${error.code || 'UNKNOWN'}`);
      logger.error(`Error message: ${error.message}`);
      
      if (error.response?.body) {
        const errorDetails = error.response.body;
        logger.error('Telegram API Response:');
        logger.error(`  Status: ${errorDetails.error_code}`);
        logger.error(`  Description: ${errorDetails.description}`);
      }

      if (error.code === 'ETELEGRAM') {
        const errorMsg = error.response?.body?.description || error.message;
        
        if (errorMsg.includes('bot was blocked')) {
          logger.error('The user has blocked the bot. Ask them to unblock it and try again.');
        } else if (errorMsg.includes('chat not found')) {
          logger.error('Chat not found. Make sure:');
          logger.error('1. The User ID is correct');
          logger.error('2. The user has started a conversation with the bot');
          logger.error(`3. Try asking the user to send /start to the bot again`);
        }
      }
      
      throw error;
    }
  }

  async addReaction(chatId, messageId, reaction = '👍') {
    try {
      await this.bot.setMessageReaction(chatId, messageId, [reaction]);
      logger.info(`Added reaction ${reaction} to message ${messageId}`);
    } catch (error) {
      logger.debug(`Could not add reaction: ${error.message}`);
    }
  }
}