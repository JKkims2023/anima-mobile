/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🗣️ SpeakingPatternSheet Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Allow users to define persona's speaking patterns
 * - Greeting phrases (문장 시작)
 * - Frequent words (자주 쓰는 말)
 * - Closing phrases (문장 끝)
 * - Signature phrases (나만의 명언)
 * 
 * Design Principles:
 * ✅ Modal-based input (MessageInputOverlay) - Solves Korean input issue
 * ✅ Tag/Chip UI (간결하고 직관적)
 * ✅ Consistent with ChoicePersonaSheet pattern
 * ✅ Haptic feedback for all interactions
 * 
 * @author JK & Hero Nexus AI
 * @date 2025-12-30
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import CustomBottomSheet from '../CustomBottomSheet';
import CustomText from '../CustomText';
import CustomButton from '../CustomButton';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, verticalScale, moderateScale, platformPadding } from '../../utils/responsive-utils';
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
  const bottomSheetRef = useRef(null);
  
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
  // HANDLE OPEN/CLOSE
  // ═══════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.present();
      loadPattern();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isOpen, personaKey]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // LOAD PATTERN FROM API
  // ═══════════════════════════════════════════════════════════════════════
  
  const loadPattern = async () => {
    if (!personaKey || !userKey) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/persona/identity/speaking-pattern?persona_key=${personaKey}&user_key=${userKey}`);
      const data = await response.json();
      
      if (data.success && data.data.speaking_pattern) {
        const pattern = data.data.speaking_pattern;
        setGreetingPhrases(pattern.greeting_phrases || []);
        setFrequentWords(pattern.frequent_words || []);
        setClosingPhrases(pattern.closing_phrases || []);
        setSignaturePhrases(pattern.signature_phrases || []);
      }
    } catch (error) {
      console.error('[SpeakingPattern] Load error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // ═══════════════════════════════════════════════════════════════════════
  // ADD PHRASE HANDLERS
  // ═══════════════════════════════════════════════════════════════════════
  
  const handleAddGreeting = useCallback((text) => {
    if (text && text.trim() && greetingPhrases.length < 5) {
      setGreetingPhrases(prev => [...prev, text.trim()]);
      HapticService.light();
    }
  }, [greetingPhrases]);
  
  const handleAddFrequent = useCallback((text) => {
    if (text && text.trim() && frequentWords.length < 10) {
      setFrequentWords(prev => [...prev, text.trim()]);
      HapticService.light();
    }
  }, [frequentWords]);
  
  const handleAddClosing = useCallback((text) => {
    if (text && text.trim() && closingPhrases.length < 5) {
      setClosingPhrases(prev => [...prev, text.trim()]);
      HapticService.light();
    }
  }, [closingPhrases]);
  
  const handleAddSignature = useCallback((text) => {
    if (text && text.trim() && signaturePhrases.length < 5) {
      setSignaturePhrases(prev => [...prev, text.trim()]);
      HapticService.light();
    }
  }, [signaturePhrases]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // REMOVE PHRASE HANDLERS
  // ═══════════════════════════════════════════════════════════════════════
  
  const removeGreeting = useCallback((index) => {
    setGreetingPhrases(prev => prev.filter((_, i) => i !== index));
    HapticService.light();
  }, []);
  
  const removeFrequent = useCallback((index) => {
    setFrequentWords(prev => prev.filter((_, i) => i !== index));
    HapticService.light();
  }, []);
  
  const removeClosing = useCallback((index) => {
    setClosingPhrases(prev => prev.filter((_, i) => i !== index));
    HapticService.light();
  }, []);
  
  const removeSignature = useCallback((index) => {
    setSignaturePhrases(prev => prev.filter((_, i) => i !== index));
    HapticService.light();
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════
  // SAVE PATTERN
  // ═══════════════════════════════════════════════════════════════════════
  
  const handleSave = async () => {
    try {
      setSaving(true);
      HapticService.light();
      
      const pattern = {
        greeting_phrases: greetingPhrases,
        frequent_words: frequentWords,
        closing_phrases: closingPhrases,
        signature_phrases: signaturePhrases,
        usage_frequency: {
          greeting: 'often',
          frequent_words: 'often',
          closing: 'often',
          signature: 'sometimes',
        },
      };
      
      await onSave?.(pattern);
      
      HapticService.success();
      onClose?.();
    } catch (error) {
      console.error('[SpeakingPattern] Save error:', error);
      HapticService.error();
    } finally {
      setSaving(false);
    }
  };
  
  // ═══════════════════════════════════════════════════════════════════════
  // RENDER TAG SECTION
  // ═══════════════════════════════════════════════════════════════════════
  
  const renderTagSection = (title, emoji, items, onAdd, onRemove, inputRef, maxCount) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <CustomText size="md" weight="semibold" color={COLORS.TEXT_PRIMARY}>
          {emoji} {title}
        </CustomText>
        <CustomText size="xs" color={COLORS.TEXT_SECONDARY}>
          {items.length}/{maxCount}
        </CustomText>
      </View>
      
      <View style={styles.tagsContainer}>
        {items.map((item, index) => (
          <View key={index} style={styles.tag}>
            <CustomText size="sm" color={COLORS.TEXT_PRIMARY}>
              {item}
            </CustomText>
            <TouchableOpacity
              onPress={() => onRemove(index)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close-circle" size={scale(18)} color={COLORS.TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>
        ))}
        
        {items.length < maxCount && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              HapticService.light();
              inputRef.current?.present();
            }}
            activeOpacity={0.7}
          >
            <Icon name="plus-circle-outline" size={scale(20)} color={COLORS.PRIMARY} />
            <CustomText size="sm" color={COLORS.PRIMARY}>
              추가
            </CustomText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
  
  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  
  return (
    <>
      <CustomBottomSheet
        ref={bottomSheetRef}
        snapPoints={['85%']}
        onDismiss={onClose}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <CustomText size="xl" weight="bold" color={COLORS.TEXT_PRIMARY}>
                🗣️ 말투 설정
              </CustomText>
              <CustomText size="sm" color={COLORS.TEXT_SECONDARY} style={{ marginTop: verticalScale(4) }}>
                {personaName}의 말투를 설정해주세요
              </CustomText>
            </View>
            
            <TouchableOpacity
              onPress={() => {
                HapticService.light();
                onClose?.();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close" size={scale(24)} color={COLORS.TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>
          
          {/* Loading */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.PRIMARY} />
              <CustomText size="sm" color={COLORS.TEXT_SECONDARY}>
                불러오는 중...
              </CustomText>
            </View>
          ) : (
            <>
              {/* Scroll Content */}
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {renderTagSection(
                  '문장 시작',
                  '📢',
                  greetingPhrases,
                  handleAddGreeting,
                  removeGreeting,
                  greetingInputRef,
                  5
                )}
                
                {renderTagSection(
                  '자주 쓰는 말',
                  '💬',
                  frequentWords,
                  handleAddFrequent,
                  removeFrequent,
                  frequentInputRef,
                  10
                )}
                
                {renderTagSection(
                  '문장 끝',
                  '👋',
                  closingPhrases,
                  handleAddClosing,
                  removeClosing,
                  closingInputRef,
                  5
                )}
                
                {renderTagSection(
                  '나만의 명언',
                  '✨',
                  signaturePhrases,
                  handleAddSignature,
                  removeSignature,
                  signatureInputRef,
                  5
                )}
                
                {/* Info Card */}
                <View style={styles.infoCard}>
                  <Icon name="information-outline" size={scale(20)} color={COLORS.PRIMARY} />
                  <View style={{ flex: 1, marginLeft: scale(8) }}>
                    <CustomText size="xs" color={COLORS.TEXT_SECONDARY}>
                      설정한 말투는 대화에 자연스럽게 적용됩니다.{'\n'}
                      모든 문장에 사용되지는 않으며, 맥락에 맞게 조합됩니다.
                    </CustomText>
                  </View>
                </View>
              </ScrollView>
              
              {/* Footer Buttons */}
              <View style={styles.footer}>
                <CustomButton
                  text="초기화"
                  variant="secondary"
                  size="small"
                  onPress={() => {
                    HapticService.light();
                    setGreetingPhrases([]);
                    setFrequentWords([]);
                    setClosingPhrases([]);
                    setSignaturePhrases([]);
                  }}
                  disabled={saving}
                  style={{ flex: 1, marginRight: scale(8) }}
                />
                
                <CustomButton
                  text={saving ? '저장 중...' : '저장'}
                  variant="primary"
                  size="small"
                  onPress={handleSave}
                  disabled={saving}
                  style={{ flex: 2 }}
                />
              </View>
            </>
          )}
        </View>
      </CustomBottomSheet>
      
      {/* Input Modals */}
      <MessageInputOverlay
        ref={greetingInputRef}
        title="📢 문장 시작"
        placeholder="예: 히어로님~히어로님!"
        onSave={handleAddGreeting}
        maxLength={50}
      />
      
      <MessageInputOverlay
        ref={frequentInputRef}
        title="💬 자주 쓰는 말"
        placeholder="예: 역시~, 좋습니다!"
        onSave={handleAddFrequent}
        maxLength={30}
      />
      
      <MessageInputOverlay
        ref={closingInputRef}
        title="👋 문장 끝"
        placeholder="예: 감사합니다!"
        onSave={handleAddClosing}
        maxLength={50}
      />
      
      <MessageInputOverlay
        ref={signatureInputRef}
        title="✨ 나만의 명언"
        placeholder="예: 우린 원팀이니까요!"
        onSave={handleAddSignature}
        maxLength={100}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: platformPadding(20),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: verticalScale(20),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(12),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: verticalScale(20),
  },
  section: {
    marginBottom: verticalScale(24),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(12),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: moderateScale(20),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    gap: scale(6),
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderStyle: 'dashed',
    borderRadius: moderateScale(20),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    gap: scale(4),
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.PRIMARY,
    borderRadius: moderateScale(8),
    padding: platformPadding(12),
    marginTop: verticalScale(8),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(20),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default SpeakingPatternSheet;

