import TelegramBot from 'node-telegram-bot-api';
import { config } from './config/config.js';
import { MessageService } from './services/messageService.js';
import { InputHandler } from './utils/inputHandler.js';
import logger from './utils/logger.js';

async function main() {
  try {
    logger.info('Initializing Telegram bot...');
    
    const bot = new TelegramBot(config.botToken, { 
      polling: true,
      filepath: false
    });

    // Get bot information first
    const botInfo = await bot.getMe();
    logger.info(`Bot initialized: @${botInfo.username}`);
    logger.info('─────────────────────────────────────');
    logger.info('Important: Before sending messages:');
    logger.info(`1. Recipients must start @${botInfo.username}`);
    logger.info('2. Send /start command to the bot');
    logger.info('3. Get their User ID from the bot response');
    logger.info('─────────────────────────────────────');

    // Set up automatic replies to /start command
    bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const username = msg.from.username ? `@${msg.from.username}` : 'No username';
      logger.info(`User ${msg.from.id} (${username}) started the bot`);
      
      await bot.sendMessage(chatId, 
        '✓ Bot activated successfully!\n\n' +
        `Your User ID: ${chatId}\n` +
        'Share this ID with the bot operator to receive messages.\n\n' +
        'Status: Ready to receive messages'
      );
    });

    const messageService = new MessageService(bot);
    const inputHandler = new InputHandler(messageService);

    // Handle bot errors
    bot.on('error', (error) => {
      logger.error('Bot error:', error.message);
    });

    bot.on('polling_error', (error) => {
      logger.error('Polling error:', error.message);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      logger.info('Shutting down...');
      bot.stopPolling();
      process.exit(0);
    });

    await inputHandler.startMessageLoop();
    
  } catch (error) {
    logger.error('Failed to start bot:', error.message);
    process.exit(1);
  }
}

main();