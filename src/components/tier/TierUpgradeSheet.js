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

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
import { scale, verticalScale, moderateScale ,platformPadding} from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';
import MessageInputOverlay from '../message/MessageInputOverlay';
import { CHAT_ENDPOINTS } from '../../config/api.config';
import { useAnima } from '../../contexts/AnimaContext';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎖️ TIER CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TIER_CONFIG = {
  basic: {
    key: 'basic',
    name: 'Basic',
    emoji: '🌟',
    color: '#9CA3AF', // Gray
    gradient: ['#6B7280', '#9CA3AF'],
    price: '무료',
    features: [
      { icon: '💬', text: '일일 채팅 20회' },
      { icon: '🎭', text: '페르소나 생성 1개' },
      { icon: '👗', text: '드레스 생성 제한' },
      { icon: '🎵', text: '음악 생성 제한' },
      { icon: '📱', text: '기본 기능 사용' },
    ],
  },
  premium: {
    key: 'premium',
    name: 'Premium',
    emoji: '💎',
    color: '#3B82F6', // Blue
    gradient: ['#2563EB', '#3B82F6'],
    price: '₩9,900/월',
    features: [
      { icon: '💬', text: '일일 채팅 100회' },
      { icon: '🎭', text: '페르소나 생성 5개' },
      { icon: '👗', text: '드레스 무제한 생성' },
      { icon: '🎵', text: '음악 생성 월 10회' },
      { icon: '🎬', text: '비디오 변환 할인' },
      { icon: '✨', text: '프리미엄 기능 우선 체험' },
    ],
  },
  ultimate: {
    key: 'ultimate',
    name: 'Ultimate',
    emoji: '👑',
    color: '#8B5CF6', // Purple
    gradient: ['#7C3AED', '#8B5CF6'],
    price: '₩19,900/월',
    features: [
      { icon: '💬', text: '일일 채팅 무제한' },
      { icon: '🎭', text: '페르소나 생성 10개' },
      { icon: '👗', text: '드레스 무제한 생성' },
      { icon: '🎵', text: '음악 생성 무제한' },
      { icon: '🎬', text: '비디오 변환 무료' },
      { icon: '🚀', text: '최신 AI 모델 우선 적용' },
      { icon: '💝', text: '특별 이벤트 초대' },
    ],
  },
};

const TIER_ORDER = ['basic', 'premium', 'ultimate'];


