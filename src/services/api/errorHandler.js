/**
 * API Error Handler
 * 
 * Features:
 * - Centralized error handling
 * - User-friendly error messages
 * - i18n support
 * 
 * Uses:
 * - All API calls
 * - Error message display
 */

/**
 * Extract error message from API response
 * @param {Error} error - Axios error object
 * @param {Function} t - i18n translation function
 * @returns {string} - User-friendly error message
 */
export const getErrorMessage = (error, t) => {
  // Check if error has response (server responded with error)
  if (error.response) {
    const { status, data } = error.response;
    
    // Try to get error code from response
    if (data && data.error_code) {
      const translationKey = `errors.${data.error_code}`;
      const translated = t(translationKey);
      
      // If translation exists, use it
      if (translated !== translationKey) {
        return translated;
      }
    }
    
    // Try to get error message from response
    if (data && data.error_message) {
      return data.error_message;
    }
    
    // Fallback to status-based messages
    switch (status) {
      case 400:
        return t('errors.bad_request') || 'Invalid request';
      case 401:
        return t('errors.unauthorized') || 'Please login again';
      case 403:
        return t('errors.forbidden') || 'Access denied';
      case 404:
        return t('errors.not_found') || 'Resource not found';
      case 500:
      case 502:
      case 503:
      case 504:
        return t('errors.server_error') || 'Server error occurred';
      default:
        return t('errors.generic') || 'An error occurred';
    }
  }
  
  // Network error (no response)
  if (error.request) {
    return t('errors.network') || 'Network error. Please check your connection.';
  }
  
  // Request setup error
  return t('errors.generic') || 'An unexpected error occurred';
};

/**
 * Check if error is due to network issue
 * @param {Error} error - Axios error object
 * @returns {boolean} - True if network error
 */
export const isNetworkError = (error) => {
  return error.request && !error.response;
};

/**
 * Check if error is due to authentication issue
 * @param {Error} error - Axios error object
 * @returns {boolean} - True if auth error
 */
export const isAuthError = (error) => {
  return error.response && error.response.status === 401;
};

/**
 * Check if error is due to server issue
 * @param {Error} error - Axios error object
 * @returns {boolean} - True if server error
 */
export const isServerError = (error) => {
  if (!error.response) return false;
  const status = error.response.status;
  return status >= 500 && status < 600;
};

/**
 * Log error for debugging
 * @param {string} context - Error context (e.g., 'Login', 'Fetch Personas')
 * @param {Error} error - Error object
 */
export const logError = (context, error) => {
  if (__DEV__) {
    console.log(`[API Error - ${context}]`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
    });
  }
};

export default {
  getErrorMessage,
  isNetworkError,
  isAuthError,
  isServerError,
  logError,
};

