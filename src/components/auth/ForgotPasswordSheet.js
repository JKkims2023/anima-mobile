/**
 * 🔐 ForgotPasswordSheet - Password Reset with Bottom Sheet
 * 
 * Features:
 * - Step 1: Email input + Send code
 * - Step 2: Code verification + New password
 * - Step 3: Success message
 * - Simple & emotional design
 * - Multi-language support
 * 
 * Props:
 * - isOpen: boolean
 * - onClose: Function
 * - onSuccess: Function (optional, called after successful reset)
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import CustomBottomSheet from '../CustomBottomSheet';
import CustomText from '../CustomText';
import CustomButton from '../CustomButton';
import NeonInputBottomSheet from './NeonInputBottomSheet';
import { scale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import authService from '../../services/api/authService';
import { useAnima } from '../../contexts/AnimaContext';

const ForgotPasswordSheet = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { showToast, showAlert } = useAnima();
  const bottomSheetRef = useRef(null);

  // ✅ Step state (1: email, 2: code+password, 'success': done)
  const [step, setStep] = useState(1);

  // ✅ Form data
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ✅ Error states
  const [emailError, setEmailError] = useState(null);
  const [codeError, setCodeError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [confirmError, setConfirmError] = useState(null);

  // ✅ Loading states
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // ✅ Timer (10 minutes = 600 seconds)
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  // ✅ Reset state when sheet opens/closes
  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.present();
      // Reset to initial state
      setStep(1);
      setEmail('');
      setCode('');
      setPassword('');
      setConfirmPassword('');
      setEmailError(null);
      setCodeError(null);
      setPasswordError(null);
      setConfirmError(null);
      setTimer(0);
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isOpen]);

  // ✅ Timer countdown
  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timer]);

  // ✅ Format timer (mm:ss)
  const formatTimer = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // ✅ Email validation
  const validateEmail = (text) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!text) {
      setEmailError(t('auth.forgot_password.validation.email_required'));
      return false;
    }
    if (!emailRegex.test(text)) {
      setEmailError(t('auth.forgot_password.validation.email_invalid'));
      return false;
    }
    setEmailError(null);
    return true;
  };

  // ✅ Code validation
  const validateCode = (text) => {
    if (!text) {
      setCodeError(t('auth.forgot_password.validation.code_required'));
      return false;
    }
    if (!/^\d{5}$/.test(text)) {
      setCodeError(t('auth.forgot_password.validation.code_invalid'));
      return false;
    }
    setCodeError(null);
    return true;
  };

  // ✅ Password validation
  const validatePassword = (text) => {
    if (!text) {
      setPasswordError(t('auth.forgot_password.validation.password_required'));
      return false;
    }
    if (text.length < 6) {
      setPasswordError(t('auth.forgot_password.validation.password_length'));
      return false;
    }
    setPasswordError(null);
    return true;
  };

  // ✅ Confirm password validation
  const validateConfirmPassword = (text) => {
    if (!text) {
      setConfirmError(t('auth.forgot_password.validation.confirm_required'));
      return false;
    }
    if (text !== password) {
      setConfirmError(t('auth.forgot_password.validation.password_not_match'));
      return false;
    }
    setConfirmError(null);
    return true;
  };

  // ✅ Handle send code
  const handleSendCode = async () => {
    if (!validateEmail(email)) return;

    setIsSendingCode(true);
    
    try {
      // ✅ Call API to send password reset email
      const result = await authService.sendPasswordResetEmail(email, t('common.language'));
      
      if (result.success) {
        Alert.alert(
          t('auth.forgot_password.code_sent'),
          email
        );
        
        // Start timer (10 minutes)
        setTimer(600);
        
        // Move to step 2
        setStep(2);
      } else {

        console.log('🔐 [ForgotPasswordSheet] result:', result);
        console.log('🔐 [ForgotPasswordSheet] result.errorCode:', result.errorCode);
        // Handle specific error codes
        let errorMessage = t('auth.forgot_password.errors.general');
        
        if (result.errorCode === 'PASSWORD_RESET_003') {
          errorMessage = t('auth.forgot_password.errors.email_not_found');
        } else if (result.errorCode === 'PASSWORD_RESET_004') {
          errorMessage = t('auth.forgot_password.errors.account_deleted');
        } else if (result.errorCode === 'PASSWORD_RESET_005') {
          errorMessage = t('auth.forgot_password.errors.send_failed');
        }
        
        showToast({
          type: 'error',
          message: errorMessage,
          emoji: '❌',
        });
      }
    } catch (error) {
      showAlert({
        title: t('common.error'),
        message: error.message || t('auth.forgot_password.errors.general'),
        emoji: '❌',
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  // ✅ Handle resend code
  const handleResendCode = async () => {
    setIsSendingCode(true);
    
    try {
      // ✅ Call API to resend password reset email
      const result = await authService.sendPasswordResetEmail(email, t('common.language'));
      
      if (result.success) {
        Alert.alert(
          t('auth.forgot_password.code_sent'),
          email
        );
        
        // Restart timer
        setTimer(600);
      } else {
        // Handle specific error codes
        let errorMessage = t('auth.forgot_password.errors.general');
        
        if (result.errorCode === 'PASSWORD_RESET_003') {
          errorMessage = t('auth.forgot_password.errors.email_not_found');
        } else if (result.errorCode === 'PASSWORD_RESET_004') {
          errorMessage = t('auth.forgot_password.errors.account_deleted');
        } else if (result.errorCode === 'PASSWORD_RESET_005') {
          errorMessage = t('auth.forgot_password.errors.send_failed');
        }
        
        Alert.alert(t('common.error'), errorMessage);
      }
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error.message || t('auth.forgot_password.errors.general')
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  // ✅ Handle reset password
  const handleResetPassword = async () => {
    const isCodeValid = validateCode(code);
    const isPasswordValid = validatePassword(password);
    const isConfirmValid = validateConfirmPassword(confirmPassword);

    if (!isCodeValid || !isPasswordValid || !isConfirmValid) return;

    setIsResetting(true);
    
    try {
      // ✅ Call API to reset password
      const result = await authService.resetPassword(email, code, password);
      
      if (result.success) {
        // ✅ Show success toast
        showToast({
          type: 'success',
          message: t('auth.forgot_password.reset_success'),
          emoji: '🎉',
        });
        
        // Close sheet and callback
        handleClose();
        onSuccess && onSuccess();
      } else {
        // Handle specific error codes
        let errorMessage = t('auth.forgot_password.errors.general');
        
        if (result.errorCode === 'RESET_PASSWORD_005') {
          errorMessage = t('auth.forgot_password.errors.email_not_found');
        } else if (result.errorCode === 'RESET_PASSWORD_006') {
          errorMessage = t('auth.forgot_password.errors.account_deleted');
        } else if (result.errorCode === 'RESET_PASSWORD_007') {
          errorMessage = t('auth.forgot_password.errors.code_invalid');
        } else if (result.errorCode === 'RESET_PASSWORD_008') {
          errorMessage = t('auth.forgot_password.errors.reset_failed');
        }
        
        Alert.alert(t('common.error'), errorMessage);
      }
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error.message || t('auth.forgot_password.errors.general')
      );
    } finally {
      setIsResetting(false);
    }
  };

  // ✅ Handle close
  const handleClose = () => {
    bottomSheetRef.current?.dismiss();
    onClose && onClose();
  };

  // ✅ Render step content
  const renderContent = () => {
    // Step 1: Email input
    if (step === 1) {
      return (
        <View style={styles.stepContainer}>
          <NeonInputBottomSheet
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) validateEmail(text);
            }}
            onBlur={() => validateEmail(email)}
            placeholder={t('auth.forgot_password.email_placeholder')}
            leftIcon="email-outline"
            error={emailError}
            success={email && !emailError}
            disabled={isSendingCode}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      );
    }

    // Step 2: Code + New password
    if (step === 2) {
      return (
        <View style={styles.stepContainer}>
          {/* Timer */}
          {timer > 0 && (
            <View style={styles.timerContainer}>
              <Icon name="clock-outline" size={moderateScale(16)} color={COLORS.DEEP_BLUE} />
              <CustomText type="small" style={styles.timerText}>
                {t('auth.forgot_password.timer')}: {formatTimer()}
              </CustomText>
            </View>
          )}

          {/* Code input */}
          <NeonInputBottomSheet
            value={code}
            onChangeText={(text) => {
              setCode(text);
              if (codeError) validateCode(text);
            }}
            onBlur={() => validateCode(code)}
            placeholder={t('auth.forgot_password.code_placeholder')}
            leftIcon="shield-check-outline"
            error={codeError}
            success={code && !codeError}
            disabled={isResetting}
            keyboardType="number-pad"
            maxLength={5}
          />

          {/* Resend code button */}
          {timer === 0 && (
            <CustomButton
              title={t('auth.forgot_password.resend_code')}
              type="text"
              onPress={handleResendCode}
              loading={isSendingCode}
              disabled={isSendingCode}
              style={styles.resendButton}
            />
          )}

          {/* New password input */}
          <NeonInputBottomSheet
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) validatePassword(text);
            }}
            onBlur={() => validatePassword(password)}
            placeholder={t('auth.forgot_password.new_password_placeholder')}
            leftIcon="lock-outline"
            error={passwordError}
            success={password && !passwordError}
            disabled={isResetting}
            secureTextEntry
          />

          {/* Confirm password input */}
          <NeonInputBottomSheet
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (confirmError) validateConfirmPassword(text);
            }}
            onBlur={() => validateConfirmPassword(confirmPassword)}
            placeholder={t('auth.forgot_password.confirm_password_placeholder')}
            leftIcon="lock-check-outline"
            error={confirmError}
            success={confirmPassword && !confirmError}
            disabled={isResetting}
            secureTextEntry
          />
        </View>
      );
    }

    // Success
    if (step === 'success') {
      return (
        <View style={styles.successContainer}>
          <Icon name="check-circle" size={moderateScale(64)} color="#10B981" />
          <CustomText type="big" bold style={styles.successTitle}>
            {t('auth.forgot_password.success_title')}
          </CustomText>
          <CustomText type="normal" style={styles.successMessage}>
            {t('auth.forgot_password.success_message')}
          </CustomText>
        </View>
      );
    }
  };

  // ✅ Render buttons
  const renderButtons = () => {
    // Step 1: Send code
    if (step === 1) {
      return [
        {
          title: t('auth.forgot_password.send_code'),
          type: 'primary',
          onPress: handleSendCode,
          loading: isSendingCode,
          disabled: isSendingCode || !email,
        },
      ];
    }

    // Step 2: Reset password
    if (step === 2) {
      return [
        {
          title: t('auth.forgot_password.reset_password'),
          type: 'primary',
          onPress: handleResetPassword,
          loading: isResetting,
          disabled: isResetting || !code || !password || !confirmPassword,
        },
      ];
    }

    // Success: No buttons (auto close)
    return [];
  };

  // ✅ Get title based on step
  const getTitle = () => {
    if (step === 1) return t('auth.forgot_password.step1_title');
    if (step === 2) return t('auth.forgot_password.step2_title');
    return t('auth.forgot_password.success_title');
  };

  // ✅ Get subtitle based on step
  const getSubtitle = () => {
    if (step === 1) return t('auth.forgot_password.step1_subtitle');
    if (step === 2) return t('auth.forgot_password.step2_subtitle');
    return null;
  };

  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      title={getTitle()}
      subtitle={getSubtitle()}
      onClose={handleClose}
      buttons={renderButtons()}
      snapPoints={step === 2 ? ['75%', '90%'] : ['55%', '75%']}
      keyboardBehavior="extend"
    >
      {renderContent()}
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  stepContainer: {
    gap: scale(16),
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
    borderRadius: scale(8),
    alignSelf: 'center',
    marginBottom: scale(8),
  },
  timerText: {
    color: COLORS.DEEP_BLUE,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: scale(-8),
    marginBottom: scale(8),
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: scale(32),
  },
  successTitle: {
    color: '#10B981',
    marginTop: scale(16),
    marginBottom: scale(8),
  },
  successMessage: {
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: moderateScale(22),
  },
});

export default ForgotPasswordSheet;