const TierUpgradeSheet = ({
  isOpen,
  onClose,
  currentTier = 'basic',
  userKey,
  onUpgradeSuccess,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(1000)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const { showAlert } = useAnima();
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


  //==== real data ====//

  const [selectedTier, setSelectedTier] = useState(currentTier);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎯 Current & Selected Tier Info
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const currentTierConfig = useMemo(() => TIER_CONFIG[currentTier] || TIER_CONFIG.basic, [currentTier]);
  const selectedTierConfig = useMemo(() => TIER_CONFIG[selectedTier] || TIER_CONFIG.basic, [selectedTier]);
  
  // Check if upgrade is possible (selected tier is higher than current)
  const canUpgrade = useMemo(() => {
    const currentIndex = TIER_ORDER.indexOf(currentTier);
    const selectedIndex = TIER_ORDER.indexOf(selectedTier);
    return selectedIndex > currentIndex;
  }, [currentTier, selectedTier]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎯 Handlers
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const handleTierSelect = useCallback((tier) => {
    HapticService.light();
    setSelectedTier(tier);
    setIsDropdownOpen(false);
  }, []);
  
  const handleUpgrade = useCallback(async () => {
    if (!canUpgrade) {
      
      HapticService.warning();
      showAlert({
        emoji: '⚠️',
        title: t('tier.already_at_tier_title'),
        message: t('tier.already_at_tier_message', { tier: selectedTierConfig.name }),
        buttons: [{ text: t('common.confirm'), style: 'primary', onPress: () => {} }],
      });
      return;
    }
    
    if (!userKey) {
      HapticService.warning();
      showAlert({
        emoji: '⚠️',
        title: t('common.login_guide.title'),
        message: t('common.login_guide.description'),
        buttons: [{ text: t('common.confirm'), style: 'primary', onPress: () => {} }],
      });
      return;
    }
    
    try {
      setIsUpgrading(true);
      HapticService.medium();
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 💳 TODO: Payment Integration (Google Pay / Apple Pay)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      /*
      const paymentResult = await processPayment({
        user_key: userKey,
        tier: selectedTier,
        amount: getPaymentAmount(selectedTier),
        platform: Platform.OS === 'ios' ? 'apple' : 'google',
      });
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment failed');
      }
      */
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🔄 API Call: Update user tier
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      
      const response = await fetch(
        'https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/user/upgrade-tier',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_key: userKey,
            new_tier: selectedTier,
          }),
        }
      );
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Upgrade failed');
      }
      
      // ✅ Success!
      HapticService.success();
      
      showAlert({
        emoji: '🎉',
        title: t('tier.upgrade_success_title'),
        message: t('tier.upgrade_success_message', { tier: selectedTierConfig.name }),
        buttons: [
          {
            text: t('common.confirm'),
            style: 'primary',
            onPress: () => {
              // Notify parent component
              if (onUpgradeSuccess) {
                onUpgradeSuccess(selectedTier);
              }
              
              // Close sheet
              onClose();
            },
          },
        ],
      });
      
    } catch (error) {
      console.error('❌ [TierUpgrade] Error:', error);
      HapticService.error();
      
      showAlert({
        emoji: '❌',
        title: t('tier.upgrade_error_title'),
        message: error.message || t('tier.upgrade_error_message'),
        buttons: [{ text: t('common.confirm'), style: 'primary', onPress: () => {} }],
      });
    } finally {
      setIsUpgrading(false);
    }
  }, [canUpgrade, userKey, selectedTier, selectedTierConfig, showAlert, t, onUpgradeSuccess, onClose]);
  
  
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

        setIsDropdownOpen(false),
        setSelectedTier(currentTier),
      ]).start();
    }
  }, [isOpen]);
      
  // ═══════════════════════════════════════════════════════════════════════
  // TEXT TRUNCATE HELPER
  // ═══════════════════════════════════════════════════════════════════════
  
  const truncateText = (text, maxLength = 20) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
  
  const handleClose = useCallback(() => {
    HapticService.light();
    setIsDropdownOpen(false);
    setSelectedTier(currentTier);
    onClose();
  }, [onClose, currentTier]);
  
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
              <CustomText type="title" bold color={COLORS.TEXT_PRIMARY}>
              🎖️ {t('tier.upgrade_title')}
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
              <View>
                <CustomText type="title" style={styles.headerSubtitle}>
                  {t('tier.current_tier', '현재 티어')}: {currentTierConfig.emoji} {currentTierConfig.name}
                </CustomText>

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {/* Tier Selection Dropdown */}
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            
                <View style={styles.section}>
                  <CustomText type="medium" bold style={styles.sectionTitle}>
                    {t('tier.select_tier', '티어 선택')}
                  </CustomText>
                  
                  <TouchableOpacity
                    style={[
                      styles.dropdown,
                      { borderColor: selectedTierConfig.color },
                      isDropdownOpen && styles.dropdownOpen,
                    ]}
                    onPress={() => {
                      HapticService.light();
                      setIsDropdownOpen(!isDropdownOpen);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownSelected}>
                      <CustomText type="huge" style={styles.dropdownEmoji}>
                        {selectedTierConfig.emoji}
                      </CustomText>
                      <View style={styles.dropdownTextContainer}>
                        <CustomText type="medium" bold style={styles.dropdownText}>
                          {selectedTierConfig.name}
                        </CustomText>
                        <CustomText type="small" style={styles.dropdownPrice}>
                          {selectedTierConfig.price}
                        </CustomText>
                      </View>
                    </View>
                    
                    <Icon
                      name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
                      size={moderateScale(20)}
                      color={COLORS.TEXT_PRIMARY}
                    />
                  </TouchableOpacity>

                  {/* Dropdown Options */}
                  {isDropdownOpen && (
                   <View style={styles.dropdownOptions}>

                    {TIER_ORDER.map((tierKey) => {
                    const tierConfig = TIER_CONFIG[tierKey];
                    const isSelected = tierKey === selectedTier;
                    const isCurrent = tierKey === currentTier;
                    
                    return (
                      <TouchableOpacity
                        key={tierKey}
                        style={[
                          styles.dropdownOption,
                          isSelected && styles.dropdownOptionSelected,
                          { borderLeftColor: tierConfig.color },
                        ]}
                        onPress={() => handleTierSelect(tierKey)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.dropdownOptionContent}>
                          <CustomText type="huge" style={styles.dropdownOptionEmoji}>
                            {tierConfig.emoji}
                          </CustomText>
                          <View style={styles.dropdownOptionTextContainer}>
                            <View style={styles.dropdownOptionHeader}>
                              <CustomText type="medium" bold style={styles.dropdownOptionText}>
                                {tierConfig.name}
                              </CustomText>
                              {isCurrent && (
                                <View style={styles.currentBadge}>
                                  <CustomText type="tiny" bold style={styles.currentBadgeText}>
                                    {t('tier.current', '현재')}
                                  </CustomText>
                                </View>
                              )}
                            </View>
                            <CustomText type="small" style={styles.dropdownOptionPrice}>
                              {tierConfig.price}
                            </CustomText>
                          </View>
                        </View>
                        
                        {isSelected && (
                          <Icon name="checkmark-circle" size={moderateScale(24)} color={tierConfig.color} />
                        )}
                      </TouchableOpacity>
                    );
                    })}

                  </View>
                  )}

                </View>

                <View style={styles.section}>
                <CustomText type="medium" bold style={styles.sectionTitle}>
                  {t('tier.features', '포함된 기능')}
                </CustomText>
                
                <View style={[styles.tierCard, { borderColor: selectedTierConfig.color }]}>
                  {selectedTierConfig.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <CustomText type="medium" style={styles.featureIcon}>
                        {feature.icon}
                      </CustomText>
                      <CustomText type="medium" style={styles.featureText}>
                        {feature.text}
                      </CustomText>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            )}
            
          </ScrollView>
          
          {/* Footer Buttons */}
          <View style={styles.footer}>
            {/* Cancel Button */}
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              activeOpacity={0.7}
              disabled={isUpgrading}
            >
              <CustomText type="medium" bold style={styles.cancelButtonText}>
                {t('common.cancel', '취소')}
              </CustomText>
            </TouchableOpacity>
            
            {/* Upgrade Button */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                { backgroundColor: canUpgrade ? selectedTierConfig.color : '#4B5563' },
                !canUpgrade && styles.upgradeButtonDisabled,
              ]}
              onPress={handleUpgrade}
              activeOpacity={0.7}
              disabled={!canUpgrade || isUpgrading}
            >
              {isUpgrading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Icon name="arrow-up-circle" size={moderateScale(20)} color="#FFFFFF" />
                  <CustomText type="medium" bold style={styles.upgradeButtonText}>
                    {canUpgrade
                      ? t('tier.upgrade_button', '업그레이드')
                      : t('tier.already_selected', '선택된 티어')}
                  </CustomText>
                </>
              )}
            </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: platformPadding(20),
    paddingTop: platformPadding(0),
    paddingBottom: platformPadding(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.2)',
  },
  headerEmoji: {
    fontSize: moderateScale(32),
  },
  headerTitle: {
    color: COLORS.TEXT_PRIMARY,
  },
  headerSubtitle: {

    marginTop: verticalScale(2),
    marginBottom: verticalScale(20),
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
  scrollContent: {
    paddingHorizontal: platformPadding(20),
    paddingTop: platformPadding(20),
    paddingBottom: platformPadding(20),
  },
  
  section: {
    marginBottom: verticalScale(24),
  },
  sectionTitle: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: verticalScale(12),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Dropdown
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(12),
    borderWidth: 2,
  },
  dropdownOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  dropdownEmoji: {
    fontSize: moderateScale(32),
  },
  dropdownTextContainer: {
    gap: verticalScale(2),
  },
  dropdownText: {
    color: COLORS.TEXT_PRIMARY,
  },
  dropdownPrice: {
    color: COLORS.TEXT_SECONDARY,
  },
  
  dropdownOptions: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderBottomLeftRadius: moderateScale(12),
    borderBottomRightRadius: moderateScale(12),
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    borderLeftWidth: 3,
  },
  dropdownOptionSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  dropdownOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    flex: 1,
  },
  dropdownOptionEmoji: {
    fontSize: moderateScale(28),
  },
  dropdownOptionTextContainer: {
    flex: 1,
    gap: verticalScale(2),
  },
  dropdownOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  dropdownOptionText: {
    color: COLORS.TEXT_PRIMARY,
  },
  dropdownOptionPrice: {
    color: COLORS.TEXT_SECONDARY,
  },
  currentBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(6),
  },
  currentBadgeText: {
    color: '#22C55E',
    fontSize: moderateScale(10),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Tier Card
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  tierCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    borderRadius: moderateScale(12),
    padding: platformPadding(16),
    borderWidth: 2,
    gap: verticalScale(12),
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  featureIcon: {
    fontSize: moderateScale(20),
  },
  featureText: {
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
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
  footer: {
    flexDirection: 'row',
    gap: scale(12),
    paddingHorizontal: platformPadding(20),
    paddingTop: platformPadding(16),
    paddingBottom: platformPadding(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.2)',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(12),
    gap: scale(8),
  },
  cancelButton: {
    backgroundColor: 'rgba(107, 114, 128, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
  },
  cancelButtonText: {
    color: COLORS.TEXT_PRIMARY,
  },
  upgradeButton: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  upgradeButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
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

export default TierUpgradeSheet;
