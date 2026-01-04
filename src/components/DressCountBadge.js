/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🦄 DressCountBadge Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Dress count badge (Static - chip rotates, not badge!)
 * 
 * Features:
 * - Shows dress count number
 * - Badge is fixed (no rotation)
 * - Chip itself will rotate when dress is being created
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-04
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomText from './CustomText';
import { scale } from '../utils/responsive-utils';
import { COLORS } from '../styles/commonstyles';

// ⭐ Static badge - Chip rotates instead!
const DressCountBadge = ({ count = 0 }) => {
  // Don't render if count is 0
  if (count === 0) return null;

  return (
    <View style={styles.badgeContainer}>
      <CustomText style={styles.badgeText}>{count}</CustomText>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'absolute',
    top: -scale(5),
    right: -scale(5),
    backgroundColor: '#A78BFA', // 🦄 라벤더 (드레스 테마 컬러)
    borderRadius: scale(10),
    minWidth: scale(20),
    height: scale(20),
    paddingHorizontal: scale(4),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.WHITE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: scale(11),
    fontWeight: 'bold',
    lineHeight: scale(13),
  },
});

export default React.memo(DressCountBadge);

