/**
 * 💫 PersonaSelectorHorizontal Component
 * 
 * Horizontal scroll persona selector
 * Based on idol-companion PersonaSelectionChips.js
 * 
 * Features:
 * - Circular persona avatars with active state
 * - Smooth horizontal scrolling
 * - Active persona highlight (glow, pulse)
 * - Add new persona chip on the right
 * - Default personas (male, female) for new users
 * - Loading state (blur + spinner)
 */

import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import CustomText from '../CustomText';
import { scale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';
import { useAnima } from '../../contexts/AnimaContext';

const AVATAR_SIZE = scale(64);
const ACTIVE_SCALE = 1.1;
const AVATAR_SPACING = scale(12);

const PersonaChip = memo(({ persona, isActive, onPress, isLoading }) => {
  const { t } = useTranslation();
  
  // Animated values
  const scaleAnim = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      scaleAnim.value = withRepeat(
        withSequence(
          withTiming(ACTIVE_SCALE, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      scaleAnim.value = withTiming(1, { duration: 300 });
      glowOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isActive, scaleAnim, glowOpacity]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleAnim.value }],
    };
  });

  const animatedGlowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
    };
  });

  const handlePress = () => {
    HapticService.light();
    onPress();
  };

  const imageUrl = persona.selected_dress_image_url && persona.done_yn === 'Y'
    ? persona.selected_dress_image_url
    : persona.original_url || persona.default_image;

  console.log('[PersonaChip] Rendering:', {
    name: persona.persona_name,
    key: persona.persona_key,
    imageUrl: imageUrl?.substring(0, 50),
    isActive,
    isLoading,
  });

  return (
    <TouchableOpacity
      style={styles.chipContainer}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.chipInner, animatedContainerStyle]}>
        {/* Glow background (when active) */}
        {isActive && (
          <Animated.View
            style={[
              styles.glowBackground,
              animatedGlowStyle,
              { backgroundColor: COLORS.DEEP_BLUE_LIGHT },
            ]}
          />
        )}

        {/* Avatar image */}
        <View style={[styles.avatarContainer, isActive && styles.avatarActive]}>
          <Image
            source={{ uri: imageUrl }}
            style={[
              styles.avatarImage,
              isLoading && styles.avatarImageBlurred,
            ]}
            resizeMode="cover"
          />
          
          {/* Loading spinner */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color={COLORS.DEEP_BLUE_LIGHT} />
            </View>
          )}

          {/* Active indicator dot */}
          {isActive && (
            <View style={styles.activeDot}>
              <View style={styles.activeDotInner} />
            </View>
          )}
        </View>

        {/* Persona name */}
        <CustomText
          type="small"
          style={[styles.personaName, isActive && styles.personaNameActive]}
          numberOfLines={1}
        >
          {persona.persona_name || persona.name}
        </CustomText>
      </Animated.View>
    </TouchableOpacity>
  );
});

PersonaChip.displayName = 'PersonaChip';

