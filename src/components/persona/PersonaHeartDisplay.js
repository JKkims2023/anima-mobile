/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 💖 PersonaHeartDisplay - Persona's Heart (3-Layer UI)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Display persona's emotional state and thoughts:
 * 1. ✨ Recent Special Moment (conversation_moments)
 * 2. 💡 Persona's Interests (ai_interests)
 * 3. 💭 Persona's Thoughts (ai_next_questions)
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-04
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from '../CustomText';
import { useTheme } from '../../contexts/ThemeContext';
import { scale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import { formatMomentSummary, getEmotionEmoji, formatTimeAgo } from '../../utils/momentFormatter';

/**
 * PersonaHeartDisplay Component
 * @param {Object} props
 * @param {Object} props.persona - Persona object (includes recent_moment, ai_interests, ai_next_questions)
 * @param {Object} props.relationshipData - Relationship data (includes how_ai_calls_user)
 */
const PersonaHeartDisplay = ({ persona, relationshipData }) => {
  const { currentTheme: theme } = useTheme();
  
  // Parse JSON fields from backend
  const recentMoment = persona?.recent_moment ? 
    (typeof persona.recent_moment === 'string' ? JSON.parse(persona.recent_moment) : persona.recent_moment) 
    : null;
  
  const aiInterests = persona?.ai_interests ? 
    (typeof persona.ai_interests === 'string' ? JSON.parse(persona.ai_interests) : persona.ai_interests) 
    : [];
  
  const aiNextQuestions = persona?.ai_next_questions ? 
    (typeof persona.ai_next_questions === 'string' ? JSON.parse(persona.ai_next_questions) : persona.ai_next_questions) 
    : [];
  
  // If no data, don't render
  if (!recentMoment && (!aiInterests || aiInterests.length === 0) && (!aiNextQuestions || aiNextQuestions.length === 0)) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      {/* Layer 1: Recent Special Moment */}
      {recentMoment && (
        <View style={[styles.layer, { backgroundColor: theme.bgSecondary, borderColor: theme.borderColor }]}>
          <View style={styles.layerHeader}>
            <Icon name="star-circle" size={scale(20)} color={theme.mainColor} />
            <CustomText type="title" bold style={{ color: theme.textPrimary, marginLeft: scale(8) }}>
              ✨ 방금 특별했던 순간
            </CustomText>
          </View>
          <View style={styles.layerContent}>
            <CustomText type="body" style={{ color: theme.textPrimary, lineHeight: scale(20) }}>
              "{formatMomentSummary(recentMoment.summary, relationshipData)}"
            </CustomText>
            <View style={styles.momentMeta}>
              {recentMoment.user_emotion && (
                <View style={styles.emotionBadge}>
                  <CustomText type="small" style={{ color: theme.textSecondary }}>
                    {getEmotionEmoji(recentMoment.user_emotion)} {recentMoment.user_emotion}
                  </CustomText>
                </View>
              )}
              <CustomText type="small" style={{ color: theme.textSecondary }}>
                • 중요도 {recentMoment.importance}/10
              </CustomText>
              <CustomText type="small" style={{ color: theme.textSecondary }}>
                • {formatTimeAgo(recentMoment.created_at)}
              </CustomText>
            </View>
          </View>
        </View>
      )}
      
      {/* Layer 2: Persona's Interests */}
      {aiInterests && aiInterests.length > 0 && (
        <View style={[styles.layer, { backgroundColor: theme.bgSecondary, borderColor: theme.borderColor }]}>
          <View style={styles.layerHeader}>
            <Icon name="lightbulb-on" size={scale(20)} color={theme.mainColor} />
            <CustomText type="title" bold style={{ color: theme.textPrimary, marginLeft: scale(8) }}>
              💡 페르소나의 관심사
            </CustomText>
          </View>
          <View style={styles.layerContent}>
            {aiInterests.map((interest, index) => (
              <View key={index} style={styles.interestItem}>
                <View style={[styles.interestDot, { backgroundColor: theme.mainColor }]} />
                <CustomText type="body" style={{ color: theme.textPrimary, flex: 1 }}>
                  {interest.topic}
                </CustomText>
                <View style={[styles.relevanceBadge, { backgroundColor: `${theme.mainColor}20` }]}>
                  <CustomText type="small" bold style={{ color: theme.mainColor }}>
                    {Math.round(interest.interest_strength * 100)}%
                  </CustomText>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Layer 3: Persona's Thoughts (Next Questions) - 최근 1개만 표시 */}
      {aiNextQuestions && aiNextQuestions.length > 0 && (
        <View style={[styles.layer, { backgroundColor: theme.bgSecondary, borderColor: theme.borderColor }]}>
          <View style={styles.layerHeader}>
            <Icon name="chat-question" size={scale(20)} color={theme.mainColor} />
            <CustomText type="title" bold style={{ color: theme.textPrimary, marginLeft: scale(8) }}>
              💭 페르소나가 궁금해하는 것
            </CustomText>
          </View>
          <View style={styles.layerContent}>
            {/* ⚠️ 사용자 집중을 위해 최근 1개만 표시 (JK 요청) */}
            <View style={styles.questionItem}>
              <View style={[styles.interestDot, { backgroundColor: theme.mainColor, marginTop: verticalScale(6) }]} />
              <CustomText type="body" style={{ color: theme.textPrimary, flex: 1 }}>
                {aiNextQuestions[0].question}
              </CustomText>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: platformPadding(12),
    paddingHorizontal: platformPadding(0),
  },
  
  // Layer
  layer: {
    borderRadius: scale(12),
    borderWidth: 1,
    overflow: 'hidden',
  },
  
  layerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: platformPadding(16),
    paddingBottom: platformPadding(12),
  },
  
  layerContent: {
    paddingHorizontal: platformPadding(16),
    paddingBottom: platformPadding(16),
    gap: platformPadding(8),
  },
  
  // Moment
  momentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginTop: verticalScale(8),
  },
  
  emotionBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: scale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Interests
  interestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  
  interestDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
  },
  
  relevanceBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: scale(12),
  },
  
  // Questions
  questionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(8),
  },
  
  questionNumber: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(2),
  },
});

export default PersonaHeartDisplay;

