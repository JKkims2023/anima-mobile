import React, { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  Animated,
  Dimensions 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import CustomText from './CustomText';
import CustomButton from './CustomButton';
import { useTheme } from '../contexts/ThemeContext';
import { scale, verticalScale, moderateScale } from '../utils/responsive-utils';
import HapticService from '../utils/HapticService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * NotificationPermissionSheet - ANIMA 감성 권한 요청 다이얼로그
 * 
 * @param {boolean} visible - 다이얼로그 표시 여부
 * @param {Function} onAllow - "허용" 버튼 클릭 시 콜백
 * @param {Function} onDeny - "나중에" 버튼 클릭 시 콜백
 * @param {string} context - 권한 요청 컨텍스트 ('persona_creation', 'video_conversion', 'music_creation', 'general')
 */
const NotificationPermissionSheet = ({ 
  visible, 
  onAllow, 
  onDeny,
  context = 'general' 
}) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // Animate in/out
  useEffect(() => {
    if (visible) {
      HapticService.light();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);
  
  // Get context-specific content
  const getContextContent = () => {
    const contextKey = `notification_permission.${context}`;
    return {
      emoji: t(`${contextKey}.emoji`),
      title: t(`${contextKey}.title`),
      message: t(`${contextKey}.message`),
      benefit: t(`${contextKey}.benefit`),
    };
  };
  
  const content = getContextContent();
  
  // Handlers
  const handleAllow = () => {
    HapticService.success();
    onAllow?.();
  };
  
  const handleDeny = () => {
    HapticService.light();
    onDeny?.();
  };
  
  const handleBackdropPress = () => {
    // Optional: Allow closing by tapping backdrop
    // handleDeny();
  };
  
  if (!visible) return null;
  
  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleDeny}
    >
      <Animated.View 
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1}
          onPress={handleBackdropPress}
        >
          <Animated.View
            style={[
              styles.sheetContainer,
              {
                transform: [{ scale: scaleAnim }],
              }
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              {/* Background gradient */}
              <LinearGradient
                colors={[
                  currentTheme.cardBackground,
                  currentTheme.cardBackground,
                ]}
                style={styles.sheet}
              >
                {/* Decorative top bar */}
                <View style={styles.topBar}>
                  <View 
                    style={[
                      styles.topBarIndicator,
                      { backgroundColor: currentTheme.mainColor }
                    ]} 
                  />
                </View>
                
                {/* Emoji */}
                <View style={styles.emojiContainer}>
                  <View 
                    style={[
                      styles.emojiCircle,
                      { 
                        backgroundColor: `${currentTheme.mainColor}15`,
                        borderColor: `${currentTheme.mainColor}30`,
                      }
                    ]}
                  >
                    <CustomText type="emoji" style={styles.emoji}>
                      {content.emoji}
                    </CustomText>
                  </View>
                </View>
                
                {/* Title */}
                <CustomText 
                  type="big" 
                  bold 
                  style={[styles.title, { color: currentTheme.textPrimary }]}
                >
                  {content.title}
                </CustomText>
                
                {/* Message */}
                <CustomText 
                  type="middle" 
                  style={[styles.message, { color: currentTheme.textSecondary }]}
                >
                  {content.message}
                </CustomText>
                
                {/* Benefit box */}
                <View 
                  style={[
                    styles.benefitBox,
                    { 
                      backgroundColor: `${currentTheme.mainColor}10`,
                      borderColor: `${currentTheme.mainColor}30`,
                    }
                  ]}
                >
                  <CustomText 
                    type="small" 
                    style={[
                      styles.benefit, 
                      { color: currentTheme.mainColor }
                    ]}
                  >
                    {content.benefit}
                  </CustomText>
                </View>
                
                {/* Buttons */}
                <View style={styles.buttonContainer}>
                  {/* Allow button */}
                  <CustomButton
                    title={t('notification_permission.allow')}
                    onPress={handleAllow}
                    style={[
                      styles.allowButton,
                      { backgroundColor: currentTheme.mainColor }
                    ]}
                    textStyle={styles.allowButtonText}
                  />
                  
                  {/* Later button */}
                  <TouchableOpacity 
                    onPress={handleDeny}
                    style={styles.laterButton}
                    activeOpacity={0.7}
                  >
                    <CustomText 
                      type="middle" 
                      style={[
                        styles.laterButtonText,
                        { color: currentTheme.textSecondary }
                      ]}
                    >
                      {t('notification_permission.later')}
                    </CustomText>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetContainer: {
    width: SCREEN_WIDTH * 0.88,
    maxWidth: 400,
  },
  sheet: {
    borderRadius: moderateScale(24),
    padding: scale(28),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  topBar: {
    width: '100%',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  topBarIndicator: {
    width: scale(40),
    height: verticalScale(4),
    borderRadius: moderateScale(2),
    opacity: 0.3,
  },
  emojiContainer: {
    marginBottom: verticalScale(20),
  },
  emojiCircle: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: scale(42),
  },
  title: {
    textAlign: 'center',
    marginBottom: verticalScale(12),
    paddingHorizontal: scale(10),
  },
  message: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: verticalScale(24),
    paddingHorizontal: scale(10),
    lineHeight: verticalScale(22),
  },
  benefitBox: {
    borderWidth: 1,
    borderRadius: moderateScale(16),
    padding: scale(16),
    marginBottom: verticalScale(28),
    width: '100%',
  },
  benefit: {
    textAlign: 'center',
    lineHeight: verticalScale(20),
  },
  buttonContainer: {
    width: '100%',
    gap: verticalScale(12),
  },
  allowButton: {
    width: '100%',
    paddingVertical: verticalScale(16),
    borderRadius: moderateScale(14),
    shadowColor: '#60A5FA',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  allowButtonText: {
    fontSize: scale(16),
    fontWeight: '700',
  },
  laterButton: {
    width: '100%',
    paddingVertical: verticalScale(14),
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: scale(15),
    opacity: 0.7,
  },
});

export default NotificationPermissionSheet;

