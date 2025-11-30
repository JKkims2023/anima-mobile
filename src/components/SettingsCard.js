/**
 * 🎴 SettingsCard - Card Container for Settings Sections
 * 
 * Features:
 * - Neon Glow border effect
 * - Theme-aware colors
 * - Optional title
 * - Smooth shadow
 * 
 * Props:
 * - title: string (optional)
 * - children: ReactNode
 * - style: ViewStyle (optional)
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomText from './CustomText';
import { scale, moderateScale, platformPadding } from '../utils/responsive-utils';
import { COLORS } from '../styles/commonstyles';

const SettingsCard = ({ title, children, style }) => {
  return (
    <View style={[styles.container, style]}>
      {/* Glow Layer */}
      <View style={styles.glowLayer} />

      {/* Card Content */}
      <View style={styles.card}>
        {title && (
          <View style={styles.titleContainer}>
            <CustomText type="title" bold style={styles.titleText}>
              {title}
            </CustomText>
          </View>
        )}
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: scale(16),
    position: 'relative',
  },
  glowLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: COLORS.DEEP_BLUE,
    shadowColor: COLORS.DEEP_BLUE,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
    elevation: 0,
    opacity: 0.5,
  },
  card: {
    backgroundColor: 'rgba(30, 30, 46, 0.8)',
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(62, 80, 180, 0.3)',
    overflow: 'hidden',
  },
  titleContainer: {
    paddingHorizontal: platformPadding(16),
    paddingTop: platformPadding(16),
    paddingBottom: platformPadding(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  titleText: {
    color: COLORS.TEXT_PRIMARY,
  },
  content: {
    // No padding here - let children control their own padding
  },
});

export default SettingsCard;

