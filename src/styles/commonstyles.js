import { StyleSheet, Platform } from 'react-native';
import { moderateScale, adaptiveFontSize } from '../utils/responsive-utils';

// Android font rendering adjustment for consistency with iOS
const ANDROID_FONT_ADJUSTMENT = 1;

// Font size calculation function (platform consistency)
const getFontSize = (size) => {
  if (Platform.OS === 'android') {
    return adaptiveFontSize(size * ANDROID_FONT_ADJUSTMENT);
  }
  return adaptiveFontSize(size);
};

// Font sizes (YouTube app style standard)
const FONT_SIZES = {
  veryBig: 32,    // Very large title (e.g., special event header)
  big: 24,        // Large title (e.g., video title, main header)
  title: 18,      // Normal title (e.g., section title)
  middle: 16,     // Medium size (e.g., channel name, category name)
  normal: 14,     // Default text (e.g., description, comment)
  small: 12,      // Small text (e.g., meta info, view count, date)
  verySmall: 10,  // Very small text (e.g., copyright info, legal notice)
};

// Text-related common styles
const textStyles = {
  // Base text style (applied to all text components)
  base: {
    allowFontScaling: false,   // Not affected by system font size settings
    includeFontPadding: false, // Remove additional padding on Android
    textAlignVertical: 'center',
    letterSpacing: 0.3,        // Letter spacing for readability
  },
  
  // Font size-specific styles
  veryBig: {
    fontSize: getFontSize(FONT_SIZES.veryBig),
    lineHeight: getFontSize(FONT_SIZES.veryBig * 1.3),
    fontWeight: '800',
  },
  big: {
    fontSize: getFontSize(FONT_SIZES.big),
    lineHeight: getFontSize(FONT_SIZES.big * 1.3),
    fontWeight: '700',
  },
  title: {
    fontSize: getFontSize(FONT_SIZES.title),
    lineHeight: getFontSize(FONT_SIZES.title * 1.3),
    fontWeight: '600',
  },
  middle: {
    fontSize: getFontSize(FONT_SIZES.middle),
    lineHeight: getFontSize(FONT_SIZES.middle * 1.35),
    fontWeight: '500',
  },
  normal: {
    fontSize: getFontSize(FONT_SIZES.normal),
    lineHeight: getFontSize(FONT_SIZES.normal * 1.35),
    fontWeight: '400',
  },
  small: {
    fontSize: getFontSize(FONT_SIZES.small),
    lineHeight: getFontSize(FONT_SIZES.small * 1.4),
    fontWeight: '400',
  },
  verySmall: {
    fontSize: getFontSize(FONT_SIZES.verySmall),
    lineHeight: getFontSize(FONT_SIZES.verySmall * 1.4),
    fontWeight: '400',
  },
};

