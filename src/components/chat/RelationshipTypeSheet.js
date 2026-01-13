/**
 * 🤝 RelationshipTypeSheet - Relationship Selection
 * 
 * "우리의 관계를 선택해주세요!"
 * 
 * Features:
 * - 5가지 관계 타입 선택
 * - 확장 가능한 구조
 * - 세련된 UI
 * - 직관적 인터랙션
 * 
 * @author JK & Hero Nexus
 * @date 2026-01-13
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomText from '../CustomText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, verticalScale, moderateScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';

/**
 * 🤝 관계 타입 정의
 */
const RELATIONSHIP_TYPES = [
  { 
    id: 'self', 
    emoji: '🪞', 
    label: '나 자신',
    description: '성찰하는 자아',
    color: '#A78BFA', // Purple
  },
  { 
    id: 'lover', 
    emoji: '💕', 
    label: '연인',
    description: '다정한 동반자',
    color: '#F472B6', // Pink
  },
  { 
    id: 'friend', 
    emoji: '👋', 
    label: '친구',
    description: '편안한 친구',
    color: '#60A5FA', // Blue (Default)
  },
  { 
    id: 'idol', 
    emoji: '⭐', 
    label: '우상',
    description: '존경하는 대상',
    color: '#FBBF24', // Yellow
  },
  { 
    id: 'free', 
    emoji: '✨', 
    label: '자유관계',
    description: '처음 만난 관계',
    subDescription: '연인, 친구, 원수... 어떤 관계로든 발전 가능',
    color: '#34D399', // Green
  },
];

const RelationshipTypeSheet = ({
  isOpen = false,
  onClose,
  currentRelationship = '',
  onSelect, // (relationshipId) => void
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(600)).current;
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ANIMATION EFFECTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  useEffect(() => {
    if (isOpen) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HANDLERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const handleSelect = (relationshipId) => {
    HapticService.light();
    onSelect(relationshipId);
    
    // 선택 후 자동 닫기 (200ms 딜레이)
    setTimeout(() => {
      onClose();
    }, 200);
  };
  
  const handleBackdropPress = () => {
    HapticService.light();
    onClose();
  };
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  if (!isOpen) return null;
  
  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1}
          onPress={handleBackdropPress}
        />
        
        {/* Sheet */}
        <Animated.View 
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom || platformPadding(20),
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handleBar} />
            <CustomText type="title" bold style={styles.headerTitle}>
              🤝 우리의 관계를 선택해주세요
            </CustomText>
            <CustomText type="small" style={styles.headerSubtitle}>
              페르소나와의 관계는 대화 스타일에 영향을 줍니다
            </CustomText>
          </View>
          
          {/* Relationship Options */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {RELATIONSHIP_TYPES.map((relationship) => {
              const isSelected = currentRelationship === relationship.id;
              
              return (
                <TouchableOpacity
                  key={relationship.id}
                  style={[
                    styles.relationshipItem,
                    isSelected && styles.relationshipItemSelected,
                    { borderColor: relationship.color + '40' },
                  ]}
                  onPress={() => handleSelect(relationship.id)}
                  activeOpacity={0.7}
                >
                  {/* Emoji & Label */}
                  <View style={styles.relationshipHeader}>
                    <View style={styles.relationshipEmojiContainer}>
                      <CustomText style={styles.relationshipEmoji}>
                        {relationship.emoji}
                      </CustomText>
                    </View>
                    <CustomText type="middle" bold style={styles.relationshipLabel}>
                      {relationship.label}
                    </CustomText>
                    {isSelected && (
                      <Icon 
                        name="check-circle" 
                        size={moderateScale(24)} 
                        color={relationship.color} 
                        style={styles.checkIcon}
                      />
                    )}
                  </View>
                  
                  {/* Description */}
                  <CustomText type="small" style={styles.relationshipDescription}>
                    {relationship.description}
                  </CustomText>
                  
                  {/* Sub Description (if exists) */}
                  {relationship.subDescription && (
                    <CustomText 
                      type="small" 
                      style={[styles.relationshipDescription, styles.relationshipSubDescription]}
                    >
                      {relationship.subDescription}
                    </CustomText>
                  )}
                </TouchableOpacity>
              );
            })}
            
            {/* Info Message */}
            <View style={styles.infoMessage}>
              <Icon name="information" size={moderateScale(20)} color={COLORS.DEEP_BLUE} />
              <CustomText type="small" style={styles.infoText}>
                관계는 나중에 변경할 수 없으니 신중히 선택해주세요
              </CustomText>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STYLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: COLORS.BACKGROUND,
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingTop: platformPadding(12),
    maxHeight: '80%',
  },
  handleBar: {
    width: scale(40),
    height: verticalScale(4),
    backgroundColor: COLORS.TEXT_TERTIARY,
    borderRadius: moderateScale(2),
    alignSelf: 'center',
    marginBottom: verticalScale(16),
  },
  header: {
    paddingHorizontal: platformPadding(20),
    paddingBottom: platformPadding(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.DIVIDER,
  },
  headerTitle: {
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: verticalScale(6),
  },
  headerSubtitle: {
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: platformPadding(20),
    paddingTop: platformPadding(16),
    paddingBottom: platformPadding(20),
  },
  relationshipItem: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: moderateScale(16),
    borderWidth: 2,
    borderColor: COLORS.DIVIDER,
    paddingVertical: verticalScale(16),
    paddingHorizontal: platformPadding(16),
    marginBottom: verticalScale(12),
  },
  relationshipItemSelected: {
    backgroundColor: COLORS.DEEP_BLUE + '10',
  },
  relationshipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  relationshipEmojiContainer: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: COLORS.BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  relationshipEmoji: {
    fontSize: moderateScale(24),
  },
  relationshipLabel: {
    flex: 1,
    color: COLORS.TEXT_PRIMARY,
  },
  checkIcon: {
    marginLeft: scale(8),
  },
  relationshipDescription: {
    color: COLORS.TEXT_SECONDARY,
    marginLeft: scale(56),
    lineHeight: moderateScale(18),
  },
  relationshipSubDescription: {
    marginTop: verticalScale(4),
    fontStyle: 'italic',
    opacity: 0.8,
  },
  infoMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(8),
    paddingVertical: verticalScale(12),
    paddingHorizontal: platformPadding(12),
    backgroundColor: COLORS.DEEP_BLUE + '10',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: COLORS.DEEP_BLUE + '30',
  },
  infoText: {
    flex: 1,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: scale(8),
  },
});

export default RelationshipTypeSheet;
