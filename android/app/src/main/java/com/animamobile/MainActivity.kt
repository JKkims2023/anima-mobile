package ai.anima.soulconnect

import android.os.Bundle
import androidx.core.view.WindowCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

/**
 * ANIMA Mobile MainActivity
 * 
 * Edge-to-Edge Support for Android 14/15
 * - Enables full-screen content with transparent system bars
 * - Supports display cutouts (notch, punch-hole)
 * - Works with gesture navigation
 */
class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "AnimaMobile"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  /**
   * Enable Edge-to-Edge display for modern Android devices
   * This allows content to extend behind system bars (status bar, navigation bar)
   * Safe area insets will be handled by react-native-safe-area-context
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // Enable Edge-to-Edge (Android 11+)
    WindowCompat.setDecorFitsSystemWindows(window, false)
  }
}
