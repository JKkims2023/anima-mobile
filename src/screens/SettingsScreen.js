import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import CustomText from '../components/CustomText';
import CustomButton from '../components/CustomButton';
import { useTheme, THEMES } from '../contexts/ThemeContext';

/**
 * SettingsScreen - Settings page with theme and language test buttons
 */
const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const { currentTheme, theme, toggleTheme } = useTheme();
  
  // Change language
  const changeLanguage = () => {
    const newLanguage = i18n.language === 'ko' ? 'en' : 'ko';
    i18n.changeLanguage(newLanguage);
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
});

export default SettingsScreen;

