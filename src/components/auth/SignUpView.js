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

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { scale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import AuthCard from './AuthCard';
import NeonInput from './NeonInput';
import CustomButton from '../CustomButton';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { sendVerificationEmail, verifyEmailCode } from '../../services/api/authService';

const SignUpView = ({ onSignUp, onBack, isLoading = false }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState(null);
  const [verificationCodeError, setVerificationCodeError] = useState(null);
  
  const [codeSent, setCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [timer, setTimer] = useState(0); // Timer in seconds (10 minutes = 600 seconds)

  // ✅ Timer effect (10 minutes countdown)
  useEffect(() => {
    let interval;
    if (codeSent && !isVerified && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCodeSent(false);
            setVerificationCode('');
            Alert.alert(
              t('auth.register.email_verification.title'),
              t('errors.EMAIL_VERIFY_103'), // Code expired
              [{ text: t('common.confirm') }]
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [codeSent, isVerified, timer, t]);

  // ✅ Format timer (MM:SS)
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ✅ Email validation
  const validateEmail = (text) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!text) {
      setEmailError(t('auth.register.validation.email_required'));
      return false;
    }
    if (!emailRegex.test(text)) {
      setEmailError(t('auth.register.validation.email_format'));
      return false;
    }
    setEmailError(null);
    return true;
  };

  // ✅ Password validation (8+ chars, uppercase, lowercase, number)
  const validatePassword = (text) => {
    if (!text) {
      setPasswordError(t('auth.register.validation.password_required'));
      return false;
    }
    if (text.length < 8) {
      setPasswordError(t('auth.register.validation.password_length'));
      return false;
    }
    if (!/[A-Z]/.test(text)) {
      setPasswordError(t('auth.register.validation.password_uppercase'));
      return false;
    }
    if (!/[a-z]/.test(text)) {
      setPasswordError(t('auth.register.validation.password_lowercase'));
      return false;
    }
    if (!/[0-9]/.test(text)) {
      setPasswordError(t('auth.register.validation.password_number'));
      return false;
    }
    setPasswordError(null);
    return true;
  };

  // ✅ Confirm password validation
  const validateConfirmPassword = (text) => {
    if (!text) {
      setConfirmPasswordError(t('auth.register.validation.password_confirm_required'));
      return false;
    }
    if (text !== password) {
      setConfirmPasswordError(t('auth.register.validation.password_not_match'));
      return false;
    }
    setConfirmPasswordError(null);
    return true;
  };

  // ✅ Verification code validation
  const validateVerificationCode = (text) => {
    if (!text) {
      setVerificationCodeError(t('auth.register.validation.verification_code_required'));
      return false;
    }
    if (!/^\d{5}$/.test(text)) {
      setVerificationCodeError(t('auth.register.validation.verification_code_invalid'));
      return false;
    }
    setVerificationCodeError(null);
    return true;
  };

  // ✅ Handle send verification code
  const handleSendCode = async () => {
    if (!validateEmail(email)) {
      return;
    }

    setIsSendingCode(true);

    try {
      const result = await sendVerificationEmail(email, t('common.locale'));

      let errorMessage = '';

      console.log('🔐 [SignUpView] result:', result);

      if (result.success) {

        console.log('what the...??')
        setCodeSent(true);
        setTimer(600); // Start 10-minute timer
        Alert.alert(
          t('auth.register.email_verification.title'),
          t('auth.register.email_verification.code_sent'),
          [{ text: t('common.confirm') }]
        );


      } else {

        console.log('🔐 [SignUpView] result:', result);
        console.log('🔐 [SignUpView] result.errorCode:', result.errorCode);
        switch (result.errorCode) {
          case 'EMAIL_VERIFY_001':
            errorMessage = t('errors.EMAIL_VERIFY_001');
            break;
          case 'EMAIL_VERIFY_002':
            errorMessage = t('errors.EMAIL_VERIFY_002');
            break;
          case 'EMAIL_VERIFY_003':
            errorMessage = t('errors.EMAIL_VERIFY_003');
            break;
          case 'EMAIL_VERIFY_004':
            errorMessage = t('errors.EMAIL_VERIFY_004');
            break;
          case 'EMAIL_VERIFY_005':
            errorMessage = t('errors.EMAIL_VERIFY_005');
            break;
          default:
            errorMessage = t('errors.UNKNOWN');
            break;
        }

        console.log('🔐 [SignUpView] errorMessage:', errorMessage);

        Alert.alert(
          t('error.title'),
          errorMessage,
          [{ text: t('common.confirm') }]
        );
      }
    } catch (error) {
      console.error('[Send Verification Code] Error:', error);
      Alert.alert(
        t('error.title'),
        t('errors.NETWORK_001'),
        [{ text: t('common.confirm') }]
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  // ✅ Handle verify code
  const handleVerifyCode = async () => {
    if (!validateVerificationCode(verificationCode)) {
      return;
    }

    setIsVerifying(true);

    try {
      const result = await verifyEmailCode(email, verificationCode);

      console.log('🔐 [SignUpView] result:', result);
      console.log('🔐 [SignUpView] result.success:', result.success);
      console.log('🔐 [SignUpView] result.errorCode:', result.errorCode);
      if (result.success) {
        setIsVerified(true);
        Alert.alert(
          t('auth.register.email_verification.title'),
          t('auth.register.email_verification.success'),
          [{ text: t('common.confirm') }]
        );
      } else {
        const errorMessage = t(`errors.${result.errorCode}`);
        Alert.alert(
          t('error.title'),
          errorMessage,
          [{ text: t('common.confirm') }]
        );
      }
    } catch (error) {
      console.error('[Verify Code] Error:', error);
      Alert.alert(
        t('error.title'),
        t('errors.NETWORK_001'),
        [{ text: t('common.confirm') }]
      );
    } finally {
      setIsVerifying(false);
    }
  };

  // ✅ Handle sign up
  const handleSignUp = () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
    const isCodeValid = validateVerificationCode(verificationCode);

    if (isEmailValid && isPasswordValid && isConfirmPasswordValid && isCodeValid && isVerified) {
      onSignUp({ 
        userEmail: email, 
        userPw: password, 
        userPwConfirm: confirmPassword,
        verificationCode 
      });
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
          <Text style={styles.title}>{t('auth.register.title')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.register.subtitle')}
          </Text>

          {/* ✅ Email input with send code button */}
          <View style={styles.emailSection}>
            <NeonInput
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) validateEmail(text);
                // Reset verification state when email changes
                if (codeSent) {
                  setCodeSent(false);
                  setIsVerified(false);
                  setVerificationCode('');
                }
              }}
              onBlur={() => validateEmail(email)}
              placeholder={t('auth.register.email_placeholder')}
              leftIcon="email-outline"
              error={emailError}
              success={email && !emailError && isVerified}
              disabled={isLoading || isSendingCode}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            {/* ✅ Send verification code button */}
            {!isVerified && (
              <CustomButton
                title={codeSent ? t('auth.register.email_verification.resend') : t('auth.register.email_verification.send_code')}
                onPress={handleSendCode}
                loading={isSendingCode}
                disabled={!email || !!emailError || isSendingCode || isLoading}
                style={styles.sendCodeButton}
              />
            )}
            
            {isVerified && (
              <View style={styles.verifiedBadge}>
                <Icon name="check-circle" size={moderateScale(20)} color="#10B981" />
                <Text style={styles.verifiedText}>{t('auth.register.email_verification.verified')}</Text>
              </View>
            )}
          </View>

          {/* ✅ Verification code input (shown after code sent) */}
          {codeSent && !isVerified && (
            <View style={styles.verificationSection}>
              {/* ✅ Timer display */}
              {timer > 0 && (
                <View style={styles.timerContainer}>
                  <Icon name="clock-outline" size={moderateScale(16)} color="#94A3B8" />
                  <Text style={styles.timerText}>
                    {t('auth.register.email_verification.timer')}: {formatTimer(timer)}
                  </Text>
                </View>
              )}
              
              <NeonInput
                value={verificationCode}
                onChangeText={(text) => {
                  // Only allow numbers
                  const numericText = text.replace(/[^0-9]/g, '');
                  if (numericText.length <= 5) {
                    setVerificationCode(numericText);
                    if (verificationCodeError) validateVerificationCode(numericText);
                  }
                }}
                onBlur={() => validateVerificationCode(verificationCode)}
                placeholder={t('auth.register.email_verification.code_placeholder')}
                leftIcon="shield-check-outline"
                error={verificationCodeError}
                success={verificationCode.length === 5 && !verificationCodeError}
                disabled={isLoading || isVerifying}
                keyboardType="number-pad"
                maxLength={5}
              />
              
              <CustomButton
                title={t('auth.register.email_verification.verify')}
                onPress={handleVerifyCode}
                loading={isVerifying}
                disabled={verificationCode.length !== 5 || isVerifying || isLoading}
                style={styles.verifyButton}
              />
            </View>
          )}

          {/* ✅ Password input */}
          <NeonInput
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) validatePassword(text);
              if (confirmPassword) validateConfirmPassword(confirmPassword);
            }}
            onBlur={() => validatePassword(password)}
            placeholder={t('auth.register.password_placeholder')}
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
            placeholder={t('auth.register.password_confirm_placeholder')}
            leftIcon="lock-check-outline"
            error={confirmPasswordError}
            success={confirmPassword && !confirmPasswordError}
            disabled={isLoading}
            secureTextEntry
          />

          {/* ✅ Sign up button */}
          <CustomButton
            title={t('auth.register.submit')}
            onPress={handleSignUp}
            loading={isLoading}
            disabled={!isVerified || isLoading}
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
    maxHeight: '100%',
    flex: 1,
  },
  card: {
    width: '100%',
    flex: 1,
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
  emailSection: {
    marginBottom: scale(16),
  },
  sendCodeButton: {
    marginTop: scale(8),
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scale(8),
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: '#10B981',
  },
  verifiedText: {
    fontSize: moderateScale(14),
    color: '#10B981',
    fontWeight: '600',
    marginLeft: scale(8),
  },
  verificationSection: {
    marginBottom: scale(16),
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(12),
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  timerText: {
    fontSize: moderateScale(14),
    color: '#94A3B8',
    fontWeight: '600',
    marginLeft: scale(8),
  },
  verifyButton: {
    marginTop: scale(8),
  },
  signUpButton: {
    marginTop: scale(8),
    marginBottom: scale(16),
  },
});

export default SignUpView;

