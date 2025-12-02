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
import { useAnima } from '../../contexts/AnimaContext';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import appleAuth from '@invertase/react-native-apple-authentication';

// ⭐ Google Sign-In Configuration
// IMPORTANT: webClientId is the OAuth 2.0 Web Client ID from Firebase Console
GoogleSignin.configure({
  webClientId: '477268616388-gh957ova16b7qnm5nt928ersfrvjkq73.apps.googleusercontent.com',
  offlineAccess: true, // Enable refresh tokens
  forceCodeForRefreshToken: true, // Android only
  accountName: '', // Android only
  googleServicePlistPath: '', // iOS only
  openIdRealm: '', // iOS only
  hostedDomain: '', // Restrict to a specific domain
  loginHint: '', // iOS only
  profileImageSize: 120, // Image size for user profile
});


const AuthSection = () => {
  const { t } = useTranslation();
  const { showAlert } = useAnima();
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
  const handleGoogleLogin = async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔵 [Google Login] Starting...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      HapticService.medium();

      // 1. Check Google Sign-In Configuration
      console.log('📋 [Google Login] Step 1: Checking configuration...');
      const configuredWebClientId = GoogleSignin.getCurrentUser();
      console.log('📋 [Google Login] Current User:', configuredWebClientId);

      // 2. 기기에 구글 플레이 서비스가 있는지 확인
      console.log('📋 [Google Login] Step 2: Checking Play Services...');
      const hasPlayServices = await GoogleSignin.hasPlayServices({ 
        showPlayServicesUpdateDialog: true 
      });
      console.log('✅ [Google Login] Play Services available:', hasPlayServices);
      
      // 3. Google Sign-In 시도
      console.log('📋 [Google Login] Step 3: Attempting sign in...');
      const signInResult = await GoogleSignin.signIn();
      console.log('✅ [Google Login] Sign in response:', signInResult);
      
      // 4. Extract user info from response
      // Note: @react-native-google-signin/google-signin v16+ returns { type, data }
      let userInfo;
      if (signInResult.type === 'success') {
        userInfo = signInResult.data;
        console.log('✅ [Google Login] Using signInResult.data');
      } else {
        userInfo = signInResult;
        console.log('✅ [Google Login] Using signInResult directly');
      }
      
      console.log('✅ [Google Login] ID Token:', userInfo?.idToken);
      console.log('✅ [Google Login] User:', userInfo?.user);

      // 5. ID Token 확인
      if (!userInfo?.idToken) {
        console.error('❌ [Google Login] Full signInResult:', JSON.stringify(signInResult, null, 2));
        throw new Error('Google Sign-In succeeded but no ID token received. This usually means webClientId is not configured correctly.');
      }
      
      // 6. Firebase용 자격 증명 생성
      console.log('📋 [Google Login] Step 6: Creating Firebase credential...');
      const googleCredential = auth.GoogleAuthProvider.credential(userInfo.idToken);
      console.log('✅ [Google Login] Firebase credential created:', googleCredential);
      
      // 7. Firebase에 로그인
      console.log('📋 [Google Login] Step 7: Signing in to Firebase...');
      const userCredential = await auth().signInWithCredential(googleCredential);
      console.log('✅ [Google Login] Firebase sign in successful!');
      console.log('✅ [Google Login] User:', userCredential.user.displayName, userCredential.user.email);
      
      // ⭐ Step 8: 백엔드 소셜 로그인 API 호출
      console.log('📋 [Google Login] Step 8: Calling backend social login API...');
      const { socialLogin } = await import('../../services/api/authService');
      
      const response = await socialLogin({
        provider: 'google',
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
        uid: userCredential.user.uid,
      });
      
      if (response.success) {
        console.log('✅ [Google Login] Backend login successful!');
        console.log('📊 [Google Login] isNewUser:', response.isNewUser);
        
        HapticService.success();
        
        // ✅ 신규 가입 vs 기존 로그인 구분
        if (response.isNewUser) {
          showAlert({
            title: t('auth.social_login.welcome_new_user'),
            message: t('auth.social_login.welcome_message', { 
              name: response.user.user_name 
            }),
            emoji: '🎉',
            buttons: [
              {
                text: t('common.confirm'),
                onPress: () => {
                  console.log('✅ [Google Login] New user welcome confirmed');
                  // UserContext가 자동으로 업데이트되어 메인 화면으로 이동
                },
              },
            ],
          });
        } else {
          showAlert({
            title: t('auth.social_login.welcome_back'),
            message: t('auth.social_login.welcome_back_message', { 
              name: response.user.user_name 
            }),
            emoji: '👋',
            buttons: [
              {
                text: t('common.confirm'),
                onPress: () => {
                  console.log('✅ [Google Login] Welcome back confirmed');
                  // UserContext가 자동으로 업데이트되어 메인 화면으로 이동
                },
              },
            ],
          });
        }
      } else {
        // ❌ 백엔드 로그인 실패
        console.error('❌ [Google Login] Backend login failed:', response.errorCode);
        HapticService.error();
        
        showAlert({
          title: t('error.title'),
          message: t(`errors.${response.errorCode}`) || t('errors.SOCIAL_LOGIN_FAILED'),
          emoji: '❌',
          buttons: [
            {
              text: t('common.confirm'),
            },
          ],
        });
      }

    } catch (error) {
      console.error('❌ [Google Login] Error:', error);
      console.error('❌ [Google Login] Error Type:', typeof error);
      console.error('❌ [Google Login] Error Code:', error?.code);
      console.error('❌ [Google Login] Error Message:', error?.message);
      
      // Handle specific errors
      if (error?.code === 'auth/account-exists-with-different-credential') {
        Alert.alert('계정 오류', '이미 다른 로그인 방법으로 가입된 이메일입니다.');
      } else if (error?.code === 'auth/invalid-credential') {
        Alert.alert('인증 오류', 'Google 인증 정보가 유효하지 않습니다.');
      } else if (error?.code === 'auth/network-request-failed') {
        Alert.alert('네트워크 오류', '인터넷 연결을 확인해주세요.');
      } else if (error?.code === 'SIGN_IN_CANCELLED' || error?.code === '-5') {
        console.log('ℹ️ [Google Login] User cancelled');
      } else {
        Alert.alert('로그인 실패', `Google 로그인 중 오류가 발생했습니다.\n${error?.message || error?.toString()}`);
      }
    }

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
        
        showAlert({
          title: t('auth.login.title'),
          message: t('auth.login.success'),
          emoji: '🎉',
          buttons: [
            {
              text: t('common.confirm'),
              onPress: () => {
                handleFlipBack();
              },
            },
          ],
        });
        
      } else {
     //   HapticService.error();

        let errorMessage = '';
        switch (response.errorCode) {
          case 'AUTH_LOGIN_001':
            errorMessage = t('errors.AUTH_LOGIN_001');
            break;
          case 'AUTH_LOGIN_002':
            errorMessage = t('errors.AUTH_LOGIN_002');
            break;
          case 'AUTH_LOGIN_003':
            errorMessage = t('errors.AUTH_LOGIN_003');
            break;
          case 'AUTH_LOGIN_004':
            errorMessage = t('errors.AUTH_LOGIN_004');
            break;
          default:
            errorMessage = t('errors.AUTH_LOGIN_004');
            break;
        }

      }
    } catch (error) {
      console.error('[Email Login] Error:', error);
  //    HapticService.error();
      showAlert({
        title: t('error.title'),
        message: t('errors.NETWORK_001'),
        emoji: '❌',
        buttons: [
          {
            text: t('common.confirm'),
            onPress: () => {
              setIsLoading(false);
            },
          },
        ],  
      });
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

