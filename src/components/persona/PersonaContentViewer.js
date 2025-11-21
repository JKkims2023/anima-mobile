/**
 * PersonaContentViewer - Main content area for Persona display
 * 
 * Features:
 * - Conditional rendering: Manager AI vs Regular Persona
 * - Loading state handling
 * - Swipe support (for multiple personas - future)
 * 
 * Uses:
 * - CustomText (common component)
 * - commonstyles.js (common styles)
 * - responsive-utils.js (spacing)
 */

import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePersona } from '../../contexts/PersonaContext';
import { useTheme } from '../../contexts/ThemeContext';
import CustomText from '../CustomText';
import ManagerAIView from './ManagerAIView';
import { moderateScale, verticalScale, horizontalScale } from '../../utils/responsive-utils';
const commonstyles = require('../../styles/commonstyles');

/**
 * PersonaContentViewer Component
 */
const PersonaContentViewer = () => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { selectedPersona, isLoading } = usePersona();

  // Loading State
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator 
          size="large" 
          color={currentTheme.primaryColor} 
        />
        <CustomText 
          type="normal" 
          style={[styles.loadingText, { color: currentTheme.textSecondary }]}
        >
          {t('common.loading')}
        </CustomText>
      </View>
    );
  }

  // No Persona State (should not happen with Manager AI default)
  if (!selectedPersona) {
    return (
      <View style={[styles.container, styles.centered]}>
        <CustomText 
          type="normal" 
          style={{ color: currentTheme.textSecondary }}
        >
          {t('persona.no_persona')}
        </CustomText>
      </View>
    );
  }

  // Conditional Rendering: Manager AI vs Regular Persona
  if (selectedPersona.isManager) {
    return <ManagerAIView persona={selectedPersona} />;
  }

  // Regular Persona View (TODO: implement later)
  return (
    <View style={[styles.container, styles.centered,]}>
      <CustomText 
        type="big" 
        bold
        style={{ color: currentTheme.textColor }}
      >
        {selectedPersona.persona_name}
      </CustomText>
      <CustomText 
        type="normal" 
        style={[styles.subtitleText, { color: currentTheme.textSecondary }]}
      >
        {t('persona.regular_persona_coming_soon')}
      </CustomText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: verticalScale(12),
  },
  subtitleText: {
    marginTop: verticalScale(8),
  },
});

export default PersonaContentViewer;

