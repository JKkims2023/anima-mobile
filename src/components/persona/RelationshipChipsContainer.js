/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 💙 RelationshipChipsContainer Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Container for relationship status chips
 * - Fetches data from API
 * - Manages loading state
 * - Sequential chip animation
 * - Auto-refresh on chat close
 * 
 * @author JK & Hero Nexus
 * @date 2026-01-01
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { scale, verticalScale } from '../../utils/responsive-utils';
import RelationshipChip from './RelationshipChip';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helper Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Format time ago to compact format (now, 5m, 2h, 3d, 1w, 2M)
 */
const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  
  if (diffSecs < 60) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 4) return `${diffWeeks}w`;
  return `${diffMonths}M`;
};

/**
 * Calculate emotion percentage (based on intensity and state)
 */
const getEmotionPercentage = (emotionState, intensity) => {
  // Map emotion states to base percentages
  const emotionValues = {
    happy: 80,
    normal: 50,
    tired: 30,
    hurt: 20,
    angry: 10,
    worried: 40,
  };
  
  const baseValue = emotionValues[emotionState] || 50;
  const intensityFactor = parseFloat(intensity) || 0.5;
  
  // Combine base value with intensity
  return Math.round(baseValue * intensityFactor * 0.01 * 100);
};

/**
 * Calculate relationship percentage
 */
const getRelationshipPercentage = (level) => {
  const levels = {
    stranger: 0,
    acquaintance: 25,
    friend: 50,
    close_friend: 75,
    partner: 100,
  };
  
  return levels[level] || 0;
};

/**
 * RelationshipChipsContainer Component (⚡ OPTIMIZED: No API calls!)
 * @param {Object} props
 * @param {Object} props.relationshipData - Relationship data from persona (passed via props)
 * @param {Function} props.onChipPress - Callback for chip press (lifted to parent)
 */
