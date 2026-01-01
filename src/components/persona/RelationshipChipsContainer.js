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

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { scale, verticalScale } from '../../utils/responsive-utils';
import RelationshipChip from './RelationshipChip';
import { useAnima } from '../../contexts/AnimaContext';

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
import { PERSONA_ENDPOINTS } from '../../config/api.config';

/**
 * RelationshipChipsContainer Component
 * @param {Object} props
 * @param {string} props.userKey - User key
 * @param {string} props.personaKey - Persona key
 * @param {boolean} props.refreshTrigger - External refresh trigger (increment to refresh)
 */
const RelationshipChipsContainer = ({ 
  userKey, 
  personaKey,
  refreshTrigger = 0, // External trigger for refresh
  onChipPress, // ⭐ NEW: Callback for chip press (lifted to parent)
}) => {
  const { apiBaseUrl } = useAnima();
  const [chips, setChips] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Fetch Relationship Status
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const fetchRelationshipStatus = useCallback(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💙 [RelationshipChips] fetchRelationshipStatus called');
    console.log('   userKey:', userKey);
    console.log('   personaKey:', personaKey);
    console.log('   apiBaseUrl:', apiBaseUrl);
    
    if (!userKey || !personaKey) {
      console.log('❌ [RelationshipChips] Missing keys - ABORTING');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return;
    }
    
    try {

      setIsLoading(true);
      setError(null);
      
      const url = `${PERSONA_ENDPOINTS.RELATIONSHIP_STATUS}?user_key=${userKey}&persona_key=${personaKey}`;
      console.log('🌐 [RelationshipChips] Fetching from:', url);
      
      const response = await fetch(
        `${PERSONA_ENDPOINTS.RELATIONSHIP_STATUS}?user_key=${userKey}&persona_key=${personaKey}`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.chips) {
        console.log('✅ [RelationshipChips] Status loaded:', {
          intimacy: data.chips.intimacy?.value,
          emotion: data.chips.emotion?.state,
          relationship: data.chips.relationship?.level,
        });
        
        setChips(data.chips);
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (err) {
      console.error('❌ [RelationshipChips] Error:', err);
      setError(err.message);
      
      // Set default chips on error
      setChips({
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
        },
        relationship: {
          level: 'stranger',
          emoji: '🆕',
          label: '처음',
          color: '#E8EAED',
          pulseSpeed: 2.0,
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, [userKey, personaKey, apiBaseUrl]);
  
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
  // Initial Load & Refresh on Trigger
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  useEffect(() => {
    fetchRelationshipStatus();
  }, [fetchRelationshipStatus, refreshTrigger]); // Refresh when trigger changes
  
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  console.log('🎨 [RelationshipChips] Rendering...');
  console.log('   chips:', chips);
  console.log('   isLoading:', isLoading);
  console.log('   error:', error);
  
  if (!chips) {
    console.log('⚠️ [RelationshipChips] No chips data - returning null');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return null; // Or skeleton loader
  }
  
  // ⭐ NEW: 5 Priority chips with compact format
  const chipConfigs = [
    {
      key: 'intimacy',
      data: chips.intimacy,
      label: `${chips.intimacy?.value || 0}%`,
      emoji: '💙',
    },
    {
      key: 'emotion',
      data: chips.emotion,
      label: `${getEmotionPercentage(chips.emotion?.state, chips.emotion?.intensity)}%`,
      emoji: chips.emotion?.emoji || '😐',
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
            />
          );
        })}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow wrapping if needed
    gap: scale(8),
    marginTop: verticalScale(8),
    marginBottom: verticalScale(14),
  },
});

export default RelationshipChipsContainer;

