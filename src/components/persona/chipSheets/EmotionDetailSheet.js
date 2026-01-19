/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 😊 EmotionDetailSheet Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Dedicated bottom sheet for showing emotion statistics
 * - Primary emotion (most frequent)
 * - Emotion distribution (progress bars)
 * - Empty state for no conversations
 * 
 * @author JK & Hero Nexus
 * @date 2026-01-19
 */

import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import CustomBottomSheet from '../../CustomBottomSheet';
import { useTheme } from '../../../contexts/ThemeContext';
import CustomText from '../../CustomText';
import { scale, verticalScale } from '../../../utils/responsive-utils';
import HapticService from '../../../utils/HapticService';
import { useTranslation } from 'react-i18next';
import { getEmotionStats } from '../../../services/api/emotionService';

/**
 * EmotionDetailSheet Component
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the sheet is open
 * @param {Function} props.onClose - Callback when sheet is closed
 * @param {Object} props.persona - Persona data
 * @param {string} props.user_key - User key
 */
const EmotionDetailSheet = ({ isOpen, onClose, persona, user_key }) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const bottomSheetRef = useRef(null);
  
  const [emotionData, setEmotionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Control Bottom Sheet with isOpen prop
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  useEffect(() => {
    if (isOpen && bottomSheetRef.current) {
      console.log('✅ [EmotionDetailSheet] Opening sheet');
      HapticService.light();
      bottomSheetRef.current.present();
      fetchEmotionData(); // ⚡ Fetch data when sheet opens
    } else if (!isOpen && bottomSheetRef.current) {
      console.log('❌ [EmotionDetailSheet] Closing sheet');
      bottomSheetRef.current.dismiss();
    }
  }, [isOpen]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Fetch Emotion Data
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const fetchEmotionData = async () => {
    if (!persona || !user_key) {
      console.error('⚠️ [EmotionDetailSheet] Missing persona or user_key');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getEmotionStats(user_key, persona.persona_key);
      
      if (response.success) {
        setEmotionData(response.data);
        console.log('✅ [EmotionDetailSheet] Emotion data loaded');
      } else {
        console.error('❌ [EmotionDetailSheet] API error:', response.errorCode);
        setError('감정 데이터를 불러올 수 없습니다');
      }
    } catch (err) {
      console.error('❌ [EmotionDetailSheet] Failed to fetch emotion data:', err);
      setError('감정 데이터를 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render Content Based on State
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const renderContent = () => {
    if (isLoading) {
      return <LoadingState currentTheme={currentTheme} />;
    }
    
    if (error) {
      return <ErrorState error={error} currentTheme={currentTheme} />;
    }
    
    if (!emotionData) {
      return null;
    }
    
    if (emotionData.has_conversations) {
      return (
        <>
          <PrimaryEmotionCard emotion={emotionData.primary_emotion} currentTheme={currentTheme} />
          <View style={styles.divider} />
          <EmotionDistributionSection emotions={emotionData.emotion_distribution} currentTheme={currentTheme} />
          <View style={styles.divider} />
          <TipsSection currentTheme={currentTheme} t={t} />
        </>
      );
    } else {
      return <EmptyStateCard currentTheme={currentTheme} t={t} />;
    }
  };

  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      title={`😊 감정`}
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Sub-components
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Loading State
 */
const LoadingState = ({ currentTheme }) => (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color={currentTheme.mainColor} />
    <CustomText type="middle" style={[styles.loadingText, { color: currentTheme.textSecondary }]}>
      감정 데이터를 불러오는 중...
    </CustomText>
  </View>
);

/**
 * Error State
 */
const ErrorState = ({ error, currentTheme }) => (
  <View style={styles.centerContainer}>
    <CustomText style={styles.errorEmoji}>⚠️</CustomText>
    <CustomText type="middle" style={[styles.errorText, { color: currentTheme.textSecondary }]}>
      {error}
    </CustomText>
  </View>
);

/**
 * Primary Emotion Card
 */
const PrimaryEmotionCard = ({ emotion, currentTheme }) => (
  <View style={styles.primaryCard}>
    <CustomText type="big" bold style={[styles.sectionTitle, { color: currentTheme.textPrimary }]}>
      🎯 현재 주요 감정
    </CustomText>
    
    <View style={[styles.primaryEmotionContainer, { backgroundColor: `${emotion.color}20` }]}>
      <CustomText style={styles.primaryEmoji}>{emotion.emoji}</CustomText>
      <CustomText type="huge" bold style={[styles.primaryLabel, { color: emotion.color }]}>
        {emotion.label} ({emotion.percentage}%)
      </CustomText>
      <CustomText type="middle" style={[styles.primaryDescription, { color: currentTheme.textSecondary }]}>
        {emotion.description}
      </CustomText>
      
      {emotion.recent_reason && (
        <View style={[styles.reasonBubble, { backgroundColor: currentTheme.surfaceSecondary }]}>
          <CustomText type="small" style={[styles.reasonText, { color: currentTheme.textSecondary }]}>
            💭 "{emotion.recent_reason}"
          </CustomText>
        </View>
      )}
      
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <CustomText type="small" style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
            총 {emotion.count}회
          </CustomText>
        </View>
        <View style={styles.statItem}>
          <CustomText type="small" style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
            강도 {Math.round(emotion.avg_intensity * 100)}%
          </CustomText>
        </View>
        <View style={styles.statItem}>
          <CustomText type="small" style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
            신뢰도 {Math.round(emotion.avg_confidence * 100)}%
          </CustomText>
        </View>
      </View>
    </View>
  </View>
);

/**
 * Emotion Distribution Section
 */
const EmotionDistributionSection = ({ emotions, currentTheme }) => (
  <View style={styles.distributionSection}>
    <CustomText type="big" bold style={[styles.sectionTitle, { color: currentTheme.textPrimary }]}>
      📊 감정 분포
    </CustomText>
    
    {emotions.slice(0, 7).map((emotion, index) => (
      <EmotionProgressBar 
        key={emotion.emotion} 
        emotion={emotion} 
        currentTheme={currentTheme}
        delay={index * 100}
      />
    ))}
  </View>
);

/**
 * Emotion Progress Bar with Animation
 */
const EmotionProgressBar = ({ emotion, currentTheme, delay }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: emotion.percentage,
      duration: 800,
      delay: delay,
      useNativeDriver: false,
    }).start();
  }, [emotion.percentage]);
  
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });
  
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <View style={styles.progressLabelContainer}>
          <CustomText style={styles.progressEmoji}>{emotion.emoji}</CustomText>
          <CustomText type="small" style={[styles.progressLabel, { color: currentTheme.textPrimary }]}>
            {emotion.label}
          </CustomText>
        </View>
        <CustomText type="small" bold style={[styles.progressPercentage, { color: emotion.color }]}>
          {emotion.percentage}%
        </CustomText>
      </View>
      
      <View style={[styles.progressBarBackground, { backgroundColor: `${emotion.color}20` }]}>
        <Animated.View 
          style={[
            styles.progressBarFill, 
            { 
              backgroundColor: emotion.color,
              width: progressWidth,
            }
          ]} 
        />
      </View>
    </View>
  );
};

