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
 * ⭐ NEW: Self-fetching component (no props dependency!)
 *   - Fetches real-time data from dedicated API endpoint
 *   - Independent of PersonaStudioScreen state
 *   - Auto-refreshes on mount and persona change
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-11 (Self-fetch upgrade)
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from '../CustomText';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { scale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import { formatMomentSummary, getEmotionEmoji, formatTimeAgo } from '../../utils/momentFormatter';
import { useTranslation } from 'react-i18next';
import { getPersonaHeartData } from '../../services/api/personaApi';

/**
 * PersonaHeartDisplay Component
 * @param {Object} props
 * @param {Object} props.persona - Persona object (for persona_key and conversation_count only)
 */
const PersonaHeartDisplay = ({ persona }) => {
  const { currentTheme: theme } = useTheme();
  const { user } = useUser();
  const { t } = useTranslation();
  
  // ⭐ NEW: Self-managed state
  const [heartData, setHeartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ⭐ NEW: Fetch real-time data (independent of parent state!)
  useEffect(() => {
    let isMounted = true; // Prevent state updates after unmount
    
    const fetchHeartData = async () => {
      if (!user?.user_key || !persona?.persona_key) {
        setIsLoading(false);
        return;
      }
      
      try {
        if (__DEV__) {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('💖 [PersonaHeartDisplay] Fetching real-time data...');
          console.log('   User:', user.user_key);
          console.log('   Persona:', persona.persona_key);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }
        
        setIsLoading(true);
        const result = await getPersonaHeartData(user.user_key, persona.persona_key);
        
        if (isMounted) {
          if (result.success) {
            setHeartData(result.data);
            setError(null);
            
            if (__DEV__) {
              console.log('✅ [PersonaHeartDisplay] Data fetched successfully!');
              console.log('   Recent moment:', result.data.recent_moment ? '✅' : '❌');
              console.log('   AI Interests:', result.data.ai_interests?.length || 0);
              console.log('   AI Questions:', result.data.ai_next_questions?.length || 0);
            }
          } else {
            setError(result.error);
            console.error('❌ [PersonaHeartDisplay] Fetch failed:', result.error);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setIsLoading(false);
          console.error('❌ [PersonaHeartDisplay] Fetch error:', err);
        }
      }
    };
    
    fetchHeartData();
    
    // Cleanup: Prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [user?.user_key, persona?.persona_key]); // ⭐ Re-fetch when user or persona changes
  
  // ⭐ Extract data (from self-fetched heartData)
  const recentMoment = heartData?.recent_moment || null;
  const aiInterests = heartData?.ai_interests || [];
  const aiNextQuestions = heartData?.ai_next_questions || [];
  const howAiCallsUser = heartData?.how_ai_calls_user || null;
  
  console.log('conversation_count', persona?.conversation_count);
  
  // ⭐ Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.loadingContainer, { backgroundColor: 'transparent' }]}>
          <ActivityIndicator size="large" color={theme.mainColor} />
          <CustomText type="body" style={{ display: 'none', color: theme.textSecondary, marginTop: verticalScale(12) }}>
            {t('persona_heart_display.loading') || '데이터 불러오는 중...'}
          </CustomText>
        </View>
      </View>
    );
  }
  
  // If no data, don't render
  if (!recentMoment && (!aiInterests || aiInterests.length === 0) && (!aiNextQuestions || aiNextQuestions.length === 0)) {
//    return null;
  }
  
  return (
    <View style={styles.container}>
      {/* Layer 1: Recent Special Moment - recentMoment */}
      {true && (
        
        <View style={[styles.layer, { backgroundColor: theme.bgSecondary, borderColor: theme.borderColor }]}>
          <View style={styles.layerHeader}>
            <CustomText type="title" bold style={{ color: theme.textPrimary, marginLeft: scale(0) }}>
              {t('persona_heart_display.recent_moment.title')}
            </CustomText>
          </View>
          <View style={styles.layerContent}>
            <CustomText type="body" style={{ color: theme.textPrimary, lineHeight: scale(20) }}>
              "{recentMoment && recentMoment.summary ? formatMomentSummary(recentMoment.summary, { how_ai_calls_user: howAiCallsUser }) : t('persona_heart_display.recent_moment.empty_description')}"
            </CustomText>
            <View style={styles.momentMeta}>
              { recentMoment && recentMoment.user_emotion ? (
                <View style={styles.emotionBadge}>
                  <CustomText type="small" style={{ color: theme.textSecondary }}>
                    {getEmotionEmoji(recentMoment.user_emotion)} {recentMoment.user_emotion}
                  </CustomText>
                </View>
              ) : null}
              { recentMoment && recentMoment.summary ? (
                <CustomText type="small" style={{ color: theme.textSecondary }}>
                  • 중요도 {recentMoment && recentMoment.importance ? recentMoment.importance : 0}/10
                </CustomText>
              ) : null}
              { recentMoment && recentMoment.created_at ? (
                <CustomText type="small" style={{ color: theme.textSecondary }}>
                  • {recentMoment && recentMoment.created_at ? formatTimeAgo(recentMoment.created_at) : ''}
                </CustomText>
              ) : null}
            </View>
          </View>
        </View>
      )}
      
      {/* Layer 2: Persona's Interests - aiInterests && aiInterests.length > 0 */}
      {true && (
        <View style={[styles.layer, { backgroundColor: theme.bgSecondary, borderColor: theme.borderColor, marginTop: platformPadding(0) }]}>
          <View style={styles.layerHeader}>
            <CustomText type="title" bold style={{ color: theme.textPrimary, marginLeft: scale(0) }}>
              {t('persona_heart_display.persona_interests.title', { persona_name: persona.persona_name })}
            </CustomText>
          </View>
          <View style={styles.layerContent}>

            {aiInterests && aiInterests.length > 0 ? (
            <>
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
            </>
            ) : (
              <CustomText type="body" style={{ color: theme.textPrimary, flex: 1 }}>
                {t('persona_heart_display.persona_interests.empty_description')}
              </CustomText>
            )}
          </View>
        </View>
      )}
      
      {/* Layer 3: Persona's Thoughts (Next Questions) - aiNextQuestions && aiNextQuestions.length > 0 */}
      {true && (
        <View style={[styles.layer, { backgroundColor: theme.bgSecondary, borderColor: theme.borderColor }]}>
          <View style={styles.layerHeader}>
            <CustomText type="title" bold style={{ color: theme.textPrimary, marginLeft: scale(0) }}>
              {t('persona_heart_display.persona_questions.title', { persona_name: persona.persona_name })}
            </CustomText>
          </View>
          <View style={styles.layerContent}>
   
            <View style={styles.questionItem}>
              <View style={[styles.interestDot, { backgroundColor: theme.mainColor, marginTop: verticalScale(6) }]} />
              <CustomText type="body" style={{ color: theme.textPrimary, flex: 1 }}>
                {aiNextQuestions && aiNextQuestions.length > 0 ? aiNextQuestions[0].question : t('persona_heart_display.persona_questions.need_more_conversation')}
              </CustomText>
            </View>
          </View>
        </View>
      )}

      {persona?.conversation_count == 0 && (
        <View style={[styles.layer_empty_conversation_count, { }]}>
          <View style={styles.layer_empty_conversation_count_header}>
            <CustomText type="middle" italic style={{  color: theme.textPrimary, fontStyle: 'italic'  }}>
              {t('persona_heart_display.empty_conversation_count')}
            </CustomText>
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
  
  // ⭐ NEW: Loading container
  loadingContainer: {
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: platformPadding(24),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: verticalScale(120),
  },
  
  // Layer
  layer: {
    borderRadius: scale(12),
    borderWidth: 1,
    overflow: 'hidden',
  },

  layer_empty_conversation_count: {

    overflow: 'hidden',
  },

  layer_empty_conversation_count_header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(12),
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

