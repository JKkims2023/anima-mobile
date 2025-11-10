import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import CustomText from '../components/CustomText';
import CustomButton from '../components/CustomButton';
import { useTheme, THEMES } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';

/**
 * SettingsScreen - Settings page with theme, language, and user info
 */
const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const { currentTheme, theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, loading: userLoading, logout } = useUser();
  
  const [logoutLoading, setLogoutLoading] = useState(false);
  
  // Change language
  const changeLanguage = () => {
    const newLanguage = i18n.language === 'ko' ? 'en' : 'ko';
    i18n.changeLanguage(newLanguage);
  };
  
  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      t('settings.account.logout_confirm_title'),
      t('settings.account.logout_confirm_message'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            setLogoutLoading(true);
            try {
              await logout();
              Alert.alert(
                t('common.success'),
                t('settings.account.logout_success')
              );
            } catch (error) {
              console.error('[SettingsScreen] Logout error:', error);
              Alert.alert(
                t('error.title'),
                error.message || t('error.generic_message')
              );
            } finally {
              setLogoutLoading(false);
            }
          },
        },
      ]
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Title */}
        <CustomText 
          type="big" 
          bold
          style={{ color: currentTheme.textColor, marginBottom: 40 }}
        >
          {t('navigation.settings')}
        </CustomText>
        
        {/* User Info Section */}
        <View style={styles.section}>
          <CustomText 
            type="title" 
            bold
            style={{ color: currentTheme.textColor, marginBottom: 16 }}
          >
            {t('settings.account.title')}
          </CustomText>
          
          {userLoading ? (
            <CustomText 
              type="normal"
              style={{ color: currentTheme.textMiddleColor }}
            >
              {t('common.loading')}...
            </CustomText>
          ) : isAuthenticated && user ? (
            <>
              <View style={styles.userInfoItem}>
                <CustomText 
                  type="small"
                  style={{ color: currentTheme.textMiddleColor }}
                >
                  {t('settings.account.user_id')}:
                </CustomText>
                <CustomText 
                  type="normal"
                  bold
                  style={{ color: currentTheme.textColor, marginTop: 4 }}
                >
                  {user.user_id}
                </CustomText>
              </View>
              
              <View style={styles.userInfoItem}>
                <CustomText 
                  type="small"
                  style={{ color: currentTheme.textMiddleColor }}
                >
                  {t('settings.account.email')}:
                </CustomText>
                <CustomText 
                  type="normal"
                  style={{ color: currentTheme.textColor, marginTop: 4 }}
                >
                  {user.user_email}
                </CustomText>
              </View>
              
              <View style={styles.userInfoItem}>
                <CustomText 
                  type="small"
                  style={{ color: currentTheme.textMiddleColor }}
                >
                  {t('settings.account.points')}:
                </CustomText>
                <CustomText 
                  type="normal"
                  bold
                  style={{ color: currentTheme.mainColor, marginTop: 4 }}
                >
                  {user.user_point || 0} P
                </CustomText>
              </View>
              
              <CustomButton
                title={t('settings.account.logout')}
                onPress={handleLogout}
                loading={logoutLoading}
                disabled={logoutLoading}
                type="outline"
                style={{ marginTop: 16 }}
              />
            </>
          ) : (
            <CustomText 
              type="normal"
              style={{ color: currentTheme.textMiddleColor }}
            >
              {t('settings.account.not_logged_in')}
            </CustomText>
          )}
        </View>
        
        {/* Theme Section */}
        <View style={styles.section}>
          <CustomText 
            type="title" 
            bold
            style={{ color: currentTheme.textColor, marginBottom: 16 }}
          >
            {t('common.settings')} - {t('settings.theme.title')}
          </CustomText>
          
          <CustomText 
            type="normal"
            style={{ color: currentTheme.textMiddleColor, marginBottom: 16 }}
          >
            {t('settings.theme.current')}: {theme === THEMES.DARK ? t('settings.theme.dark') : t('settings.theme.light')}
          </CustomText>
          
          <CustomButton
            title={`${t('settings.theme.toggle')} (${theme === THEMES.DARK ? 'Dark → White' : 'White → Dark'})`}
            onPress={toggleTheme}
            type="primary"
          />
        </View>
        
        {/* Language Section */}
        <View style={styles.section}>
          <CustomText 
            type="title" 
            bold
            style={{ color: currentTheme.textColor, marginBottom: 16 }}
          >
            {t('common.settings')} - {t('settings.language.title')}
          </CustomText>
          
          <CustomText 
            type="normal"
            style={{ color: currentTheme.textMiddleColor, marginBottom: 16 }}
          >
            {t('settings.language.current')}: {i18n.language === 'ko' ? '한국어' : 'English'}
          </CustomText>
          
          <CustomButton
            title={`${t('settings.language.change')} (${i18n.language === 'ko' ? '한국어 → English' : 'English → 한국어'})`}
            onPress={changeLanguage}
            type="outline"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  userInfoItem: {
    marginBottom: 16,
  },
});

export default SettingsScreen;

