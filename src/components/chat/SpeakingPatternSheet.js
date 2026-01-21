/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🗣️ SpeakingPatternSheet Component (Modal-based with Tabs)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Allow users to define persona's speaking patterns
 * 
 * Design: Tab-based UI (3 tabs)
 * ✅ Tab 1: 문장 (greeting + closing phrases)
 * ✅ Tab 2: 자주 쓰는 말 (frequent words)
 * ✅ Tab 3: 나만의 명언 (signature phrases)
 * 
 * Features:
 * ✅ Modal-based (correct z-index)
 * ✅ Tab navigation
 * ✅ Tag/Chip UI
 * ✅ Text truncation (20+ chars → ...)
 * ✅ Space-efficient layout
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
import { CHAT_ENDPOINTS } from '../../config/api.config';


const SpeakingPatternSheet = ({
  isOpen,
  onClose,
  personaKey,
  personaName,
  userKey,
  onSave,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(1000)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  
  // Modal Refs
  const greetingInputRef = useRef(null);
  const closingInputRef = useRef(null);
  const nicknameInputRef = useRef(null);
  const frequentInputRef = useRef(null);
  const signatureInputRef = useRef(null);
  
  // States
  const [activeTab, setActiveTab] = useState('phrase');
  const [greetingPhrases, setGreetingPhrases] = useState([]);
  const [closingPhrases, setClosingPhrases] = useState([]);
  const [myNicknames, setMyNicknames] = useState([]);
  const [frequentWords, setFrequentWords] = useState([]);
  const [signaturePhrases, setSignaturePhrases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const TABS = [
    {
      id: 'phrase',
      icon: '💬',
      title: t('speaking_pattern_sheet.tab_title.phrase'),
      description: '',
    },
    {
      id: 'nickname',
      icon: '👤',
      title: t('speaking_pattern_sheet.tab_title.nickname'),
      description: '',
    },
    /*
    {
      id: 'frequent',
      icon: '✨',
      title: '자주 쓰는 말',
      description: '평소 자주 쓰는 말투나 표현',
    },
    {
      id: 'signature',
      icon: '🌟',
      title: '나만의 명언',
      description: '특별한 상황에서 사용하는 시그니처 문구',
    },
    */
  ];
  
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

        setActiveTab('phrase'),
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
        `${CHAT_ENDPOINTS.SPEAKING_PATTERN}?user_key=${userKey}&persona_key=${personaKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = await response.json();

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🗣️  [SpeakingPatternSheet] Load response:', data);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // ✅ FIX: data.data.speaking_pattern (not data.speaking_pattern)
      if (data.success && data.data?.speaking_pattern) {
        const pattern = data.data.speaking_pattern;
        setGreetingPhrases(pattern.greeting_phrases || []);
        setClosingPhrases(pattern.closing_phrases || []);
        setMyNicknames(pattern.my_nicknames || []);
        setFrequentWords(pattern.frequent_words || []);
        setSignaturePhrases(pattern.signature_phrases || []);
        
        console.log('✅ [SpeakingPatternSheet] Loaded patterns:', {
          greeting: pattern.greeting_phrases?.length || 0,
          closing: pattern.closing_phrases?.length || 0,
          nicknames: pattern.my_nicknames?.length || 0,
          frequent: pattern.frequent_words?.length || 0,
          signature: pattern.signature_phrases?.length || 0,
        });
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
        closing_phrases: closingPhrases,
        my_nicknames: myNicknames,
        frequent_words: frequentWords,
        signature_phrases: signaturePhrases,
      };

      console.log(pattern);
      console.log(userKey);
      console.log(personaKey);
      console.log(CHAT_ENDPOINTS.SPEAKING_PATTERN);
      
      const response = await fetch(
        CHAT_ENDPOINTS.SPEAKING_PATTERN,
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

      console.log(response);
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ [SpeakingPatternSheet] Saved successfully');
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
    setClosingPhrases([]);
    setMyNicknames([]);
    setFrequentWords([]);
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
      case 'closing':
        if (closingPhrases.length < 5 && !closingPhrases.includes(value)) {
          setClosingPhrases([...closingPhrases, value]);
        }
        break;
      case 'nickname':
        if (myNicknames.length < 5 && !myNicknames.includes(value)) {
          setMyNicknames([...myNicknames, value]);
        }
        break;
      case 'frequent':
        if (frequentWords.length < 10 && !frequentWords.includes(value)) {
          setFrequentWords([...frequentWords, value]);
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
      case 'closing':
        setClosingPhrases(closingPhrases.filter((_, i) => i !== index));
        break;
      case 'nickname':
        setMyNicknames(myNicknames.filter((_, i) => i !== index));
        break;
      case 'frequent':
        setFrequentWords(frequentWords.filter((_, i) => i !== index));
        break;
      case 'signature':
        setSignaturePhrases(signaturePhrases.filter((_, i) => i !== index));
        break;
    }
  };
  
  // ═══════════════════════════════════════════════════════════════════════
  // TEXT TRUNCATE HELPER
  // ═══════════════════════════════════════════════════════════════════════
  
  const truncateText = (text, maxLength = 20) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  // ═══════════════════════════════════════════════════════════════════════
  // RENDER TAB BUTTONS
  // ═══════════════════════════════════════════════════════════════════════
  
  const renderTabs = () => {
    return (
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => {
                HapticService.selection();
                setActiveTab(tab.id);
              }}
            >
              <CustomText
                type="normal"
                weight={isActive ? 'bold' : 'normal'}
                color={isActive ? COLORS.DEEP_BLUE : COLORS.TEXT_SECONDARY}
              >
                {tab.icon} {tab.title}
              </CustomText>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };
  
  // ═══════════════════════════════════════════════════════════════════════
  // RENDER TAG SECTION
  // ═══════════════════════════════════════════════════════════════════════
  
  const renderTagSection = (title, subtitle, phrases, type, inputRef, maxCount, shouldTruncate = false) => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <CustomText type="middle" bold color={COLORS.TEXT_PRIMARY}>
            {title}
          </CustomText>
          <CustomText size="xs" color={COLORS.TEXT_TERTIARY} style={{ marginTop: verticalScale(2) }}>
            {subtitle} (최대 {maxCount}개)
          </CustomText>
        </View>
        
        <View style={styles.tagsContainer}>
          {phrases.map((phrase, index) => (
            <View key={index} style={styles.tag}>
              <CustomText size="sm" color={COLORS.TEXT_PRIMARY}>
                {shouldTruncate ? truncateText(phrase, 20) : phrase}
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
  // RENDER TAB CONTENT
  // ═══════════════════════════════════════════════════════════════════════
  
  const renderTabContent = () => {
    const currentTab = TABS.find(tab => tab.id === activeTab);
    
    return (
      <View style={styles.tabContent}>
        {/* Tab Description */}
        <View style={styles.tabDescription}>
          <CustomText size="sm" color={COLORS.TEXT_SECONDARY} style={{ display: 'none' }}>
            {currentTab?.description}
          </CustomText>
        </View>

        <View style={styles.divider}></View>
        
        {/* Tab-specific Content */}
        {activeTab === 'phrase' && (
          <>
            {renderTagSection(
              t('speaking_pattern_sheet.phrases.description'),
              '',
              greetingPhrases,
              'greeting',
              greetingInputRef,
              5,
              false
            )}
            {renderTagSection(
              t('speaking_pattern_sheet.closing_phrases.description'),
              '',
              closingPhrases,
              'closing',
              closingInputRef,
              5,
              false
            )}
          </>
        )}
        
        {activeTab === 'nickname' && (
          <>
            <View style={styles.nicknameWarning}>
              <CustomText size="xs" color="#FF9500" style={{ marginLeft: scale(6), flex: 1 }}>
                {t('speaking_pattern_sheet.nickname.warning', { name: personaName })}
              </CustomText>
            </View>

            {renderTagSection(
              t('speaking_pattern_sheet.nickname.description'),
              '',
              myNicknames,
              'nickname',
              nicknameInputRef,
              5,
              false
            )}
          </>
        )}
        
        {activeTab === 'frequent' && (
          <>
            {renderTagSection(
              '💬 자주 쓰는 말',
              '평소 자주 쓰는 말투나 표현',
              frequentWords,
              'frequent',
              frequentInputRef,
              10,
              true  // ✅ 20자 이상 ... 처리
            )}
          </>
        )}
        
        {activeTab === 'signature' && (
          <>
            {renderTagSection(
              '✨ 나만의 명언',
              '특별한 상황에서 사용하는 시그니처 문구',
              signaturePhrases,
              'signature',
              signatureInputRef,
              3,
              true  // ✅ 20자 이상 ... 처리
            )}
          </>
        )}
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
        presentationStyle="overFullScreen"
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
              <CustomText type="title" bold color={COLORS.TEXT_PRIMARY}>
                🗣️ {t('speaking_pattern_sheet.title', { persona_name: personaName })}
              </CustomText>
            </View>
            
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close" size={scale(24)} color={COLORS.TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>
          
          {/* Tabs */}
          {renderTabs()}
          
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
              renderTabContent()
            )}
          </ScrollView>
          
          {/* Footer Buttons */}
          <View style={styles.footer}>
            <CustomButton
              title={t('common.cancel')}
              onPress={handleClose}
              type="outline"
              size="medium"
              style={styles.resetButton}
              disabled={loading || saving}
            />
            <CustomButton
              title={t('common.save')}
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
        title={t('speaking_pattern_sheet.phrases.title')}
        placeholder={t('speaking_pattern_sheet.phrases.placeholder')}
        leftIcon="text"
        maxLength={20}
        onSave={(value) => handleAddPhrase('greeting', value)}
      />
      <MessageInputOverlay
        ref={closingInputRef}
        title={t('speaking_pattern_sheet.closing_phrases.title')}
        placeholder={t('speaking_pattern_sheet.closing_phrases.placeholder')}
        leftIcon="text"
        maxLength={20}
        onSave={(value) => handleAddPhrase('closing', value)}
      />
      <MessageInputOverlay
        ref={nicknameInputRef}
        title={t('speaking_pattern_sheet.nickname.title')}
        placeholder={t('speaking_pattern_sheet.nickname.placeholder')}
        leftIcon="account"
        maxLength={15}
        onSave={(value) => handleAddPhrase('nickname', value)}
      />
      <MessageInputOverlay
        ref={frequentInputRef}
        title="자주 쓰는 말 추가"
        placeholder="예: ~데요, ~죠!, 완전~"
        leftIcon="text"
        maxLength={30}
        onSave={(value) => handleAddPhrase('frequent', value)}
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
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Tabs
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
    gap: scale(8),
  },
  tab: {
    flex: 1,
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(12),
    backgroundColor: COLORS.CARD_BACKGROUND,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: COLORS.DEEP_BLUE + '15',
    borderColor: COLORS.DEEP_BLUE,
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Tab Content
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  tabContent: {
    flex: 1,
  },
  tabDescription: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
    marginTop: verticalScale(-26),
  },
  
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
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
    flexDirection: 'row',
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
  nicknameWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(12),
    backgroundColor: '#FF9500' + '15',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#FF9500' + '30',
    marginBottom: verticalScale(12),
  },
  divider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginTop: verticalScale(-10),
    marginBottom: verticalScale(22),
  },
});

export default SpeakingPatternSheet;
