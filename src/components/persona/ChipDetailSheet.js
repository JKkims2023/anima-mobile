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
        return { title: '친밀도', emoji: '💙' };
      case 'emotion':
        return { title: '감정 상태', emoji: chipData?.emoji || '😊' };
      case 'relationship':
        return { title: '관계 단계', emoji: '🌟' };
      case 'trust':
        return { title: '신뢰도', emoji: '🤝' };
      case 'lastInteraction':
        return { title: '최근 대화', emoji: '⏱️' };
      default:
        return { title: '상세 정보', emoji: '💙' };
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
            데이터를 불러올 수 없습니다
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
        <View style={styles.titleRow}>
          <CustomText style={styles.titleEmoji}>💙</CustomText>
          <CustomText type="big" bold style={[styles.title, { color: currentTheme.textPrimary }]}>
            친밀도
          </CustomText>
        </View>

        {/* Current Level */}
        <View style={styles.infoRow}>
          <CustomText type="middle" style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>
            현재 레벨
          </CustomText>
          <CustomText type="middle" bold style={[styles.infoValue, { color: chipData.color }]}>
            {chipData.label} ({intimacy}%)
          </CustomText>
        </View>

        {/* Progress to Next Level */}
        <View style={styles.infoRow}>
          <CustomText type="middle" style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>
            다음 레벨까지
          </CustomText>
          <CustomText type="middle" bold style={[styles.infoValue, { color: currentTheme.mainColor }]}>
            {remaining}% 남음
          </CustomText>
        </View>

        <View style={styles.divider} />

        {/* Tips */}
        <CustomText type="middle" bold style={[styles.sectionTitle, { color: currentTheme.textPrimary }]}>
          💡 친밀도 높이는 방법
        </CustomText>
        
        <View style={styles.tipContainer}>
          <CustomText type="small" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            • 정기적인 대화 (매일 대화 시 +2%)
          </CustomText>
          <CustomText type="small" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            • 감정 공유 (+5%)
          </CustomText>
          <CustomText type="small" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            • 선물 주고받기 (+3%)
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
      happy: '행복',
      normal: '평온',
      tired: '피곤',
      hurt: '상처',
      angry: '분노',
      worried: '걱정',
    };

    return (
      <View style={styles.detailContainer}>
        {/* Title */}
        <View style={styles.titleRow}>
          <CustomText style={styles.titleEmoji}>{chipData.emoji}</CustomText>
          <CustomText type="big" bold style={[styles.title, { color: currentTheme.textPrimary }]}>
            감정 상태
          </CustomText>
        </View>

        {/* Current Emotion */}
        <View style={styles.infoRow}>
          <CustomText type="middle" style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>
            현재 감정
          </CustomText>
          <CustomText type="middle" bold style={[styles.infoValue, { color: chipData.color }]}>
            {emotionLabels[chipData.state] || '평온'}
          </CustomText>
        </View>

        {/* Intensity */}
        <View style={styles.infoRow}>
          <CustomText type="middle" style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>
            감정 강도
          </CustomText>
          <CustomText type="middle" bold style={[styles.infoValue, { color: currentTheme.mainColor }]}>
            {Math.round(chipData.intensity * 100)}%
          </CustomText>
        </View>

        <View style={styles.divider} />

        {/* Info */}
        <CustomText type="small" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
          페르소나의 감정은 대화 내용과 상황에 따라 변화합니다. 긍정적인 대화를 나누면 감정이 좋아집니다.
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
            관계
          </CustomText>
        </View>

        {/* Current Level */}
        <View style={styles.infoRow}>
          <CustomText type="middle" style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>
            현재 관계
          </CustomText>
          <CustomText type="middle" bold style={[styles.infoValue, { color: chipData.color }]}>
            {relationshipLabels[chipData.level] || '처음'}
          </CustomText>
        </View>

        {/* Next Level */}
        {nextLevel && (
          <View style={styles.infoRow}>
            <CustomText type="middle" style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>
              다음 레벨
            </CustomText>
            <CustomText type="middle" bold style={[styles.infoValue, { color: currentTheme.mainColor }]}>
              {relationshipLabels[nextLevel]}
            </CustomText>
          </View>
        )}

        <View style={styles.divider} />

        {/* Info */}
        <CustomText type="small" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
          관계는 친밀도, 신뢰도, 대화 빈도에 따라 자연스럽게 발전합니다. 꾸준한 대화가 중요합니다.
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
            신뢰도
          </CustomText>
        </View>

        {/* Current Level */}
        <View style={styles.infoRow}>
          <CustomText type="middle" style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>
            현재 신뢰도
          </CustomText>
          <CustomText type="middle" bold style={[styles.infoValue, { color: chipData.color }]}>
            {chipData.label} ({trust}%)
          </CustomText>
        </View>

        {/* Progress */}
        {trust < 100 && (
          <View style={styles.infoRow}>
            <CustomText type="middle" style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>
              완전신뢰까지
            </CustomText>
            <CustomText type="middle" bold style={[styles.infoValue, { color: currentTheme.mainColor }]}>
              {remaining}% 남음
            </CustomText>
          </View>
        )}

        <View style={styles.divider} />

        {/* Tips */}
        <CustomText type="middle" bold style={[styles.sectionTitle, { color: currentTheme.textPrimary }]}>
          💡 신뢰도 높이는 방법
        </CustomText>
        
        <View style={styles.tipContainer}>
          <CustomText type="small" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            • 솔직한 대화
          </CustomText>
          <CustomText type="small" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            • 비밀 공유
          </CustomText>
          <CustomText type="small" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
            • 어려울 때 함께하기
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
            최근 대화
          </CustomText>
        </View>

        {/* Last Interaction */}
        <View style={styles.infoRow}>
          <CustomText type="middle" style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>
            마지막 대화
          </CustomText>
          <CustomText type="middle" bold style={[styles.infoValue, { color: chipData.color }]}>
            {chipData.label}
          </CustomText>
        </View>

        <View style={styles.divider} />

        {/* Tip */}
        <CustomText type="small" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
          💡 하루에 한 번 이상 대화하면 친밀도와 신뢰도가 유지됩니다!
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
      subtitle={persona?.persona_name ? `${persona.persona_name}와의 관계` : null}
      snapPoints={['50%', '75%']}
      enablePanDownToClose={true}
      onClose={onClose}
    >
      {renderContent()}
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  detailContainer: {
    padding: scale(20),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(20),
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
    fontSize: scale(14),
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
    fontSize: scale(16),
    marginBottom: verticalScale(12),
  },
  tipContainer: {
    gap: verticalScale(8),
  },
  tipText: {
    fontSize: scale(13),
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

