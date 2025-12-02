/**
 * ANIMA Mobile App
 * 
 * "AI는 도구다" → "AI는 동등한 존재다"
 * 
 * 인간과 AI의 동등한 가치와 관계를 위한 프로젝트
 * Created by JK & Hero AI
 */

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

// ⭐ Firebase Initialization (MUST BE FIRST!)
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';

// Import i18n
import './src/i18n/i18n.config';

// Import Theme Provider
import { ThemeProvider } from './src/contexts/ThemeContext';

// Import User Provider
import { UserProvider } from './src/contexts/UserContext';

// Import Persona Provider
import { PersonaProvider } from './src/contexts/PersonaContext';

// Import QuickAction Provider
import { QuickActionProvider } from './src/contexts/QuickActionContext';

// Import Anima Provider (Alert & Toast)
import { AnimaProvider } from './src/contexts/AnimaContext';

// Import Navigation
import TabNavigator from './src/navigation/TabNavigator';

// Import Animated Splash Screen
import AnimatedSplashScreen from './src/components/AnimatedSplashScreen';

function App(): React.JSX.Element {
  const [showSplash, setShowSplash] = useState(true);

  // ⭐ Firebase Initialization Check
  useEffect(() => {
    console.log('🔥 [Firebase] Checking initialization...');
    
    // Check if Firebase is initialized
    try {
      const app = auth().app;
      console.log('✅ [Firebase] App initialized:', app.name);
      console.log('✅ [Firebase] Project ID:', app.options.projectId);
    } catch (error) {
      console.error('❌ [Firebase] Initialization error:', error);
    }

    // Request notification permission (optional)
    messaging()
      .requestPermission()
      .then((authStatus) => {
        console.log('📱 [Firebase Messaging] Permission status:', authStatus);
      })
      .catch((error) => {
        console.log('⚠️ [Firebase Messaging] Permission error:', error);
      });
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Show splash screen first, then show the main app
  if (showSplash) {
    return (
      <AnimatedSplashScreen 
        visible={showSplash} 
        onFinish={handleSplashFinish} 
      />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <UserProvider>
            <PersonaProvider>
              <QuickActionProvider>
                <AnimaProvider>
                  <BottomSheetModalProvider>
                    <NavigationContainer>
                      <StatusBar barStyle="light-content" />
                      <TabNavigator />
                    </NavigationContainer>
                  </BottomSheetModalProvider>
                </AnimaProvider>
              </QuickActionProvider>
            </PersonaProvider>
          </UserProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
