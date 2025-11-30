/**
 * 🎯 SettingsItem - Individual Settings Row Item
 * 
 * Features:
 * - Icon on left
 * - Text (title + optional description)
 * - Right component (arrow, toggle, etc.)
 * - Press animation
 * - Theme-aware colors
 * 
 * Props:
 * - icon: string (emoji or icon name)
 * - title: string (required)
 * - description: string (optional)
 * - onPress: Function (optional)
 * - rightComponent: ReactNode (optional, default: arrow)
 * - showBorder: boolean (default: true)
 * - disabled: boolean (default: false)
 */

import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from './CustomText';
import { scale, moderateScale, platformPadding } from '../utils/responsive-utils';
import { COLORS } from '../styles/commonstyles';

const SettingsItem = ({
  icon,
  title,
  description,
  onPress,
  rightComponent,
  showBorder = true,
  disabled = false,
}) => {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.container,
        showBorder && styles.containerWithBorder,
        disabled && styles.containerDisabled,
      ]}
    >
      {/* Left: Icon */}
      {icon && (
        <View style={styles.iconContainer}>
          {icon.length <= 2 ? (
            // Emoji
            <CustomText type="big" style={styles.emoji}>
              {icon}
            </CustomText>
          ) : (
            // Icon name
            <Icon name={icon} size={moderateScale(24)} color={COLORS.DEEP_BLUE} />
          )}
        </View>
      )}

      {/* Center: Text */}
      <View style={styles.textContainer}>
        <CustomText type="normal" bold style={styles.title}>
          {title}
        </CustomText>
        {description && (
          <CustomText type="small" style={styles.description}>
            {description}
          </CustomText>
        )}
      </View>

      {/* Right: Component or Arrow */}
      <View style={styles.rightContainer}>
        {rightComponent || (
          onPress && (
            <Icon
              name="chevron-right"
              size={moderateScale(24)}
              color="rgba(255, 255, 255, 0.3)"
            />
          )
        )}
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: platformPadding(16),
    paddingVertical: platformPadding(12),
    minHeight: scale(60),
  },
  containerWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  containerDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  emoji: {
    fontSize: moderateScale(24),
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: scale(2),
  },
  description: {
    color: COLORS.TEXT_SECONDARY,
    marginTop: scale(2),
  },
  rightContainer: {
    marginLeft: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SettingsItem;

