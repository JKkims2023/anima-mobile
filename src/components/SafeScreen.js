/**
 * ANIMA SafeScreen Component
 * 
 * Universal safe area wrapper for all screens
 * - Automatically handles top/bottom/left/right insets
 * - Supports custom edges configuration
 * - Works with ScrollView, FlatList, etc.
 * - Handles keyboard avoidance
 * 
 * Compatible with Android 14/15 and iOS 17/18
 * 
 * Created by JK & Hero AI
 */

import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSafeEdges, logSafeArea } from '../utils/safe-area-utils';

/**
 * SafeScreen Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {Object} props.style - Additional style
 * @param {boolean} props.edges.top - Apply top safe area (default: true)
 * @param {boolean} props.edges.bottom - Apply bottom safe area (default: true)
 * @param {boolean} props.edges.left - Apply left safe area (default: false)
 * @param {boolean} props.edges.right - Apply right safe area (default: false)
 * @param {boolean} props.keyboardAware - Enable keyboard avoidance (default: true)
 * @param {string} props.backgroundColor - Background color (default: transparent)
 * @param {boolean} props.statusBarHidden - Hide status bar (default: false)
 * @param {string} props.statusBarStyle - Status bar style (default: 'light-content')
 * @param {boolean} props.debug - Log safe area insets (default: false)
 * 
 * @example
 * // Basic usage
 * <SafeScreen>
 *   <Text>Content</Text>
 * </SafeScreen>
 * 
 * @example
 * // Custom edges
 * <SafeScreen edges={{ top: true, bottom: false }}>
 *   <Text>Content</Text>
 * </SafeScreen>
 * 
 * @example
 * // With custom background
 * <SafeScreen backgroundColor="#0F172A">
 *   <Text>Content</Text>
 * </SafeScreen>
 */
const SafeScreen = ({
  children,
  style,
  edges = { top: true, bottom: true, left: false, right: false },
  keyboardAware = true,
  backgroundColor = 'transparent',
  statusBarHidden = false,
  statusBarStyle = 'light-content',
  debug = false,
  ...restProps
}) => {
  const insets = useSafeAreaInsets();
  const safeEdges = getSafeEdges(insets);

  // Debug logging in development
  if (debug && __DEV__) {
    logSafeArea(insets, 'SafeScreen');
  }

  // Calculate padding based on enabled edges
  const safePadding = {
    paddingTop: edges.top ? safeEdges.top : 0,
    paddingBottom: edges.bottom ? safeEdges.bottom : 0,
    paddingLeft: edges.left ? safeEdges.left : 0,
    paddingRight: edges.right ? safeEdges.right : 0,
  };

  // Status bar configuration
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent');
    }
    StatusBar.setBarStyle(statusBarStyle);
    if (statusBarHidden) {
      StatusBar.setHidden(true);
    }

    return () => {
      if (statusBarHidden) {
        StatusBar.setHidden(false);
      }
    };
  }, [statusBarHidden, statusBarStyle]);

  const content = (
    <View
      style={[
        styles.container,
        { backgroundColor },
        safePadding,
        style,
      ]}
      {...restProps}
    >
      {children}
    </View>
  );

  // Wrap with KeyboardAvoidingView if enabled
  if (keyboardAware) {
    return (
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
});

export default SafeScreen;

