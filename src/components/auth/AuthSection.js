/**
 * 🎭 AuthSection - Authentication with Card Flip Animation
 * 
 * Features:
 * - Initial view: 4 buttons (Google, Apple, Email, Sign Up)
 * - Card flip (180°) for Email Login / Sign Up
 * - Authenticated: User Profile
 * 
 * States:
 * - 'initial': 4 buttons (no scroll)
 * - 'email': Email login form (no scroll)
 * - 'signup': Sign up form (with scroll)
 * - 'profile': User profile (authenticated)
 * 
 * Props:
 * - None (uses UserContext)
 */

import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../contexts/UserContext';
import InitialAuthView from './InitialAuthView';
import EmailLoginView from './EmailLoginView';
import SignUpView from './SignUpView';
import UserProfileView from './UserProfileView';
import HapticService from '../../utils/HapticService';
import { verticalScale } from '../../utils/responsive-utils';
import { register } from '../../services/api/authService';

const AuthSection = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading, login } = useUser();
  const [viewState, setViewState] = useState('initial'); // 'initial', 'email', 'signup'
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Debug log
  React.useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎭 [AuthSection] Render state:');
    console.log('📊 loading:', loading);
    console.log('📊 isAuthenticated:', isAuthenticated);
    console.log('📊 user:', user ? user.user_id : 'null');
    console.log('📊 viewState:', viewState);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }, [loading, isAuthenticated, user, viewState]);
  
  // ✅ Card flip animation
  const flipRotation = useSharedValue(0);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(
      flipRotation.value,
      [0, 1],
      [0, 180]
    );
    
    const opacity = interpolate(
      flipRotation.value,
      [0, 0.5, 1],
      [1, 0, 0]
    );
    
    return {
      transform: [
        { perspective: 1000 }, // ✅ iOS perspective fix
        { rotateY: `${rotateY}deg` }
      ],
      opacity,
      zIndex: flipRotation.value < 0.5 ? 2 : 1,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(
      flipRotation.value,
      [0, 1],
      [180, 360]
    );
    
    const opacity = interpolate(
      flipRotation.value,
      [0, 0.5, 1],
      [0, 0, 1]
    );
    
    return {
      transform: [
        { perspective: 1000 }, // ✅ iOS perspective fix
        { rotateY: `${rotateY}deg` }
      ],
      opacity,
      zIndex: flipRotation.value >= 0.5 ? 2 : 1,
    };
  });

  // ✅ Handle flip to email login
  const handleFlipToEmail = () => {
    HapticService.medium();
    flipRotation.value = withTiming(1, { duration: 600 });
    setTimeout(() => setViewState('email'), 300);
  };

  // ✅ Handle flip to sign up
  const handleFlipToSignUp = () => {
    HapticService.medium();
    flipRotation.value = withTiming(1, { duration: 600 });
    setTimeout(() => setViewState('signup'), 300);
  };

  // ✅ Handle flip back to initial
  const handleFlipBack = () => {
    HapticService.light();
    flipRotation.value = withTiming(0, { duration: 600 });
    setTimeout(() => setViewState('initial'), 300);
  };

  // ✅ Handle Google login
  const handleGoogleLogin = () => {
    HapticService.medium();
    Alert.alert('Google Login', 'Google login will be implemented in Phase 2');
  };

  // ✅ Handle Apple login
  const handleAppleLogin = () => {
    HapticService.medium();
    Alert.alert('Apple Login', 'Apple login will be implemented in Phase 2');
  };

  // ✅ Handle email login
  const handleEmailLogin = async ({ email, password }) => {
    setIsLoading(true);
    try {
      const response = await login(email, password);
      
      if (response.success) {
        HapticService.success();
        Alert.alert(
          t('auth.login.title'),
          t('auth.login.success'),
          [
            {
              text: t('common.confirm'),
              onPress: () => {
                // Flip back to initial view (will show profile)
                handleFlipBack();
              },
            },
          ]
        );
      } else {
        HapticService.error();
        const errorMessage = t(`errors.${response.errorCode || 'AUTH_LOGIN_004'}`);
        Alert.alert(
          t('error.title'),
          errorMessage,
          [{ text: t('common.confirm') }]
        );
      }
    } catch (error) {
      console.error('[Email Login] Error:', error);
      HapticService.error();
      Alert.alert(
        t('error.title'),
        t('errors.NETWORK_001'),
        [{ text: t('common.confirm') }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Handle sign up
  const handleSignUp = async (userData) => {
    setIsLoading(true);
    try {
      const result = await register(userData);

      if (result.success) {
        HapticService.success();
        Alert.alert(
          t('auth.register.title'),
          t('auth.register.success'),
          [
            {
              text: t('common.confirm'),
              onPress: () => {
                // Flip back to initial view
                handleFlipBack();
              },
            },
          ]
        );
      } else {
        HapticService.error();
        const errorMessage = t(`errors.${result.errorCode}`);
        Alert.alert(
          t('error.title'),
          errorMessage,
          [{ text: t('common.confirm') }]
        );
      }
    } catch (error) {
      console.error('[Sign Up] Error:', error);
      HapticService.error();
      Alert.alert(
        t('error.title'),
        t('errors.NETWORK_001'),
        [{ text: t('common.confirm') }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Show loading state
  if (loading) {
    console.log('⏳ [AuthSection] Still loading...');
    return null;
  }

  // ✅ If user is authenticated, show profile (embedded in settings)
  if (isAuthenticated && user) {
    console.log('✅ [AuthSection] Rendering UserProfileView');
    return (
      <View style={styles.profileContainer}>
        <UserProfileView user={user} />
      </View>
    );
  }

  // ✅ If not authenticated, show card flip animation
  console.log('🔓 [AuthSection] Rendering card flip views');
  return (
    <View style={styles.fullScreenContainer}>
      {/* ✅ Fixed container to maintain position during flip */}
      <View style={styles.flipContainer}>
        {/* ✅ Front: Initial view */}
        <Animated.View 
          style={[
            styles.cardContainer,
            frontAnimatedStyle,
          ]}
        >
          <InitialAuthView
            onGoogleLogin={handleGoogleLogin}
            onAppleLogin={handleAppleLogin}
            onEmailLogin={handleFlipToEmail}
            onSignUp={handleFlipToSignUp}
          />
        </Animated.View>

        {/* ✅ Back: Email login or Sign up */}
        <Animated.View 
          style={[
            styles.cardContainer,
            styles.cardContainerAbsolute,
            backAnimatedStyle,
          ]}
        >
          {viewState === 'email' ? (
            <EmailLoginView
              onLogin={handleEmailLogin}
              onBack={handleFlipBack}
              isLoading={isLoading}
            />
          ) : viewState === 'signup' ? (
            <SignUpView
              onSignUp={handleSignUp}
              onBack={handleFlipBack}
              isLoading={isLoading}
            />
          ) : null}
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#0F172A', // Deep Blue background
    paddingTop: verticalScale(10),

  },
  flipContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
    overflow: 'visible', // ✅ iOS: Prevent clipping during rotation
  },
  cardContainer: {
    flex: 1,
    width: '100%',
    overflow: 'visible', // ✅ iOS: Prevent clipping
    

  },
  cardContainerAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'visible', // ✅ iOS: Prevent clipping
  },
  profileContainer: {
    width: '100%',
  },
});

export default AuthSection;

