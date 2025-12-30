/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🗣️ SpeakingPatternSheet Component (Modal-based)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Allow users to define persona's speaking patterns
 * - Greeting phrases (문장 시작)
 * - Frequent words (자주 쓰는 말)
 * - Closing phrases (문장 끝)
 * - Signature phrases (나만의 명언)
 * 
 * Design Principles:
 * ✅ Modal-based (for correct z-index above ManagerAIOverlay)
 * ✅ Modal-based input (MessageInputOverlay) - Solves Korean input issue
 * ✅ Tag/Chip UI (간결하고 직관적)
 * ✅ Animated slide-up effect
 * ✅ Haptic feedback for all interactions
 * 
 * @author JK & Hero Nexus AI
 * @date 2025-12-30
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomText from '../CustomText';
import CustomButton from '../CustomButton';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, verticalScale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';
import MessageInputOverlay from '../message/MessageInputOverlay';

const SpeakingPatternSheet = ({
  isOpen,
  onClose,
  personaKey,
  personaName,
  userKey,
  onSave, // (pattern) => Promise<void>
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(1000)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  
  // Modal Refs for Input Overlays
  const greetingInputRef = useRef(null);
  const frequentInputRef = useRef(null);
  const closingInputRef = useRef(null);
  const signatureInputRef = useRef(null);
  
  // States
  const [greetingPhrases, setGreetingPhrases] = useState([]);
  const [frequentWords, setFrequentWords] = useState([]);
  const [closingPhrases, setClosingPhrases] = useState([]);
  const [signaturePhrases, setSignaturePhrases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // ═══════════════════════════════════════════════════════════════════════
  // ANIMATION EFFECTS
  // ═══════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
      loadPattern();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1000,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, personaKey]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // LOAD PATTERN FROM API
  // ═══════════════════════════════════════════════════════════════════════
  
  const loadPattern = async () => {
    if (!personaKey || !userKey) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(
        `${process.env.IDOL_COMPANION_BASE_URL}/api/persona/identity/speaking-pattern?user_key=${userKey}&persona_key=${personaKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = await response.json();
      
      if (data.success && data.speaking_pattern) {
        setGreetingPhrases(data.speaking_pattern.greeting_phrases || []);
        setFrequentWords(data.speaking_pattern.frequent_words || []);
        setClosingPhrases(data.speaking_pattern.closing_phrases || []);
        setSignaturePhrases(data.speaking_pattern.signature_phrases || []);
      }
    } catch (error) {
      console.error('[SpeakingPatternSheet] Load error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // ═══════════════════════════════════════════════════════════════════════
  // SAVE PATTERN TO API
  // ═══════════════════════════════════════════════════════════════════════
  
  const handleSave = async () => {
    if (!personaKey || !userKey) return;
    
    try {
      setSaving(true);
      HapticService.success();
      
      const pattern = {
        greeting_phrases: greetingPhrases,
        frequent_words: frequentWords,
        closing_phrases: closingPhrases,
        signature_phrases: signaturePhrases,
      };
      
      const response = await fetch(
        `${process.env.IDOL_COMPANION_BASE_URL}/api/persona/identity/speaking-pattern`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_key: userKey,
            persona_key: personaKey,
            speaking_pattern: pattern,
          }),
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        onSave?.(pattern);
        onClose?.();
      } else {
        console.error('[SpeakingPatternSheet] Save failed:', data.error);
      }
    } catch (error) {
      console.error('[SpeakingPatternSheet] Save error:', error);
    } finally {
      setSaving(false);
    }
  };
  
  // ═══════════════════════════════════════════════════════════════════════
  // RESET PATTERN
  // ═══════════════════════════════════════════════════════════════════════
  
  const handleReset = () => {
    HapticService.light();
    setGreetingPhrases([]);
    setFrequentWords([]);
    setClosingPhrases([]);
    setSignaturePhrases([]);
  };
  
  // ═══════════════════════════════════════════════════════════════════════
  // ADD/REMOVE HANDLERS
  // ═══════════════════════════════════════════════════════════════════════
  
  const handleAddPhrase = (type, value) => {
    if (!value || !value.trim()) return;
    
    HapticService.selection();
    
    switch (type) {
      case 'greeting':
        if (greetingPhrases.length < 5 && !greetingPhrases.includes(value)) {
          setGreetingPhrases([...greetingPhrases, value]);
        }
        break;
      case 'frequent':
        if (frequentWords.length < 10 && !frequentWords.includes(value)) {
          setFrequentWords([...frequentWords, value]);
        }
        break;
      case 'closing':
        if (closingPhrases.length < 5 && !closingPhrases.includes(value)) {
          setClosingPhrases([...closingPhrases, value]);
        }
        break;
      case 'signature':
        if (signaturePhrases.length < 3 && !signaturePhrases.includes(value)) {
          setSignaturePhrases([...signaturePhrases, value]);
        }
        break;
    }
  };
  
  const handleRemovePhrase = (type, index) => {
    HapticService.light();
    
    switch (type) {
      case 'greeting':
        setGreetingPhrases(greetingPhrases.filter((_, i) => i !== index));
        break;
      case 'frequent':
        setFrequentWords(frequentWords.filter((_, i) => i !== index));
        break;
      case 'closing':
        setClosingPhrases(closingPhrases.filter((_, i) => i !== index));
        break;
      case 'signature':
        setSignaturePhrases(signaturePhrases.filter((_, i) => i !== index));
        break;
    }
  };
  
  // ═══════════════════════════════════════════════════════════════════════
  // RENDER PATTERN SECTION
  // ═══════════════════════════════════════════════════════════════════════
  
  const renderPatternSection = (title, icon, description, phrases, type, inputRef, maxCount) => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <CustomText size="md" weight="bold" color={COLORS.TEXT_PRIMARY}>
            {icon} {title}
          </CustomText>
          <CustomText size="xs" color={COLORS.TEXT_TERTIARY} style={{ marginTop: verticalScale(2) }}>
            {description} (최대 {maxCount}개)
          </CustomText>
        </View>
        
        <View style={styles.tagsContainer}>
          {phrases.map((phrase, index) => (
            <View key={index} style={styles.tag}>
              <CustomText size="sm" color={COLORS.TEXT_PRIMARY}>
                {phrase}
              </CustomText>
              <TouchableOpacity
                onPress={() => handleRemovePhrase(type, index)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Icon name="close-circle" size={moderateScale(16)} color={COLORS.TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>
          ))}
          
          {phrases.length < maxCount && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                HapticService.light();
                inputRef.current?.present();
              }}
            >
              <Icon name="plus-circle" size={moderateScale(20)} color={COLORS.DEEP_BLUE} />
              <CustomText size="sm" color={COLORS.DEEP_BLUE} style={{ marginLeft: scale(4) }}>
                추가
              </CustomText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };
  
  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════
  
  const handleClose = () => {
    HapticService.light();
    onClose?.();
  };
  
  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  
  if (!isOpen) return null;
  
  return (
    <>
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        {/* Backdrop */}
        <TouchableOpacity 
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View 
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: 'rgba(0,0,0,0.7)',
                opacity: backdropOpacity,
              }
            ]} 
          />
        </TouchableOpacity>
        
        {/* Modal Container */}
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              paddingBottom: insets.bottom + verticalScale(20),
              transform: [{ translateY: slideAnim }],
            },
          ]}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>
          
          {/* Header */}
          <View style={styles.header}>
            <View>
              <CustomText size="xl" weight="bold" color={COLORS.TEXT_PRIMARY}>
                🗣️ 말투 설정
              </CustomText>
              <CustomText size="sm" color={COLORS.TEXT_SECONDARY} style={{ marginTop: verticalScale(4) }}>
                {personaName}의 자연스러운 말투를 설정하세요
              </CustomText>
            </View>
            
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close" size={scale(24)} color={COLORS.TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>
          
          {/* Content */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.DEEP_BLUE} />
                <CustomText size="sm" color={COLORS.TEXT_SECONDARY} style={{ marginTop: verticalScale(12) }}>
                  불러오는 중...
                </CustomText>
              </View>
            ) : (
              <>
                {renderPatternSection(
                  '문장 시작',
                  '📢',
                  '대화 시작이나 주제 전환 시 사용',
                  greetingPhrases,
                  'greeting',
                  greetingInputRef,
                  5
                )}
                
                {renderPatternSection(
                  '자주 쓰는 말',
                  '💬',
                  '평소 자주 쓰는 말투나 표현',
                  frequentWords,
                  'frequent',
                  frequentInputRef,
                  10
                )}
                
                {renderPatternSection(
                  '문장 끝',
                  '👋',
                  '문장을 마무리하는 표현',
                  closingPhrases,
                  'closing',
                  closingInputRef,
                  5
                )}
                
                {renderPatternSection(
                  '나만의 명언',
                  '✨',
                  '특별한 상황에서 사용하는 시그니처 문구',
                  signaturePhrases,
                  'signature',
                  signatureInputRef,
                  3
                )}
              </>
            )}
          </ScrollView>
          
          {/* Footer Buttons */}
          <View style={styles.footer}>
            <CustomButton
              title="초기화"
              onPress={handleReset}
              type="outline"
              size="medium"
              style={styles.resetButton}
              disabled={loading || saving}
            />
            <CustomButton
              title="저장"
              onPress={handleSave}
              type="primary"
              size="medium"
              style={styles.saveButton}
              disabled={loading}
              loading={saving}
            />
          </View>
          
          {saving && (
            <View style={styles.savingOverlay}>
              <ActivityIndicator size="small" color={COLORS.DEEP_BLUE} />
              <CustomText size="sm" color={COLORS.TEXT_SECONDARY} style={{ marginLeft: scale(8) }}>
                저장 중...
              </CustomText>
            </View>
          )}
        </Animated.View>
      </Modal>
      
      {/* Input Overlays */}
      <MessageInputOverlay
        ref={greetingInputRef}
        title="문장 시작 추가"
        placeholder="예: 히어로님~!, 오늘도~, 역시~"
        leftIcon="text"
        maxLength={20}
        onSave={(value) => handleAddPhrase('greeting', value)}
      />
      <MessageInputOverlay
        ref={frequentInputRef}
        title="자주 쓰는 말 추가"
        placeholder="예: ~데요, ~죠!, 완전~"
        leftIcon="text"
        maxLength={15}
        onSave={(value) => handleAddPhrase('frequent', value)}
      />
      <MessageInputOverlay
        ref={closingInputRef}
        title="문장 끝 추가"
        placeholder="예: ~해요!, 감사합니다!, ~할게요!"
        leftIcon="text"
        maxLength={20}
        onSave={(value) => handleAddPhrase('closing', value)}
      />
      <MessageInputOverlay
        ref={signatureInputRef}
        title="나만의 명언 추가"
        placeholder="예: 우린 원팀이니까요!"
        leftIcon="star"
        maxLength={50}
        onSave={(value) => handleAddPhrase('signature', value)}
      />
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.BACKGROUND,
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: verticalScale(12),
  },
  handle: {
    width: scale(40),
    height: verticalScale(4),
    backgroundColor: COLORS.TEXT_TERTIARY,
    borderRadius: moderateScale(2),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.DIVIDER,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(100),
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(40),
  },
  section: {
    marginBottom: verticalScale(24),
  },
  sectionHeader: {
    marginBottom: verticalScale(12),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: COLORS.DIVIDER,
    gap: scale(6),
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    backgroundColor: 'transparent',
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: COLORS.DEEP_BLUE,
    borderStyle: 'dashed',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
    borderTopWidth: 1,
    borderTopColor: COLORS.DIVIDER,
    gap: scale(12),
  },
  resetButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
  savingOverlay: {
    position: 'absolute',
    bottom: verticalScale(100),
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    backgroundColor: COLORS.BACKGROUND,
  },
});

export default SpeakingPatternSheet;
