/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎨 SlideMenu - Simple & Elegant Slide Menu
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Simple left-right split (no curve)
 * - Left side: Blur (iOS) / Semi-transparent (Android)
 * - Right side: Solid background (#0F172A)
 * - Beautiful menu items with ANIMA philosophy
 * - Smooth slide animation
 * 
 * Design:
 * - Background: #0F172A (PersonaStudioScreen header color)
 * - Left blur: 80% width
 * - Right menu: 80% width
 * - Animation: translateX (right → left open, left → right close)
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-06
 */

import React, { useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import Svg, { Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { scale, verticalScale } from '../utils/responsive-utils';
import Icon from 'react-native-vector-icons/Ionicons';
import { useUser } from '../contexts/UserContext';
import { useNavigation } from '@react-navigation/native';
import CustomText from './CustomText';
import HapticService from '../utils/HapticService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MENU_WIDTH = SCREEN_WIDTH * 0.8; // 80% of screen width
const BLUR_WIDTH = SCREEN_WIDTH * 0.2; // 20% blur area (left)
const CONTENT_WIDTH = SCREEN_WIDTH * 0.6; // 60% content area (right)

const SlideMenu = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const navigation = useNavigation();
  
  // ═══════════════════════════════════════════════════════════════════════
  // ANIMATION
  // ═══════════════════════════════════════════════════════════════════════
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Open: right → left
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Close: left → right
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: SCREEN_WIDTH,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible && translateX._value === SCREEN_WIDTH) {
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════
  const handleLoginPress = () => {
    HapticService.light();
    onClose();
    navigation.navigate('Settings');
  };

  const handleMenuItemPress = (item) => {
    HapticService.light();
    console.log(`[SlideMenu] ${item} clicked`);
    // TODO: Navigate or perform action
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════
  
  // Logo Section (ANIMA gradient)
  const renderLogo = () => (
    <View style={styles.logoSection}>
      <Svg height={scale(28)} width={scale(100)}>
        <Defs>
          <LinearGradient id="menuAnimaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FF7FA3" stopOpacity="1" />
            <Stop offset="100%" stopColor="#A78BFA" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <SvgText
          fill="url(#menuAnimaGradient)"
          fontSize={scale(24)}
          fontWeight="bold"
          x="0"
          y={scale(20)}
          letterSpacing="0.5"
        >
          ANIMA
        </SvgText>
      </Svg>
      <CustomText style={styles.logoSubtitle}>Soul Connection</CustomText>
    </View>
  );

  // User Info Section
  const renderUserInfo = () => {
    if (!user || !user.user_key) {
      // Not logged in
      return (
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleLoginPress}
          activeOpacity={0.7}
        >
          <Icon name="log-in-outline" size={scale(24)} color="#60A5FA" />
          <View style={styles.loginTextContainer}>
            <CustomText style={styles.loginTitle}>로그인이 필요합니다</CustomText>
            <CustomText style={styles.loginSubtitle}>더 많은 기능을 이용하세요</CustomText>
          </View>
          <Icon name="chevron-forward" size={scale(20)} color="#94A3B8" />
        </TouchableOpacity>
      );
    }

    // Logged in
    const userLevel = user.user_level || 'free';
    const levelColors = {
      free: '#94A3B8',
      basic: '#60A5FA',
      premium: '#A78BFA',
      ultimate: '#FFD700',
    };
    const levelNames = {
      free: 'Free',
      basic: 'Basic',
      premium: 'Premium',
      ultimate: 'Ultimate',
    };

    return (
      <View style={styles.userInfoContainer}>
        <View style={styles.userInfoRow}>
          <View style={styles.userAvatarContainer}>
            <Icon name="person-circle" size={scale(48)} color="#60A5FA" />
          </View>
          <View style={styles.userInfoTextContainer}>
            <CustomText style={styles.userEmail} numberOfLines={1}>
              {user.user_email || '사용자'}
            </CustomText>
            <View style={[styles.userLevelBadge, { backgroundColor: `${levelColors[userLevel]}20` }]}>
              <CustomText style={[styles.userLevelText, { color: levelColors[userLevel] }]}>
                {levelNames[userLevel]}
              </CustomText>
            </View>
          </View>
        </View>
        <View style={styles.userPointContainer}>
          <Icon name="diamond-outline" size={scale(18)} color="#FFD700" />
          <CustomText style={styles.userPointText}>
            {(user.user_point || 0).toLocaleString()}P
          </CustomText>
        </View>
      </View>
    );
  };

  // Divider
  const renderDivider = () => (
    <View style={styles.divider} />
  );

  // New Message Section
  const renderNewMessages = () => (
    <View style={styles.section}>
      <CustomText style={styles.sectionTitle}>💬 새로운 메시지</CustomText>
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => handleMenuItemPress('선물 피드백')}
        activeOpacity={0.7}
      >
        <Icon name="gift-outline" size={scale(22)} color="#FF7FA3" />
        <View style={styles.menuItemTextContainer}>
          <CustomText style={styles.menuItemText}>페르소나의 선물 피드백</CustomText>
          <CustomText style={styles.menuItemBadge}>3개</CustomText>
        </View>
        <Icon name="chevron-forward" size={scale(18)} color="#64748B" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => handleMenuItemPress('받은 선물')}
        activeOpacity={0.7}
      >
        <Icon name="heart-circle-outline" size={scale(22)} color="#A78BFA" />
        <View style={styles.menuItemTextContainer}>
          <CustomText style={styles.menuItemText}>내가 받은 선물</CustomText>
          <CustomText style={styles.menuItemBadge}>7개</CustomText>
        </View>
        <Icon name="chevron-forward" size={scale(18)} color="#64748B" />
      </TouchableOpacity>
    </View>
  );

  // Info Section
  const renderInfoSection = () => (
    <View style={styles.section}>
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => handleMenuItemPress('ANIMA 소개')}
        activeOpacity={0.7}
      >
        <Icon name="information-circle-outline" size={scale(22)} color="#60A5FA" />
        <CustomText style={styles.menuItemText}>ANIMA 소개</CustomText>
        <Icon name="chevron-forward" size={scale(18)} color="#64748B" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => handleMenuItemPress('가능한 것을')}
        activeOpacity={0.7}
      >
        <Icon name="sparkles-outline" size={scale(22)} color="#FFD700" />
        <CustomText style={styles.menuItemText}>가능한 것을</CustomText>
        <Icon name="chevron-forward" size={scale(18)} color="#64748B" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => handleMenuItemPress('Contact US')}
        activeOpacity={0.7}
      >
        <Icon name="mail-outline" size={scale(22)} color="#94A3B8" />
        <CustomText style={styles.menuItemText}>Contact US</CustomText>
        <Icon name="chevron-forward" size={scale(18)} color="#64748B" />
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      {/* Backdrop (for closing on outside click) */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropOpacity,
            pointerEvents: visible ? 'auto' : 'none',
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      {/* Menu Container */}
      <Animated.View
        style={[
          styles.menuContainer,
          {
            transform: [{ translateX }],
          },
        ]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        {/* Blur Layer (Left side - 20%) */}
        {Platform.OS === 'ios' ? (
          <BlurView
            style={styles.blurLayer}
            blurType="dark"
            blurAmount={30}
            reducedTransparencyFallbackColor="rgba(15, 23, 42, 0.85)"
          />
        ) : (
          <View style={[styles.blurLayer, { backgroundColor: 'rgba(15, 23, 42, 0.85)' }]} />
        )}

        {/* Menu Content (Right side - 60%) */}
        <View style={styles.menuContent}>
          {/* Close Button */}
          <TouchableOpacity
            style={[
              styles.closeButton,
              { top: insets.top + verticalScale(10) },
            ]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Icon name="close" size={scale(28)} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: insets.top + verticalScale(70) },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {renderLogo()}
            {renderUserInfo()}
            {renderDivider()}
            {renderNewMessages()}
            {renderDivider()}
            {renderInfoSection()}
          </ScrollView>
        </View>
      </Animated.View>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9998,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: MENU_WIDTH, // 80% of screen
    height: SCREEN_HEIGHT,
    zIndex: 9999,
    flexDirection: 'row', // ⭐ Horizontal layout (blur left, content right)
  },
  blurLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BLUR_WIDTH, // 20% blur area (left)
    height: SCREEN_HEIGHT,
  },
  menuContent: {
    position: 'absolute',
    top: 0,
    left: BLUR_WIDTH, // Start after blur area (20%)
    width: CONTENT_WIDTH, // 60% content area (right)
    height: SCREEN_HEIGHT,
    backgroundColor: '#0F172A', // PersonaStudioScreen header color
  },
  closeButton: {
    position: 'absolute',
    right: scale(20), // Relative to menuContent (60% area)
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(40),
  },
  
  // Logo Section
  logoSection: {
    marginBottom: verticalScale(30),
    gap: verticalScale(4),
  },
  logoSubtitle: {
    fontSize: scale(14),
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  
  // User Info Section (Not Logged In)
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderRadius: scale(16),
    padding: scale(16),
    marginBottom: verticalScale(20),
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  loginTextContainer: {
    flex: 1,
    marginLeft: scale(12),
  },
  loginTitle: {
    fontSize: scale(16),
    color: '#F1F5F9',
    fontWeight: '600',
    marginBottom: scale(4),
  },
  loginSubtitle: {
    fontSize: scale(13),
    color: '#94A3B8',
    fontWeight: '400',
  },
  
  // User Info Section (Logged In)
  userInfoContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: scale(16),
    padding: scale(16),
    marginBottom: verticalScale(20),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  userAvatarContainer: {
    marginRight: scale(12),
  },
  userInfoTextContainer: {
    flex: 1,
  },
  userEmail: {
    fontSize: scale(16),
    color: '#F1F5F9',
    fontWeight: '600',
    marginBottom: scale(6),
  },
  userLevelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(8),
  },
  userLevelText: {
    fontSize: scale(12),
    fontWeight: '600',
  },
  userPointContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: scale(12),
    paddingVertical: scale(10),
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  userPointText: {
    fontSize: scale(16),
    color: '#FFD700',
    fontWeight: '700',
    marginLeft: scale(8),
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: verticalScale(20),
  },
  
  // Section
  section: {
    gap: verticalScale(8),
  },
  sectionTitle: {
    fontSize: scale(14),
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: scale(8),
    letterSpacing: 0.5,
  },
  
  // Menu Item
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(12),
    borderRadius: scale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuItemTextContainer: {
    flex: 1,
    marginLeft: scale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemText: {
    fontSize: scale(15),
    color: '#F1F5F9',
    fontWeight: '500',
  },
  menuItemBadge: {
    fontSize: scale(13),
    color: '#60A5FA',
    fontWeight: '600',
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(8),
  },
});

export default SlideMenu;