const AddPersonaChip = memo(({ onPress, isCreating, hasWaitingPersona }) => {
  const { t } = useTranslation();
  const rotateAnim = useSharedValue(0);

  useEffect(() => {
    if (!isCreating && !hasWaitingPersona) {
      rotateAnim.value = withRepeat(
        withSequence(
          withTiming(10, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(-10, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [isCreating, hasWaitingPersona, rotateAnim]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotateAnim.value}deg` }],
    };
  });

  const handlePress = () => {
    if (isCreating || hasWaitingPersona) return;
    HapticService.light();
    onPress();
  };

  const icon = isCreating ? '⏳' : hasWaitingPersona ? '💤' : '➕';

  return (
    <TouchableOpacity
      style={styles.chipContainer}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={isCreating || hasWaitingPersona}
    >
      <View style={[styles.chipInner, (isCreating || hasWaitingPersona) && styles.chipDisabled]}>
        <View style={styles.addAvatarContainer}>
          <Animated.View style={animatedIconStyle}>
            <CustomText style={styles.addIcon}>{icon}</CustomText>
          </Animated.View>
        </View>
        <CustomText type="small" style={styles.addText} numberOfLines={1}>
          {t('message.create_new_persona')}
        </CustomText>
      </View>
    </TouchableOpacity>
  );
});

AddPersonaChip.displayName = 'AddPersonaChip';

const PersonaSelectorHorizontal = ({
  personas = [],
  selectedIndex = 0,
  onSelectPersona,
  onAddPersona,
  isCreating = false,
  hasWaitingPersona = false,
  showDefaultPersonas = true, // Show default male/female if no personas
}) => {
  const { t } = useTranslation();
  const { showToast } = useAnima();
  const scrollViewRef = useRef(null);

  // If no personas and showDefaultPersonas is true, show default personas
  const defaultPersonas = [
    {
      persona_key: 'default_sage',
      persona_name: 'SAGE',
      default_image: 'https://babi-cdn.logbrix.ai/babi/real/babi/f91b1fb7-d162-470d-9a43-2ee5835ee0bd_00001_.png',
      original_url: 'https://babi-cdn.logbrix.ai/babi/real/babi/f91b1fb7-d162-470d-9a43-2ee5835ee0bd_00001_.png',
      selected_dress_video_url: 'https://babi-cdn.logbrix.ai/babi/real/babi/46fb3532-e41a-4b96-8105-a39e64f39407_00001_.mp4',
      selected_dress_video_convert_yn: 'Y',
      isDefault: true,
      done_yn: 'Y',
    },
    {
      persona_key: 'default_nexus',
      persona_name: 'Nexus',
      default_image: 'https://babi-cdn.logbrix.ai/babi/real/babi/29e7b9c3-b2a2-4559-8021-a8744ef509cd_00001_.png',
      original_url: 'https://babi-cdn.logbrix.ai/babi/real/babi/29e7b9c3-b2a2-4559-8021-a8744ef509cd_00001_.png',
      selected_dress_video_url: 'https://babi-cdn.logbrix.ai/babi/real/babi/5b444ca5-d161-47a1-bfae-81171f8df1f1_00001_.mp4',
      selected_dress_video_convert_yn: 'Y',
      isDefault: true,
      done_yn: 'Y',
    },
  ];

  // Use personas as-is (no additional defaultPersonas logic here)
  const displayPersonas = personas;

  // Debug log
  console.log('[PersonaSelectorHorizontal] Received personas:', {
    count: displayPersonas.length,
    personas: displayPersonas.map(p => ({ key: p.persona_key, name: p.persona_name })),
    selectedIndex,
  });

  // Auto-scroll to selected persona
  useEffect(() => {
    if (scrollViewRef.current && selectedIndex >= 0 && displayPersonas.length > 0) {
      const offsetX = selectedIndex * (AVATAR_SIZE + AVATAR_SPACING);
      scrollViewRef.current.scrollTo({ x: offsetX, animated: true });
    }
  }, [selectedIndex, displayPersonas.length]);

  const handleAddPersona = useCallback(() => {
    if (hasWaitingPersona) {
      showToast({
        type: 'info',
        message: t('customization.waiting_persona_alert') || '아직 만나지 못한 AI가 기다리고 있어요!\n먼저 만나보실래요?',
        emoji: '⏳',
      });
      return;
    }
    onAddPersona();
  }, [hasWaitingPersona, onAddPersona, showToast, t]);

  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={styles.headerContainer}>
        <CustomText type="normal" bold style={styles.sectionTitle}>
          {t('message.persona_selector_title')}
        </CustomText>
      </View>

      {/* Horizontal scroll container with fixed add button */}
      <View style={styles.scrollContainer}>
        {/* Scrollable personas */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
        >
          {displayPersonas.length > 0 ? (
            displayPersonas.map((persona, index) => {
              console.log('[PersonaSelectorHorizontal] Rendering PersonaChip:', index, persona.persona_name);
              return (
                <PersonaChip
                  key={`${persona.persona_key}-${index}`}
                  persona={persona}
                  isActive={index === selectedIndex}
                  onPress={() => onSelectPersona(index)}
                  isLoading={persona.done_yn !== 'Y'}
                />
              );
            })
          ) : (
            <CustomText style={{ color: '#FFF', padding: 20 }}>No personas</CustomText>
          )}
        </ScrollView>

        {/* Fixed Add button (right side) */}
        <View style={styles.fixedAddButtonContainer}>
          <AddPersonaChip
            onPress={handleAddPersona}
            isCreating={isCreating}
            hasWaitingPersona={hasWaitingPersona}
          />
        </View>
      </View>

      {/* CTA for new users */}
      {personas.length === 0 && showDefaultPersonas && (
        <View style={styles.ctaContainer}>
          <CustomText type="small" style={styles.ctaText}>
            {t('message_creator.cta_title')}
          </CustomText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: scale(20),
  },
  headerContainer: {
    paddingHorizontal: scale(20),
    marginBottom: scale(12),
  },
  sectionTitle: {
    color: COLORS.TEXT_PRIMARY,
  },
  scrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingLeft: scale(20),
    paddingRight: scale(10),
    paddingVertical: scale(8),
    flexDirection: 'row',
    alignItems: 'center',
  },
  fixedAddButtonContainer: {
    paddingRight: scale(0),
    paddingLeft: scale(10),
  },
  chipContainer: {
    marginRight: AVATAR_SPACING,
    alignItems: 'center',
  },
  chipInner: {
    alignItems: 'center',
    width: AVATAR_SIZE,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  glowBackground: {
    position: 'absolute',
    width: AVATAR_SIZE * 1.2,
    height: AVATAR_SIZE * 1.2,
    borderRadius: (AVATAR_SIZE * 1.2) / 2,
    top: -(AVATAR_SIZE * 0.1),
    left: -(AVATAR_SIZE * 0.1),
  },
  avatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
    backgroundColor: COLORS.BG_SECONDARY,
  },
  avatarActive: {
    borderColor: COLORS.DEEP_BLUE_LIGHT,
    borderWidth: 2,
    shadowColor: COLORS.DEEP_BLUE_LIGHT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: scale(6),
    elevation: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarImageBlurred: {
    opacity: 0.3,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  activeDot: {
    position: 'absolute',
    bottom: scale(4),
    right: scale(4),
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: COLORS.BG_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDotInner: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: COLORS.DEEP_BLUE_LIGHT,
  },
  personaName: {
    color: COLORS.TEXT_SECONDARY,
    marginTop: scale(6),
    textAlign: 'center',
  },
  personaNameActive: {
    color: COLORS.DEEP_BLUE_LIGHT,
    fontWeight: 'bold',
  },
  addAvatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: COLORS.BORDER_PRIMARY,
    borderStyle: 'dashed',
    backgroundColor: COLORS.BG_SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: moderateScale(28),
  },
  addText: {
    color: COLORS.TEXT_TERTIARY,
    marginTop: scale(6),
    textAlign: 'center',
  },
  ctaContainer: {
    marginTop: scale(12),
    paddingHorizontal: scale(20),
    paddingVertical: scale(12),
    backgroundColor: `${COLORS.DEEP_BLUE}20`,
    borderRadius: scale(12),
    marginHorizontal: scale(20),
    borderWidth: 1,
    borderColor: `${COLORS.DEEP_BLUE}40`,
  },
  ctaText: {
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: scale(20),
  },
});

export default memo(PersonaSelectorHorizontal);

