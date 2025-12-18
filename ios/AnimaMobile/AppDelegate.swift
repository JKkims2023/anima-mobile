import Firebase
import FirebaseCore
import FirebaseMessaging
import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    
    // ⭐ Firebase initialization
    FirebaseApp.configure()
    print("[Firebase] ✅ Initialized successfully")
    
    // ⭐ Push notification setup
    Messaging.messaging().delegate = self
    UNUserNotificationCenter.current().delegate = self
    print("[Firebase] 💙 Push notification delegates configured")
    
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "AnimaMobile",
      in: window,
      launchOptions: launchOptions
    )
    
    return true
  }
  
  // ⭐ APNs token registration
  func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    Messaging.messaging().apnsToken = deviceToken
    print("[Firebase] 📱 APNs token configured")
  }
  
  // ⭐ APNs token registration failure
  func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    print("[Firebase] ⚠️  APNs token registration failed: \(error.localizedDescription)")
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MARK: - UNUserNotificationCenterDelegate
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
extension AppDelegate: UNUserNotificationCenterDelegate {
  // ⭐ Called when notification arrives while app is in foreground
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    print("[Firebase] 📨 Foreground notification received")
    // Display notification even when app is in foreground
    completionHandler([.list, .banner, .badge, .sound])
  }
  
  // ⭐ Called when user taps on notification
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    print("[Firebase] 👆 Notification tapped")
    // TODO: Handle notification tap - navigate to specific screen
    completionHandler()
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MARK: - MessagingDelegate
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
extension AppDelegate: MessagingDelegate {
  // ⭐ Called when FCM token is refreshed
  func messaging(
    _ messaging: Messaging,
    didReceiveRegistrationToken fcmToken: String?
  ) {
    if let token = fcmToken {
      print("[Firebase] 🔄 FCM token updated: \(token.prefix(20))...")
      // TODO: Send token to ANIMA backend server
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MARK: - React Native Delegate
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
  // BootSplash는 Objective-C 라이브러리라서 Swift에서 직접 사용이 어렵습니다
  // 대신 JS의 AnimatedSplashScreen (Lottie)를 사용합니다
  // override func customize(_ rootView: RCTRootView) {
  //   super.customize(rootView)
  //   RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView)
  // }
}
