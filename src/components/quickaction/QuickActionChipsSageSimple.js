/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎯 QuickActionChipsSageSimple Component (TEST VERSION)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Simplified version without complex animations for debugging
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-11-22
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, verticalScale } from '../../utils/responsive-utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HapticService from '../../utils/HapticService';

const QuickActionChipsSageSimple = ({
  onSettingsClick,
  onNotificationClick,
}) => {
  const insets = useSafeAreaInsets();
  
  const actions = [
    { id: 'settings', icon: 'cog', label: '설정', onClick: onSettingsClick },
    { id: 'notification', icon: 'bell', label: '알림', onClick: onNotificationClick },
  ];
  
  const handlePress = (action) => {
    HapticService.medium();
    action.onClick();
  };
  
  return (
    <View style={[styles.container, { top: insets.top + verticalScale(20) }]}>
      {actions.map((action) => (
        <View key={action.id} style={styles.chipWrapper}>
          <TouchableOpacity
            style={styles.chip}
            onPress={() => handlePress(action)}
            activeOpacity={0.7}
          >
            <Icon name={action.icon} size={scale(24)} color="#FFFFFF" />
            <Text style={styles.label}>{action.label}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: scale(16),
    zIndex: 1000,
    gap: verticalScale(12),
  },
  chipWrapper: {
    alignItems: 'flex-end',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    borderRadius: scale(24),
    gap: scale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  label: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: '600',
  },
});

export default QuickActionChipsSageSimple;