const RelationshipChipsContainer = React.memo(({ 
  relationshipData, // ⚡ NEW: Direct data from persona (no API call!)
  onChipPress, // ⭐ Callback for chip press (lifted to parent)
  isFocused = true, // ⭐ NEW: Screen focus state (for emotion animation)
  onEmotionChipLayout, // ⭐ NEW: Callback for emotion chip layout
}) => {
  const [isLoading] = useState(false); // No loading needed (data is instant!)
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⚡ Transform Relationship Data (Memoized!)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const chips = useMemo(() => {
    const data = relationshipData;
    if (!data) {
      // Default chips if no relationship data exists yet
      return {
        intimacy: {
          value: 0,
          label: '처음',
          color: '#E8EAED',
          emoji: '💙',
          pulseSpeed: 1.5,
        },
        emotion: {
          state: 'normal',
          emoji: '😐',
          label: '평온',
          color: '#9AA0A6',
          pulseSpeed: 1.5,
          intensity: 0.5,
        },
        relationship: {
          level: 'stranger',
          emoji: '🆕',
          label: '처음',
          color: '#E8EAED',
          pulseSpeed: 2.0,
        },
        trust: {
          value: 0,
          label: '신뢰 구축 중',
          color: '#E8EAED',
          emoji: '⭐',
          pulseSpeed: 1.5,
        },
        lastInteraction: null,
      };
    }
    
    // ⭐ Transform backend data to chip format
    const emotionEmojis = {
      happy: '😊',
      normal: '😐',
      tired: '😴',
      hurt: '😢',
      angry: '😠',
      worried: '😰',
    };
    
    const relationshipEmojis = {
      stranger: '🆕',
      acquaintance: '👋',
      friend: '🤝',
      close_friend: '💙',
      partner: '💕',
    };
    
    return {
      intimacy: {
        value: data.intimacy_level || 0,
        label: data.intimacy_level >= 80 ? '깊은 유대' : data.intimacy_level >= 50 ? '친밀함' : '처음',
        color: data.intimacy_level >= 80 ? '#F59E0B' : data.intimacy_level >= 50 ? '#3B82F6' : '#E8EAED',
        emoji: '💙',
        pulseSpeed: 1.5,
      },
      emotion: {
        state: data.emotional_state || 'normal',
        emoji: emotionEmojis[data.emotional_state] || '😐',
        label: data.emotional_state || 'normal',
        color: '#9AA0A6',
        pulseSpeed: 1.5,
        intensity: data.state_intensity || 0.5,
      },
      relationship: {
        level: data.relationship_level || 'stranger',
        emoji: relationshipEmojis[data.relationship_level] || '🆕',
        label: data.relationship_level || 'stranger',
        color: '#E8EAED',
        pulseSpeed: 2.0,
      },
      trust: {
        value: data.trust_score || 0,
        label: '신뢰',
        color: data.trust_score >= 80 ? '#10B981' : data.trust_score >= 50 ? '#3B82F6' : '#E8EAED',
        emoji: '⭐',
        pulseSpeed: 1.5,
      },
      lastInteraction: data.last_interaction_at ? {
        timestamp: data.last_interaction_at,
      } : null,
      interactionCount: {
        value: data.interaction_count || 0,
      },
      moments: {
        count: data.moments_count || 0,
      },
    };
  }, [relationshipData]); // ⚡ Only recalculate when relationshipData changes!
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle Chip Press (Click Handler)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  // ⭐ Lift chip press to parent
  const handleChipPress = useCallback((chipKey, chipData) => {
    if (__DEV__) {
      console.log('💙 [RelationshipChips] Chip pressed:', chipKey);
    }
    onChipPress?.(chipKey, chipData);
  }, [onChipPress]);
  
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  if (__DEV__) {
    console.log('🎨 [RelationshipChips] Rendering...');
    console.log('   chips:', chips);
    console.log('   isLoading:', isLoading);
    // ⚡ REMOVED: error state (no longer used)
  }
  
  if (!chips) {
    if (__DEV__) {
      console.log('⚠️ [RelationshipChips] No chips data - returning null');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
    return null; // Or skeleton loader
  }
  
  // ⭐ NEW: 5 Priority chips with EMOTION FIRST (no percentage!)
  const chipConfigs = [
    {
      key: 'emotion',
      data: chips.emotion,
      label: null, // ⚠️ No percentage! Dynamic emoji only
      emoji: chips.emotion?.emoji || '😐',
      isEmotionChip: true, // ⭐ Special flag for dynamic animation
    },
    {
      key: 'intimacy',
      data: chips.intimacy,
      label: `${chips.intimacy?.value || 0}%`,
      emoji: '💙',
    },
    {
      key: 'relationship',
      data: chips.relationship,
      label: `${getRelationshipPercentage(chips.relationship?.level)}%`,
      emoji: '🔥',
    },
    {
      key: 'trust',
      data: chips.trust,
      label: `${chips.trust?.value || 0}%`,
      emoji: '⭐',
    },
    {
      key: 'lastInteraction',
      data: chips.lastInteraction,
      label: chips.lastInteraction ? formatTimeAgo(chips.lastInteraction.timestamp) : 'N/A',
      emoji: '⏱️',
    },
  ];
  
  console.log('✅ [RelationshipChips] Rendering', chipConfigs.length, 'chips');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  return (
    <>
      <View style={styles.container}>
        {chipConfigs.map((config, index) => {
          const chip = config.data;
          if (!chip && config.key !== 'lastInteraction') return null; // Skip if no data
          
          return (
            <RelationshipChip
              key={config.key}
              emoji={config.emoji}
              label={config.label}
              color={chip?.color || '#9AA0A6'}
              pulseSpeed={chip?.pulseSpeed || 1.5}
              delay={index * 100} // Sequential animation (100ms delay between chips)
              isLoading={isLoading}
              type={config.key}
              onPress={() => handleChipPress(config.key, chip)} // ⭐ NEW: Click handler
              isEmotionChip={config.isEmotionChip || false} // ⭐ NEW: Emotion chip flag
              isFocused={isFocused} // ⭐ NEW: Pass focus state
              onLayout={config.isEmotionChip ? onEmotionChipLayout : undefined} // ⭐ NEW: Report emotion chip position
            />
          );
        })}
      </View>
    </>
  );
}, (prevProps, nextProps) => {
  // ⚡ Custom comparison: Only re-render if relationshipData actually changes
  return (
    prevProps.relationshipData === nextProps.relationshipData &&
    prevProps.onChipPress === nextProps.onChipPress
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow wrapping if needed
    gap: scale(8),
    marginTop: verticalScale(8),
    marginBottom: Platform.OS === 'ios' ? verticalScale(-20) : verticalScale(0),

  },
});

export default RelationshipChipsContainer;

