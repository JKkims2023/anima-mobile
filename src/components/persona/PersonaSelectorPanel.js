/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎯 PersonaSelectorPanel Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Expandable persona selection panel (slides from right to left)
 * - Horizontal scrollable persona chips
 * - Staggered appearance animation
 * - Close button
 * - Glassmorphism design
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-11-22
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from '../CustomText';
import { scale, verticalScale } from '../../utils/responsive-utils';
import HapticService from '../../utils/HapticService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * PersonaSelectorPanel Component
 * @param {Object} props
 * @param {boolean} props.visible - Whether panel is visible
 * @param {Array} props.personas - List of personas to display
 * @param {Function} props.onSelectPersona - Callback when persona is selected
 * @param {Function} props.onClose - Callback when close button is pressed
 * @param {Function} props.onViewAll - Callback when "View All" is pressed
 */
const PersonaSelectorPanel = ({
  visible = false,
  personas = [],
  onSelectPersona,
  onClose,
  onViewAll,
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // ✅ Slide animation
  useEffect(() => {
    if (visible) {
      // Slide in from right
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out to right
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);
  
  // ✅ Handle persona selection
  const handleSelectPersona = (persona) => {
    HapticService.impact('medium');
    if (onSelectPersona) {
      onSelectPersona(persona);
    }
  };
  
  // ✅ Handle close
  const handleClose = () => {
    HapticService.selection();
    if (onClose) {
      onClose();
    }
  };
  
  // ✅ Handle view all
  const handleViewAll = () => {
    HapticService.selection();
    if (onViewAll) {
      onViewAll();
    }
  };
  
  if (!visible && slideAnim._value === SCREEN_WIDTH) {
    return null;
  }
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + verticalScale(80),
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleClose}
        activeOpacity={0.7}
      >
        <Icon name="close" size={scale(24)} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* Persona Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {personas.map((persona, index) => (
          <PersonaChip
            key={persona.persona_key}
            persona={persona}
            index={index}
            visible={visible}
            onPress={() => handleSelectPersona(persona)}
          />
        ))}
        
        {/* View All Button */}
        {personas.length > 0 && (
          <TouchableOpacity
            style={styles.viewAllChip}
            onPress={handleViewAll}
            activeOpacity={0.7}
          >
            <Icon name="plus" size={scale(32)} color="#FFFFFF" />
            <CustomText style={styles.viewAllText}>더보기</CustomText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </Animated.View>
  );
};

/**
 * PersonaChip Component (Individual persona chip with stagger animation)
 */
const PersonaChip = ({ persona, index, visible, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  // ✅ Staggered appearance animation
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          delay: index * 50, // Stagger by 50ms
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          delay: index * 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible, index, scaleAnim, opacityAnim]);
  
  const imageUrl = persona.selected_dress_image_url || persona.original_url;
  
  return (
    <Animated.View
      style={[
        styles.chipContainer,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.chip}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.chipImage}
          resizeMode="cover"
        />
        <View style={styles.chipOverlay}>
          <CustomText style={styles.chipName} numberOfLines={1}>
            {persona.persona_name}
          </CustomText>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: scale(20),
    left: scale(20),
    zIndex: 150,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: scale(16),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(12),
    // ✅ Glassmorphism
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // ✅ Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: verticalScale(8),
    right: scale(8),
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scrollContent: {
    paddingRight: scale(40), // Space for close button
    gap: scale(12),
  },
  chipContainer: {
    marginRight: scale(8),
  },
  chip: {
    width: scale(80),
    height: scale(100),
    borderRadius: scale(12),
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  chipImage: {
    width: '100%',
    height: '100%',
  },
  chipOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(6),
  },
  chipName: {
    fontSize: scale(12),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  viewAllChip: {
    width: scale(80),
    height: scale(100),
    borderRadius: scale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: verticalScale(4),
  },
  viewAllText: {
    fontSize: scale(12),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default PersonaSelectorPanel;

