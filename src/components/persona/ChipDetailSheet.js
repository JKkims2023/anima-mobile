/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 💙 ChipDetailSheet Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Bottom sheet showing detailed information for each relationship chip
 * - Intimacy details
 * - Emotion history
 * - Relationship progress
 * - Trust breakdown
 * - Last interaction info
 * 
 * @author JK & Hero Nexus
 * @date 2026-01-01
 */

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import CustomBottomSheet from '../CustomBottomSheet';
import { useTheme } from '../../contexts/ThemeContext';
import CustomText from '../CustomText';
import { scale, verticalScale } from '../../utils/responsive-utils';
import HapticService from '../../utils/HapticService';
import { useTranslation } from 'react-i18next';
/**
 * ChipDetailSheet Component
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the sheet is open
 * @param {Function} props.onClose - Callback when sheet is closed
 * @param {string} props.chipKey - Which chip is selected ('intimacy', 'emotion', 'relationship', 'trust', 'lastInteraction')
 * @param {Object} props.chipData - Full chip data from API
 * @param {Object} props.persona - Persona data for context
 */
const ChipDetailSheet = ({ isOpen, onClose, chipKey, chipData, persona }) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const bottomSheetRef = useRef(null);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Control Bottom Sheet with isOpen prop
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  useEffect(() => {
    if (isOpen && bottomSheetRef.current) {
      console.log('✅ [ChipDetailSheet] Opening sheet:', chipKey);
      HapticService.light();
      bottomSheetRef.current.present();
    } else if (!isOpen && bottomSheetRef.current) {
      console.log('❌ [ChipDetailSheet] Closing sheet');
      bottomSheetRef.current.dismiss();
    }
  }, [isOpen, chipKey]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Get Title and Emoji based on chip type
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const getTitleAndEmoji = () => {
    switch (chipKey) {
      case 'intimacy':
        return { title: t('ai_chip.intimacy.title'), emoji: '💙' };
      case 'emotion':
        return { title: t('ai_chip.emotion.title'), emoji: chipData?.emoji || '😊' };
      case 'relationship':
        return { title: t('ai_chip.relationship.title'), emoji: '🌟' };
      case 'trust':
        return { title: t('ai_chip.trust.title'), emoji: '🤝' };
      case 'lastInteraction':
        return { title: t('ai_chip.last_interaction.title'), emoji: '⏱️' };
      default:
        return { title: t('ai_chip.title'), emoji: '💙' };
    }
  };

  const { title, emoji } = getTitleAndEmoji();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render Content Based on Chip Type
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const renderContent = () => {
    if (!chipKey || !chipData) {
      return (
        <View style={styles.emptyContainer}>
          <CustomText type="middle" style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
            {t('ai_chip.empty.description', '데이터를 불러올 수 없습니다')}
          </CustomText>
        </View>
      );
    }

    switch (chipKey) {
      case 'intimacy':
        return renderIntimacyDetails();
      case 'emotion':
        return renderEmotionDetails();
      case 'relationship':
        return renderRelationshipDetails();
      case 'trust':
        return renderTrustDetails();
      case 'lastInteraction':
        return renderLastInteractionDetails();
      default:
        return null;
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💙 Intimacy Details
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const renderIntimacyDetails = () => {
    const intimacy = chipData.value || 0;
    const nextLevel = 100;
    const remaining = nextLevel - intimacy;

    return (
      <View style={styles.detailContainer}>
        {/* Title */}
        <View style={[styles.titleRow,{display:'none'}]}>
          <CustomText style={styles.titleEmoji}>💙</CustomText>
          <CustomText type="big" bold style={[styles.title, { color: currentTheme.textPrimary }]}>
            {t('ai_chip.intimacy.title')}
          </CustomText>
        </View>

        {/* Current Level */}
        <View style={styles.infoRow}>
          <CustomText type="middle" style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>
            {t('ai_chip.intimacy.current_level')}
          </CustomText>
          <CustomText type="middle" bold style={[styles.infoValue, {display:'none', color: chipData.color }]}>
            {chipData.label} ({intimacy}%)
          </CustomText>
        </View>

        {/* Progress to Next Level */}
        <View style={styles.infoRow}>
          <CustomText type="middle" style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>
            {t('ai_chip.intimacy.next_level')}
          </CustomText>
          <CustomText type="middle" bold style={[styles.infoValue, { color: currentTheme.mainColor }]}>
            {remaining}% {t('ai_chip.need')}
          </CustomText>
        </View>

        <View style={styles.divider} />

        {/* Tips */}
        <CustomText type="middle" bold style={[styles.sectionTitle, { color: currentTheme.textPrimary }]}>
          💡 {t('ai_chip.intimacy.evolution_criteria')}
        </CustomText>
        
        <View style={styles.tipContainer}>
          <CustomText type="small" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            • {t('ai_chip.intimacy.evolution_criteria.item1')}
          </CustomText>
          <CustomText type="small" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            • {t('ai_chip.intimacy.evolution_criteria.item2')}
          </CustomText>
          <CustomText type="small" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            • {t('ai_chip.intimacy.evolution_criteria.item3')}
          </CustomText>
          <CustomText type="small" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            • {t('ai_chip.intimacy.evolution_criteria.item4')}
          </CustomText>
        </View>
      </View>
    );
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 😊 Emotion Details
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const renderEmotionDetails = () => {
    const emotionLabels = {
      happy: t('ai_chip.emotion.happy'),
      normal: t('ai_chip.emotion.normal'),
      tired: t('ai_chip.emotion.tired'),
      hurt: t('ai_chip.emotion.hurt'),
      angry: t('ai_chip.emotion.angry'),
      worried: t('ai_chip.emotion.worried'),
    };

    return (
      <View style={styles.detailContainer}>
        {/* Title */}
        <View style={styles.titleRow}>
          <CustomText style={styles.titleEmoji}>{chipData.emoji}</CustomText>
          <CustomText type="big" bold style={[styles.title, { color: currentTheme.textPrimary }]}>
            {t('ai_chip.emotion.title')}
          </CustomText>
        </View>

        {/* Current Emotion */}
        <View style={styles.infoRow}>
          <CustomText type="middle" style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>
            {t('ai_chip.emotion.current_emotion')}
          </CustomText>
          <CustomText type="middle" bold style={[styles.infoValue, { color: chipData.color }]}>
            {emotionLabels[chipData.state] || t('ai_chip.emotion.normal')}
          </CustomText>
        </View>

        {/* Intensity */}
        <View style={[styles.infoRow, {display:'none'}]}>
          <CustomText type="middle" style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>
            {t('ai_chip.emotion.next_emotion')}
          </CustomText>
          <CustomText type="middle" bold style={[styles.infoValue, { color: currentTheme.mainColor }]}>
            {Math.round(chipData.intensity * 100)}%
          </CustomText>
        </View>

        <View style={styles.divider} />

        {/* Emotion Understanding */}
        <CustomText type="big" bold style={[styles.sectionTitle, { color: currentTheme.textPrimary }]}>
          💭 {t('ai_chip.emotion.about_emotion')}
        </CustomText>
        
        <View style={styles.tipContainer}>
          <CustomText type="normal" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            • {t('ai_chip.emotion.about_emotion.item1')}
          </CustomText>
          <CustomText type="normal" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            • {t('ai_chip.emotion.about_emotion.item2')}
          </CustomText>
          <CustomText type="normal" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            • {t('ai_chip.emotion.about_emotion.item3')}
          </CustomText>
        </View>
        
        <View style={styles.divider} />
        
        <CustomText type="small" bold style={[styles.bottomTipText, { color: currentTheme.textSecondary, fontStyle: 'italic' }]}>
          💙 {t('ai_chip.emotion.about_emotion.description')}
        </CustomText>
      </View>
    );
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔥 Relationship Details
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const renderRelationshipDetails = () => {
    const relationshipLabels = {
      stranger: '처음',
      acquaintance: '지인',
      friend: '친구',
      close_friend: '절친',
      partner: '파트너',
    };

    const nextLevels = {
      stranger: 'acquaintance',
      acquaintance: 'friend',
      friend: 'close_friend',
      close_friend: 'partner',
      partner: null,
    };

    const nextLevel = nextLevels[chipData.level];

    return (
      <View style={styles.detailContainer}>
        {/* Title */}
        <View style={styles.titleRow}>
          <CustomText style={styles.titleEmoji}>🔥</CustomText>
          <CustomText type="big" bold style={[styles.title, { color: currentTheme.textPrimary }]}>
            {t('ai_chip.relationship.title')}
          </CustomText>
        </View>

        {/* Current Level */}
        <View style={styles.infoRow}>
          <CustomText type="middle" style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>
            {t('ai_chip.relationship.current_relationship')}
          </CustomText>
          <CustomText type="middle" bold style={[styles.infoValue, { color: chipData.color }]}>
            {relationshipLabels[chipData.level] || '처음'}
          </CustomText>
        </View>

        {/* Next Level */}
        {nextLevel && (
          <View style={[styles.infoRow, {display:'none'}]}>
            <CustomText type="middle" style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>
              {t('ai_chip.relationship.next_relationship')}
            </CustomText>
            <CustomText type="middle" bold style={[styles.infoValue, { color: currentTheme.mainColor }]}>
              {relationshipLabels[nextLevel]}
            </CustomText>
          </View>
        )}

        <View style={styles.divider} />

        {/* Evolution Criteria */}
        <CustomText type="big" bold style={[styles.sectionTitle, { color: currentTheme.textPrimary }]}>
          📊 {t('ai_chip.relationship.evolution_criteria')}
        </CustomText>
        
        <View style={styles.tipContainer}>
          <CustomText type="normal" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            • {t('ai_chip.relationship.evolution_criteria.item1')}
          </CustomText>
          <CustomText type="normal" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            • {t('ai_chip.relationship.evolution_criteria.item2')}
          </CustomText>
          <CustomText type="normal" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            • {t('ai_chip.relationship.evolution_criteria.item3')}
          </CustomText>
          <CustomText type="normal" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            • {t('ai_chip.relationship.evolution_criteria.item4')}
          </CustomText>
        </View>
        
        <View style={styles.divider} />
        
        <CustomText type="normal" bold style={[styles.bottomTipText, { color: currentTheme.textSecondary, fontStyle: 'italic' }]}>
          💡 {t('ai_chip.relationship.about_relationship.description')}
        </CustomText>
      </View>
    );
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⭐ Trust Details
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const renderTrustDetails = () => {
    const trust = chipData.value || 0;
    const nextLevel = 100;
    const remaining = nextLevel - trust;

    return (
      <View style={styles.detailContainer}>
        {/* Title */}
        <View style={styles.titleRow}>
          <CustomText style={styles.titleEmoji}>⭐</CustomText>
          <CustomText type="big" bold style={[styles.title, { color: currentTheme.textPrimary }]}>
            {t('ai_chip.trust.title')}
          </CustomText>
        </View>

        {/* Current Level */}
        <View style={styles.infoRow}>
          <CustomText type="middle" style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>
            {t('ai_chip.trust.current_trust')}
          </CustomText>
          <CustomText type="middle" bold style={[styles.infoValue, { color: chipData.color }]}>
            {chipData.label} ({trust}%)
          </CustomText>
        </View>

        {/* Progress */}
        {trust < 100 && (
          <View style={[styles.infoRow, {display:'none'}]}>
            <CustomText type="middle" style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>
              {t('ai_chip.trust.next_trust')}
            </CustomText>
            <CustomText type="middle" bold style={[styles.infoValue, { color: currentTheme.mainColor }]}>
              {remaining}% {t('ai_chip.need')}
            </CustomText>
          </View>
        )}

        <View style={styles.divider} />

        {/* Tips */}
        <CustomText type="middle" bold style={[styles.sectionTitle, { color: currentTheme.textPrimary }]}>
          💡 {t('ai_chip.trust.evolution_criteria')}
        </CustomText>
        
        <View style={styles.tipContainer}>
          <CustomText type="normal" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            • {t('ai_chip.trust.evolution_criteria.item1')}
          </CustomText>
          <CustomText type="normal" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            • {t('ai_chip.trust.evolution_criteria.item2')}
          </CustomText>
          <CustomText type="normal" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            • {t('ai_chip.trust.evolution_criteria.item3')}
          </CustomText>
          <CustomText type="normal" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            ⚠️ {t('ai_chip.trust.evolution_criteria.item4')}
          </CustomText>
        </View>
      </View>
    );
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⏱️ Last Interaction Details
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const renderLastInteractionDetails = () => {
    return (
      <View style={styles.detailContainer}>
        {/* Title */}
        <View style={styles.titleRow}>
          <CustomText style={styles.titleEmoji}>⏱️</CustomText>
          <CustomText type="big" bold style={[styles.title, { color: currentTheme.textPrimary }]}>
            {t('ai_chip.last_interaction.title')}
          </CustomText>
        </View>

        {/* Last Interaction */}
        <View style={styles.infoRow}>
          <CustomText type="middle" style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>
            {t('ai_chip.last_interaction.last_interaction')}
          </CustomText>
          <CustomText type="middle" bold style={[styles.infoValue, { color: chipData.color }]}>
            {chipData.label}
          </CustomText>
        </View>

        <View style={styles.divider} />

        {/* Tips */}
        <CustomText type="middle" bold style={[styles.sectionTitle, { color: currentTheme.textPrimary }]}>
          💡 {t('ai_chip.last_interaction.evolution_criteria')}
        </CustomText>
        
        <View style={styles.tipContainer}>
          <CustomText type="normal" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            • {t('ai_chip.last_interaction.evolution_criteria.item1')}
          </CustomText>
          <CustomText type="normal" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            • {t('ai_chip.last_interaction.evolution_criteria.item2')}
          </CustomText>
          <CustomText type="normal" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            • {t('ai_chip.last_interaction.evolution_criteria.item3')}
          </CustomText>
        </View>
        
        <View style={styles.divider} />
        
        <CustomText type="normal" bold style={[styles.bottomTipText, { color: currentTheme.textSecondary, fontStyle: 'italic' }]}>
          💙 {t('ai_chip.last_interaction.about_relationship.description')}
        </CustomText>
      </View>
    );
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!chipKey || !chipData) {
    return null;
  }

  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      title={`${emoji} ${title}`}
//      subtitle={persona?.persona_name ? `${persona.persona_name}와의 관계` : null}
      subtitle={null}
      snapPoints={['75%']}
      enablePanDownToClose={true}
      onClose={onClose}
      buttons={[
        {
          title: t('common.close', '닫기'),
          type: 'primary',
          onPress: onClose,
        },
      ]}
    >
      {renderContent()}
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  detailContainer: {
    padding: scale(0),

  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(20),
    display: 'none',
  },
  titleEmoji: {
    fontSize: scale(32),
    marginRight: scale(12),
  },
  title: {
    fontSize: scale(24),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  infoLabel: {
    fontSize: scale(16),
  },
  infoValue: {
    fontSize: scale(14),
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: verticalScale(16),
  },
  sectionTitle: {
    fontSize: scale(18),
    marginBottom: verticalScale(16),
  },
  tipContainer: {
    gap: verticalScale(8),
  },
  tipText: {
    fontSize: scale(14),
    lineHeight: scale(20),
  },
  bottomTipText: {
    fontSize: scale(15),
    lineHeight: scale(20),
  },
  emptyContainer: {
    padding: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: scale(14),
  },
});

export default ChipDetailSheet;

