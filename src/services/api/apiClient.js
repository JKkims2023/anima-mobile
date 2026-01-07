/**
 * API Client - Axios Instance with Interceptors
 * 
 * Features:
 * - Automatic token injection
 * - Request/Response logging (dev only)
 * - Error handling
 * - Retry logic
 * - Timeout configuration
 * 
 * Uses:
 * - All API calls in the app
 * - Centralized configuration
 */

import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT, DEFAULT_HEADERS } from '../../config/api.config';
import { getAuthToken } from '../../utils/storage';

/**
 * Create Axios instance with base configuration
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: DEFAULT_HEADERS,
});

/**
 * Request Interceptor
 * - Inject auth token automatically
 * - Log requests (dev only)
 */
apiClient.interceptors.request.use(
  async (config) => {
    // Get auth token from AsyncStorage
    const token = await getAuthToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * - Log responses (dev only)
 * - Handle common errors
 */
apiClient.interceptors.response.use(
  (response) => {
    
    return response;
  },
  (error) => {
    // Log error
    if (__DEV__) {

      console.log('💌 [API Response Error]', error);
      console.log('[API Response Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - Token expired or invalid
          console.log('[API] Unauthorized - Token may be expired');
          // TODO: Implement logout or token refresh logic
          break;
        case 403:
          // Forbidden
          console.log('[API] Forbidden - Access denied');
          break;
        case 404:
          // Not Found
          console.log('[API] Not Found');
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          // Server Error
          console.log('[API] Server Error:', status);
          break;
        default:
          console.log('[API] Error:', status, data);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.log('[API] Network Error - No response received');
    } else {
      // Something happened in setting up the request
      console.log('[API] Request Setup Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Export configured axios instance
 */
export default apiClient;