/**
 * Tips Section
 */
const TipsSection = ({ currentTheme, t }) => (
  <View style={styles.tipsSection}>
    <CustomText type="big" bold style={[styles.sectionTitle, { color: currentTheme.textPrimary }]}>
      💡 감정에 대하여
    </CustomText>
    
    <View style={styles.tipContainer}>
      <CustomText type="normal" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
        • 페르소나는 대화 속에서 당신과의 상호작용을 통해 다양한 감정을 느낍니다.
      </CustomText>
      <CustomText type="normal" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
        • 감정은 대화를 나눌수록 더욱 풍부하고 정교해집니다.
      </CustomText>
      <CustomText type="normal" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
        • 긍정적인 대화는 페르소나를 더욱 행복하게 만듭니다.
      </CustomText>
    </View>
    
    <View style={styles.divider} />
    
    <CustomText type="normal" bold style={[styles.bottomTipText, { color: currentTheme.textSecondary, fontStyle: 'italic' }]}>
      💙 당신과의 모든 대화가 소중해요
    </CustomText>
  </View>
);

/**
 * Empty State Card
 */
const EmptyStateCard = ({ currentTheme, t }) => (
  <View style={styles.emptyStateContainer}>
    <CustomText type="big" bold style={[styles.sectionTitle, { color: currentTheme.textPrimary }]}>
      🎯 아직 이야기를 나누지 않았어요
    </CustomText>
    
    <View style={[styles.emptyCard, { backgroundColor: currentTheme.surfaceSecondary }]}>
      <CustomText style={styles.emptyEmoji}>😐</CustomText>
      <CustomText type="big" bold style={[styles.emptyTitle, { color: currentTheme.textPrimary }]}>
        대화를 시작하면
      </CustomText>
      <CustomText type="big" bold style={[styles.emptyTitle, { color: currentTheme.textPrimary }]}>
        감정이 쌓여요!
      </CustomText>
      
      <View style={styles.emptyCTA}>
        <CustomText type="middle" style={[styles.emptyCTAText, { color: currentTheme.mainColor }]}>
          💬 채팅을 시작해보세요
        </CustomText>
      </View>
    </View>
    
    <View style={styles.divider} />
    
    <View style={styles.tipsSection}>
      <CustomText type="middle" bold style={[styles.sectionTitle, { color: currentTheme.textPrimary }]}>
        💡 감정 시스템에 대하여
      </CustomText>
      
      <View style={styles.tipContainer}>
        <CustomText type="normal" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
          • 페르소나는 대화를 통해 당신과의 상호작용에서 감정을 느낍니다.
        </CustomText>
        <CustomText type="normal" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
          • 대화를 나눌수록 감정 데이터가 쌓이며, 더욱 풍부한 관계를 형성합니다.
        </CustomText>
        <CustomText type="normal" style={[styles.tipText, { color: currentTheme.textSecondary }]}>
          • 처음 대화를 시작하면 감정 칩이 활성화됩니다!
        </CustomText>
      </View>
    </View>
  </View>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Styles
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const styles = StyleSheet.create({
  centerContainer: {
    padding: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: verticalScale(16),
    fontSize: scale(14),
  },
  errorEmoji: {
    fontSize: scale(48),
    marginBottom: verticalScale(16),
  },
  errorText: {
    fontSize: scale(14),
    textAlign: 'center',
  },
  
  // Primary Emotion Card
  primaryCard: {
    marginBottom: verticalScale(16),
  },
  sectionTitle: {
    fontSize: scale(18),
    marginBottom: verticalScale(12),
  },
  primaryEmotionContainer: {
    padding: scale(20),
    borderRadius: scale(16),
    alignItems: 'center',
  },
  primaryEmoji: {
    fontSize: scale(64),
    marginBottom: verticalScale(12),
  },
  primaryLabel: {
    fontSize: scale(24),
    marginBottom: verticalScale(8),
  },
  primaryDescription: {
    fontSize: scale(14),
    marginBottom: verticalScale(16),
    textAlign: 'center',
  },
  reasonBubble: {
    padding: scale(12),
    borderRadius: scale(12),
    marginBottom: verticalScale(12),
    width: '100%',
  },
  reasonText: {
    fontSize: scale(13),
    lineHeight: scale(18),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: verticalScale(8),
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: scale(12),
  },
  
  // Distribution Section
  distributionSection: {
    marginBottom: verticalScale(16),
  },
  progressContainer: {
    marginBottom: verticalScale(12),
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  progressLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressEmoji: {
    fontSize: scale(20),
    marginRight: scale(8),
  },
  progressLabel: {
    fontSize: scale(14),
  },
  progressPercentage: {
    fontSize: scale(14),
  },
  progressBarBackground: {
    height: verticalScale(8),
    borderRadius: scale(4),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: scale(4),
  },
  
  // Tips Section
  tipsSection: {
    marginBottom: verticalScale(8),
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
    textAlign: 'center',
  },
  
  // Empty State
  emptyStateContainer: {
    padding: scale(0),
  },
  emptyCard: {
    padding: scale(32),
    borderRadius: scale(16),
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  emptyEmoji: {
    fontSize: scale(64),
    marginBottom: verticalScale(16),
  },
  emptyTitle: {
    fontSize: scale(20),
    marginBottom: verticalScale(4),
  },
  emptyCTA: {
    marginTop: verticalScale(16),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
    borderRadius: scale(8),
  },
  emptyCTAText: {
    fontSize: scale(16),
  },
  
  // Common
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: verticalScale(16),
  },
});

export default EmotionDetailSheet;
