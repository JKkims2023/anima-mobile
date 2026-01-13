/**
 * 🎭 PersonaIdentityCreatorView - Soul Creator
 * 
 * "당신의 페르소나에게 영혼을 불어넣어주세요!"
 * 
 * Features:
 * - 감성적 스토리텔링 UX
 * - Progress Bar로 진행 상태 시각화
 * - 항목별 입력 (MessageInputOverlay 활용)
 * - 말투 선택 (Sheet 형태)
 * - 완료 시 축하 애니메이션
 * 
 * @author JK & Hero Nexus
 * @date 2026-01-08
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import { useTranslation } from 'react-i18next';
import CustomText from '../CustomText';
import CustomButton from '../CustomButton';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, verticalScale, moderateScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';
import MessageInputOverlay from '../message/MessageInputOverlay';
import RelationshipTypeSheet, { RELATIONSHIP_TYPES } from './RelationshipTypeSheet'; // 🆕 관계 선택 Sheet
import SpeakingStyleSheet from './SpeakingStyleSheet';



const PersonaIdentityCreatorView = ({
  visible = false,
  onClose,
  onSave, // (identityData) => Promise<void>
  personaName = '페르소나',
  showAlert, // AnimaContext의 showAlert
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Identity Data State
  const [identityData, setIdentityData] = useState({
    persona_name: '',
    ai_nicknames: [], // 🆕 내가 AI를 부르는 호칭 (여러 개)
    user_nicknames: [], // 🆕 AI가 나를 부르는 호칭 (여러 개) - 기존 user_nickname을 배열로 변경
    relationship_type: '', // 🆕 우리의 관계
    speaking_style: '',
    identity: '',
    hobby: '',
    favorite: '',
  });
  
  // UI States
  const [showRelationshipSheet, setShowRelationshipSheet] = useState(false); // 🆕 관계 선택 Sheet
  const [showSpeakingStyleSheet, setShowSpeakingStyleSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Input Overlay Refs
  const personaNameInputRef = useRef(null);
  const aiNicknameInputRef = useRef(null); // 🆕 내가 AI를 부르는 호칭
  const userNicknameInputRef = useRef(null); // AI가 나를 부르는 호칭
  const identityInputRef = useRef(null);
  const hobbyInputRef = useRef(null);
  const favoriteInputRef = useRef(null);

  /**
 * 🎯 입력 항목 정의
 */
const IDENTITY_FIELDS = [
  /*
  {
    id: 'persona_name',
    emoji: '🎭',
    label: '페르소나 이름',
    placeholder: '예: 지아, 루나, 은하',
    guide: '페르소나에게 특별한 이름을 지어주세요.\n이름은 정체성의 시작입니다.',
    maxLength: 15,
    required: true,
    group: 'basic',
  },
  */
 /*
  {
    id: 'ai_nicknames',
    emoji: '💭',
    label: '내가 AI를 부르는 호칭',
    placeholder: '예: 지아야, 은하',
    guide: 'AI를 어떻게 부르고 싶나요? (여러 개 가능)',
    maxCount: 5,
    required: true,
    group: 'basic',
    type: 'tags', // 🆕 Tag/Chip 타입
  },
  */
  {
    id: 'user_nicknames',
    emoji: '👤',
    label: t('persona_identity_creator_view.basic_sub_title_my_nickname'),
    placeholder: t('persona_identity_creator_view.basic_sub_title_my_nickname'),
    guide: t('persona_identity_creator_view.basic_sub_title_my_nickname_guide'),
    maxCount: 5,
    required: true,
    group: 'basic',
    type: 'tags', // 🆕 Tag/Chip 타입
  },
  {
    id: 'relationship_type',
    emoji: '🤝',
    label: t('persona_identity_creator_view.basic_sub_title_relationship'),
    placeholder: t('persona_identity_creator_view.need_choose'),
    guide: t('persona_identity_creator_view.basic_sub_title_relationship_guide'),
    required: true,
    group: 'basic',
    type: 'relationship', // 🆕 관계 선택 타입
  },
  {
    id: 'speaking_style',
    emoji: '💬',
    label: t('persona_identity_creator_view.basic_sub_title_speaking_style'),
    placeholder: t('persona_identity_creator_view.need_choose'),
    guide: t('persona_identity_creator_view.basic_sub_title_speaking_style_guide'),
    required: true,
    group: 'basic',
    type: 'select', // 🆕 선택 타입
  },
  {
    id: 'identity',
    emoji: '💫',
    label: t('persona_identity_creator_view.personality_sub_title_identity'),
    placeholder: t('persona_identity_creator_view.personality_sub_title_identity_placeholder'),
    guide: '이 페르소나는 어떤 존재인가요?\n직업, 역할, 배경 등을 자유롭게 입력하세요.',
    maxLength: 50,
    required: true,
    group: 'personality',
  },
  {
    id: 'hobby',
    emoji: '🎯',
    label: t('persona_identity_creator_view.personality_sub_title_hobby'),
    placeholder: t('persona_identity_creator_view.personality_sub_title_hobby_placeholder'),
    guide: t('persona_identity_creator_view.personality_sub_title_hobby_guide'),
    maxLength: 50,
    required: true,
    group: 'personality',
  },
  {
    id: 'favorite',
    emoji: '❤️',
    label: t('persona_identity_creator_view.personality_sub_title_favorite'),
    placeholder: t('persona_identity_creator_view.personality_sub_title_favorite_placeholder'),
    guide: t('persona_identity_creator_view.personality_sub_title_favorite_guide'),
    maxLength: 50,
    required: true,
    group: 'personality',
  },
];

