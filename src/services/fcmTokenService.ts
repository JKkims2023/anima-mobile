/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FCM Token Management Service
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Manages FCM token updates to server
 * - Bridges NotificationService and UserContext
 * - Handles token synchronization with backend
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-12-18
 */

import NotificationService from './NotificationService';

/**
 * Update FCM token on server
 * This function should be called after user login/auto-login
 * 
 * @param user_key - User's unique key
 * @returns Promise<boolean> - Whether update was successful
 */
export const updateFCMTokenOnServer = async (user_key: string): Promise<boolean> => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[FCMTokenService] 🔄 Updating FCM token for user...');
    console.log('[FCMTokenService] User Key:', user_key);

    // Get current FCM token
    const token = await NotificationService.getFCMToken();
    
    if (!token) {
      console.log('[FCMTokenService] ⚠️  No FCM token available, skipping server update');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return false;
    }

    console.log('[FCMTokenService] Token:', token.substring(0, 20) + '...');

    // Update token on server
    const success = await NotificationService.updateTokenOnServer(token, user_key);

    if (success) {
      console.log('[FCMTokenService] ✅ FCM token updated successfully');
    } else {
      console.log('[FCMTokenService] ❌ FCM token update failed');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return success;
  } catch (error) {
    console.error('[FCMTokenService] ❌ Error:', error);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return false;
  }
};

/**
 * Force FCM token refresh and update on server
 * 
 * @param user_key - User's unique key
 * @returns Promise<boolean> - Whether refresh was successful
 */
export const refreshFCMToken = async (user_key: string): Promise<boolean> => {
  try {
    console.log('[FCMTokenService] 🔄 Forcing FCM token refresh...');
    
    // Force token refresh
    await NotificationService.forceTokenRefresh();
    
    // Update on server
    return await updateFCMTokenOnServer(user_key);
  } catch (error) {
    console.error('[FCMTokenService] ❌ Refresh error:', error);
    return false;
  }
};

export default {
  updateFCMTokenOnServer,
  refreshFCMToken,
};

