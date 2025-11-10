import React, { useState, useEffect } from 'react';
import { TextInput, Platform, StyleSheet, Keyboard, View } from 'react-native';
import i18n from '../i18n/i18n.config';

const commonstyles = require('../styles/commonstyles');

/**
 * Custom component for platform-independent consistent text input
 * 
 * @param {Object} props - Component properties
 * @param {string} props.style - Input field style
 * @param {boolean} props.bold - Whether text is bold
 * @param {boolean} props.multiline - Whether multiple lines input
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.placeholderTextColor - Placeholder text color
 * @returns {JSX.Element} - Custom text input component
 */
const CustomTextInput = (props) => {
  const { 
    style, 
    bold, 
    onBlur, 
    multiline, 
    value,
    placeholder,
    placeholderTextColor,
    onFocus,
    ...restProps 
  } = props;
  
  // Manage focus state
  const [isFocused, setIsFocused] = useState(false);
  
  // Set selection prop for consistent handling of overflow text
  // On Android, show the end part when text is long, but set to show the start part like iOS
  const selectionProp = Platform.OS === 'android' && !isFocused && value && value.length > 0
    ? { selection: { start: 0, end: 0 } }
    : {};
  
  // Select font family based on current language
  const fontFamily = i18n.language === 'ko' 
    ? (bold ? commonstyles.fontSizeInfo.fontFamilyBold : commonstyles.fontSizeInfo.fontFamily)
    : (bold ? commonstyles.fontSizeInfo_Us.fontFamilyBold : commonstyles.fontSizeInfo_Us.fontFamily);
  
  // Default text input style
  const defaultStyle = {
    fontFamily,
    fontSize: commonstyles.fontSizeInfo.textNormal, // Default font size
    color: commonstyles.whiteTheme.textColor, // Default text color
    padding: 0, // Set default padding to 0 for consistent padding
    ...Platform.select({
      android: {
        includeFontPadding: false, // Remove font padding on Android
        textAlignVertical: multiline ? 'top' : 'center', // Vertical text alignment on Android
        paddingVertical: 0, // Remove default padding on Android
      },
      ios: {
        // Adjust padding for effect similar to textAlignVertical: 'top' on iOS for multiline
        ...(multiline ? { paddingTop: 8 } : {}),
      }
    }),
  };
  
  // Additional settings for style consistency between Android and iOS
  const platformStyles = Platform.OS === 'android' ? {
    // Adjust Android-specific styles
    height: (props.multiline ? undefined : 40), // Set height for single line input field
  } : {};
  
  // Consistency of placeholder color - set default value
  const defaultPlaceholderColor = '#C7C7CD'; // iOS default placeholder color
  
  // onFocus handler - update state when gaining focus
  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };
  
  // onBlur handler - close keyboard and update state when losing focus
  const handleBlur = (e) => {
    setIsFocused(false);
    Keyboard.dismiss(); // Close keyboard
    if (onBlur) onBlur(e); // Call existing onBlur handler if present
  };
  
  // Change only border color based on focus state
  const focusedStyle = isFocused ? {
    borderColor: commonstyles.whiteTheme.mainColor,
  } : {};
  
  // If multiline, wrap TextInput with View to apply border styling
  if (multiline) {
    return (
      <View style={[styles.inputContainer, style, focusedStyle]}>
        <TextInput 
          {...restProps} 
          value={value}
          multiline={true}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor || defaultPlaceholderColor}
          allowFontScaling={false} // Not affected by system font size settings
          maxFontSizeMultiplier={1} // Limit maximum font size multiplier
          style={[defaultStyle, platformStyles]}
          onBlur={handleBlur} // Close keyboard when losing focus
          onFocus={handleFocus} // Update state when gaining focus
          underlineColorAndroid="transparent" // Remove default underline on Android
          {...selectionProp} // Apply selection prop for overflow handling
        />
      </View>
    );
  }
  
  // Order of overwriting is important: defaultStyle -> platformStyles -> style -> focusedStyle
  return (
    <TextInput 
      {...restProps}
      value={value}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor || defaultPlaceholderColor}
      allowFontScaling={false} // Not affected by system font size settings
      maxFontSizeMultiplier={1} // Limit maximum font size multiplier
      style={[defaultStyle, platformStyles, style, focusedStyle]}
      onBlur={handleBlur} // Close keyboard when losing focus
      onFocus={handleFocus} // Update state when gaining focus
      underlineColorAndroid="transparent" // Remove default underline on Android
      {...selectionProp} // Apply selection prop for overflow handling
    />
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    // Container style for multiline TextInput
    overflow: 'hidden',
  },
});

export default CustomTextInput;


