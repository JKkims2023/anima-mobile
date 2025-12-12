/**
 * ⚙️ SettingsScreen - Modern Card-Based Settings
 * 
 * Features:
 * - User Profile Card (with avatar, name, email)
 * - Service Settings (Push, Haptic)
 * - Terms & Policies
 * - Danger Zone (Logout, Withdrawal)
 * - Neon Glow effect
 * - Theme-aware colors
 * - Safe Area support
 * 
 * Design: Modern Card Style with ANIMA branding
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from '../components/CustomText';
import CustomButton from '../components/CustomButton';
import CustomSwitch from '../components/CustomSwitch';
import SettingsCard from '../components/SettingsCard';
import SettingsItem from '../components/SettingsItem';
import SafeScreen from '../components/SafeScreen';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useAnima } from '../contexts/AnimaContext';
import AuthSection from '../components/auth/AuthSection';
import HapticService from '../utils/HapticService';
import { scale, moderateScale, platformPadding } from '../utils/responsive-utils';
import { COLORS } from '../styles/commonstyles';

/**
 * ⚙️ SettingsScreen Component
 */
const SettingsScreen = () => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { user, isAuthenticated, loading: userLoading, logout } = useUser();
  const { showToast, showAlert, showDefaultPersonas, updateShowDefaultPersonas } = useAnima();

  // ✅ Local state for settings
  const [pushEnabled, setPushEnabled] = useState(false);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

  // ✅ Load settings from AsyncStorage on mount
  React.useEffect(() => {
    loadSettings();
  }, []);

  // ✅ Load settings
  const loadSettings = async () => {
    try {
      const pushSetting = await AsyncStorage.getItem('@anima_push_enabled');

      if (pushSetting !== null) {
        setPushEnabled(pushSetting === 'true');
      }
      
      // ⭐ Load haptic setting from HapticService (already initialized on app start)
      setHapticEnabled(HapticService.isEnabled());
      
      if (__DEV__) {
        console.log('[Settings] Loaded haptic setting:', HapticService.isEnabled());
      }
    } catch (error) {
      console.error('[Settings] Failed to load settings:', error);
    }
  };

  // ✅ Handle Push toggle
  const handlePushToggle = async (value) => {
    setPushEnabled(value);
    try {
      await AsyncStorage.setItem('@anima_push_enabled', value.toString());
      // TODO: Update push notification settings via API
    } catch (error) {
      console.error('[Settings] Failed to save push setting:', error);
    }
  };

  // ✅ Handle Haptic toggle
  const handleHapticToggle = async (value) => {
    setHapticEnabled(value);
    
    try {
      // ⭐ Update HapticService state (also saves to AsyncStorage)
      if (value) {
        await HapticService.enable();
        // ⭐ Give feedback when enabling!
        HapticService.light();
      } else {
        await HapticService.disable();
        // No feedback when disabling (obviously!)
      }
      
      if (__DEV__) {
        console.log('[Settings] Haptic toggled:', value);
      }
    } catch (error) {
      console.error('[Settings] Failed to save haptic setting:', error);
    }
  };
  
  // ⭐ NEW: Handle Default Personas toggle
  const handleDefaultPersonasToggle = async (value) => {
    try {
      // ⭐ Update AnimaContext state (also saves to AsyncStorage)
      await updateShowDefaultPersonas(value);
      
      HapticService.light();
      
      if (__DEV__) {
        console.log('[Settings] Default Personas toggled:', value);
      }
    } catch (error) {
      console.error('[Settings] Failed to save default personas setting:', error);
    }
  };

  // ✅ Handle Logout
  const handleLogout = () => {
    showAlert({
      title: t('settings.logout.confirm_title'),
      message: t('settings.logout.confirm_message'),
      emoji: '🚪',
      buttons: [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.logout.button'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            showToast({
              type: 'success',
              message: t('settings.logout.success'),
              emoji: '👋',
            });
          },
        },
      ],
    });
  };

  // ✅ Handle Withdrawal
  const handleWithdrawal = () => {
    if (!showWithdrawConfirm) {
      setShowWithdrawConfirm(true);
      return;
    }

    showAlert({
      title: t('settings.withdrawal.final_confirm_title'),
      message: t('settings.withdrawal.final_confirm_message'),
      emoji: '💔',
      buttons: [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: () => setShowWithdrawConfirm(false),
        },
        {
          text: t('settings.withdrawal.button'),
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement withdrawal API call
            showToast({
              type: 'error',
              message: t('settings.withdrawal.pending'),
              emoji: '⏳',
            });
            setShowWithdrawConfirm(false);
          },
        },
      ],
    });
  };

  // ✅ Handle Terms press
  const handleTermsPress = () => {
    // TODO: Navigate to Terms screen or open web link
    Alert.alert(
      t('settings.terms.service_terms'),
      t('settings.terms.coming_soon')
    );
  };

  // ✅ Handle Privacy Policy press
  const handlePrivacyPress = () => {
    // TODO: Navigate to Privacy Policy screen or open web link
    Alert.alert(
      t('settings.terms.privacy_policy'),
      t('settings.terms.coming_soon')
    );
  };

  // ✅ If NOT authenticated, show FULL-SCREEN login
  if (!isAuthenticated && !userLoading) {
    return <AuthSection />;
  }

  // ✅ If authenticated, show settings
  return (
    <SafeScreen
      backgroundColor={currentTheme.backgroundColor}
      statusBarStyle={currentTheme.statusBarStyle || 'light-content'}
      edges={{ top: true, bottom: false }}
      keyboardAware={false}
    >
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Header (Fixed) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <View style={styles.header}>
        <CustomText type="big" bold style={styles.headerTitle}>
          {t('settings.title')}
        </CustomText>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {userLoading ? (
          <CustomText type="normal" style={styles.loadingText}>
            {t('common.loading')}...
          </CustomText>
        ) : (
          <>
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* 1️⃣ User Profile Card */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <SettingsCard>
              <View style={styles.profileContainer}>
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                  <View style={styles.avatarGlow} />
                  <View style={styles.avatar}>
                    <CustomText type="big" style={styles.avatarText}>
                      {user?.user_name?.[0]?.toUpperCase() || user?.user_id?.[0]?.toUpperCase() || '👤'}
                    </CustomText>
                  </View>
                </View>

                {/* User Info */}
                <View style={styles.userInfo}>
                  <CustomText type="title" bold style={styles.userName}>
                    {user?.user_name || user?.user_id}
                  </CustomText>
                  <CustomText type="small" style={styles.userEmail}>
                    {user?.user_email}
                  </CustomText>
                </View>
              </View>
            </SettingsCard>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* 2️⃣ Service Settings */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <SettingsCard title={t('settings.service.title')}>
              <SettingsItem
                icon="🔔"
                title={t('settings.service.push_notification')}
                description={t('settings.service.push_description')}
                showBorder={true}
                rightComponent={
                  <CustomSwitch
                    value={pushEnabled}
                    onValueChange={handlePushToggle}
                  />
                }
              />
              <SettingsItem
                icon="📳"
                title={t('settings.service.haptic')}
                description={t('settings.service.haptic_description')}
                showBorder={true}
                rightComponent={
                  <CustomSwitch
                    value={hapticEnabled}
                    onValueChange={handleHapticToggle}
                  />
                }
              />
              <SettingsItem
                icon="🎭"
                title={t('settings.service.default_personas')}
                description={t('settings.service.default_personas_description')}
                showBorder={false}
                rightComponent={
                  <CustomSwitch
                    value={showDefaultPersonas}
                    onValueChange={handleDefaultPersonasToggle}
                  />
                }
              />
            </SettingsCard>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* 3️⃣ Terms & Policies */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <SettingsCard title={t('settings.terms.title')}>
              <SettingsItem
                icon="📜"
                title={t('settings.terms.service_terms')}
                description={t('settings.terms.service_terms_description')}
                onPress={handleTermsPress}
                showBorder={true}
              />
              <SettingsItem
                icon="🔒"
                title={t('settings.terms.privacy_policy')}
                description={t('settings.terms.privacy_policy_description')}
                onPress={handlePrivacyPress}
                showBorder={false}
              />
            </SettingsCard>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* 4️⃣ Danger Zone */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <SettingsCard title={t('settings.danger.title')}>
              <View style={styles.dangerContent}>
                {/* Logout Button */}
                <CustomButton
                  title={t('settings.logout.button')}
                  type="outline"
                  onPress={handleLogout}
                  style={styles.dangerButton}
                  textStyle={styles.logoutButtonText}
                  leftIcon={<Icon name="exit-to-app" size={scale(20)} color={COLORS.TEXT_PRIMARY} />}
                />

                {/* Withdrawal Button */}
                {!showWithdrawConfirm ? (
                  <CustomButton
                    title={t('settings.withdrawal.button')}
                    type="outline"
                    onPress={handleWithdrawal}
                    style={[styles.dangerButton, styles.withdrawalButton]}
                    textStyle={styles.withdrawalButtonText}
                    leftIcon={<Icon name="account-remove" size={scale(20)} color="#EF4444" />}
                  />
                ) : (
                  <View style={styles.withdrawConfirmContainer}>
                    <CustomText type="small" style={styles.withdrawConfirmText}>
                      {t('settings.withdrawal.confirm_message')}
                    </CustomText>
                    <View style={styles.withdrawConfirmButtons}>
                      <CustomButton
                        title={t('common.cancel')}
                        type="outline"
                        onPress={() => setShowWithdrawConfirm(false)}
                        style={styles.withdrawCancelButton}
                      />
                      <CustomButton
                        title={t('settings.withdrawal.confirm')}
                        type="primary"
                        onPress={handleWithdrawal}
                        style={styles.withdrawConfirmButton}
                      />
                    </View>
                  </View>
                )}
              </View>
            </SettingsCard>

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </>
        )}
      </ScrollView>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: platformPadding(20),
    paddingTop: platformPadding(10), // ⭐ Reduced (header is now fixed)
    paddingBottom: platformPadding(40),
  },
  header: {
    paddingHorizontal: platformPadding(20),
    paddingTop: platformPadding(20),
    paddingBottom: scale(16),
    backgroundColor: COLORS.BACKGROUND || '#000', // ⭐ Fixed background
  },
  headerTitle: {
    color: COLORS.TEXT_PRIMARY,
  },
  loadingText: {
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: scale(40),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Profile Card
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: platformPadding(16),
    paddingVertical: platformPadding(20),
  },
  avatarContainer: {
    position: 'relative',
    marginRight: scale(16),
  },
  avatarGlow: {
    position: 'absolute',
    top: -scale(4),
    left: -scale(4),
    right: -scale(4),
    bottom: -scale(4),
    borderRadius: moderateScale(40),
    backgroundColor: COLORS.DEEP_BLUE,
    opacity: 0.3,
    shadowColor: COLORS.DEEP_BLUE,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: scale(12),
    elevation: 0,
  },
  avatar: {
    width: scale(64),
    height: scale(64),
    borderRadius: moderateScale(32),
    backgroundColor: COLORS.DEEP_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: moderateScale(28),
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: scale(4),
  },
  userEmail: {
    color: COLORS.TEXT_SECONDARY,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Danger Zone
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  dangerContent: {
    paddingHorizontal: platformPadding(16),
    paddingVertical: platformPadding(16),
  },
  dangerButton: {
    marginBottom: scale(12),
    borderColor: 'rgba(156, 163, 175, 0.3)',
  },
  logoutButtonText: {
    color: COLORS.TEXT_PRIMARY,
  },
  withdrawalButton: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    marginBottom: 0,
  },
  withdrawalButtonText: {
    color: '#EF4444',
  },
  withdrawConfirmContainer: {
    marginTop: scale(12),
  },
  withdrawConfirmText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: scale(12),
  },
  withdrawConfirmButtons: {
    flexDirection: 'row',
    gap: scale(12),
  },
  withdrawCancelButton: {
    flex: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
  },
  withdrawConfirmButton: {
    flex: 1,
    backgroundColor: '#EF4444',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bottom Spacing
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  bottomSpacing: {
    height: scale(40),
  },
});

export default SettingsScreen;
