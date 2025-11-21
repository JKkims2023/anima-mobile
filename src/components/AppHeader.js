/**
 * AppHeader Component
 * 
 * Features:
 * - ANIMA branding
 * - Settings icon
 * - Safe Area aware (status bar)
 * 
 * @author JK & Hero AI
 * @date 2024-11-21
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { moderateScale } from '../utils/responsive-utils';
import { useTheme } from '../contexts/ThemeContext';

const AppHeader = ({ onSettingsPress }) => {
  const { currentTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      {/* Logo/Title */}
      <Text style={[styles.title, { color: currentTheme.primaryColor || '#3B82F6' }]}>
        ANIMA - Soul Connect 💫
      </Text>

      {/* Settings Icon */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onSettingsPress}
        activeOpacity={0.7}
      >
        <Icon name="settings" size={moderateScale(24)} color={currentTheme.textColor} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
  },
  iconButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppHeader;

