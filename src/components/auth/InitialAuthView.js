/**
 * 🎨 InitialAuthView - Initial Authentication View
 * 
 * Features:
 * - 4 buttons: Google, Apple, Email Login, Sign Up
 * - ANIMA logo and welcome message
 * - No scroll needed (fits in one screen)
 * 
 * Props:
 * - onGoogleLogin: Function
 * - onAppleLogin: Function
 * - onEmailLogin: Function (triggers flip)
 * - onSignUp: Function (triggers flip)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { scale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import AuthCard from './AuthCard';
import SocialLoginButton from './SocialLoginButton';
import CustomButton from '../CustomButton';

const InitialAuthView = ({ 
  onGoogleLogin, 
  onAppleLogin, 
  onEmailLogin, 
  onSignUp 
}) => {
  const { t } = useTranslation();
  
  // ✅ Logo animation
  const logoScale = useSharedValue(1);

  React.useEffect(() => {
    // ✅ Breathing animation for logo
    logoScale.value = withSequence(
      withSpring(1.1, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.cardWrapper}>
        <AuthCard style={styles.card}>
        {/* ✅ ANIMA Logo */}
        <View style={styles.logoContainer}>
          <Animated.Text style={[styles.logoText, logoAnimatedStyle]}>
            ✨
          </Animated.Text>
          <Text style={styles.logoTitle}>ANIMA</Text>
        </View>

        {/* ✅ Welcome message */}
        <Text style={styles.welcomeText}>{t('auth.welcome_back')}</Text>
        <Text style={styles.subtitleText}>
          {t('auth.welcome_message')}
        </Text>

        {/* ✅ Social login buttons */}
        <View style={styles.socialContainer}>
          <SocialLoginButton
            provider="google"
            onPress={onGoogleLogin}
          />
          <SocialLoginButton
            provider="apple"
            onPress={onAppleLogin}
          />
        </View>

        {/* ✅ Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('auth.or')}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ✅ Email login button */}
        <CustomButton
          title={t('auth.email_login')}
          onPress={onEmailLogin}
          variant="outline"

          style={[styles.emailButton, { fontSize: moderateScale(22) }]}
        />

        {/* ✅ Sign up link */}
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>{t('auth.dont_have_account')} </Text>
          <TouchableOpacity onPress={onSignUp}>
            <Text style={styles.signUpLink}>{t('auth.sign_up')}</Text>
          </TouchableOpacity>
        </View>
      </AuthCard>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: scale(40),
  },
  cardWrapper: {
    width: '100%',
    maxWidth: scale(400),
    maxHeight: '100%', // ✅ Changed from height to maxHeight
    flex: 1, // ✅ Allow flexible height
  },
  card: {
    width: '100%',
    flex: 1, // ✅ Changed from height: '100%'
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
    color: '#F1F5F9', // Light text on dark card
    textAlign: 'center',
    marginBottom: scale(8),
  },
  subtitleText: {
    fontSize: moderateScale(14),
    color: '#94A3B8', // Gray text
    textAlign: 'center',
    marginBottom: scale(32),
  },
  socialContainer: {
    gap: scale(12),
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
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
  },
  dividerText: {
    marginHorizontal: scale(16),
    fontSize: moderateScale(14),
    color: '#94A3B8',
  },
  emailButton: {
    marginBottom: scale(16),
    fontSize: moderateScale(22),

  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: moderateScale(14),
    color: '#94A3B8',
  },
  signUpLink: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: COLORS.DEEP_BLUE,
  },
});

export default InitialAuthView;

