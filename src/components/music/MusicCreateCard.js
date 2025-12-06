/**
 * 🎵 MusicCreateCard Component
 * 
 * Initial state card for music creation
 * Shows when no music is being created and no music is selected
 * 
 * @author JK & Hero Nexus AI
 */

import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from '../CustomText';
import { useTheme } from '../../contexts/ThemeContext';
import { scale, verticalScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';

const CARD_HEIGHT = verticalScale(180);

/**
 * MusicCreateCard Component
 */
const MusicCreateCard = memo(({ onPress, disabled = false }) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();

  const handlePress = () => {
    if (disabled) return;
    HapticService.light();
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={[styles.container, { height: CARD_HEIGHT }]}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      {/* Background Glow */}
      <View style={styles.glowLayer} />

      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Icon
            name="music-note-plus"
            size={scale(48)}
            color={currentTheme.mainColor || COLORS.MAIN_COLOR}
          />
        </View>

        {/* Title */}
        <CustomText type="big" bold style={styles.title}>
          {t('music.title')}
        </CustomText>

        {/* Subtitle */}
        <CustomText type="normal" style={styles.subtitle}>
          {t('music.subtitle')}
        </CustomText>

        {/* Button */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: currentTheme.mainColor || COLORS.MAIN_COLOR }
          ]}
          onPress={handlePress}
          activeOpacity={0.8}
          disabled={disabled}
        >
          <Icon name="sparkles" size={scale(20)} color="#FFFFFF" />
          <CustomText type="normal" bold style={styles.buttonText}>
            {t('music.create_button')}
          </CustomText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

MusicCreateCard.displayName = 'MusicCreateCard';

const styles = StyleSheet.create({
  container: {
    marginHorizontal: scale(16),
    marginVertical: scale(12),
    borderRadius: scale(20),
    overflow: 'hidden',
    position: 'relative',
  },
  glowLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(62, 80, 180, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(62, 80, 180, 0.3)',
    borderRadius: scale(20),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(24),
    paddingVertical: scale(20),
  },
  iconContainer: {
    marginBottom: scale(12),
  },
  title: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: scale(8),
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.TEXT_SECONDARY,
    marginBottom: scale(20),
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(24),
    paddingVertical: scale(12),
    borderRadius: scale(12),
    gap: scale(8),
  },
  buttonText: {
    color: '#FFFFFF',
  },
});

export default MusicCreateCard;

