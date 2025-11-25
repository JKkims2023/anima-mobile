import React from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Platform,
  View,
  Pressable
} from 'react-native';
import { moderateScale, getShadowStyle, platformPadding, platformMargin } from '../utils/responsive-utils';
import CustomText from './CustomText';
const commonstyles = require('../styles/commonstyles');

/**
 * Custom component for platform-independent consistent button UI
 * 
 * @param {Object} props - Component properties
 * @param {string} props.title - Button text
 * @param {Function} props.onPress - Button click event handler
 * @param {Object} props.style - Button style
 * @param {Object} props.textStyle - Button text style
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {boolean} props.loading - Loading state
 * @param {string} props.type - Button type ('primary', 'secondary', etc.)
 * @param {Component} props.leftIcon - Icon to display on the left of button
 * @param {Component} props.rightIcon - Icon to display on the right of button
 * @returns {JSX.Element} - Custom button component
 */
const CustomButton = (props) => {
  const { 
    title, 
    onPress, 
    style, 
    textStyle, 
    disabled = false, 
    loading = false,
    type = 'primary', 
    leftIcon,
    rightIcon,
    textType = 'normal', // Default text type
    ...restProps 
  } = props;
  
  // Set style based on button type
  let buttonTypeStyle = {};
  let textTypeStyle = {};
  
  switch (type) {
    case 'primary':
      buttonTypeStyle = styles.primaryButton;
      textTypeStyle = styles.primaryButtonText;
      break;
    case 'secondary':
      buttonTypeStyle = styles.secondaryButton;
      textTypeStyle = styles.secondaryButtonText;
      break;
    case 'outline':
      buttonTypeStyle = styles.outlineButton;
      textTypeStyle = styles.outlineButtonText;
      break;
    case 'text':
      buttonTypeStyle = styles.textButton;
      textTypeStyle = styles.textButtonText;
      break;
    default:
      buttonTypeStyle = styles.primaryButton;
      textTypeStyle = styles.primaryButtonText;
  }
  
  // Disabled style
  const disabledStyle = disabled ? styles.disabledButton : {};
  const disabledTextStyle = disabled ? styles.disabledButtonText : {};
  
  // Render button content
  const renderButtonContent = (buttonState = {}) => {
    // buttonState includes pressed state provided by Pressable component
    const { pressed } = buttonState;
    const opacityStyle = pressed ? { opacity: 0.85 } : {};
    
    return (
      <View style={[
        styles.contentContainer, 
        opacityStyle,
      ]}>
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={type === 'primary' ? '#ffffff' : commonstyles.whiteTheme.mainColor} 
          />
        ) : (
          <>
            {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
            <CustomText 
              type={textType}
//              bold 
              style={[textTypeStyle, disabledTextStyle, textStyle, { fontSize: moderateScale(18) }]}
            >
              {title}
            </CustomText>
            {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
          </>
        )}
      </View>
    );
  };
  
  // Render optimized button for platform
  if (Platform.OS === 'android') {
    // On Android, use Pressable for more natural feedback
    return (
      <Pressable
        android_ripple={disabled ? null : { color: '#00000020', borderless: false }}
        onPress={onPress}
        disabled={disabled || loading}
        style={({pressed}) => [
          styles.button, 
          buttonTypeStyle, 
          disabledStyle, 
          style,
          pressed && styles.buttonPressed
        ]}
        {...restProps}
      >
        {renderButtonContent}
      </Pressable>
    );
  }
  
  // On iOS, use TouchableOpacity
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, buttonTypeStyle, disabledStyle, style]}
      {...restProps}
    >
      {renderButtonContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: moderateScale(50),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    ...getShadowStyle(2),
    paddingHorizontal: platformPadding(20),  // Platform-aware padding
    overflow: 'hidden', // Limit ripple effect to inside button on Android
  },
  buttonPressed: {
    // Style for button press effect on Android
    backgroundColor: Platform.OS === 'android' ? '#00000010' : undefined,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Primary button
  primaryButton: {
    backgroundColor: commonstyles.whiteTheme.mainColor,
  },
  primaryButtonText: {
    color: 'white',
  },
  // Secondary button
  secondaryButton: {
    backgroundColor: '#e9ecef',
  },
  secondaryButtonText: {
    color: commonstyles.whiteTheme.textColor,
  },
  // Outline button
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: commonstyles.whiteTheme.mainColor,
  },
  outlineButtonText: {
    color: commonstyles.whiteTheme.mainColor,
  },
  // Text button (Text only)
  textButton: {
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    elevation: 0,
    height: moderateScale(40),
  },
  textButtonText: {
    color: commonstyles.whiteTheme.mainColor,
  },
  // Disabled style
  disabledButton: {
    backgroundColor: '#ced4da',
    borderColor: '#ced4da',
  },
  disabledButtonText: {
    color: '#868e96',
  },
  // Icon styling (platform-aware margins)
  iconLeft: {
    marginRight: platformMargin(8),
  },
  iconRight: {
    marginLeft: platformMargin(8),
  },
});

export default CustomButton;


