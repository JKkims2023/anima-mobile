/**
 * 🔐 LoginView - Main Login Component
 * 
 * Features:
 * - Social login (Google, Apple)
 * - Email/Password login
 * - Card flip animation to SignUpView
 * - Form validation
 * - Animated logo
 * 
 * Props:
 * - onLoginSuccess: Function
 * - onSwitchToSignUp: Function
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import SafeScreen from '../SafeScreen';
import AuthCard from './AuthCard';
import SocialLoginButton from './SocialLoginButton';
import NeonInput from './NeonInput';
import CustomButton from '../CustomButton';
import { login } from '../../services/api/authService';
import { useTranslation } from 'react-i18next';

const LoginView = ({ onLoginSuccess, onSwitchToSignUp }) => {

  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Logo animation
  const logoScale = useSharedValue(1);
  const logoRotate = useSharedValue(0);

  React.useEffect(() => {
    // ✅ Breathing animation for logo
    logoScale.value = withSequence(
      withSpring(1.1, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  // ✅ Email validation
  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError('Invalid email format');
      return false;
    }
    setEmailError(null);
    return true;
  };

  // ✅ Password validation
  const validatePassword = (value) => {
    if (!value) {
      setPasswordError('Password is required');
      return false;
    }
    if (value.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  // ✅ Handle email login
  const handleEmailLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Call API endpoint
      // const response = await fetch('/api/auth/login', { ... });
      
      console.log('🔐 [LoginView] email:', email);
      console.log('🔐 [LoginView] password:', password);

      const result = await login(email, password);
      console.log('🔐 [LoginView] result:', result);
      console.log('🔐 [LoginView] result.success:', result.success);
      console.log('🔐 [LoginView] result.errorCode:', result.errorCode);

      if (result.success) {
        console.log('✅ [LoginView] Email login success');
        onLoginSuccess?.();
      } else {
        console.log('❌ [LoginView] Email login error:', result.errorCode);
        setPasswordError('Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('❌ [LoginView] Email login error:', error);
      setPasswordError('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Handle social login
  const handleSocialLogin = async (provider) => {
    console.log(`🔐 [LoginView] ${provider} login initiated`);
    
    try {
      // TODO: Implement social login
      // - Google: @react-native-google-signin/google-signin
      // - Apple: @invertase/react-native-apple-authentication
      
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      console.log(`✅ [LoginView] ${provider} login success`);
      onLoginSuccess?.();
    } catch (error) {
      console.error(`❌ [LoginView] ${provider} login error:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeScreen
      backgroundColor="#0F172A"
      statusBarStyle="light-content"
      edges={{ top: true, bottom: true }}
      keyboardAware={true}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <AuthCard style={styles.card}>
        {/* ✅ ANIMA Logo */}
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Text style={styles.logoText}>✨</Text>
          <Text style={styles.logoTitle}>ANIMA</Text>
        </Animated.View>

        {/* ✅ Welcome message */}
        <Text style={styles.welcomeText}>{t('auth.welcome_back')}</Text>
        <Text style={styles.subtitleText}>
          {t('auth.welcome_message')}
        </Text>

        {/* ✅ Social login buttons */}
        <View style={styles.socialContainer}>
          <SocialLoginButton
            provider="google"
            onPress={() => handleSocialLogin('google')}
            disabled={isLoading}
          />
          <SocialLoginButton
            provider="apple"
            onPress={() => handleSocialLogin('apple')}
            disabled={isLoading}
          />
        </View>

        {/* ✅ Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ✅ Email/Password inputs */}
        <NeonInput
          label="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (emailError) validateEmail(text);
          }}
          onBlur={() => validateEmail(email)}
          placeholder="your@email.com"
          leftIcon="email-outline"
          error={emailError}
          success={email && !emailError}
          disabled={isLoading}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <NeonInput
          label="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) validatePassword(text);
          }}
          onBlur={() => validatePassword(password)}
          placeholder="••••••••"
          leftIcon="lock-outline"
          error={passwordError}
          success={password && !passwordError}
          disabled={isLoading}
          secureTextEntry
        />

        {/* ✅ Forgot password */}
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot password?</Text>
        </TouchableOpacity>

        {/* ✅ Login button */}
        <CustomButton
          title="Login"
          onPress={handleEmailLogin}
          loading={isLoading}
          disabled={isLoading}
          style={styles.loginButton}
        />

        {/* ✅ Sign up link */}
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity
            onPress={onSwitchToSignUp}
            disabled={isLoading}
          >
            <Text style={styles.signUpLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </AuthCard>
        </View>
      </ScrollView>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: scale(40),
  },
  container: {
    paddingHorizontal: scale(20),
  },
  card: {
    width: '100%',
    maxWidth: scale(400),
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: scale(24),
  },
  logoText: {
    fontSize: moderateScale(48),
    marginBottom: scale(8),
  },
  logoTitle: {
    fontSize: moderateScale(32),
    fontWeight: 'bold',
    color: COLORS.DEEP_BLUE,
    letterSpacing: 2,
  },
  welcomeText: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: scale(8),
  },
  subtitleText: {
    fontSize: moderateScale(14),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: scale(32),
  },
  socialContainer: {
    marginBottom: scale(24),
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(24),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
  },
  dividerText: {
    marginHorizontal: scale(16),
    fontSize: moderateScale(14),
    color: '#9CA3AF',
    fontWeight: '500',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: scale(24),
  },
  forgotPasswordText: {
    fontSize: moderateScale(14),
    color: COLORS.DEEP_BLUE,
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: scale(16),
    fontSize: moderateScale(18),

  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: moderateScale(14),
    color: '#6B7280',
  },
  signUpLink: {
    fontSize: moderateScale(14),
    color: COLORS.DEEP_BLUE,
    fontWeight: '600',
  },
});

export default LoginView;

