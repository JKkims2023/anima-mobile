import NotificationService from '../services/NotificationService';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Permission Management
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Check notification permission status without requesting
 * @returns {Promise<boolean>} Permission status
 */
export const checkNotificationPermission = async (): Promise<boolean> => {
  try {
    return await NotificationService.checkPermissionStatus();
  } catch (error) {
    console.error('[PushNotification] Check permission error:', error);
    return false;
  }
};

/**
 * Check if permission has been requested before
 * @returns {Promise<boolean>} Whether permission was requested
 */
export const hasRequestedNotificationPermission = async (): Promise<boolean> => {
  try {
    return await NotificationService.hasRequestedPermission();
  } catch (error) {
    console.error('[PushNotification] Check requested permission error:', error);
    return false;
  }
};

/**
 * Request notification permission with context
 * ⭐ Use this for delayed permission requests (better UX)
 * @param {string} context - Context for permission request
 * @returns {Promise<boolean>} Whether permission was granted
 */
export const requestNotificationPermissionWithContext = async (
  context: 'persona_creation' | 'video_conversion' | 'music_creation' | 'general' = 'general'
): Promise<boolean> => {
  try {
    console.log(`[PushNotification] 💙 Requesting permission (context: ${context})`);
    return await NotificationService.requestPermissionWithContext(context);
  } catch (error) {
    console.error('[PushNotification] Request permission error:', error);
    return false;
  }
};

/**
 * Request notification permission (legacy method)
 * @deprecated Use requestNotificationPermissionWithContext instead
 * @returns {Promise<boolean>} Whether permission was granted
 */
export const requestUserPermission = async (): Promise<boolean> => {
  try {
    return await NotificationService.requestUserPermission();
  } catch (error) {
    console.error('[PushNotification] Request permission error:', error);
    return false;
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Initialization
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Initialize notifications WITHOUT requesting permission
 * ⭐ Use this in App.tsx to initialize Firebase without permission request
 * @returns {Promise<boolean>} Whether initialization was successful
 */
export const initializeNotificationsWithoutPermission = async (): Promise<boolean> => {
  try {
    console.log('[PushNotification] 🚀 Initializing without permission...');
    return await NotificationService.initializeWithoutPermission();
  } catch (error) {
    console.error('[PushNotification] Initialize error:', error);
    return false;
  }
};

/**
 * Setup push notifications (legacy method)
 * @deprecated Use initializeNotificationsWithoutPermission instead
 * @param {boolean} hasPermission - Whether permission is already granted
 * @returns {Promise<boolean>} Whether setup was successful
 */
export const setupPushNotifications = async (hasPermission: boolean = false): Promise<boolean> => {
  try {
    if (hasPermission || await requestUserPermission()) {
      await NotificationService.setupMessaging();
      return true;
    } else {
      console.log('[PushNotification] No permission, notification service not set up');
      return false;
    }
  } catch (error) {
    console.error('[PushNotification] Setup error:', error);
    return false;
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Token Management
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get FCM token
 * @returns {Promise<string | null>} FCM token
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    console.log('[PushNotification] Getting FCM token...');
    const token = await NotificationService.getFCMToken();
    if (token) {
      console.log('[PushNotification] ✅ Token obtained:', token.substring(0, 20) + '...');
    } else {
      console.log('[PushNotification] ⚠️  No token available');
    }
    return token;
  } catch (error) {
    console.error('[PushNotification] Get token error:', error);
    return null;
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Notification Display
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Display a local notification
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {any} data - Optional data
 * @returns {Promise<boolean>} Whether notification was displayed
 */
export const displayNotification = async (
  title: string,
  body: string,
  data?: any
): Promise<boolean> => {
  try {
    return await NotificationService.displayNotification(title, body, data);
  } catch (error) {
    console.error('[PushNotification] Display notification error:', error);
    return false;
  }
};

/**
 * Cancel a specific notification
 * @param {string} notificationId - Notification ID to cancel
 * @returns {Promise<boolean>} Whether cancellation was successful
 */
export const cancelNotification = async (notificationId: string): Promise<boolean> => {
  try {
    return await NotificationService.cancelNotification(notificationId);
  } catch (error) {
    console.error('[PushNotification] Cancel notification error:', error);
    return false;
  }
};

/**
 * Cancel all notifications
 * @returns {Promise<boolean>} Whether cancellation was successful
 */
export const cancelAllNotifications = async (): Promise<boolean> => {
  try {
    return await NotificationService.cancelAllNotifications();
  } catch (error) {
    console.error('[PushNotification] Cancel all notifications error:', error);
    return false;
  }
};

/**
 * Set badge count (iOS only)
 * @param {number} count - Badge count
 * @returns {Promise<boolean>} Whether setting was successful
 */
export const setBadgeCount = async (count: number): Promise<boolean> => {
  try {
    return await NotificationService.setBadgeCount(count);
  } catch (error) {
    console.error('[PushNotification] Set badge count error:', error);
    return false;
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Testing
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Test push notification
 * @returns {Promise<any>} Test result
 */
export const testPushNotification = async (): Promise<any> => {
  try {
    return await NotificationService.testPushNotification();
  } catch (error) {
    console.error('[PushNotification] Test notification error:', error);
    return { success: false, error: String(error) };
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Export default object (for convenience)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default {
  // Permission
  checkNotificationPermission,
  hasRequestedNotificationPermission,
  requestNotificationPermissionWithContext,
  requestUserPermission,
  
  // Initialization
  initializeNotificationsWithoutPermission,
  setupPushNotifications,
  
  // Token
  getFCMToken,
  
  // Display
  displayNotification,
  cancelNotification,
  cancelAllNotifications,
  setBadgeCount,
  
  // Testing
  testPushNotification,
};