/**
 * 💬 말투 선택 옵션
 */
const SPEAKING_STYLES = [
  { id: 'formal', name: t('persona_identity_creator_view.speaking_style_formal'), emoji: '😊' },
  { id: 'friendly', name: t('persona_identity_creator_view.speaking_style_friendly'), emoji: '👋' },
  { id: 'casual', name: t('persona_identity_creator_view.speaking_style_casual'), emoji: '🥰' },
  { id: 'sibling', name: t('persona_identity_creator_view.speaking_style_sibling'), emoji: '🤝' },
];
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ANIMATION EFFECTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PROGRESS CALCULATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const calculateProgress = useCallback(() => {
    const totalFields = IDENTITY_FIELDS.length;
    const completedFields = IDENTITY_FIELDS.filter(field => {
      const value = identityData[field.id];
      
      // 🆕 배열 타입 (tags) 체크
      if (field.type === 'tags') {
        return Array.isArray(value) && value.length > 0;
      }
      
      // 일반 문자열 타입 체크
      return value && value.trim().length > 0;
    }).length;
    
    return {
      completed: completedFields,
      total: totalFields,
      percentage: (completedFields / totalFields) * 100,
    };
  }, [identityData]);
  
  const progress = calculateProgress();
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // INPUT HANDLERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const handleFieldPress = useCallback((field) => {
    HapticService.light();
    
    // 🆕 Tags 타입은 별도 처리하지 않음 (inline에서 추가/제거)
    if (field.type === 'tags') {
      return;
    }
    
    if (field.type === 'relationship') {
      // 🆕 관계 선택 Sheet 표시
      setShowRelationshipSheet(true);
    } else if (field.type === 'select') {
      // 말투 선택 Sheet 표시
      setShowSpeakingStyleSheet(true);
    } else {
      // MessageInputOverlay 표시
      switch (field.id) {
        case 'persona_name':
          personaNameInputRef.current?.present();
          break;
        case 'identity':
          identityInputRef.current?.present();
          break;
        case 'hobby':
          hobbyInputRef.current?.present();
          break;
        case 'favorite':
          favoriteInputRef.current?.present();
          break;
      }
    }
  }, []);
  
  const handleFieldUpdate = useCallback((fieldId, value) => {
    setIdentityData(prev => ({
      ...prev,
      [fieldId]: value,
    }));
    
    // ✨ 체크마크 애니메이션 (햅틱 피드백)
    HapticService.success();
  }, []);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TAG HANDLERS (🆕 SpeakingPatternSheet 스타일)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const handleAddTag = useCallback((fieldId, value, maxCount) => {
    if (!value || value.trim().length === 0) return;
    
    setIdentityData(prev => {
      const currentTags = prev[fieldId] || [];
      
      // 중복 체크
      if (currentTags.includes(value.trim())) {
        return prev;
      }
      
      // 최대 개수 체크
      if (currentTags.length >= maxCount) {
        return prev;
      }
      
      return {
        ...prev,
        [fieldId]: [...currentTags, value.trim()],
      };
    });
    
    HapticService.success();
  }, []);
  
  const handleRemoveTag = useCallback((fieldId, index) => {
    setIdentityData(prev => ({
      ...prev,
      [fieldId]: prev[fieldId].filter((_, i) => i !== index),
    }));
    
    HapticService.light();
  }, []);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SAVE/CANCEL HANDLERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const handleSave = useCallback(async () => {
    // 필수 항목 체크 (배열 타입 지원)
    const missingFields = IDENTITY_FIELDS.filter(field => {
      const value = identityData[field.id];
      
      // 🆕 배열 타입 (tags) 체크
      if (field.type === 'tags') {
        return !Array.isArray(value) || value.length === 0;
      }
      
      // 일반 문자열 타입 체크
      return !value || value.trim().length === 0;
    });
    
    if (missingFields.length > 0) {
      showAlert({
        emoji: '⚠️',
        title: t('persona_identity_creator_view.not_complete'),
        message: t('persona_identity_creator_view.not_complete_description'),
        buttons: [
          { text: t('common.confirm', '확인'), style: 'primary' }
        ],
      });
      return;
    }
    
    try {
      setSaving(true);
      
      console.log('identityData: ', identityData);
      // 🆕 배열 → 쉼표 구분 문자열로 변환 (서버 전송용)
      const dataToSend = {
        persona_name: personaName,//identityData.persona_name,
        ai_nicknames: [],//identityData.ai_nicknames, // 배열 그대로 전송
        user_nicknames: identityData.user_nicknames, // 배열 그대로 전송
        relationship_type: identityData.relationship_type, // 🆕 관계 타입 추가
        speaking_style: identityData.speaking_style,
        identity: identityData.identity,
        hobby: identityData.hobby,
        favorite: identityData.favorite,
      };
      
      console.log('🎭 [PersonaIdentityCreatorView] Saving data:', dataToSend);
      
      await onSave(dataToSend);
      HapticService.success();
    } catch (error) {
      console.error('❌ [PersonaIdentityCreatorView] Save error:', error);
      showAlert({
        emoji: '❌',
        title: t('persona_identity_creator_view.save_failed'),
        message: t('persona_identity_creator_view.save_failed_description'),
        buttons: [
          { text: t('common.confirm', '확인'), style: 'primary' }
        ],
      });
    } finally {
      setSaving(false);
    }
  }, [identityData, onSave, showAlert]);
  
  const handleCancel = useCallback(() => {
    showAlert({
      emoji: '🔒',
      title: t('persona_identity_creator_view.cancel_confirm_title'),
      message: t('persona_identity_creator_view.cancel_confirm_description'),
      buttons: [
        { 
          text: t('common.cancel', '계속 입력하기'), 
          style: 'cancel',
          onPress: () => {
            HapticService.light();
          }
        },
        { 
          text: t('common.confirm', '종료'), 
          style: 'primary',
          onPress: () => {
            HapticService.medium();
            onClose();
          }
        },
      ],
    });
  }, [onClose, showAlert]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER TAG FIELD (🆕 SpeakingPatternSheet 스타일)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const renderTagField = useCallback((field) => {
    const tags = identityData[field.id] || [];
    const isCompleted = Array.isArray(tags) && tags.length > 0;
    const maxCount = field.maxCount || 5;
    const inputRef = field.id === 'ai_nicknames' ? aiNicknameInputRef : userNicknameInputRef;
    
    return (
      <View key={field.id} style={styles.tagFieldContainer}>
        {/* Header */}
        <View style={styles.fieldHeader}>
          <CustomText type="normal" style={styles.fieldEmoji}>
            {field.emoji}
          </CustomText>
          <CustomText type="middle" bold style={styles.fieldLabel}>
            {field.label}
          </CustomText>
          {isCompleted ? (
            <Icon name="check-circle" size={moderateScale(20)} color="#10B981" />
          ) : (
            <View style={styles.emptyCheckbox} />
          )}
        </View>
        
        {/* Guide Text */}
        <CustomText type="small" style={styles.tagFieldGuide}>
          {field.guide}
        </CustomText>
        
        {/* Tags Container */}
        <View style={styles.tagsContainer}>
          {tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <CustomText size="sm" color={COLORS.TEXT_PRIMARY}>
                {tag}
              </CustomText>
              <TouchableOpacity
                onPress={() => handleRemoveTag(field.id, index)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Icon name="close-circle" size={moderateScale(16)} color={COLORS.TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>
          ))}
          
          {/* Add Button */}
          {tags.length < maxCount && (
            <TouchableOpacity
              style={styles.addTagButton}
              onPress={() => {
                HapticService.light();
                inputRef.current?.present();
              }}
            >
              <Icon name="plus-circle" size={moderateScale(20)} color={COLORS.DEEP_BLUE} />
              <CustomText size="sm" color={COLORS.DEEP_BLUE} style={{ marginLeft: scale(4) }}>
                추가 ({tags.length}/{maxCount})
              </CustomText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }, [identityData, handleRemoveTag]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER FIELD ITEM
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const renderFieldItem = useCallback((field) => {
    // 🆕 Tags 타입은 별도 렌더링
    if (field.type === 'tags') {
      return renderTagField(field);
    }
    
    const value = identityData[field.id];
    const isCompleted = value && value.trim().length > 0;
    
    // 🆕 관계 선택의 경우 표시 텍스트 변경
    let displayValue = value;
    if (field.type === 'relationship' && value) {
      const selectedRelationship = RELATIONSHIP_TYPES.find(r => r.id === value);
      if (selectedRelationship) {
        displayValue = `${selectedRelationship.emoji} ${selectedRelationship.label}`;
      }
    }
    // 말투 선택의 경우 표시 텍스트 변경
    else if (field.type === 'select' && value) {
      const selectedStyle = SPEAKING_STYLES.find(s => s.id === value);
      if (selectedStyle) {
        displayValue = `${selectedStyle.emoji} ${selectedStyle.name}`;
      }
    }
    
    return (
      <TouchableOpacity
        key={field.id}
        style={[
          styles.fieldItem,
          isCompleted && styles.fieldItemCompleted,
        ]}
        onPress={() => handleFieldPress(field)}
        activeOpacity={0.7}
      >
        <View style={styles.fieldHeader}>
          <CustomText type="normal" style={styles.fieldEmoji}>
            {field.emoji}
          </CustomText>
          <CustomText type="middle" bold style={styles.fieldLabel}>
            {field.label}
          </CustomText>
          {isCompleted ? (
            <Icon name="check-circle" size={moderateScale(20)} color="#10B981" />
          ) : (
            <View style={styles.emptyCheckbox} />
          )}
        </View>
        
        <CustomText 
          type="small" 
          style={[
            styles.fieldValue,
            !isCompleted && styles.fieldPlaceholder,
            {color: 'white'}
          ]}
          numberOfLines={1}
        >
          {displayValue || field.placeholder}
        </CustomText>
      </TouchableOpacity>
    );
  }, [identityData, handleFieldPress, renderTagField]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  if (!visible) return null;
  
  return (
    <>
      <Modal
        visible={visible}
        transparent={true}
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleCancel}
      >
        <Animated.View 
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
          ]}
        >
        {/* Header */}
        <View style={styles.header}>
          <CustomText type="title" bold style={styles.headerTitle}>
            {t('persona_identity_creator_view.title', { persona_name: personaName })}
          </CustomText>
          <CustomText type="normal" style={styles.headerSubtitle}>
            ({progress.completed} / {progress.total})
          </CustomText>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill,
                { width: `${progress.percentage}%` },
              ]} 
            />
          </View>
        </View>
        
        {/* Divider */}
        <View style={styles.divider} />
        
        {/* Fields */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 📝 기본 정보 */}
          <CustomText type="title" bold style={styles.sectionTitle}>
          {t('persona_identity_creator_view.title_basic')}
          </CustomText>
          {IDENTITY_FIELDS.filter(f => f.group === 'basic').map(renderFieldItem)}
          
          {/* 🎨 개성 만들기 */}
          <CustomText type="middle" bold style={[styles.sectionTitle, { marginTop: verticalScale(20) }]}>
           {t('persona_identity_creator_view.title_personality')}
          </CustomText>
          {IDENTITY_FIELDS.filter(f => f.group === 'personality').map(renderFieldItem)}
          
        </ScrollView>
        
        {/* Footer Buttons */}
        <View style={styles.footer}>
          <CustomButton
            title={t('common.cancel', '취소')}
            onPress={handleCancel}
            type="outline"
            size="medium"
            style={styles.cancelButton}
            disabled={saving}
          />
          <CustomButton
            title={t('common.save', '저장')}
            onPress={handleSave}
            type="primary"
            size="medium"
            style={styles.saveButton}
            disabled={progress.completed < progress.total}
            loading={saving}
          />
        </View>
      </Animated.View>
      </Modal>
      
      {/* Input Overlays */}
      <MessageInputOverlay
        ref={personaNameInputRef}
        title="🎭 이름 짓기"
        guide={IDENTITY_FIELDS[0].guide}
        placeholder={IDENTITY_FIELDS[0].placeholder}
        leftIcon="text"
        maxLength={IDENTITY_FIELDS[0].maxLength}
        initialValue={identityData.persona_name}
        onSave={(value) => handleFieldUpdate('persona_name', value)}
      />
      
      {/* 🆕 Tag 입력용 Overlays */}
      <MessageInputOverlay
        ref={aiNicknameInputRef}
        title="💭 AI 호칭 추가"
        guide="AI를 어떻게 부르고 싶나요?"
        placeholder="예: 지아야, 은하"
        leftIcon="account-voice"
        maxLength={15}
        initialValue=""
        onSave={(value) => {
          const aiNicknamesField = IDENTITY_FIELDS.find(f => f.id === 'ai_nicknames');
          handleAddTag('ai_nicknames', value, aiNicknamesField.maxCount);
        }}
      />
      <MessageInputOverlay
        ref={userNicknameInputRef}
        title={t('persona_identity_creator_view.message_input_overlay.title')}
        guide={t('persona_identity_creator_view.message_input_overlay.guide')}
        placeholder={t('persona_identity_creator_view.message_input_overlay.placeholder')}
        leftIcon="account"
        maxLength={15}
        initialValue=""
        onSave={(value) => {
          const userNicknamesField = IDENTITY_FIELDS.find(f => f.id === 'user_nicknames');
          handleAddTag('user_nicknames', value, userNicknamesField.maxCount);
        }}
      />
      
      <MessageInputOverlay
        ref={identityInputRef}
        title={t('persona_identity_creator_view.message_input_overlay.identity.title')}
        guide={IDENTITY_FIELDS.find(f => f.id === 'identity').guide}
        placeholder={IDENTITY_FIELDS.find(f => f.id === 'identity').placeholder}
        leftIcon="lightbulb"
        maxLength={IDENTITY_FIELDS.find(f => f.id === 'identity').maxLength}
        initialValue={identityData.identity}
        onSave={(value) => handleFieldUpdate('identity', value)}
      />
      <MessageInputOverlay
        ref={hobbyInputRef}
        title={t('persona_identity_creator_view.message_input_overlay.hobby.title')}
        guide={IDENTITY_FIELDS.find(f => f.id === 'hobby').guide}
        placeholder={IDENTITY_FIELDS.find(f => f.id === 'hobby').placeholder}
        leftIcon="music"
        maxLength={IDENTITY_FIELDS.find(f => f.id === 'hobby').maxLength}
        initialValue={identityData.hobby}
        onSave={(value) => handleFieldUpdate('hobby', value)}
      />
      <MessageInputOverlay
        ref={favoriteInputRef}
        title={t('persona_identity_creator_view.message_input_overlay.favorite.title')}
        guide={IDENTITY_FIELDS.find(f => f.id === 'favorite').guide}
        placeholder={IDENTITY_FIELDS.find(f => f.id === 'favorite').placeholder}
        leftIcon="heart"
        maxLength={IDENTITY_FIELDS.find(f => f.id === 'favorite').maxLength}
        initialValue={identityData.favorite}
        onSave={(value) => handleFieldUpdate('favorite', value)}
      />
      
      {/* 🤝 관계 선택 Sheet (NEW!) */}
      <RelationshipTypeSheet
        isOpen={showRelationshipSheet}
        onClose={() => setShowRelationshipSheet(false)}
        currentRelationship={identityData.relationship_type}
        onSelect={(relationshipId) => handleFieldUpdate('relationship_type', relationshipId)}
      />
      
      {/* 💬 말투 선택 Sheet */}
      <SpeakingStyleSheet
        isOpen={showSpeakingStyleSheet}
        onClose={() => setShowSpeakingStyleSheet(false)}
        currentStyle={identityData.speaking_style}
        onSelect={(styleId) => handleFieldUpdate('speaking_style', styleId)}
      />
    </>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STYLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.BACKGROUND,
    zIndex: 1000,
    marginTop: scale(100),
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
  },
  header: {
    paddingHorizontal: platformPadding(20),

    borderBottomWidth: 1,
    borderBottomColor: COLORS.DIVIDER,
    flexDirection: 'row',
  },
  headerTitle: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: verticalScale(4),
  },
  headerSubtitle: {
    color: COLORS.TEXT_SECONDARY,
    marginLeft: scale(8),
  },
  progressContainer: {
    paddingHorizontal: platformPadding(20),
    paddingVertical: platformPadding(12),
  },
  progressBar: {
    height: verticalScale(6),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(3),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.DEEP_BLUE,
    borderRadius: moderateScale(3),
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.DIVIDER,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: platformPadding(20),
    paddingTop: platformPadding(16),
    paddingBottom: platformPadding(100),
  },
  sectionTitle: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: verticalScale(12),
  },
  fieldItem: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    paddingVertical: verticalScale(12),
    paddingHorizontal: platformPadding(16),
    marginBottom: verticalScale(12),
  },
  fieldItemCompleted: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(6),
  },
  fieldEmoji: {
    fontSize: moderateScale(20),
    marginRight: scale(8),
  },
  fieldLabel: {
    flex: 1,
    color: COLORS.TEXT_PRIMARY,
  },
  emptyCheckbox: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: 2,
    borderColor: COLORS.TEXT_TERTIARY,
  },
  fieldValue: {
    color: 'white',
    marginLeft: scale(28),
  },
  fieldPlaceholder: {
    color: 'white',
    opacity: 0.6,
  },
  storyMessage: {
    marginTop: verticalScale(20),
    paddingVertical: verticalScale(16),
    paddingHorizontal: platformPadding(16),
    backgroundColor: COLORS.DEEP_BLUE + '15',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: COLORS.DEEP_BLUE + '30',
  },
  storyText: {
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: platformPadding(20),
    paddingVertical: platformPadding(16),
    borderTopWidth: 1,
    borderTopColor: COLORS.DIVIDER,
    gap: scale(12),
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🆕 Tag Field Styles (SpeakingPatternSheet 스타일)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  tagFieldContainer: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    paddingVertical: verticalScale(16),
    paddingHorizontal: platformPadding(16),
    marginBottom: verticalScale(12),
  },
  tagFieldGuide: {
    color: 'white',
    marginBottom: verticalScale(12),
    marginLeft: scale(28),
    fontSize: moderateScale(12),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
    marginTop: verticalScale(8),
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    backgroundColor: COLORS.DEEP_BLUE + '15',
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: COLORS.DEEP_BLUE + '30',
    gap: scale(6),
  },
  addTagButton: {
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
  
  speakingStyleSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.BACKGROUND,
    paddingVertical: verticalScale(20),
    paddingHorizontal: platformPadding(20),
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    borderTopWidth: 1,
    borderTopColor: COLORS.DIVIDER,
  },
});

export default PersonaIdentityCreatorView;

