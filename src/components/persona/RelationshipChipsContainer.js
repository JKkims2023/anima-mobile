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
      
      const url = `${apiBaseUrl}/anima/persona/relationship-status?user_key=${userKey}&persona_key=${personaKey}`;
      console.log('🌐 [RelationshipChips] Fetching from:', url);
      
      const response = await fetch(
        `${apiBaseUrl}/anima/persona/relationship-status?user_key=${userKey}&persona_key=${personaKey}`
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
  
  // Priority chips: intimacy, emotion, relationship
  const priorityChips = [
    chips.intimacy,
    chips.emotion,
    chips.relationship,
  ].filter(Boolean);
  
  console.log('✅ [RelationshipChips] Rendering', priorityChips.length, 'chips');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  return (
    <View style={styles.container}>
      {priorityChips.map((chip, index) => {
        // Determine chip key
        let chipKey = 'default';
        if (chip === chips.intimacy) chipKey = 'intimacy';
        if (chip === chips.emotion) chipKey = 'emotion';
        if (chip === chips.relationship) chipKey = 'relationship';
        
        return (
          <RelationshipChip
            key={chipKey}
            emoji={chip.emoji}
            label={chip.label}
            color={chip.color}
            pulseSpeed={chip.pulseSpeed || 1.5}
            delay={index * 100} // Sequential animation (100ms delay between chips)
            isLoading={isLoading}
            type={chipKey}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow wrapping if needed
    gap: scale(8),
    marginTop: verticalScale(8),
    marginBottom: verticalScale(4),
  },
});

export default RelationshipChipsContainer;

