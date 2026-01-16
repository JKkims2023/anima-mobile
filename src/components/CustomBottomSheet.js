/**
 * 🎨 CustomBottomSheet - Universal Bottom Sheet Component (ANIMA Emotional Design)
 * 
 * Based on @gorhom/bottom-sheet with ANIMA design system
 * 
 * ✨ ANIMA Philosophy:
 * - Glassmorphic Background (iOS BlurView + Android semi-transparent)
 * - Pink/Purple Gradient Overlay (ANIMA Signature)
 * - Warm border colors (Pink tint)
 * - Light backdrop (not too dark)
 * - Emotional, living UI
 * 
 * Features:
 * - Fixed header (title, subtitle, close button)
 * - Scrollable content area
 * - Fixed footer with 1-2 dynamic buttons
 * - Dark/White theme support
 * - Safe Area handling
 * - Keyboard awareness
 * - Android back button handling
 * 
 * Props:
 * - ref: BottomSheetModal ref (required)
 * - title: string (required)
 * - subtitle: string (optional)
 * - showCloseButton: boolean (default: true)
 * - onClose: function (Android 백버튼 및 닫기 시 호출)
 * - children: ReactNode
 * - buttons: Array<ButtonConfig> (1-2 buttons)
 * - snapPoints: Array<string> (default: ['65%', '90%'])
 * - enableDynamicSizing: boolean (default: false)
 * - enablePanDownToClose: boolean (default: true)
 * - enableDismissOnClose: boolean (default: true, Android 백버튼 처리)
 * - keyboardBehavior: 'interactive' | 'fillParent' | 'extend' (default: 'interactive')
 * - keyboardBlurBehavior: 'none' | 'restore' (default: 'restore')
 * - showHandle: boolean (default: false)
 * - contentContainerStyle: ViewStyle
 * - headerStyle: ViewStyle
 * - footerStyle: ViewStyle
 * 
 * Usage:
 * ```
 * const bottomSheetRef = useRef(null);
 * 
 * <CustomBottomSheet
 *   ref={bottomSheetRef}
 *   title="타이틀"
 *   subtitle="서브타이틀"
 *   buttons={[
 *     { title: '확인', type: 'primary', onPress: handleConfirm },
 *     { title: '취소', type: 'outline', onPress: handleCancel }
 *   ]}
 * >
 *   <CustomText>콘텐츠</CustomText>
 * </CustomBottomSheet>
 * 
 * // Open
 * bottomSheetRef.current?.present();
 * 
 * // Close
 * bottomSheetRef.current?.dismiss();
 * ```
 */

import React, { forwardRef, useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Keyboard, BackHandler, Platform } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetFooter,
  BottomSheetTextInput, // ✅ BottomSheet 전용 TextInput
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur'; // ⭐ NEW: ANIMA Glassmorphic
import LinearGradient from 'react-native-linear-gradient'; // ⭐ NEW: ANIMA Gradient
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, moderateScale, platformPadding, verticalScale } from '../utils/responsive-utils';
import CustomText from './CustomText';
import CustomButton from './CustomButton';
const commonstyles = require('../styles/commonstyles');

// ✅ BottomSheetTextInput을 export하여 외부에서 사용 가능하도록
export { BottomSheetTextInput };

