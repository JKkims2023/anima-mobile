/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 💌 PostcardBack Component - AI의 감정을 담은 추억 카드
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - 생성된 이미지 블러 배경 (신비로운 효과)
 * - Glassmorphic 카드 디자인 (모든 색상에 조화)
 * - AI persona의 감정 코멘트
 * - Sequential fade-in 애니메이션
 * - 닫기 버튼
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-04 - REDESIGNED for visual consistency with Front
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ScrollView, ImageBackground, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from '../CustomText';
import { scale, verticalScale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';
import { useTranslation } from 'react-i18next';
import { 
  updatePersonaCommentChecked,
} from '../../services/api/personaApi';
import { isAnimaCorePersona } from '../../constants/persona';
import { setPersonaCommentRead, isPersonaCommentRead } from '../../utils/storage';



const PostcardBack = ({
  persona,
  onClose,
  isVisible = false, // ⭐ Track visibility to trigger animation
  onMarkAsRead, // ⭐ NEW: Callback to notify parent that comment has been read
  user, // ⭐ NEW: User object for API call
}) => {
  const { t } = useTranslation();
  const scaleAnim = useSharedValue(1);
  const scrollViewRef = useRef(null); // ⭐ Ref for scroll reset
  const hasMarkedAsRead = useRef(false); // ⭐ NEW: Prevent duplicate API calls

  // ⭐ Sequential fade-in animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20); // ⭐ Slide down effect
  const messageOpacity = useSharedValue(0);
  const messageTranslateY = useSharedValue(20); // ⭐ Slide up effect
  const closeButtonOpacity = useSharedValue(0);
  const closeButtonScale = useSharedValue(0.8);
  const [backImage, setBackImage] = useState(null);

  // 🔥 CRITICAL FIX: Force image reset on isVisible change!
  // This ensures images reload even with the same URL
  useEffect(() => {
    if (isVisible && persona) {
      // Step 1: Reset to null first (force unmount)
      setBackImage(null);
      
      // Step 2: Set new image on next tick (force remount)
      const timer = setTimeout(() => {
        if (persona?.selected_dress_image_url) {
          setBackImage(persona.selected_dress_image_url);
        } else if (persona?.persona_url) {
          setBackImage(persona.persona_url);
        }
      }, 0);
      
      return () => clearTimeout(timer);
    } else if (!isVisible) {
      // Reset when closing (cleanup)
      setBackImage(null);
    }
  }, [isVisible, persona?.persona_key, persona?.selected_dress_image_url, persona?.persona_url]);

  // ⭐ Get persona data
  const personaComment = persona?.selected_dress_persona_comment || '';
  const personaName = persona?.persona_name || 'AI';
  
  // ⭐ Image sources (priority order)
  const backgroundImage = 
    persona?.selected_dress_image_url ||  // 1순위: 생성된 드레스 이미지
    persona?.persona_url ||               // 2순위: 페르소나 기본 이미지
    null;                                 // Fallback: null (어두운 배경)
  
  const personaThumbnail = 
    persona?.selected_dress_image_url || 
    persona?.persona_url || 
    '';
  
  // ⭐ Fallback message if no comment
  const displayComment = personaComment || t('postcard.no_memory_yet');

  // ⭐ Animation values for each element (더 세밀한 제어!)
  const thumbnailOpacity = useSharedValue(0);
  const thumbnailScale = useSharedValue(0.5);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(-10);

  // ⭐ NEW: Mark comment as read when PostcardBack is opened
  useEffect(() => {
    // ⭐ Define async function inside useEffect (React standard pattern)
    const markCommentAsRead = async () => {
      if (isVisible && !hasMarkedAsRead.current && persona?.persona_key) {
        // ⭐ Check if comment should be marked as read
        const hasComment = 
          persona.selected_dress_persona_comment !== null &&
          persona.selected_dress_persona_comment !== '' &&
          persona.selected_dress_persona_comment.trim() !== '';
        
        if (!hasComment) return;

        // ⭐ Check if ANIMA Core persona (SAGE/NEXUS - 1:N relationship)
        const isAnimaCore = isAnimaCorePersona(persona.persona_key);
        
        // ⭐ CRITICAL: Use 'guest' as fallback for non-logged-in users
        // ANIMA_CORE personas (SAGE/NEXUS) are for ALL users, including free users!
        const effectiveUserKey = user?.user_key || 'guest';
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📖 [PostcardBack] Checking comment read status...');
        console.log('   persona_key:', persona.persona_key);
        console.log('   persona_name:', persona.persona_name);
        console.log('   user_key:', user?.user_key);
        console.log('   effectiveUserKey:', effectiveUserKey);
        console.log('   is_anima_core:', isAnimaCore);
        console.log(persona);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // ⭐ Determine if unread based on persona type
        let isUnread = false;
        
        if (isAnimaCore) {
          // ⭐ ANIMA Core (SAGE/NEXUS): Check AsyncStorage ONLY
          // Note: DB's persona_comment_checked is ALWAYS 'N' for ANIMA Core
          // because we don't call the DB API (only save to AsyncStorage)
          // So we only need to check if user has read it locally!
          
          const alreadyReadLocally = await isPersonaCommentRead(effectiveUserKey, persona.persona_key);
          console.log('   📦 [AsyncStorage] Already read locally:', alreadyReadLocally);
          
          // ⭐ Not read locally = mark as unread!
          isUnread = !alreadyReadLocally;
          console.log('   ✅ Final isUnread:', isUnread);
        } else {
          // ⭐ User-created persona: Check DB field only
          // For user-created personas, we need actual user_key from DB
          if (!user?.user_key) {
            console.log('   ⚠️ User-created persona but no user_key, skipping');
            isUnread = false;
          } else {
            isUnread = persona.persona_comment_checked === 'N';
            console.log('   🗄️ [Database] persona_comment_checked:', persona.persona_comment_checked);
          }
        }
        
        if (isUnread) {
          console.log('✅ [PostcardBack] Marking comment as read...');
          
          // ⭐ Prevent duplicate calls
          hasMarkedAsRead.current = true;
          
          // ⭐ Mark as read based on persona type
          let success = false;
          
          if (isAnimaCore) {
            // ⭐ ANIMA Core: Save to AsyncStorage
            success = await setPersonaCommentRead(effectiveUserKey, persona.persona_key);
            if (success) {
              console.log('✅ [AsyncStorage] Comment marked as read!');
            } else {
              console.error('❌ [AsyncStorage] Failed to mark as read');
            }
          } else {
            // ⭐ User-created: Call DB API (requires actual user_key)
            if (user?.user_key) {
              const response = await updatePersonaCommentChecked(persona.persona_key, user.user_key);
              success = response.success;
              if (success) {
                console.log('✅ [Database] Comment marked as read!');
              } else {
                console.error('❌ [Database] Failed to mark as read:', response.message);
              }
            } else {
              console.error('❌ [Database] Cannot mark as read: no user_key');
              success = false;
            }
          }
          
          // ⭐ Notify parent component
          if (success && onMarkAsRead) {
            onMarkAsRead(persona.persona_key);
          }
          
          // ⭐ Reset flag if failed
          if (!success) {
            hasMarkedAsRead.current = false;
          }
        } else {
          console.log('ℹ️ [PostcardBack] Comment already read, skipping...');
        }
      }
      
      // ⭐ Reset flag when PostcardBack is closed
      if (!isVisible) {
        hasMarkedAsRead.current = false;
      }
    };

    // ⭐ Execute async function
    markCommentAsRead();
  }, [isVisible, persona?.persona_key, persona?.selected_dress_persona_comment, persona?.persona_comment_checked, user?.user_key, onMarkAsRead]);
  
  // ⭐ Sequential fade-in animation - triggered when isVisible becomes true OR persona changes
  useEffect(() => {
    if (isVisible) {
      // ⭐ Reset all values first
      thumbnailOpacity.value = 0;
      thumbnailScale.value = 0.5;
      titleOpacity.value = 0;
      titleTranslateY.value = -10;
      headerOpacity.value = 0;
      headerTranslateY.value = -20;
      messageOpacity.value = 0;
      messageTranslateY.value = 20;
      closeButtonOpacity.value = 0;
      closeButtonScale.value = 0.8;

      console.log('[PostcardBack] ✅ Animation reset triggered');
      console.log('   persona_key:', persona?.persona_key);
      console.log('   persona_name:', persona?.persona_name);
      console.log('   selected_dress_image_url:', persona?.selected_dress_image_url);
      console.log('   persona_url:', persona?.persona_url);
      console.log('   done_yn:', persona?.done_yn);
      console.log('   backImage:', backImage);

      // ⭐ Start sequential animation (모든 항목 순차적!)
      // 1. Thumbnail (페르소나 썸네일) - 400ms
      thumbnailOpacity.value = withTiming(1, { 
        duration: 500, 
        easing: Easing.out(Easing.ease) 
      });
      thumbnailScale.value = withSpring(1, { 
        damping: 15,
        stiffness: 150 
      });

      // 2. Title (💖 SAGE가 보낸 추억) - 600ms delay
      titleOpacity.value = withDelay(
        600,
        withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })
      );
      titleTranslateY.value = withDelay(
        600,
        withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) })
      );

      // 3. Message (메시지 영역) - 1000ms delay
      messageOpacity.value = withDelay(
        1000,
        withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
      );
      messageTranslateY.value = withDelay(
        1000,
        withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) })
      );

      // 4. Close Button (닫기 버튼) - 1400ms delay
      closeButtonOpacity.value = withDelay(
        1400,
        withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
      );
      closeButtonScale.value = withDelay(
        1400,
        withSpring(1, { damping: 12 })
      );
    }
  }, [isVisible, persona?.persona_key, persona?.selected_dress_image_url, persona?.persona_url]); // ✅ FIX: Trigger animation when persona changes

  // ⭐ Pulse animation on close button press
  const handleClosePress = () => {
    HapticService.medium();
    scaleAnim.value = withSpring(0.9, {}, () => {
      scaleAnim.value = withSpring(1);
    });
    
    // ⭐ Reset scroll position to top before closing
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
    
    onClose();
  };

  // ⭐ Animated Styles
  const thumbnailAnimStyle = useAnimatedStyle(() => ({
    opacity: thumbnailOpacity.value,
    transform: [{ scale: thumbnailScale.value }],
  }));

  const titleAnimStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],

  }));

  const messageAnimStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
    transform: [{ translateY: messageTranslateY.value }],
    width: '100%',


  }));

  const closeButtonAnimStyle = useAnimatedStyle(() => ({
    opacity: closeButtonOpacity.value,
    transform: [
      { scale: closeButtonScale.value },
      { scale: scaleAnim.value }, // ⭐ Press feedback
    ],
  }));

  return (
    <View style={styles.container}>
      {/* ⭐ Background: Generated Image with Blur (or fallback gradient) */}
    
        <ImageBackground
          source={{ uri: backImage }}
          style={styles.backgroundImage}
          blurRadius={Platform.OS === 'ios' ? 12 : 8} // ⭐ iOS: stronger blur, Android: lighter (performance)
          resizeMode="cover"
        >
          {renderOverlayAndCard()}
        </ImageBackground>
      
    </View>
  );

  // ⭐ Render Overlay and Card Content (재사용 가능)
  function renderOverlayAndCard() {
    return (
      <View style={styles.darkOverlay}>
          
          {/* ⭐ Glassmorphic Card (중앙) - 통일된 반투명 배경 */}
          <View style={styles.cardContainer}>
            <View style={[styles.glassmorphicCard, styles.glassmorphicBackground]}>
              {renderCardContent()}
            </View>
          </View>
      </View>
    );
  }

  // ⭐ Render Card Content (재사용 가능)
  function renderCardContent() {
    return (
      <>
        {/* ⭐ Header Section */}
        <View style={styles.headerSection}>
          {/* 1. Persona Thumbnail - Animated */}
          <Animated.View style={[styles.thumbnailContainer, thumbnailAnimStyle]}>
 
              <Image
                source={{ uri: backImage }}
                style={styles.thumbnailImage}
                resizeMode="cover"
              />

          </Animated.View>
          
          {/* 2. Title - Animated */}
          <Animated.View style={titleAnimStyle}>
            <CustomText type="title" style={styles.titleText}>
              💖 From. {personaName}
            </CustomText>
          </Animated.View>
        </View>

        {/* ⭐ 3. Message: AI Comment - Animated */}
        <Animated.ScrollView 
          ref={scrollViewRef}
          style={[styles.messageContainer, messageAnimStyle]}
          contentContainerStyle={styles.messageContent}
          showsVerticalScrollIndicator={false}
          backgroundColor="transparent" // ⚠️ CRITICAL: Android 이중 반투명 방지!
        >
          <CustomText type="middle" style={styles.messageText}>
            {displayComment}
          </CustomText>
        </Animated.ScrollView>

        {/* ⭐ 4. Close Button - Animated */}
        <Animated.View style={[styles.closeButtonContainer, closeButtonAnimStyle]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClosePress}
            activeOpacity={0.7}
          >
            <Icon name="close-circle" size={scale(24)} color="rgba(255, 255, 255, 0.9)" />
            <CustomText type="bodyB" style={styles.closeButtonText}>
              {t('common.close')}
            </CustomText>
          </TouchableOpacity>
        </Animated.View>
      </>
    );
  }
};

