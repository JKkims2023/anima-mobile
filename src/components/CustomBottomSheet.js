/**
 * 🎨 CustomBottomSheet - Universal Bottom Sheet Component
 * 
 * Based on @gorhom/bottom-sheet with ANIMA design system
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, moderateScale, platformPadding } from '../utils/responsive-utils';
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
  
  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  // ==================== Header Component ====================
  
  const renderHeader = useCallback(() => {
    return (
      <View style={[styles.header, { borderBottomColor: theme.borderPrimary }, headerStyle]}>
        {/* Title & Subtitle */}
        <View style={styles.headerTextContainer}>
          <CustomText 
            type="big" 
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
            style={[styles.closeButton, { backgroundColor: theme.bgSecondary }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Icon 
              name="close" 
              size={moderateScale(20)} 
              color={theme.textSecondary} 
            />
          </TouchableOpacity>
        )}
      </View>
    );
  }, [title, subtitle, showCloseButton, onClose, theme, headerStyle]);

  // ==================== Footer Component ====================
  
  const renderFooter = useCallback(
    (props) => {
      if (!buttons || buttons.length === 0) return null;

      return (
        <BottomSheetFooter {...props} bottomInset={insets.bottom}>
          <View 
            style={[
              styles.footer, 
              { 
                backgroundColor: theme.backgroundColor,
                borderTopColor: theme.borderPrimary,
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
        </BottomSheetFooter>
      );
    },
    [buttons, insets.bottom, theme, footerStyle]
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
  
  const backgroundStyle = useMemo(
    () => ({
      backgroundColor: theme.backgroundColor,
      elevation: 50, // ✅ Android elevation (그림자 + z-order)
    }),
    [theme]
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
        // ✅ Track open/close state for back button handler
        if (newIndex === -1) {
          setIsOpen(false);
        } else {
          setIsOpen(true);
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: platformPadding(20),
    paddingTop: platformPadding(20),
    paddingBottom: platformPadding(16),
    borderBottomWidth: 1,
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
  },

  // ==================== Content ====================
  contentContainer: {
    paddingHorizontal: platformPadding(20),
    paddingTop: platformPadding(20),
    paddingBottom: platformPadding(100), // Extra space for footer
  },

  // ==================== Footer ====================
  footer: {
    flexDirection: 'row',
    paddingHorizontal: platformPadding(20),
    paddingTop: platformPadding(16),
    paddingBottom: platformPadding(16), // ✅ 고정 패딩 (BottomSheetFooter가 Safe Area 자동 처리)
    borderTopWidth: 1,
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

