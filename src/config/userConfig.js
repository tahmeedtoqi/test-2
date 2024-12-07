import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.join(__dirname, '../../config.json');

const defaultConfig = {
  defaultUserId: '',
  defaultMessage: '',
  recentUsers: []
};

class UserConfig {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        return JSON.parse(data);
      }
      return defaultConfig;
    } catch (error) {
      logger.error('Error loading config:', error.message);
      return defaultConfig;
    }
  }

  saveConfig() {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
    } catch (error) {
      logger.error('Error saving config:', error.message);
    }
  }

  setDefaultUserId(userId) {
    this.config.defaultUserId = userId;
    this.addRecentUser(userId);
    this.saveConfig();
  }

  setDefaultMessage(message) {
    this.config.defaultMessage = message;
    this.saveConfig();
  }

  addRecentUser(userId) {
    if (!this.config.recentUsers.includes(userId)) {
      this.config.recentUsers.unshift(userId);
      this.config.recentUsers = this.config.recentUsers.slice(0, 5); // Keep last 5 users
      this.saveConfig();
    }
  }

  getDefaultUserId() {
    return this.config.defaultUserId;
  }

  getDefaultMessage() {
    return this.config.defaultMessage;
  }

  getRecentUsers() {
    return this.config.recentUsers;
  }
}

export const userConfig = new UserConfig();