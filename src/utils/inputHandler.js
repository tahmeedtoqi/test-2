import readline from 'readline';
import logger from './logger.js';
import { userConfig } from '../config/userConfig.js';

export class InputHandler {
  constructor(messageService) {
    this.messageService = messageService;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async promptForUserId() {
    const recentUsers = userConfig.getRecentUsers();
    const defaultUserId = userConfig.getDefaultUserId();
    
    if (recentUsers.length > 0) {
      logger.info('Recent users:');
      recentUsers.forEach((userId, index) => {
        logger.info(`${index + 1}. ${userId}`);
      });
    }

    if (defaultUserId) {
      logger.info(`Current default user: ${defaultUserId}`);
    }

    return new Promise((resolve) => {
      this.rl.question('Enter User ID/Username (or number from recent users): ', (input) => {
        const trimmedInput = input.trim();
        
        // Check if input is a number referring to recent users
        const index = parseInt(trimmedInput) - 1;
        if (!isNaN(index) && index >= 0 && index < recentUsers.length) {
          resolve(recentUsers[index]);
        } else {
          resolve(trimmedInput);
        }
      });
    });
  }

  async promptForMessage() {
    const defaultMessage = userConfig.getDefaultMessage();
    const prompt = defaultMessage 
      ? `Enter message (or "exit" to quit, "change" for new user, "default" to use "${defaultMessage}"): `
      : 'Enter message (or "exit" to quit, "change" for new user): ';

    return new Promise((resolve) => {
      this.rl.question(prompt, (message) => {
        const trimmedMessage = message.trim();
        if (trimmedMessage === 'default' && defaultMessage) {
          resolve(defaultMessage);
        } else {
          resolve(trimmedMessage);
        }
      });
    });
  }

  async startMessageLoop(initialUserId = null) {
    let currentUserId = initialUserId || userConfig.getDefaultUserId();

    if (!currentUserId) {
      currentUserId = await this.promptForUserId();
    }

    userConfig.setDefaultUserId(currentUserId);
    logger.info(`Sending messages to: ${currentUserId}`);
    logger.info('Commands:');
    logger.info('  "exit" - Quit the application');
    logger.info('  "change" - Message a different user');
    logger.info('  "setdefault" - Set current message as default');
    logger.info('  "default" - Use default message (if set)');

    while (true) {
      const message = await this.promptForMessage();

      if (message.toLowerCase() === 'exit') {
        logger.info('Exiting...');
        this.rl.close();
        process.exit(0);
      }

      if (message.toLowerCase() === 'change') {
        currentUserId = await this.promptForUserId();
        userConfig.setDefaultUserId(currentUserId);
        logger.info(`Now sending messages to: ${currentUserId}`);
        continue;
      }

      if (message.toLowerCase() === 'setdefault') {
        const defaultMessage = await this.promptForMessage();
        userConfig.setDefaultMessage(defaultMessage);
        logger.info(`Default message set to: ${defaultMessage}`);
        continue;
      }

      try {
        await this.messageService.sendDirectMessage(currentUserId, message);
      } catch (error) {
        continue;
      }
    }
  }
}