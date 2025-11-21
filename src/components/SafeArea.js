/**
 * ANIMA SafeArea Components
 * 
 * Flexible safe area components for specific use cases
 * - SafeAreaTop: Top inset only
 * - SafeAreaBottom: Bottom inset only
 * - SafeAreaView: Custom safe area view
 * - SafeAreaScrollView: Safe area with ScrollView
 * 
 * Created by JK & Hero AI
 */

import React from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSafePadding, getSafeMultiPadding } from '../utils/safe-area-utils';

/**
 * SafeAreaTop - Top safe area spacer
 * Useful for headers, banners, etc.
 * 
 * @example
 * <SafeAreaTop backgroundColor="#0F172A" />
 * <Header />
 */
export const SafeAreaTop = ({ backgroundColor = 'transparent', style, minHeight = 0 }) => {
  const insets = useSafeAreaInsets();
  const height = Math.max(insets.top, minHeight);

  return <View style={[{ height, backgroundColor }, style]} />;
};

/**
 * SafeAreaBottom - Bottom safe area spacer
 * Useful for tab bars, bottom sheets, etc.
 * 
 * @example
 * <BottomTabBar />
 * <SafeAreaBottom backgroundColor="#0F172A" />
 */
export const SafeAreaBottom = ({ backgroundColor = 'transparent', style, minHeight = 0 }) => {
  const insets = useSafeAreaInsets();
  const height = Math.max(insets.bottom, minHeight);

  return <View style={[{ height, backgroundColor }, style]} />;
};

/**
 * SafeAreaView - Custom safe area view with flexible edge control
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {Object} props.edges - Which edges to apply safe area
 * @param {number} props.edges.top - Minimum top padding
 * @param {number} props.edges.bottom - Minimum bottom padding
 * @param {number} props.edges.left - Minimum left padding
 * @param {number} props.edges.right - Minimum right padding
 * 
 * @example
 * <SafeAreaView edges={{ top: 20, bottom: 0 }}>
 *   <Content />
 * </SafeAreaView>
 */
export const SafeAreaView = ({ 
  children, 
  edges = {}, 
  style,
  ...restProps 
}) => {
  const insets = useSafeAreaInsets();
  const safePadding = getSafeMultiPadding(insets, edges);

  return (
    <View style={[styles.container, safePadding, style]} {...restProps}>
      {children}
    </View>
  );
};

/**
 * SafeAreaScrollView - ScrollView with safe area padding
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {Object} props.edges - Which edges to apply safe area
 * @param {Object} props.contentContainerStyle - ScrollView content style
 * 
 * @example
 * <SafeAreaScrollView edges={{ top: true, bottom: true }}>
 *   <LongContent />
 * </SafeAreaScrollView>
 */
export const SafeAreaScrollView = ({ 
  children, 
  edges = { top: true, bottom: true, left: false, right: false },
  contentContainerStyle,
  ...restProps 
}) => {
  const insets = useSafeAreaInsets();
  
  const safePadding = {
    paddingTop: edges.top ? insets.top : 0,
    paddingBottom: edges.bottom ? insets.bottom : 0,
    paddingLeft: edges.left ? insets.left : 0,
    paddingRight: edges.right ? insets.right : 0,
  };

  return (
    <ScrollView
      contentContainerStyle={[safePadding, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      {...restProps}
    >
      {children}
    </ScrollView>
  );
};

/**
 * SafeAreaInset - Render prop component for custom safe area handling
 * 
 * @param {Function} props.children - Render function receiving insets
 * 
 * @example
 * <SafeAreaInset>
 *   {({ top, bottom, left, right }) => (
 *     <View style={{ marginTop: top }}>
 *       <CustomComponent />
 *     </View>
 *   )}
 * </SafeAreaInset>
 */
export const SafeAreaInset = ({ children }) => {
  const insets = useSafeAreaInsets();
  return children(insets);
};

/**
 * useSafeAreaStyle - Hook for creating safe area styles
 * 
 * @param {Object} edges - Edges to apply safe area
 * @returns {Object} - Style object with safe area padding
 * 
 * @example
 * const Component = () => {
 *   const safeStyle = useSafeAreaStyle({ top: 20, bottom: 10 });
 *   return <View style={safeStyle}><Text>Content</Text></View>;
 * };
 */
export const useSafeAreaStyle = (edges = {}) => {
  const insets = useSafeAreaInsets();
  return getSafeMultiPadding(insets, edges);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default {
  SafeAreaTop,
  SafeAreaBottom,
  SafeAreaView,
  SafeAreaScrollView,
  SafeAreaInset,
  useSafeAreaStyle,
};

