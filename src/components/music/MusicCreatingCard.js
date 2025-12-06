/**
 * ⏳ MusicCreatingCard Component
 * 
 * Shows music generation progress
 * Displays progress bar and percentage
 * 
 * @author JK & Hero Nexus AI
 */

import React, { memo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Progress from 'react-native-progress';
import CustomText from '../CustomText';
import { useTheme } from '../../contexts/ThemeContext';
import { scale, verticalScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';

const CARD_HEIGHT = verticalScale(180);

/**
 * MusicCreatingCard Component
 */
const MusicCreatingCard = memo(({ progress = 0, estimatedTime = 30 }) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();

  // Calculate remaining time
  const remainingTime = Math.max(0, Math.ceil(estimatedTime * (1 - progress / 100)));

  return (
    <View style={[styles.container, { height: CARD_HEIGHT }]}>
      {/* Background Glow */}
      <View style={styles.glowLayer} />

      {/* Content */}
      <View style={styles.content}>
        {/* Loading Spinner */}
        <ActivityIndicator
          size="large"
          color={currentTheme.mainColor || COLORS.MAIN_COLOR}
          style={styles.spinner}
        />

        {/* Title */}
        <CustomText type="big" bold style={styles.title}>
          {t('music.creating_title')}
        </CustomText>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Progress.Bar
            progress={progress / 100}
            width={scale(280)}
            height={scale(8)}
            color={currentTheme.mainColor || COLORS.MAIN_COLOR}
            unfilledColor="rgba(62, 80, 180, 0.2)"
            borderWidth={0}
            borderRadius={scale(4)}
          />
        </View>

        {/* Progress Text */}
        <CustomText type="normal" style={styles.progressText}>
          {progress}% {t('common.complete')}
        </CustomText>

        {/* Subtitle */}
        <CustomText type="small" style={styles.subtitle}>
          {t('music.creating_subtitle')} ({remainingTime}s)
        </CustomText>
      </View>
    </View>
  );
});

MusicCreatingCard.displayName = 'MusicCreatingCard';

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
  spinner: {
    marginBottom: scale(16),
  },
  title: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: scale(20),
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: scale(12),
  },
  progressText: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: scale(8),
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
});

export default MusicCreatingCard;

