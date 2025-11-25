/**
 * 📧 EmailLoginView - Email Login Form (Flipped Card Back)
 * 
 * Features:
 * - Email + Password inputs
 * - Forgot password link
 * - Login button
 * - Back button (flip back to initial view)
 * - No scroll needed
 * 
 * Props:
 * - onLogin: Function
 * - onBack: Function (flip back)
 * - isLoading: boolean
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { scale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import AuthCard from './AuthCard';
import NeonInput from './NeonInput';
import CustomButton from '../CustomButton';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const EmailLoginView = ({ onLogin, onBack, isLoading = false }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  // ✅ Email validation
  const validateEmail = (text) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!text) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(text)) {
      setEmailError('Invalid email format');
      return false;
    }
    setEmailError(null);
    return true;
  };

  // ✅ Password validation
  const validatePassword = (text) => {
    if (!text) {
      setPasswordError('Password is required');
      return false;
    }
    if (text.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  // ✅ Handle login
  const handleLogin = () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (isEmailValid && isPasswordValid) {
      onLogin({ email, password });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardWrapper}>
        <AuthCard style={styles.card}>
        {/* ✅ Back button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBack}
          disabled={isLoading}
        >
          <Icon name="arrow-left" size={moderateScale(24)} color="#94A3B8" />
        </TouchableOpacity>

        {/* ✅ Title */}
        <Text style={styles.title}>{t('auth.email_login_title')}</Text>
        <Text style={styles.subtitle}>
          {t('auth.email_login_subtitle')}
        </Text>

        {/* ✅ Email input */}
        <NeonInput
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (emailError) validateEmail(text);
          }}
          onBlur={() => validateEmail(email)}
          placeholder={t('auth.email_placeholder')}
          leftIcon="email-outline"
          error={emailError}
          success={email && !emailError}
          disabled={isLoading}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* ✅ Password input */}
        <NeonInput
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) validatePassword(text);
          }}
          onBlur={() => validatePassword(password)}
          placeholder={t('auth.password_placeholder')}
          leftIcon="lock-outline"
          error={passwordError}
          success={password && !passwordError}
          disabled={isLoading}
          secureTextEntry
        />

        {/* ✅ Forgot password */}
        <TouchableOpacity 
          style={styles.forgotPassword}
          disabled={isLoading}
        >
          <Text style={styles.forgotPasswordText}>{t('auth.forgot_password')}</Text>
        </TouchableOpacity>

        {/* ✅ Login button */}
        <CustomButton
          title={t('auth.login_button')}
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading}
          style={styles.loginButton}
        />
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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: scale(16),
    padding: scale(8),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: '#F1F5F9',
    textAlign: 'center',
    marginBottom: scale(8),
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: scale(32),
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: scale(24),
  },
  forgotPasswordText: {
    fontSize: moderateScale(14),
    color: COLORS.DEEP_BLUE,
  },
  loginButton: {
    marginTop: scale(8),
  },
});

export default EmailLoginView;

