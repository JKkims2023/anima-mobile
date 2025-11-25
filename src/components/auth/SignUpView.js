/**
 * ✍️ SignUpView - Sign Up Form (Flipped Card Back)
 * 
 * Features:
 * - Name, Email, Password, Confirm Password inputs
 * - Sign up button
 * - Back button (flip back to initial view)
 * - Internal scroll (unavoidable for sign up form)
 * 
 * Props:
 * - onSignUp: Function
 * - onBack: Function (flip back)
 * - isLoading: boolean
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { scale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import AuthCard from './AuthCard';
import NeonInput from './NeonInput';
import CustomButton from '../CustomButton';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SignUpView = ({ onSignUp, onBack, isLoading = false }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [nameError, setNameError] = useState(null);
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState(null);

  // ✅ Name validation
  const validateName = (text) => {
    if (!text) {
      setNameError('Name is required');
      return false;
    }
    if (text.length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }
    setNameError(null);
    return true;
  };

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

  // ✅ Confirm password validation
  const validateConfirmPassword = (text) => {
    if (!text) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (text !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError(null);
    return true;
  };

  // ✅ Handle sign up
  const handleSignUp = () => {
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid) {
      onSignUp({ name, email, password });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardWrapper}>
        <AuthCard style={styles.card}>
          <ScrollView 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ✅ Back button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onBack}
            disabled={isLoading}
          >
            <Icon name="arrow-left" size={moderateScale(24)} color="#94A3B8" />
          </TouchableOpacity>

          {/* ✅ Title */}
          <Text style={styles.title}>{t('auth.sign_up_title')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.sign_up_subtitle')}
          </Text>

          {/* ✅ Name input */}
          <NeonInput
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (nameError) validateName(text);
            }}
            onBlur={() => validateName(name)}
            placeholder={t('auth.name_placeholder')}
            leftIcon="account-outline"
            error={nameError}
            success={name && !nameError}
            disabled={isLoading}
          />

          {/* ✅ Email input */}
          <NeonInput
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

          {/* ✅ Password input */}
          <NeonInput
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) validatePassword(text);
              if (confirmPassword) validateConfirmPassword(confirmPassword);
            }}
            onBlur={() => validatePassword(password)}
            placeholder="••••••••"
            leftIcon="lock-outline"
            error={passwordError}
            success={password && !passwordError}
            disabled={isLoading}
            secureTextEntry
          />

          {/* ✅ Confirm password input */}
          <NeonInput
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (confirmPasswordError) validateConfirmPassword(text);
            }}
            onBlur={() => validateConfirmPassword(confirmPassword)}
            placeholder="••••••••"
            leftIcon="lock-check-outline"
            error={confirmPasswordError}
            success={confirmPassword && !confirmPasswordError}
            disabled={isLoading}
            secureTextEntry
          />

          {/* ✅ Sign up button */}
          <CustomButton
            title={t('auth.signup_button')}
            onPress={handleSignUp}
            loading={isLoading}
            disabled={isLoading}
            style={styles.signUpButton}
          />
        </ScrollView>
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
  signUpButton: {
    marginTop: scale(8),
    marginBottom: scale(16),
  },
});

export default SignUpView;

