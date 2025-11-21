import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import SafeScreen from '../components/SafeScreen';
import AppHeader from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';
import { PersonaProvider } from '../contexts/PersonaContext';
import { ChatProvider } from '../contexts/ChatContext';
import PersonaContentViewer from '../components/persona/PersonaContentViewer';
import { moderateScale, verticalScale } from '../utils/responsive-utils';

/**
 * HomeScreen - Main entry point with Manager AI
 * 
 * Layout:
 * - Top: Persona selection chips area (reserved space)
 * - Main: Persona content viewer (Manager AI / Persona)
 */
const HomeScreen = () => {
  const { currentTheme } = useTheme();
  
  const handleSettingsPress = () => {
    // TODO: Open settings modal/sheet
    console.log('Settings pressed');
  };
  
  return (
    <PersonaProvider>
      <ChatProvider>
        <SafeScreen 
          backgroundColor={currentTheme.backgroundColor}
          statusBarStyle={currentTheme.statusBarStyle || 'light-content'}
          edges={{ top: true, bottom: false }}
          keyboardAware={false}
        >
          {/* Header */}
          <AppHeader onSettingsPress={handleSettingsPress} />
          
          <View style={styles.container}>
            {/* Persona Content Viewer (Full Screen) */}
            <View style={styles.contentArea}>
              <PersonaContentViewer />
            </View>
          </View>
        </SafeScreen>
      </ChatProvider>
    </PersonaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
  },
});

export default HomeScreen;