module.exports = StyleSheet.create({
  overall: {
    flex: 1,
    backgroundColor: '#0F172A', // Dark theme primary background (Slate 900)
  },

  // Text styles
  textStyles: textStyles,
  
  // Common font style
  font_normal: {
    fontSize: getFontSize(14),
    allowFontScaling: false,
  },
  
  // Dark Theme (Deep Blue) - DEFAULT THEME 🌙
  darkTheme: {
    // Primary - Bright Blue
    mainColor: '#60A5FA',            // Blue 400 (Primary)
    mainColorLight: '#93C5FD',       // Blue 300
    mainColorDark: '#3B82F6',        // Blue 500
    
    // Secondary - Light Gray
    secondaryColor: '#94A3B8',       // Slate 400
    secondaryColorLight: '#CBD5E1',  // Slate 300
    secondaryColorDark: '#64748B',   // Slate 500
    
    // Accent - Bright Amber
    accentColor: '#FBBF24',          // Amber 400
    accentColorLight: '#FCD34D',     // Amber 300
    accentColorDark: '#F59E0B',      // Amber 500
    
    // Background
    backgroundColor: '#0F172A',      // Slate 900 (Primary BG)
    bgSecondary: '#1E293B',          // Slate 800
    bgTertiary: '#334155',           // Slate 700
    bgElevated: '#1E293B',           // Slate 800
    
    modalBackgroundColor: '#1E293B', // Slate 800
    menuMainBackColor: '#0F172A',    // Slate 900
    menuMainContentBackColor: '#0F172A', // Slate 900
    topHeaderBackColor: '#0F172A',   // Slate 900
    bottomTabColor: '#0F172A',       // Slate 900
    chatroomColor: '#1E293B',        // Slate 800
    
    // Border
    borderPrimary: '#475569',        // Slate 600 (30% lighter)
    borderSecondary: '#334155',      // Slate 700 (20% lighter)
    borderSubtle: '#1E293B',         // Slate 800 (10% lighter)
    borderViewColor: '#334155',      // Slate 700
    borderColor: '#475569',          // Slate 600
    borderViewInsideColor: '#1E293B', // Slate 800
    borderViewLineColor: '#334155',  // Slate 700
    rbBorderColor: '#334155',        // Slate 700
    
    // Text
    textPrimary: '#F8FAFC',          // Slate 50 (Contrast 16.2:1)
    textSecondary: '#CBD5E1',        // Slate 300 (Contrast 7.8:1)
    textTertiary: '#94A3B8',         // Slate 400 (Contrast 4.1:1)
    textColor: '#F8FAFC',            // Slate 50
    mainTextColor: '#F8FAFC',        // Slate 50
    headerTopTitleColor: '#F8FAFC',  // Slate 50
    textMiddleColor: '#94A3B8',      // Slate 400
    textMoreColor: '#64748B',        // Slate 500
    statusBarText: '#F8FAFC',        // Slate 50
    searchBarText: '#F8FAFC',        // Slate 50
    
    // Icon & Interactive
    iconColor: '#F8FAFC',            // Slate 50
    menuIconColor: '#64748B',        // Slate 500 (Inactive)
    iconBackgroundColor: '#F8FAFC',  // Slate 50
    searchIconColor: '#CBD5E1',      // Slate 300
    
    // Interactive States
    headerTabIndicator: '#60A5FA',   // Blue 400
    itemColor: '#60A5FA',            // Blue 400
    cursorColor: '#60A5FA',          // Blue 400
    
    // Special Views
    searchBackColor: '#1E293B',      // Slate 800
    rbViewColor: '#1E293B',          // Slate 800
    clickViewColor: '#1E293B',       // Slate 800
    clickViewBorderColor: '#334155', // Slate 700
    alertViewColor: '#1E293B',       // Slate 800
    alterViewBorderColor: '#334155', // Slate 700
    bannerBackgroundColor: '#60A5FA', // Blue 400
    donationViewBackgroundColor: '#60A5FA', // Blue 400
    separatorColor: '#334155',       // Slate 700
    viewLineColor: '#475569',        // Slate 600
    topViewLineColor: '#475569',     // Slate 600
    
    // Container Styles
    listMainContainer: {
      margin: moderateScale(10),
      marginBottom: 0,
      borderWidth: 1,
      borderRadius: moderateScale(10),
      borderColor: '#475569',        // Slate 600
      flexDirection: 'row',
      backgroundColor: '#0F172A',    // Slate 900
    },
    containerMain: {
      flex: 1,
      backgroundColor: '#0F172A',    // Slate 900
    },
    absoluteContainerMain: {
      flex: 1,
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#0F172A',    // Slate 900
    },
  },

  // White Theme (Deep Blue Light) 🌞
  whiteTheme: {
    // Primary - Deep Blue
    mainColor: '#1E40AF',            // Blue 700 (Primary)
    mainColorLight: '#3B82F6',       // Blue 500
    mainColorDark: '#1E3A8A',        // Blue 800
    
    // Secondary - Slate Gray
    secondaryColor: '#475569',       // Slate 600
    secondaryColorLight: '#64748B',  // Slate 500
    secondaryColorDark: '#334155',   // Slate 700
    
    // Accent - Warm Amber
    accentColor: '#D97706',          // Amber 600
    accentColorLight: '#F59E0B',     // Amber 500
    accentColorDark: '#B45309',      // Amber 700
    
    // Background
    backgroundColor: '#F8FAFC',      // Slate 50 (Primary BG)
    bgSecondary: '#F8FAFC',          // Slate 50
    bgTertiary: '#F1F5F9',           // Slate 100
    bgElevated: '#FFFFFF',           // White
    
    modalBackgroundColor: '#FFFFFF', // White
    menuMainBackColor: '#FFFFFF',    // White
    menuMainContentBackColor: '#F8FAFC', // Slate 50
    topHeaderBackColor: '#FFFFFF',   // White
    bottomTabColor: '#FFFFFF',       // White
    chatroomColor: '#F8FAFC',        // Slate 50
    
    // Border
    borderPrimary: '#CBD5E1',        // Slate 300 (20% darker)
    borderSecondary: '#E2E8F0',      // Slate 200 (10% darker)
    borderSubtle: '#F1F5F9',         // Slate 100
    borderViewColor: '#E2E8F0',      // Slate 200
    borderColor: '#CBD5E1',          // Slate 300
    borderViewInsideColor: '#FFFFFF', // White
    borderViewLineColor: '#CBD5E1',  // Slate 300
    rbBorderColor: '#E2E8F0',        // Slate 200
    
    // Text
    textPrimary: '#0F172A',          // Slate 900 (Contrast 17.8:1)
    textSecondary: '#475569',        // Slate 600 (Contrast 5.2:1)
    textTertiary: '#94A3B8',         // Slate 400 (Contrast 3.2:1)
    textColor: '#0F172A',            // Slate 900
    mainTextColor: '#0F172A',        // Slate 900
    headerTopTitleColor: '#0F172A',  // Slate 900
    textMiddleColor: '#64748B',      // Slate 500
    textMoreColor: '#475569',        // Slate 600
    statusBarText: '#0F172A',        // Slate 900
    searchBarText: '#94A3B8',        // Slate 400
    
    // Icon & Interactive
    iconColor: '#0F172A',            // Slate 900
    menuIconColor: '#94A3B8',        // Slate 400 (Inactive)
    iconBackgroundColor: '#0F172A',  // Slate 900
    searchIconColor: '#64748B',      // Slate 500
    
    // Interactive States
    headerTabIndicator: '#1E40AF',   // Blue 700
    itemColor: '#1E40AF',            // Blue 700
    cursorColor: '#1E40AF',          // Blue 700
    
    // Special Views
    searchBackColor: '#F1F5F9',      // Slate 100
    rbViewColor: '#FFFFFF',          // White
    clickViewColor: '#F8FAFC',       // Slate 50
    clickViewBorderColor: '#1E40AF', // Blue 700
    alertViewColor: '#FFFFFF',       // White
    alterViewBorderColor: '#CBD5E1', // Slate 300
    bannerBackgroundColor: '#1E40AF', // Blue 700
    donationViewBackgroundColor: '#1E40AF', // Blue 700
    separatorColor: '#E2E8F0',       // Slate 200
    viewLineColor: '#CBD5E1',        // Slate 300
    topViewLineColor: '#CBD5E1',     // Slate 300
    
    // Container Styles
    listMainContainer: {
      margin: moderateScale(10),
      marginBottom: 0,
      borderColor: '#CBD5E1',        // Slate 300
      borderWidth: 1,
      borderRadius: moderateScale(10),
      backgroundColor: '#FFFFFF',    // White
    },
    containerMain: {
      flex: 1,
      backgroundColor: '#FFFFFF',    // White
    },
    absoluteContainerMain: {
      flex: 1,
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#FFFFFF',    // White
    },
  },

  // Font information (for backward compatibility)
  fontSizeInfo: {
    fontFamily: 'NotoSansKR-Regular',
    fontFamilyBold: 'NotoSansKR-Bold',
    textVeryBig: getFontSize(FONT_SIZES.veryBig),
    textBig: getFontSize(FONT_SIZES.big),
    textPicSize: getFontSize(24),
    textTitle: getFontSize(FONT_SIZES.title),
    textMiddle: getFontSize(FONT_SIZES.middle),
    textMedium: getFontSize(FONT_SIZES.middle),
    textNormal: getFontSize(FONT_SIZES.normal),
    textSmall: getFontSize(FONT_SIZES.small),
    textVerySmall: getFontSize(FONT_SIZES.verySmall),
    textBottomSize: getFontSize(FONT_SIZES.verySmall),
  },
  
  fontSizeInfo_Us: {
    fontFamily: 'InterDisplay-Regular',
    fontFamilyBold: 'InterDisplay-Bold',
    textVeryBig: getFontSize(FONT_SIZES.veryBig),
    textBig: getFontSize(FONT_SIZES.big),
    textPicSize: getFontSize(24),
    textTitle: getFontSize(FONT_SIZES.title),
    textMiddle: getFontSize(FONT_SIZES.middle),
    textMedium: getFontSize(FONT_SIZES.middle),
    textNormal: getFontSize(FONT_SIZES.normal),
    textSmall: getFontSize(FONT_SIZES.small),
    textVerySmall: getFontSize(FONT_SIZES.verySmall),
    textBottomSize: getFontSize(FONT_SIZES.verySmall),
  },

  textStyle: {
    allowFontScaling: false,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});


