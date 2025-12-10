/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 💝 EmotionPresetBottomSheet - One-Click Optimal Effect Selection
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Provide 4 emotion-based presets (Congrats, Thanks, Love, Comfort)
 * - Allow users to apply optimal effect combinations with one click
 * - Embody ANIMA's ultimate kindness: removing confusion
 * 
 * Features:
 * - Beautiful card-based UI for each preset
 * - Instant application of all effects
 * - Haptic feedback on selection
 * - Toast confirmation message
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-12-10
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import CustomBottomSheet from './CustomBottomSheet';
import CustomText from './CustomText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { scale, verticalScale } from '../utils/responsive-utils';
import { EMOTION_PRESETS } from '../constants/emotion-presets';
import HapticService from '../utils/HapticService';

const EmotionPresetBottomSheet = ({ sheetRef, onPresetSelect }) => {
  const { t } = useTranslation();

  const handlePresetPress = (preset) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💝 [EmotionPreset] Selected:', preset.id);
    console.log('   Effects:', preset.effects);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    HapticService.success();
    onPresetSelect(preset);
    sheetRef.current?.dismiss();
  };

  return (
    <CustomBottomSheet
      ref={sheetRef}
      snapPoints={['75%']}
      title={t('emotion_presets.title')}
      subtitle={t('emotion_presets.subtitle')}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {EMOTION_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            style={styles.presetCard}
            onPress={() => handlePresetPress(preset)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[`${preset.color}33`, `${preset.color}11`]} // 20% and 7% opacity
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBackground}
            >
              {/* Header: Emoji + Title */}
              <View style={styles.cardHeader}>
                <CustomText style={[styles.emoji, { fontSize: scale(40) }]}>
                  {preset.emoji}
                </CustomText>
                <View style={styles.headerText}>
                  <CustomText type="big" bold style={styles.presetTitle}>
                    {t(preset.labelKey)}
                  </CustomText>
                  <CustomText style={styles.presetDescription}>
                    {t(preset.descriptionKey)}
                  </CustomText>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Effects Preview */}
              <View style={styles.effectsContainer}>
                {/* Text Animation */}
                <View style={styles.effectRow}>
                  <Icon name="format-text" size={scale(18)} color={preset.color} />
                  <CustomText style={styles.effectLabel}>
                    {t(`text_animation.${preset.effects.textAnimation}`)}
                  </CustomText>
                </View>

                {/* Background Effect */}
                <View style={styles.effectRow}>
                  <Icon name="creation" size={scale(18)} color={preset.color} />
                  <CustomText style={styles.effectLabel}>
                    {t(`background_effects.${preset.effects.backgroundEffect.split('_')[0]}.title`)}
                  </CustomText>
                </View>

                {/* Active Effect */}
                <View style={styles.effectRow}>
                  <Icon name="shimmer" size={scale(18)} color={preset.color} />
                  <CustomText style={styles.effectLabel}>
                    {t(`active_effects.${preset.effects.activeEffect}`)}
                  </CustomText>
                </View>
              </View>

              {/* Apply Button */}
              <View style={[styles.applyButton, { backgroundColor: preset.color }]}>
                <CustomText bold style={styles.applyButtonText}>
                  {t('emotion_presets.apply')}
                </CustomText>
                <Icon name="check-circle" size={scale(20)} color="#FFFFFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: scale(16),
    paddingBottom: verticalScale(40),
  },
  presetCard: {
    marginBottom: verticalScale(16),
    borderRadius: scale(16),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  gradientBackground: {
    padding: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(16),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  emoji: {
    marginRight: scale(12),
  },
  headerText: {
    flex: 1,
  },
  presetTitle: {
    fontSize: scale(20),
    color: '#FFFFFF',
    marginBottom: verticalScale(4),
  },
  presetDescription: {
    fontSize: scale(13),
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: scale(18),
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: verticalScale(12),
  },
  effectsContainer: {
    marginBottom: verticalScale(12),
  },
  effectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  effectLabel: {
    fontSize: scale(14),
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: scale(8),
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(20),
    borderRadius: scale(12),
    gap: scale(8),
  },
  applyButtonText: {
    fontSize: scale(16),
    color: '#FFFFFF',
  },
});

export default EmotionPresetBottomSheet;

