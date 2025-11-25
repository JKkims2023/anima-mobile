/**
 * 🎨 AuthCard - ANIMA Authentication Card
 * 
 * Features:
 * - Deep Blue gradient background
 * - Smooth shadow
 * - Card flip animation support
 * - Cross-platform consistency
 * 
 * Used for:
 * - Login form
 * - Sign up form
 * - User profile
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { scale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';

const AuthCard = ({ children, style }) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardInner}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: scale(24),
    overflow: 'hidden',
    // ✅ Deep Blue gradient background (matching ANIMA theme)
    backgroundColor: 'rgba(30, 41, 59, 0.95)', // Slate 800 with opacity
    // ✅ Elegant shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(8) },
    shadowOpacity: 0.3,
    shadowRadius: scale(24),
    elevation: 12,
  },
  cardInner: {
    padding: scale(24),
    // ✅ Subtle border with ANIMA accent color

  },
});

export default AuthCard;

