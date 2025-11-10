/**
 * 🔌 API Client
 * 
 * Axios-based HTTP client for idol-companion backend
 * 
 * Features:
 * - Automatic JWT token injection
 * - Request/Response interceptors
 * - Error handling
 * - Retry logic
 * - Timeout configuration
 * 
 * IMPORTANT: All API calls must go through this client!
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  API_BASE_URL,
  API_TIMEOUT,
  API_RETRY_CONFIG,
  DEFAULT_HEADERS,
} from '../../config/api.config';

// ==================== Constants ====================

const TOKEN_STORAGE_KEY = 'anima-mobile-token';

// ==================== Create Axios Instance ====================

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: DEFAULT_HEADERS,
});

// ==================== Request Interceptor ====================

/**
 * Inject JWT token into all requests
 */
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      
      if (token) {
        // Add Authorization header
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Log request in development
      if (__DEV__) {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
      }
      
      return config;
    } catch (error) {
      console.error('[API Client] Request interceptor error:', error);
      return config;
    }
  },
  (error) => {
    console.error('[API Client] Request error:', error);
    return Promise.reject(error);
  }
);

// ==================== Response Interceptor ====================

/**
 * Handle responses and errors
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (__DEV__) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}:`, response.status);
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log error in development
    if (__DEV__) {
      console.error('[API Error]:', {
        url: originalRequest?.url,
        method: originalRequest?.method,
        status: error.response?.status,
        message: error.message,
      });
    }
    
    // Handle specific error cases
    if (error.response) {
      const { status, data } = error.response;
      
      // 401 Unauthorized - Token expired or invalid
      if (status === 401) {
        // Clear token
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
        
        // Don't retry
        return Promise.reject({
          code: 'AUTH_ERROR',
          message: data?.message || 'Authentication failed',
          status: 401,
          errorCode: data?.errorCode,
        });
      }
      
      // 403 Forbidden - No permission
      if (status === 403) {
        return Promise.reject({
          code: 'PERMISSION_ERROR',
          message: data?.message || 'Permission denied',
          status: 403,
          errorCode: data?.errorCode,
        });
      }
      
      // 404 Not Found
      if (status === 404) {
        return Promise.reject({
          code: 'NOT_FOUND',
          message: data?.message || 'Resource not found',
          status: 404,
          errorCode: data?.errorCode,
        });
      }
      
      // 500+ Server errors - Retry if configured
      if (status >= 500 && API_RETRY_CONFIG.retryOn.includes(status)) {
        const retryCount = originalRequest.__retryCount || 0;
        
        if (retryCount < API_RETRY_CONFIG.maxRetries) {
          originalRequest.__retryCount = retryCount + 1;
          
          // Wait before retry
          await new Promise(resolve => 
            setTimeout(resolve, API_RETRY_CONFIG.retryDelay * (retryCount + 1))
          );
          
          if (__DEV__) {
            console.log(`[API Client] Retrying request (${retryCount + 1}/${API_RETRY_CONFIG.maxRetries})`);
          }
          
          return apiClient(originalRequest);
        }
      }
      
      // Return error with response data
      return Promise.reject({
        code: 'API_ERROR',
        message: data?.message || 'Server error',
        status,
        errorCode: data?.errorCode,
        data: data?.data,
      });
    }
    
    // Network error (no response)
    if (error.request) {
      return Promise.reject({
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your internet connection.',
        status: 0,
      });
    }
    
    // Request setup error
    return Promise.reject({
      code: 'REQUEST_ERROR',
      message: error.message || 'Request failed',
      status: 0,
    });
  }
);

// ==================== Token Management ====================

/**
 * Save JWT token to AsyncStorage
 * @param {string} token - JWT token
 */
export const saveToken = async (token) => {
  try {
    console.log('💾 [API Client] Saving token to AsyncStorage...');
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    console.log('✅ [API Client] Token saved successfully');
    console.log('🔑 [API Client] Token preview:', token.substring(0, 20) + '...');
  } catch (error) {
    console.error('❌ [API Client] Failed to save token:', error);
    throw error;
  }
};

/**
 * Get JWT token from AsyncStorage
 * @returns {Promise<string|null>} JWT token or null
 */
export const getToken = async () => {
  try {
    console.log('🔍 [API Client] Reading token from AsyncStorage...');
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    
    if (token) {
      console.log('✅ [API Client] Token found!');
      console.log('🔑 [API Client] Token preview:', token.substring(0, 20) + '...');
    } else {
      console.log('⚠️  [API Client] No token found in AsyncStorage');
    }
    
    return token;
  } catch (error) {
    console.error('❌ [API Client] Failed to get token:', error);
    return null;
  }
};

/**
 * Remove JWT token from AsyncStorage
 */
export const removeToken = async () => {
  try {
    console.log('🗑️  [API Client] Removing token from AsyncStorage...');
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    console.log('✅ [API Client] Token removed successfully');
  } catch (error) {
    console.error('❌ [API Client] Failed to remove token:', error);
    throw error;
  }
};

/**
 * Check if user is authenticated (has token)
 * @returns {Promise<boolean>} True if authenticated
 */
export const isAuthenticated = async () => {
  const token = await getToken();
  return !!token;
};

// ==================== Request Helpers ====================

/**
 * GET request
 * @param {string} url - API endpoint
 * @param {object} config - Axios config
 * @returns {Promise} Response data
 */
export const get = async (url, config = {}) => {
  const response = await apiClient.get(url, config);
  return response.data;
};

/**
 * POST request
 * @param {string} url - API endpoint
 * @param {object} data - Request body
 * @param {object} config - Axios config
 * @returns {Promise} Response data
 */
export const post = async (url, data = {}, config = {}) => {
  const response = await apiClient.post(url, data, config);
  return response.data;
};

/**
 * PUT request
 * @param {string} url - API endpoint
 * @param {object} data - Request body
 * @param {object} config - Axios config
 * @returns {Promise} Response data
 */
export const put = async (url, data = {}, config = {}) => {
  const response = await apiClient.put(url, data, config);
  return response.data;
};

/**
 * DELETE request
 * @param {string} url - API endpoint
 * @param {object} config - Axios config
 * @returns {Promise} Response data
 */
export const del = async (url, config = {}) => {
  const response = await apiClient.delete(url, config);
  return response.data;
};

/**
 * PATCH request
 * @param {string} url - API endpoint
 * @param {object} data - Request body
 * @param {object} config - Axios config
 * @returns {Promise} Response data
 */
export const patch = async (url, data = {}, config = {}) => {
  const response = await apiClient.patch(url, data, config);
  return response.data;
};

// ==================== Export ====================

export default {
  // Axios instance
  client: apiClient,
  
  // Request methods
  get,
  post,
  put,
  delete: del,
  patch,
  
  // Token management
  saveToken,
  getToken,
  removeToken,
  isAuthenticated,
};

