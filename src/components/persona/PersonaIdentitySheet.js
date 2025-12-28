/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎭 PersonaIdentitySheet Component - Phase 2 (Wikipedia Integration)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * AI 자아 설정 바텀 시트
 * 
 * Features (Phase 1):
 * - User input mode with Modal Overlay (자음 분리 방지)
 * 
 * Features (Phase 2):
 * - Tab system (User Input / Wikipedia Search)
 * - Wikipedia search & GPT conversion
 * - Preview & Edit functionality
 * - Apply button
 * 
 * @author JK & Hero Nexus AI
 * @date 2025-12-25
 * @updated 2025-12-25 - Added Wikipedia integration (Phase 2)
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Switch, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import CustomBottomSheet from '../CustomBottomSheet';
import CustomText from '../CustomText';
import MessageInputOverlay from '../message/MessageInputOverlay';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, verticalScale, moderateScale } from '../../utils/responsive-utils';
import HapticService from '../../utils/HapticService';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import config from '../../config/api.config';

const API_BASE_URL = config.API_BASE_URL;

const PersonaIdentitySheet = ({ visible, onClose, persona, onSave }) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const bottomSheetRef = useRef(null);

  // ✅ Modal Refs for Input Overlays (자음 분리 방지)
  const nameInputRef = useRef(null);
  const contentInputRef = useRef(null);
  const searchInputRef = useRef(null);

  // State
  const [identityEnabled, setIdentityEnabled] = useState(false);
  const [identityName, setIdentityName] = useState('');
  const [identityContent, setIdentityContent] = useState('');
  const [originalData, setOriginalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ⭐ NEW: Tab state (user_input | wikipedia)
  const [activeTab, setActiveTab] = useState('user_input');

  // ⭐ NEW: Wikipedia search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);

  // Character limits
  const MIN_CHARS = 50;
  const MAX_CHARS = 1000;
  const contentLength = identityContent.length;
  const isContentValid = contentLength >= MIN_CHARS && contentLength <= MAX_CHARS;

  // Check for unsaved changes
  const hasUnsavedChanges = () => {
    if (!originalData) return false;
    return (
      originalData.identityEnabled !== identityEnabled ||
      originalData.identityName !== identityName ||
      originalData.identityContent !== identityContent
    );
  };

  // Load identity data when visible
  useEffect(() => {
    if (visible && persona?.persona_key) {
      bottomSheetRef.current?.present();
      loadIdentityData();
    }
  }, [visible, persona?.persona_key]);

  // Load identity data from API
  const loadIdentityData = async () => {
    if (!persona?.persona_key) return;

    setIsLoading(true);
    try {

        console.log('API_BASE_URL: ', API_BASE_URL);
        console.log('persona.persona_key: ', persona.persona_key);
      const response = await axios.get(
        `${API_BASE_URL}/api/persona/identity?persona_key=${persona.persona_key}`
      );

      if (response.data.success) {
        
      }

    } catch (error) {
      console.error('[PersonaIdentitySheet] Failed to load identity:', error);
      Alert.alert(
        t('common.error', '오류'),
        t('persona.identity.load_failed', '자아 설정을 불러오는데 실패했습니다.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ⭐ NEW: Reset all states when sheet closes
  const resetStates = () => {
    console.log('🔄 [PersonaIdentitySheet] Resetting all states');
    
    // Reset tab to default
    setActiveTab('user_input');
    
    // Reset search states
    setSearchQuery('');
    setSearchResult(null);
    setSearchError(null);
    setIsSearching(false);
    
    // Note: Don't reset identity data (name, content) 
    // because user might have edited them
  };

  // Handle close with unsaved changes check
  const handleClose = () => {
    if (hasUnsavedChanges()) {
      Alert.alert(
        t('persona.identity.unsaved_title', '저장하지 않은 변경사항'),
        t('persona.identity.unsaved_message', '변경사항을 저장하지 않고 닫으시겠습니까?'),
        [
          {
            text: t('common.cancel', '취소'),
            style: 'cancel',
          },
          {
            text: t('persona.identity.close_without_save', '닫기'),
            style: 'destructive',
            onPress: () => {
              resetStates(); // ⭐ Reset states before closing
              bottomSheetRef.current?.dismiss();
              onClose?.();
            },
          },
        ]
      );
    } else {
      resetStates(); // ⭐ Reset states before closing
      bottomSheetRef.current?.dismiss();
      onClose?.();
    }
  };

  // Handle save
  const handleSave = async () => {
    if (identityEnabled && !isContentValid) {
      Alert.alert(
        t('common.error', '오류'),
        t('persona.identity.invalid_content', `자아 설명은 최소 ${MIN_CHARS}자, 최대 ${MAX_CHARS}자여야 합니다.`)
      );
      return;
    }

    setIsSaving(true);
    HapticService.medium();

    try {
      const requestData = {
        persona_key: persona.persona_key,
        identity_enabled: identityEnabled ? 'Y' : 'N',
        identity_source: identityEnabled ? (searchResult ? 'wikipedia' : 'user_input') : 'none',
        identity_name: identityEnabled ? identityName : null,
        identity_content: identityEnabled ? identityContent : null,
        identity_metadata: searchResult?.metadata || null,
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/persona/identity`,
        requestData
      );

      if (response.data.success) {
        HapticService.success();
        
        // Update original data
        setOriginalData({
          identityEnabled,
          identityName,
          identityContent,
        });

        Alert.alert(
          t('common.success', '성공'),
          t('persona.identity.save_success', '자아 설정이 저장되었습니다.'),
          [
            {
              text: t('common.confirm', '확인'),
              onPress: () => {
                resetStates(); // ⭐ Reset states after successful save
                bottomSheetRef.current?.dismiss();
                onClose?.();
                onSave?.(response.data.data);
              },
            },
          ]
        );
      } else {
        throw new Error(response.data.message || 'Save failed');
      }
    } catch (error) {
      console.error('[PersonaIdentitySheet] Failed to save identity:', error);
      HapticService.error();
      Alert.alert(
        t('common.error', '오류'),
        error.response?.data?.message || t('persona.identity.save_failed', '자아 설정 저장에 실패했습니다.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle enable/disable toggle
  const handleToggleEnable = (value) => {
    HapticService.light();
    setIdentityEnabled(value);
  };

  // ✅ Handle input modal clicks (자음 분리 방지)
  const handleNameClick = () => {
    HapticService.light();
    nameInputRef.current?.present();
  };

  const handleContentClick = () => {
    HapticService.light();
    contentInputRef.current?.present();
  };

  const handleSearchClick = () => {
    HapticService.light();
    searchInputRef.current?.present();
  };

  // ✅ Handle input modal save callbacks
  const handleNameSave = (value) => {
    console.log('✅ [PersonaIdentitySheet] Name saved:', value);
    setIdentityName(value);
  };

  const handleContentSave = (value) => {
    console.log('✅ [PersonaIdentitySheet] Content saved:', value);
    setIdentityContent(value);
  };

  const handleSearchSave = (value) => {
    console.log('✅ [PersonaIdentitySheet] Search query saved:', value);
    setSearchQuery(value);
  };

  // ⭐ NEW: Handle tab change
  const handleTabChange = (tab) => {
    HapticService.light();
    setActiveTab(tab);
    
    // Reset search state when switching tabs
    if (tab === 'user_input') {
      setSearchResult(null);
      setSearchError(null);
    }
  };

  // ⭐ NEW: Handle Wikipedia search
  const handleWikipediaSearch = async () => {
    if (!searchQuery || searchQuery.trim() === '') {
      Alert.alert(
        t('common.error', '오류'),
        t('persona.identity.search_placeholder', '검색어를 입력해주세요.')
      );
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);
    HapticService.medium();

    try {
      console.log(`🔍 [PersonaIdentitySheet] Searching Wikipedia for: ${searchQuery}`);

      const response = await axios.post(
        `${API_BASE_URL}/api/persona/search-wikipedia`,
        {
          query: searchQuery,
          language: 'ko',
        }
      );

      if (response.data.success) {
        const result = response.data.data;
        setSearchResult(result);
        
        // Auto-fill name and content with search result
        setIdentityName(result.identity_name);
        setIdentityContent(result.identity_content);
        
        HapticService.success();
        console.log('✅ [PersonaIdentitySheet] Wikipedia search successful');
      } else {
        throw new Error(response.data.message || 'Search failed');
      }
    } catch (error) {
      console.error('[PersonaIdentitySheet] Wikipedia search failed:', error);
      setSearchError(error.response?.data?.message || t('persona.identity.search_failed', 'Wikipedia 검색에 실패했습니다.'));
      HapticService.error();
      Alert.alert(
        t('common.error', '오류'),
        error.response?.data?.message || t('persona.identity.search_failed', 'Wikipedia 검색에 실패했습니다.')
      );
    } finally {
      setIsSearching(false);
    }
  };

  // ⭐ NEW: Handle apply search result
  const handleApplySearchResult = () => {
    if (!searchResult) return;
    
    HapticService.success();
    Alert.alert(
      t('common.success', '성공'),
      t('persona.identity.preview_hint', '결과가 적용되었습니다. 저장 버튼을 눌러주세요.')
    );
  };

  if (!persona) return null;

  return (
    <>
      <CustomBottomSheet
        ref={bottomSheetRef}
        title={`🎭 ${t('persona.identity.title', 'AI 자아 설정')}`}
        subtitle={`${persona.persona_name}`}
        snapPoints={['85%', '95%']}
        showCloseButton={true}
        onClose={handleClose}
        buttons={[
          {
            title: t('common.cancel', '취소'),
            type: 'outline',
            onPress: handleClose,
            disabled: isSaving,
          },
          {
            title: t('common.save', '저장'),
            type: 'primary',
            onPress: handleSave,
            disabled: isLoading || isSaving,
            loading: isSaving,
          },
        ]}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <CustomText>{t('common.loading', '불러오는 중...')}</CustomText>
          </View>
        ) : (
          <>

            {/* Identity Input (only when enabled) */}
            {identityEnabled && (
              <>
                {/* ⭐ NEW: Tab Selector */}
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    style={[
                      styles.tab,
                      activeTab === 'user_input' && styles.tabActive,
                      { borderColor: activeTab === 'user_input' ? currentTheme.mainColor : currentTheme.borderPrimary }
                    ]}
                    onPress={() => handleTabChange('user_input')}
                    activeOpacity={0.7}
                  >
                    <Icon 
                      name="pencil" 
                      size={moderateScale(20)} 
                      color={activeTab === 'user_input' ? currentTheme.mainColor : currentTheme.textSecondary} 
                    />
                    <CustomText 
                      type="small" 
                      bold={activeTab === 'user_input'}
                      style={{ color: activeTab === 'user_input' ? currentTheme.mainColor : currentTheme.textSecondary }}
                    >
                      {t('persona.identity.tab_user_input', '직접 입력')}
                    </CustomText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.tab,
                      activeTab === 'wikipedia' && styles.tabActive,
                      { borderColor: activeTab === 'wikipedia' ? currentTheme.mainColor : currentTheme.borderPrimary }
                    ]}
                    onPress={() => handleTabChange('wikipedia')}
                    activeOpacity={0.7}
                  >
                    <Icon 
                      name="wikipedia" 
                      size={moderateScale(20)} 
                      color={activeTab === 'wikipedia' ? currentTheme.mainColor : currentTheme.textSecondary} 
                    />
                    <CustomText 
                      type="small" 
                      bold={activeTab === 'wikipedia'}
                      style={{ color: activeTab === 'wikipedia' ? currentTheme.mainColor : currentTheme.textSecondary }}
                    >
                      {t('persona.identity.tab_wikipedia', 'Wikipedia 검색')}
                    </CustomText>
                  </TouchableOpacity>
                </View>

                {/* Tab Content: User Input */}
                {activeTab === 'user_input' && (
                  <>
                    {/* Identity Name (클릭 시 Modal) */}
                    <View style={styles.section}>
                      <CustomText type="middle" bold style={styles.label}>
                        {t('persona.identity.name_label', '자아 이름')} ({t('common.optional', '선택')})
                      </CustomText>
                      
                      <TouchableOpacity
                        style={[
                          styles.inputDisplay,
                          {
                            backgroundColor: currentTheme.bgSecondary,
                            borderColor: identityName ? currentTheme.mainColor : currentTheme.borderPrimary,
                          },
                        ]}
                        onPress={handleNameClick}
                        activeOpacity={0.7}
                      >
                        <CustomText
                          type="normal"
                          style={[
                            styles.inputDisplayText,
                            !identityName && styles.inputDisplayPlaceholder,
                            { color: identityName ? currentTheme.textPrimary : currentTheme.textTertiary }
                          ]}
                          numberOfLines={1}
                        >
                          {identityName || t('persona.identity.name_placeholder', '예: BTS 뷔, 김태형')}
                        </CustomText>

                        <View style={styles.inputDisplayRight}>
                          <CustomText type="small" style={{ color: currentTheme.textTertiary }}>
                            {identityName.length}/100
                          </CustomText>
                          <Icon name="pencil" size={moderateScale(20)} color={currentTheme.textSecondary} />
                        </View>
                      </TouchableOpacity>
                    </View>

                    {/* Identity Content (클릭 시 Modal) */}
                    <View style={styles.section}>
                      <View style={styles.labelRow}>
                        <CustomText type="middle" bold style={styles.label}>
                          {t('persona.identity.content_label', '자아 설명')}
                        </CustomText>
                        <CustomText
                          type="small"
                          style={[
                            styles.counter,
                            {
                              color: isContentValid
                                ? currentTheme.textSecondary
                                : contentLength < MIN_CHARS
                                ? '#FFA500'
                                : '#FF4444',
                            },
                          ]}
                        >
                          {contentLength} / {MAX_CHARS}
                          {contentLength < MIN_CHARS && ` (최소 ${MIN_CHARS}자)`}
                        </CustomText>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.inputDisplay,
                          styles.inputDisplayMultiline,
                          {
                            backgroundColor: currentTheme.bgSecondary,
                            borderColor: isContentValid
                              ? currentTheme.mainColor
                              : contentLength < MIN_CHARS
                              ? '#FFA500'
                              : contentLength > MAX_CHARS
                              ? '#FF4444'
                              : currentTheme.borderPrimary,
                          },
                        ]}
                        onPress={handleContentClick}
                        activeOpacity={0.7}
                      >
                        <CustomText
                          type="normal"
                          style={[
                            styles.inputDisplayText,
                            !identityContent && styles.inputDisplayPlaceholder,
                            { color: identityContent ? currentTheme.textPrimary : currentTheme.textTertiary }
                          ]}
                          numberOfLines={5}
                        >
                          {identityContent || t('persona.identity.content_placeholder', 
                            '예시:\n\n김태형(뷔)는 따뜻하고 사려 깊은 성격입니다...')}
                        </CustomText>

                        <Icon 
                          name="pencil" 
                          size={moderateScale(20)} 
                          color={currentTheme.textSecondary} 
                          style={styles.editIcon}
                        />
                      </TouchableOpacity>

                      <CustomText type="small" style={[styles.hint, { color: currentTheme.textTertiary }]}>
                        {t('persona.identity.content_hint', '💡 성격, 말투, 가치관, 행동 패턴을 포함해주세요')}
                      </CustomText>
                    </View>
                  </>
                )}

                {/* ⭐ NEW: Tab Content: Wikipedia Search */}
                {activeTab === 'wikipedia' && (
                  <>
                    {/* Search Input */}
                    <View style={styles.section}>
                      <CustomText type="middle" bold style={styles.label}>
                        {t('persona.identity.search_label', '검색어')}
                      </CustomText>
                      
                      <View style={styles.searchContainer}>
                        <TouchableOpacity
                          style={[
                            styles.searchInput,
                            {
                              backgroundColor: currentTheme.bgSecondary,
                              borderColor: currentTheme.borderPrimary,
                            },
                          ]}
                          onPress={handleSearchClick}
                          activeOpacity={0.7}
                        >
                          <Icon name="magnify" size={moderateScale(20)} color={currentTheme.textSecondary} />
                          <CustomText
                            type="normal"
                            style={[
                              styles.searchInputText,
                              !searchQuery && styles.inputDisplayPlaceholder,
                              { color: searchQuery ? currentTheme.textPrimary : currentTheme.textTertiary }
                            ]}
                            numberOfLines={1}
                          >
                            {searchQuery || t('persona.identity.search_placeholder', '예: BTS 뷔, 김태형')}
                          </CustomText>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.searchButton,
                            { backgroundColor: currentTheme.mainColor },
                            isSearching && styles.searchButtonDisabled
                          ]}
                          onPress={handleWikipediaSearch}
                          disabled={isSearching}
                          activeOpacity={0.7}
                        >
                          {isSearching ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <CustomText type="normal" bold style={{ color: '#FFFFFF' }}>
                              {t('persona.identity.search_button', '검색')}
                            </CustomText>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Search Result */}
                    {searchResult && (
                      <View style={styles.section}>
                        <View style={[styles.resultCard, { backgroundColor: currentTheme.bgSecondary, borderColor: currentTheme.borderPrimary }]}>
                          <View style={styles.resultHeader}>
                            <Icon name="check-circle" size={moderateScale(24)} color="#10B981" />
                            <CustomText type="middle" bold style={{ color: '#10B981', marginLeft: scale(8) }}>
                              {t('persona.identity.preview_title', '미리보기')}
                            </CustomText>
                          </View>

                          {/* Result Name */}
                          <View style={styles.resultSection}>
                            <CustomText type="small" bold style={{ color: currentTheme.textSecondary }}>
                              {t('persona.identity.name_label', '자아 이름')}
                            </CustomText>
                            <CustomText type="normal" style={{ color: currentTheme.textPrimary, marginTop: scale(4) }}>
                              {searchResult.identity_name}
                            </CustomText>
                          </View>

                          {/* Result Content */}
                          <View style={styles.resultSection}>
                            <View style={styles.labelRow}>
                              <CustomText type="small" bold style={{ color: currentTheme.textSecondary }}>
                                {t('persona.identity.content_label', '자아 설명')}
                              </CustomText>
                              <CustomText type="small" style={{ color: currentTheme.textTertiary }}>
                                {searchResult.identity_content.length} / {MAX_CHARS}
                              </CustomText>
                            </View>
                            <CustomText 
                              type="normal" 
                              style={{ color: currentTheme.textPrimary, marginTop: scale(4), lineHeight: moderateScale(20) }}
                            >
                              {searchResult.identity_content}
                            </CustomText>
                          </View>

                          {/* Edit Button */}
                          <TouchableOpacity
                            style={[styles.editButton, { backgroundColor: currentTheme.mainColor }]}
                            onPress={handleContentClick}
                            activeOpacity={0.7}
                          >
                            <Icon name="pencil" size={moderateScale(18)} color="#FFFFFF" />
                            <CustomText type="normal" style={{ color: '#FFFFFF', marginLeft: scale(8) }}>
                              {t('persona.identity.edit_result', '결과 수정하기')}
                            </CustomText>
                          </TouchableOpacity>

                          {/* Wikipedia Info */}
                          {searchResult.metadata && (
                            <View style={styles.metadataSection}>
                              <Icon name="information-outline" size={moderateScale(16)} color={currentTheme.textTertiary} />
                              <CustomText type="small" style={{ color: currentTheme.textTertiary, marginLeft: scale(4) }}>
                                Wikipedia에서 가져온 정보입니다
                              </CustomText>
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Search Hint */}
                    {!searchResult && !isSearching && (
                      <CustomText type="small" style={[styles.hint, { color: currentTheme.textTertiary }]}>
                        {t('persona.identity.preview_hint', '💡 Wikipedia에서 검색하면 AI가 자동으로 페르소나 설명을 생성합니다')}
                      </CustomText>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </CustomBottomSheet>

      {/* ✅ Input Modal Overlays (자음 분리 방지) */}
      <MessageInputOverlay
        ref={nameInputRef}
        title={t('persona.identity.name_label', '자아 이름')}
        placeholder={t('persona.identity.name_placeholder', '예: BTS 뷔, 김태형')}
        leftIcon="account"
        initialValue={identityName}
        maxLength={100}
        multiline={false}
        onSave={handleNameSave}
      />

      <MessageInputOverlay
        ref={contentInputRef}
        title={t('persona.identity.content_label', '자아 설명')}
        placeholder={t('persona.identity.content_placeholder', 
          '예시:\n\n김태형(뷔)는 따뜻하고 사려 깊은 성격입니다. 예술적이고 감성적이며, 4차원적인 매력이 있습니다.\n\n말투 특징:\n- 생각을 많이 하며 천천히 말함\n- 은유적이고 시적인 표현 사용\n- 팬들에게 "아미들아~", "보고싶어요" 등 애정 표현\n\n성격 특징:\n- 친구들에게 애정이 넘침\n- 진솔하고 솔직한 대화 선호\n- 예술과 창의성을 사랑함')}
        leftIcon="text-box"
        initialValue={identityContent}
        maxLength={MAX_CHARS}
        multiline={true}
        onSave={handleContentSave}
      />

      <MessageInputOverlay
        ref={searchInputRef}
        title={t('persona.identity.search_label', '검색어')}
        placeholder={t('persona.identity.search_placeholder', '예: BTS 뷔, 김태형')}
        leftIcon="magnify"
        initialValue={searchQuery}
        maxLength={100}
        multiline={false}
        onSave={handleSearchSave}
      />
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: verticalScale(40),
    alignItems: 'center',
  },
  section: {
    marginBottom: verticalScale(20),
  },
  description: {
    lineHeight: moderateScale(20),
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  switchLeft: {
    flex: 1,
    marginRight: scale(16),
  },
  label: {
    marginBottom: verticalScale(8),
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  counter: {
    fontWeight: '600',
  },
  // ✅ Input Display (클릭 가능한 읽기 전용 표시)
  inputDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: moderateScale(8),
    borderWidth: 1,
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    minHeight: moderateScale(48),
  },
  inputDisplayMultiline: {
    minHeight: moderateScale(120),
    alignItems: 'flex-start',
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(12),
  },
  inputDisplayText: {
    flex: 1,
    fontSize: moderateScale(15),
  },
  inputDisplayPlaceholder: {
    opacity: 0.6,
  },
  inputDisplayRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginLeft: scale(12),
  },
  editIcon: {
    position: 'absolute',
    top: scale(12),
    right: scale(12),
  },
  hint: {
    marginTop: verticalScale(8),
    lineHeight: moderateScale(18),
  },
  
  // ⭐ NEW: Tab Styles
  tabContainer: {
    flexDirection: 'row',
    gap: scale(12),
    marginBottom: verticalScale(20),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
    borderWidth: 2,
  },
  tabActive: {
    // Active tab styling handled by border color
  },

  // ⭐ NEW: Search Styles
  searchContainer: {
    flexDirection: 'row',
    gap: scale(12),
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    minHeight: moderateScale(48),
  },
  searchInputText: {
    flex: 1,
    fontSize: moderateScale(15),
  },
  searchButton: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: scale(80),
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },

  // ⭐ NEW: Result Card Styles
  resultCard: {
    borderRadius: moderateScale(12),
    borderWidth: 1,
    padding: scale(16),
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  resultSection: {
    marginBottom: verticalScale(16),
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(8),
    marginTop: verticalScale(8),
  },
  metadataSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(12),
    paddingTop: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default PersonaIdentitySheet;
