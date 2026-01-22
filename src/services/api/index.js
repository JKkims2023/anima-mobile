/**
 * API Service - Central Export
 * 
 * Features:
 * - Centralized API exports
 * - Easy import from components
 * - Type documentation
 * 
 * Usage:
 * import { chatApi, personaApi } from '@services/api';
 */

import apiClient from './apiClient';
import * as chatApi from './chatApi';
import * as errorHandler from './errorHandler';
import gameApi from './gameApi'; // 🎮 NEW: Game API

/**
 * Export all API services
 */
export {
  apiClient,
  chatApi,
  errorHandler,
  gameApi, // 🎮 NEW: Game API
};

/**
 * Default export for convenience
 */
export default {
  apiClient,
  chatApi,
  errorHandler,
  gameApi, // 🎮 NEW: Game API
};