const CustomBottomSheet = forwardRef((props, ref) => {
  const {
    // Header props
    title,
    subtitle,
    showCloseButton = true,
    onClose,
    
    // Content props
    children,
    
    // Footer props (1-2 buttons)
    buttons = [],
    
    // Bottom sheet props
    snapPoints = ['65%', '90%'],
    enableDynamicSizing = false,
    enablePanDownToClose = false, // ✅ 컨텐츠 드래그로 닫기 비활성화
    enableDismissOnClose = true, // ✅ Android 백버튼 자동 처리
    keyboardBehavior = 'extend', // ✅ 키보드가 나타나면 BottomSheet 확장
    keyboardBlurBehavior = 'restore',
    showHandle = false,
    
    // Style props
    contentContainerStyle,
    headerStyle,
    footerStyle,
    
    // Advanced props
    index = 0,
    animateOnMount = true,
    enableContentPanningGesture = false, // ✅ 컨텐츠 터치로 인한 닫기 방지
  } = props;

  // Safe area insets
  const insets = useSafeAreaInsets();

  const [footerHeight, setFooterHeight] = useState(0);

  // Theme colors (ANIMA 기본 테마: Dark Mode - Deep Blue)
  const theme = commonstyles.darkTheme;
  
  // ✅ Internal ref for imperative control
  const internalRef = useRef(null);
  
  // ✅ Track keyboard state
  const keyboardVisibleRef = useRef(false);
  
  // ✅ Track BottomSheet open state
  const [isOpen, setIsOpen] = useState(false);
  
  // ✅ Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        keyboardVisibleRef.current = true;
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      (e) => {
        keyboardVisibleRef.current = false;
        
        // ✅ 명시적으로 첫 번째 snap point로 복원
        // Android에서는 keyboardWillHide가 없으므로 didHide에서 처리
        setTimeout(() => {
          if (internalRef.current) {
            internalRef.current.snapToIndex(index);
          }
        }, 100); // ✅ 약간의 딜레이로 안정적인 복원
      }
    );
    
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [index]);
  
  // ✅ Android Back Button Handler
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return; // iOS는 처리 불필요
    }
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isOpen) {
        // ✅ BottomSheet가 열려 있으면 닫기
        if (internalRef.current) {
          internalRef.current.dismiss();
        }
        return true; // ✅ 이벤트 소비 (부모로 전달 안됨)
      }
      
      return false; // ✅ 이벤트 전파 (부모가 처리)
    });
    
    return () => {
      backHandler.remove();
    };
  }, [isOpen]);

  // ==================== Backdrop Component ====================
  // ✨ ANIMA: Lighter backdrop (not too dark)
  
  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7} // ✨ ANIMA: Lighter (0.8 → 0.7)
        pressBehavior="close"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.6)', // ✨ ANIMA: More transparent (0.9 → 0.6)
        }}
      />
    ),
    []
  );

  // ==================== Header Component ====================
  // ✨ ANIMA: Glassmorphic header with gradient overlay
  
  const renderHeader = useCallback(() => {
    return (
      <View style={styles.headerWrapper}>
        {/* ✨ ANIMA: Gradient Overlay */}
        <LinearGradient
          colors={['rgba(255, 107, 157, 0.08)', 'rgba(167, 139, 250, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Header Content */}
        <View style={[styles.header, headerStyle]}>
          {/* Title & Subtitle */}
          <View style={styles.headerTextContainer}>
            <CustomText 
              type="title" 
              bold={true} 
              style={[styles.title, { color: theme.textPrimary }]}
            >
              {title}
            </CustomText>
            
            {subtitle && (
              <CustomText 
                type="middle" 
                style={[styles.subtitle, { color: theme.textSecondary }]}
              >
                {subtitle}
              </CustomText>
            )}
          </View>

          {/* Close Button */}
          {showCloseButton && onClose && (
            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: 'rgba(255, 107, 157, 0.1)' }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Icon 
                name="close" 
                size={moderateScale(20)} 
                color="rgba(255, 107, 157, 0.8)" 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }, [title, subtitle, showCloseButton, onClose, theme, headerStyle]);

  // ==================== Footer Component ====================
  // ✨ ANIMA: Glassmorphic footer with gradient overlay
  
  const renderFooter = useCallback(
    (props) => {
      if (!buttons || buttons.length === 0) return null;

      const handleFooterLayout = (event) => {
        const { height } = event.nativeEvent.layout;
        // 푸터 높이가 변경되었을 때만 state 업데이트 (불필요한 리렌더링 방지)
        if (height !== footerHeight) {
          setFooterHeight(height);
        }
      };

      return (
        <BottomSheetFooter {...props} bottomInset={0}>
          <View style={styles.footerWrapper}>
            {/* ✨ ANIMA: Gradient Overlay */}
            <LinearGradient
              colors={['rgba(255, 107, 157, 0.05)', 'rgba(167, 139, 250, 0.08)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            
            {/* Footer Content */}
            <View 
              onLayout={handleFooterLayout}
              style={[
                styles.footer, 
                { 
                  paddingBottom: insets.bottom + platformPadding(16)
                },
                footerStyle
              ]}
            >
              {buttons.map((button, index) => (
                <CustomButton
                  key={index}
                  title={button.title}
                  type={button.type || 'primary'}
                  onPress={button.onPress}
                  disabled={button.disabled || false}
                  loading={button.loading || false}
                  style={[
                    styles.footerButton,
                    buttons.length === 1 && styles.footerButtonSingle,
                    button.style,
                  ]}
                />
              ))}
            </View>
          </View>
        </BottomSheetFooter>
      );
    },
    [buttons, insets.bottom, footerStyle, footerHeight]
  );

  // ==================== Handle Component ====================
  
  const handleStyle = useMemo(
    () => ({
      backgroundColor: theme.borderPrimary,
    }),
    [theme]
  );

  const handleIndicatorStyle = useMemo(
    () => ({
      backgroundColor: theme.textTertiary,
    }),
    [theme]
  );

  // ==================== Background Style ====================
  // ✨ ANIMA: Glassmorphic background (semi-transparent)
  
  const backgroundStyle = useMemo(
    () => ({
      backgroundColor: Platform.OS === 'ios' 
        ? 'rgba(26, 26, 26, 0.85)' // ✨ iOS: Semi-transparent for BlurView
        : 'rgba(26, 26, 26, 0.95)', // ✨ Android: Slightly more opaque
      elevation: 50, // ✅ Android elevation (그림자 + z-order)
    }),
    []
  );

  // ==================== Container Style (z-index) ====================
  
  const containerStyle = useMemo(
    () => ({
      zIndex: 999999, // ✅ 모든 UI 요소보다 상위
      elevation: 50,  // ✅ Android elevation
    }),
    []
  );

  // ==================== Render ====================

  return (
    <BottomSheetModal
      ref={(r) => {
        // ✅ Forward ref to parent
        if (typeof ref === 'function') {
          ref(r);
        } else if (ref) {
          ref.current = r;
        }
        // ✅ Keep internal ref for keyboard handling
        internalRef.current = r;
      }}
      index={index}
      snapPoints={snapPoints}
      enableDynamicSizing={enableDynamicSizing}
      enablePanDownToClose={enablePanDownToClose}
      enableDismissOnClose={enableDismissOnClose}
      onChange={(newIndex) => {
        console.log('[CustomBottomSheet] onChange called, index:', newIndex);
        // ✅ Track open/close state for back button handler
        if (newIndex === -1) {
          setIsOpen(false);
        } else {
          setIsOpen(true);
        }
        // ✅ Call parent onChange if provided
        if (props.onChange) {
          props.onChange(newIndex);
        }
      }}
      onDismiss={() => {
        setIsOpen(false);
        onClose && onClose();
      }}
      keyboardBehavior={keyboardBehavior}
      keyboardBlurBehavior={keyboardBlurBehavior}
      animateOnMount={animateOnMount}
      enableContentPanningGesture={enableContentPanningGesture}
      backdropComponent={renderBackdrop}
      footerComponent={buttons.length > 0 ? renderFooter : undefined}
      backgroundStyle={backgroundStyle}
      style={containerStyle}
      handleStyle={showHandle ? handleStyle : { display: 'none' }}
      handleIndicatorStyle={handleIndicatorStyle}
      android_keyboardInputMode="adjustResize"
    >
      {/* Header */}
      {renderHeader()}

      {/* Content */}
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.contentContainer,
          contentContainerStyle,
          { paddingBottom: insets.bottom + footerHeight, marginBottom: 1000  }

        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
 
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  // ==================== Header ====================
  // ✨ ANIMA: Glassmorphic header wrapper
  headerWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: platformPadding(20),
    paddingTop: platformPadding(20),
    paddingBottom: platformPadding(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 107, 157, 0.15)', // ✨ ANIMA: Pink tint border
    backgroundColor: 'transparent', // ✨ For gradient overlay
  },
  headerTextContainer: {
    flex: 1,
    marginRight: scale(12),
  },
  title: {
    marginBottom: scale(4),
  },
  subtitle: {
    lineHeight: moderateScale(18),
  },
  closeButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.2)', // ✨ ANIMA: Pink border
  },

  // ==================== Content ====================
  contentContainer: {
    paddingHorizontal: platformPadding(20),
    paddingTop: platformPadding(20),
//    paddingBottom: platformPadding(100), // Extra space for footer
  },

  // ==================== Footer ====================
  // ✨ ANIMA: Glassmorphic footer wrapper
  footerWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: platformPadding(20),
    paddingTop: platformPadding(16),
    paddingBottom: platformPadding(0), // ✅ 고정 패딩 (BottomSheetFooter가 Safe Area 자동 처리)
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 107, 157, 0.15)', // ✨ ANIMA: Pink tint border
    backgroundColor: 'transparent', // ✨ For gradient overlay
    gap: scale(12),
  },
  footerButton: {
    flex: 1,
  },
  footerButtonSingle: {
    flex: 1,
  },
});

CustomBottomSheet.displayName = 'CustomBottomSheet';

export default CustomBottomSheet;

