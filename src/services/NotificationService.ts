import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { Platform, PermissionsAndroid, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const NOTIFICATION_CHANNEL_ID = 'anima_notification_channel';
const FCM_TOKEN_STORAGE_KEY = '@anima_fcm_token';
const PERMISSION_REQUESTED_KEY = '@anima_notification_permission_requested';
const MAX_RETRY_COUNT = 3;

class NotificationService {
  private static instance: NotificationService;
  private initialized: boolean = false;
  private retryCount: number = 0;
  private lastToken: string | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⭐ NEW: Check permission status without requesting
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async checkPermissionStatus(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().hasPermission();
        return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
               authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      } else if (Platform.OS === 'android') {
        const androidVersion = typeof Platform.Version === 'string' 
          ? parseInt(Platform.Version, 10) 
          : Platform.Version;
        
        if (androidVersion >= 33) {
          return await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
        }
        return true; // Android 12 and below don't need permission
      }
      return false;
    } catch (error) {
      console.error('[FCM] Permission status check error:', error);
      return false;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⭐ NEW: Check if permission has been requested before
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async hasRequestedPermission(): Promise<boolean> {
    try {
      const requested = await AsyncStorage.getItem(PERMISSION_REQUESTED_KEY);
      return requested === 'true';
    } catch (error) {
      console.error('[FCM] Check requested permission error:', error);
      return false;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⭐ NEW: Mark that permission has been requested
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async markPermissionRequested(): Promise<void> {
    try {
      await AsyncStorage.setItem(PERMISSION_REQUESTED_KEY, 'true');
    } catch (error) {
      console.error('[FCM] Mark permission requested error:', error);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Request user permission (original method)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async requestUserPermission(): Promise<boolean> {
    try {
      console.log('[FCM] 🔔 requestUserPermission called');
      console.log(`[FCM] Platform: ${Platform.OS}`);
      
      if (Platform.OS === 'ios') {
        console.log('[FCM] iOS: Calling messaging().requestPermission()...');
        
        // iOS permission request
        const authStatus = await messaging().requestPermission({
          alert: true,
          announcement: false,
          badge: true,
          carPlay: false,
          provisional: false,
          sound: true,
        });

        console.log('[FCM] iOS: authStatus =', authStatus);
        console.log('[FCM] iOS: AuthorizationStatus.AUTHORIZED =', messaging.AuthorizationStatus.AUTHORIZED);
        console.log('[FCM] iOS: AuthorizationStatus.PROVISIONAL =', messaging.AuthorizationStatus.PROVISIONAL);

        const isAuthorized = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        
        console.log(`[FCM] iOS: isAuthorized = ${isAuthorized}`);
        return isAuthorized;
      } else if (Platform.OS === 'android') {
        console.log('[FCM] Android: Checking version...');
        // Android permission request - only needed for Android 13+ (API 33)
        const androidVersion = typeof Platform.Version === 'string' 
          ? parseInt(Platform.Version, 10) 
          : Platform.Version;
        
        console.log(`[FCM] Android: Version = ${androidVersion}`);
        
        if (androidVersion >= 33) {
          console.log('[FCM] Android 13+: Requesting POST_NOTIFICATIONS permission...');
          const permission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: "알림 권한",
              message: "ANIMA의 중요한 소식을 알림으로 받아보세요.",
              buttonNeutral: "나중에",
              buttonNegative: "거부",
              buttonPositive: "허용"
            }
          );
          console.log(`[FCM] Android: Permission result = ${permission}`);
          const granted = permission === PermissionsAndroid.RESULTS.GRANTED;
          console.log(`[FCM] Android: granted = ${granted}`);
          return granted;
        }
        
        // Android 12 and below don't need permission
        console.log('[FCM] Android 12-: No permission needed, returning true');
        return true;
      }
      
      console.log('[FCM] ⚠️  Unknown platform, returning false');
      return false;
    } catch (error) {
      console.error('[FCM] ❌ Permission request error:', error);
      return false;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⭐ NEW: Request permission with context (delayed permission request)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async requestPermissionWithContext(context: string = 'general'): Promise<boolean> {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`[FCM] 💙 Requesting permission with context: ${context}`);
      console.log(`[FCM] Platform: ${Platform.OS}`);
      
      // Check current permission status
      const currentStatus = await this.checkPermissionStatus();
      console.log(`[FCM] Current permission status: ${currentStatus}`);
      
      // If already requested, just check status
      const hasRequested = await this.hasRequestedPermission();
      console.log(`[FCM] Has requested before: ${hasRequested}`);
      
      if (hasRequested) {
        console.log('[FCM] Permission already requested, checking status');
        return currentStatus;
      }
      
      // First time requesting
      console.log('[FCM] 🚀 First time requesting permission, calling requestUserPermission()...');
      const granted = await this.requestUserPermission();
      console.log(`[FCM] Permission result: ${granted ? 'GRANTED' : 'DENIED'}`);
      
      // Mark as requested
      await this.markPermissionRequested();
      console.log('[FCM] ✅ Marked as requested in AsyncStorage');
      
      if (granted) {
        console.log('[FCM] ✅ Permission granted! Setting up messaging...');
        try {
          // Set up FCM immediately after permission is granted
          await this.setupMessaging();
          await this.getFCMToken();
        } catch (setupError: any) {
          // ⭐ Don't fail permission flow if FCM setup fails (e.g., iOS Simulator)
          console.log('[FCM] ⚠️  FCM setup failed (may be iOS Simulator), but permission is granted');
        }
      } else {
        console.log('[FCM] ⚠️  Permission denied by user');
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return granted;
    } catch (error) {
      console.log('[FCM] ⚠️  Permission request error (non-critical):', error);
      return false;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⭐ NEW: Initialize without requesting permission
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async initializeWithoutPermission(): Promise<boolean> {
    try {
      if (this.initialized) {
        console.log('[FCM] Already initialized');
        return true;
      }
      
      console.log('[FCM] 🚀 Initializing without permission request');
      
      // Create Android notification channel (doesn't require permission)
      if (Platform.OS === 'android') {
        await this.createNotificationChannel();
      }
      
      // If permission already granted, set up messaging
      const hasPermission = await this.checkPermissionStatus();
      if (hasPermission) {
        console.log('[FCM] ✅ Permission already granted, setting up messaging');
        try {
          await this.setupMessaging();
          await this.getFCMToken();
        } catch (setupError: any) {
          // ⭐ Don't fail initialization if FCM setup fails (e.g., iOS Simulator)
          console.log('[FCM] ⚠️  FCM setup failed, but app will continue normally');
          if (Platform.OS === 'ios') {
            console.log('[FCM] 💡 Tip: Test push notifications on a real iOS device');
          }
        }
      } else {
        console.log('[FCM] ℹ️  No permission yet, waiting for user action');
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.log('[FCM] ⚠️  Initialize error (non-critical):', error);
      // Still mark as initialized so app can continue
      this.initialized = true;
      return true; // Return true to allow app to continue
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Get FCM token
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async getFCMToken(): Promise<string | null> {
    try {
      // Check saved token
      const savedToken = await AsyncStorage.getItem(FCM_TOKEN_STORAGE_KEY);
      if (savedToken) {
        this.lastToken = savedToken;
      }
      
      // Check permission (both iOS and Android)
      const hasPermission = await this.requestUserPermission();
      if (!hasPermission) {
        console.log('[FCM] No permission, returning saved token');
        return savedToken || null;
      }
      
      // ⭐ Note: Firebase auto-registers for APNs on iOS
      // No need to call registerDeviceForRemoteMessages() manually

      // Request FCM token
      try {
        const fcmToken = await messaging().getToken();
        
        if (!fcmToken) {
          throw new Error('Failed to get FCM token');
        }
        
        this.lastToken = fcmToken;
        await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, fcmToken);
        
        console.log('[FCM] ✅ Token obtained:', fcmToken);
        return fcmToken;
      } catch (tokenError: any) {
        // ⭐ Handle iOS Simulator gracefully
        if (tokenError?.code === 'messaging/unregistered') {
          console.log('[FCM] ℹ️  FCM not available on iOS Simulator - This is normal');
          console.log('[FCM] 📱 Please test on a real iOS device for push notifications');
          return savedToken || null;
        }
        
        console.error('[FCM] Token request error:', tokenError);
        if (savedToken) {
          return savedToken;
        }
        
        // Don't throw error, return null gracefully
        return null;
      }
    } catch (error: any) {
      console.error('[FCM] getFCMToken error:', error.message);
      return this.lastToken || null;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Setup messaging (handlers and listeners)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async setupMessaging(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Create Android notification channel
      await this.createNotificationChannel();

      // iOS: Check permission
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().hasPermission();
        if (authStatus === messaging.AuthorizationStatus.NOT_DETERMINED) {
          await this.requestUserPermission();
        }
      }

      // Foreground message handler - all platforms
      console.log('[FCM] 🔔 Registering foreground message handler...');
      messaging().onMessage(async remoteMessage => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('[FCM] 📨 FOREGROUND MESSAGE RECEIVED!');
        console.log('[FCM] Platform:', Platform.OS);
        console.log('[FCM] Message:', JSON.stringify(remoteMessage, null, 2));
        console.log('[FCM] Title:', remoteMessage.notification?.title);
        console.log('[FCM] Body:', remoteMessage.notification?.body);
        console.log('[FCM] Data:', remoteMessage.data);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Filter invalid messages
        if (!remoteMessage.notification || 
            !remoteMessage.notification.title || 
            !remoteMessage.notification.body) {
          console.log('[FCM] ⚠️  Invalid foreground message, ignoring');
          return;
        }
        
        if (Platform.OS === 'android') {
          console.log('[FCM] 🤖 Handling Android foreground message...');
          this.handleAndroidForegroundMessage(remoteMessage);
        } else if (Platform.OS === 'ios') {
          console.log('[FCM] 🍎 Handling iOS foreground message...');
          this.handleIOSForegroundMessage(remoteMessage);
        }
      });
      console.log('[FCM] ✅ Foreground message handler registered');

      // Background message handler
      this.setupBackgroundMessageHandler();

      // Foreground event handler
      notifee.onForegroundEvent(({ type, detail }) => {
        try {
          if (type === EventType.PRESS) {
            console.log('[FCM] 👆 Notification pressed (foreground)');
            // Add navigation logic here if needed
          }
        } catch (error) {
          console.error('[FCM] Foreground event handler error:', error);
        }
      });

      // Background event handler
      notifee.onBackgroundEvent(async ({ type, detail }) => {
        try {
          if (type === EventType.PRESS) {
            console.log('[FCM] 👆 Notification pressed (background)');
            // Add navigation logic here if needed
          }
          return Promise.resolve();
        } catch (error) {
          console.error('[FCM] Background event handler error:', error);
          return Promise.resolve();
        }
      });

      // Token refresh handler
      messaging().onTokenRefresh(async token => {
        try {
          console.log('[FCM] 🔄 Token refreshed:', token.substring(0, 20) + '...');
          this.lastToken = token;
          await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
          await this.updateTokenOnServer(token);
        } catch (error) {
          console.error('[FCM] Token refresh handler error:', error);
        }
      });

      // App opened from notification
      messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('[FCM] 🚀 App opened from notification:', remoteMessage);
        // Add navigation logic here if needed
      });

      // App opened from quit state
      messaging()
        .getInitialNotification()
        .then(remoteMessage => {
          if (remoteMessage) {
            console.log('[FCM] 🚀 App opened from quit state:', remoteMessage);
            // Add navigation logic here if needed
          }
        })
        .catch(error => {
          console.error('[FCM] getInitialNotification error:', error);
        });

      this.initialized = true;
      this.retryCount = 0;
      console.log('[FCM] ✅ Messaging setup complete');
    } catch (error) {
      console.error('[FCM] setupMessaging error:', error);
      this.initialized = false;
      
      // Retry logic
      if (this.retryCount < MAX_RETRY_COUNT) {
        this.retryCount++;
        console.log(`[FCM] Retrying... (${this.retryCount}/${MAX_RETRY_COUNT})`);
        setTimeout(() => this.setupMessaging(), 5000);
      } else {
        console.error('[FCM] Max retry count exceeded, FCM setup failed');
      }
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle Android foreground message
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private handleAndroidForegroundMessage(remoteMessage: any): void {
    console.log('[FCM] 🤖 Android foreground message:', remoteMessage);
      
    // Vibration
    try {
      const pattern = [0, 300, 200, 300];
      Vibration.vibrate(pattern);
    } catch (error) {
      console.error('[FCM] Vibration error:', error);
    }

    // Display notification with notifee
    try {
      notifee.displayNotification({
        id: String(Date.now()),
        title: remoteMessage.notification?.title || 'ANIMA',
        body: remoteMessage.notification?.body || '',
        data: remoteMessage.data,
        android: {
          channelId: NOTIFICATION_CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          smallIcon: 'ic_launcher',
          pressAction: {
            id: 'default',
          },
          lightUpScreen: true,
          vibrationPattern: [300, 500, 300, 500],
          lights: ['#60A5FA', 500, 500] as [string, number, number], // ANIMA blue
        }
      });
    } catch (error) {
      console.error('[FCM] Display foreground notification error:', error);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle iOS foreground message
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private async handleIOSForegroundMessage(remoteMessage: any): Promise<void> {
    try {
      console.log('[FCM] 🍎 iOS foreground message:', remoteMessage);
      // iOS shows notification automatically, just vibrate
      try {
        Vibration.vibrate(300);
      } catch (vibrationError) {
        console.error('[FCM] iOS vibration error:', vibrationError);
      }
    } catch (error) {
      console.error('[FCM] iOS foreground message handler error:', error);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Update token on server
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async updateTokenOnServer(token: string, user_key: string): Promise<boolean> {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[FCM] 📤 Updating token on server...');
      console.log('[FCM] Token:', token.substring(0, 20) + '...');
      console.log('[FCM] User Key:', user_key);
      console.log('[FCM] Platform:', Platform.OS);

      // Check if token has changed (compare with AsyncStorage)
      const lastSentToken = await AsyncStorage.getItem('@anima_last_sent_fcm_token');
      if (lastSentToken === token) {
        console.log('[FCM] ℹ️  Token unchanged, skipping server update');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return true;
      }

      // Import API config dynamically
      const { FCM_ENDPOINTS } = require('../config/api.config');

      console.log('FCM_ENDPOINTS', FCM_ENDPOINTS);
      console.log('FCM_ENDPOINTS.UPDATE_TOKEN', FCM_ENDPOINTS.UPDATE_TOKEN);
      
      // Call backend API
      const response = await fetch(FCM_ENDPOINTS.UPDATE_TOKEN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_key,
          token,
          platform: Platform.OS,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('[FCM] ✅ Token updated on server successfully');
        console.log('[FCM] Updated:', data.data?.updated);
        
        // Save last sent token to AsyncStorage
        await AsyncStorage.setItem('@anima_last_sent_fcm_token', token);
        console.log('[FCM] ✅ Last sent token saved to AsyncStorage');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return true;
      } else {
        console.log('[FCM] ❌ Server update failed:', data.error);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return false;
      }
    } catch (error) {
      console.log('[FCM] ❌ Update token on server error:', error);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return false;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Create notification channel (Android)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private async createNotificationChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        const channel = await notifee.getChannel(NOTIFICATION_CHANNEL_ID);
        
        if (!channel) {
          await notifee.createChannel({
            id: NOTIFICATION_CHANNEL_ID,
            name: 'ANIMA 알림',
            importance: AndroidImportance.HIGH,
            description: 'ANIMA의 중요한 소식을 받아보세요',
            sound: undefined,
            vibration: true,
            vibrationPattern: [300, 500, 300, 500],
            lights: true,
            lightColor: '#60A5FA', // ANIMA blue
          });
          console.log('[FCM] ✅ Notification channel created');
        }
      } catch (error) {
        console.log('[FCM] Create notification channel error:', error);
        throw error;
      }
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Setup background message handler
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private setupBackgroundMessageHandler(): void {
    console.log('[FCM] 🌙 Registering background message handler...');
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[FCM] 🌙 BACKGROUND MESSAGE RECEIVED!');
      console.log('[FCM] Platform:', Platform.OS);
      console.log('[FCM] Message:', JSON.stringify(remoteMessage, null, 2));
      console.log('[FCM] Title:', remoteMessage.notification?.title);
      console.log('[FCM] Body:', remoteMessage.notification?.body);
      console.log('[FCM] Data:', remoteMessage.data);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Filter invalid messages
      if (!remoteMessage.notification || 
          !remoteMessage.notification.title || 
          !remoteMessage.notification.body) {
        console.log('[FCM] ⚠️  Invalid background message, ignoring');
        return Promise.resolve();
      }
      
      try {
        if (Platform.OS === 'android') {
          const channel = await notifee.getChannel(NOTIFICATION_CHANNEL_ID);
          if (!channel) {
            await this.createNotificationChannel();
          }
          
          await notifee.displayNotification({
            id: String(Date.now()),
            title: remoteMessage.notification?.title || 'ANIMA',
            body: remoteMessage.notification?.body || '',
            data: remoteMessage.data,
            android: {
              channelId: NOTIFICATION_CHANNEL_ID,
              importance: AndroidImportance.HIGH,
              smallIcon: 'ic_launcher',
              lightUpScreen: true,
              vibrationPattern: [300, 500, 300, 500],
              lights: ['#60A5FA', 500, 500] as [string, number, number],
            }
          });
        }
      
        Vibration.vibrate([300, 500, 300, 500]);
        return Promise.resolve();
      } catch (error) {
        console.log('[FCM] Background message handler error:', error);
        return Promise.resolve();
      }
    });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Display notification
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async displayNotification(title: string, body: string, data?: any): Promise<boolean> {
    try {
      const androidConfig = Platform.OS === 'android' ? {
        channelId: NOTIFICATION_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
        smallIcon: 'ic_launcher',
        autoCancel: true,
        vibrationPattern: [300, 500, 300, 500],
        lights: ['#60A5FA', 500, 500] as [string, number, number],
        lightUpScreen: true,
      } : undefined;

      const iosConfig = Platform.OS === 'ios' ? {
        foregroundPresentationOptions: {
          badge: true,
          sound: false,
          banner: true,
          list: true,
        },
      } : undefined;

      if (Platform.OS === 'android') {
        const channel = await notifee.getChannel(NOTIFICATION_CHANNEL_ID);
        if (!channel) {
          await this.createNotificationChannel();
        }
      }

      await notifee.displayNotification({
        id: String(Date.now()),
        title,
        body,
        data,
        android: androidConfig,
        ios: iosConfig
      });

      return true;
    } catch (error) {
      console.log('[FCM] Display notification error:', error);
      return false;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Cancel notification
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      await notifee.cancelNotification(notificationId);
      return true;
    } catch (error) {
      console.log('[FCM] Cancel notification error:', error);
      return false;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Cancel all notifications
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async cancelAllNotifications(): Promise<boolean> {
    try {
      await notifee.cancelAllNotifications();
      return true;
    } catch (error) {
      console.log('[FCM] Cancel all notifications error:', error);
      return false;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Set badge count (iOS)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async setBadgeCount(count: number): Promise<boolean> {
    if (Platform.OS === 'ios') {
      try {
        await notifee.setBadgeCount(count);
        return true;
      } catch (error) {
        console.log('[FCM] Set badge count error:', error);
        return false;
      }
    }
    return false;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Test push notification
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async testPushNotification(): Promise<any> {
    try {
      const token = await this.getFCMToken();
      if (!token) {
        return { success: false, error: 'No FCM token' };
      }
      
      const notificationResult = await this.displayNotification(
        '💙 ANIMA 테스트',
        `알림 테스트입니다. ${new Date().toLocaleTimeString()}`,
        { test: true }
      );
      
      return {
        success: notificationResult,
        token: token,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[FCM] Test push notification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

export default NotificationService.getInstance();

