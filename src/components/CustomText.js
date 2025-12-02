import React from 'react';
import { Text, Platform, StyleSheet } from 'react-native';
import i18n from '../i18n/i18n.config';

const commonstyles = require('../styles/commonstyles');
import { fontSettings } from '../utils/responsive-utils';

/**
 * Custom component for platform-independent consistent text display
 * 
 * @param {Object} props - Component properties
 * @param {string} props.style - Text style
 * @param {boolean} props.bold - Whether text is bold
 * @param {string} props.type - Text size type ('normal', 'small', 'large', etc.)
 * @param {string} props.numberOfLines - Maximum number of lines to display
 * @param {string} props.ellipsizeMode - Text overflow handling method
 * @returns {JSX.Element} - Custom text component
 */
const CustomText = (props) => {
  const { 
    children, 
    style, 
    bold, 
    type = 'normal', // Default is normal
    numberOfLines,
    ellipsizeMode = 'tail', // Default is 'tail' (ellipsis at the end)
    ...restProps 
  } = props;
  
  // Select font family based on current language
  const fontFamily = i18n.language === 'ko' 
    ? (bold ? commonstyles.fontSizeInfo.fontFamilyBold : commonstyles.fontSizeInfo.fontFamily)
    : (bold ? commonstyles.fontSizeInfo_Us.fontFamilyBold : commonstyles.fontSizeInfo_Us.fontFamily);
  
  // Get text style for the type
  const textTypeStyle = commonstyles.textStyles[type] || commonstyles.textStyles.normal;
  
  // Default text style
  const defaultStyle = {
    ...commonstyles.textStyles.base,
    ...textTypeStyle,
    fontFamily,
    color: commonstyles.darkTheme.textColor, // Default text color
    // Redefine fontWeight if bold is true
    ...(bold && { fontWeight: '700' }),
  };
  
  // Set default properties for text overflow handling
  const ellipsizeProps = numberOfLines ? {
    numberOfLines: numberOfLines,
    ellipsizeMode: ellipsizeMode, // Choose from 'head', 'middle', 'tail', 'clip'
  } : {};
  
  return (
    <Text 
      {...restProps} 
      allowFontScaling={false} // Not affected by system font size settings
      maxFontSizeMultiplier={1} // Limit maximum font size multiplier
      style={[defaultStyle, style]}
      {...ellipsizeProps}
    >
      {children}
    </Text>
  );
};

export default CustomText;