const styles = StyleSheet.create({
  // ═══════════════════════════════════════════════════════════════════════════
  // Container
  // ═══════════════════════════════════════════════════════════════════════════
  container: {
    flex: 1,
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Background Image (생성된 이미지 블러 배경)
  // ═══════════════════════════════════════════════════════════════════════════
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  
  // ⭐ Fallback: Dark gradient background (when no image)
  fallbackBackground: {
    backgroundColor: '#1a1a2e', // Dark blue-gray
  },
  
  // ⭐ Dark Overlay for Readability
  darkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // ⭐ 40% darkness for readability
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Glassmorphic Card Container
  // ═══════════════════════════════════════════════════════════════════════════
  cardContainer: {
    width: '100%',
    maxWidth: scale(360), // ⭐ Slightly wider for better readability
    height: '85%', // ⭐ 85% of screen height
    maxHeight: verticalScale(600),
    marginTop: scale(-65),

  },
  
  // ⭐ Glassmorphic Card (iOS & Android 통일!)
  glassmorphicCard: {
    flex: 1,
    borderRadius: scale(24),
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)', // ⭐ Subtle white border
    padding: scale(24),
    // ⚠️ NO overflow: 'hidden'! (iOS 컨텐츠 숨김 방지!)
    // ✅ Shadow for depth (iOS only!)
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scale(10) },
        shadowOpacity: 0.3,
        shadowRadius: scale(20),
      },
      android: {
        elevation: 0, // ⚠️ Android: NO elevation! (직사각형 블러 방지!)
      },
    }),
  },
  
  // ⭐ Glassmorphic Background (통일된 반투명 배경!)
  glassmorphicBackground: {
    backgroundColor: Platform.OS === 'android' 
      ? 'rgba(255, 255, 255, 0.08)'  // ⭐ Android: 8% (극도로 투명하게!)
      : 'rgba(255, 255, 255, 0.18)', // ⭐ iOS: 18%
    // ⚠️ borderRadius는 부모(glassmorphicCard)에서 상속!
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Header Section (페르소나 정보)
  // ═══════════════════════════════════════════════════════════════════════════
  headerSection: {
    alignItems: 'center',
    marginBottom: scale(24),
    zIndex: 10, // ⭐ iOS: Ensure header is above other elements
    backgroundColor: 'transparent', // ⚠️ CRITICAL: Android 이중 반투명 방지!
  },
  
  // ⭐ Persona Thumbnail
  thumbnailContainer: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // ⭐ 썸네일 자체 배경 (OK!)
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginBottom: scale(16),
    // ✅ Shadow (iOS only!)
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scale(4) },
        shadowOpacity: 0.2,
        shadowRadius: scale(8),
      },
      android: {
        elevation: 0, // ⚠️ Android: NO elevation!
      },
    }),
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  
  // ⭐ Title Text
  titleText: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    // ✅ Stronger text shadow for better readability
    textShadowColor: 'rgba(0, 0, 0, 0.8)', // ⭐ Increased from 0.5 to 0.8
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Message Section (AI 코멘트)
  // ═══════════════════════════════════════════════════════════════════════════
  messageContainer: {
    flex: 1,
    marginBottom: scale(20),
    backgroundColor: 'transparent', // ⚠️ CRITICAL: Android 이중 반투명 방지!
    borderRadius: 0, // ⚠️ Android: NO border radius on ScrollView!
    alignContent: 'flex-start',

    textAlign: 'left',
    marginTop: scale(-40),
  },
  messageContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: scale(4),
    backgroundColor: 'transparent', // ⚠️ CRITICAL: Android 이중 반투명 방지!
    borderRadius: 0, // ⚠️ Android: NO border radius!
  },
  messageText: {
   // fontSize: moderateScale(17),
    lineHeight: moderateScale(28),
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '400',
    // ✅ Stronger text shadow for better readability on all backgrounds
    textShadowColor: 'rgba(0, 0, 0, 0.8)', // ⭐ Increased from 0.5 to 0.8
    textShadowOffset: { width: 0, height: 2 }, // ⭐ Increased offset
    textShadowRadius: 4, // ⭐ Increased radius
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Close Button (닫기 버튼)
  // ═══════════════════════════════════════════════════════════════════════════
  closeButtonContainer: {
    alignItems: 'center',
    marginTop: 'auto',
    zIndex: 10, // ⭐ iOS: Ensure button is above other elements
    backgroundColor: 'transparent', // ⚠️ CRITICAL: Android 이중 반투명 방지!
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)', // ⭐ Semi-transparent white
    paddingVertical: scale(12),
    paddingHorizontal: scale(28),
    borderRadius: scale(28),
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    // ✅ Shadow (iOS only!)
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scale(4) },
        shadowOpacity: 0.3,
        shadowRadius: scale(8),
      },
      android: {
        elevation: 0, // ⚠️ Android: NO elevation!
      },
    }),
  },
  closeButtonText: {
    color: '#FFFFFF',
    marginLeft: scale(8),
    fontSize: moderateScale(16),
    fontWeight: '600',
    // ✅ Stronger text shadow
    textShadowColor: 'rgba(0, 0, 0, 0.5)', // ⭐ Increased from 0.3 to 0.5
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default PostcardBack;

