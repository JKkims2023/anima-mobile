import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import CustomText from '../components/CustomText';
import SafeScreen from '../components/SafeScreen';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import AuthSection from '../components/auth/AuthSection';

/**
 * SettingsScreen - ANIMA Settings & Authentication
 * 
 * Features:
 * - Full-screen login when not authenticated
 * - User profile + settings when authenticated
 * - Deep Blue theme (fixed)
 * - No theme/language toggle (removed)
 */
const SettingsScreen = () => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { user, isAuthenticated, loading: userLoading } = useUser();
  
  // ✅ Log user state changes
  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚙️  [SettingsScreen] User state changed');
    console.log('📊 [SettingsScreen] isAuthenticated:', isAuthenticated);
    console.log('📊 [SettingsScreen] loading:', userLoading);
    console.log('📊 [SettingsScreen] user:', user ? user.user_id : 'null');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }, [user, isAuthenticated, userLoading]);
  
  // ✅ If NOT authenticated, show FULL-SCREEN login (no SafeScreen wrapper)
  if (!isAuthenticated && !userLoading) {
    return <AuthSection />;
  }
  
  // ✅ If authenticated (or loading), show settings page with SafeScreen
  return (
    <SafeScreen
      backgroundColor={currentTheme.backgroundColor}
      statusBarStyle={currentTheme.statusBarStyle || 'light-content'}
      edges={{ top: true, bottom: false }}
      keyboardAware={false}
    >
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <CustomText 
          type="big" 
          bold
          style={{ color: currentTheme.textColor, marginBottom: 40 }}
        >
          {t('navigation.settings')}
        </CustomText>
        
        {userLoading ? (
          <CustomText 
            type="normal"
            style={{ color: currentTheme.textMiddleColor }}
          >
            {t('common.loading')}...
          </CustomText>
        ) : (
          <>
            {/* ✨ User Profile Section */}
            <AuthSection />
            
            {/* TODO: Add more settings here in future */}
            {/* - Notifications */}
            {/* - Privacy */}
            {/* - About */}
          </>
        )}
      </ScrollView>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40, // Extra bottom padding for scroll
  },
});

export default SettingsScreen;

