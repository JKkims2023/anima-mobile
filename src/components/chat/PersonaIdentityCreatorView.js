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
import SpeakingStyleSheet from './SpeakingStyleSheet';

/**
 * 🎯 입력 항목 정의
 */
const IDENTITY_FIELDS = [
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
  {
    id: 'user_nickname',
    emoji: '👤',
    label: '당신의 이름',
    placeholder: '예: JK, 형, 누나',
    guide: '페르소나가 당신을 어떻게 불러주길 원하나요?',
    maxLength: 10,
    required: true,
    group: 'basic',
  },
  {
    id: 'speaking_style',
    emoji: '💬',
    label: '말투',
    placeholder: '선택해주세요',
    guide: '페르소나가 어떤 말투로 대화하길 원하나요?',
    required: true,
    group: 'basic',
    type: 'select', // 🆕 선택 타입
  },
  {
    id: 'identity',
    emoji: '💫',
    label: '자아 (직업/역할)',
    placeholder: '예: K-POP 아이돌, 영화배우, 의사',
    guide: '이 페르소나는 어떤 존재인가요?\n직업, 역할, 배경 등을 자유롭게 입력하세요.',
    maxLength: 50,
    required: true,
    group: 'personality',
  },
  {
    id: 'hobby',
    emoji: '🎯',
    label: '취미',
    placeholder: '예: 음악 감상, 영화 보기, 책 읽기',
    guide: '페르소나가 좋아하는 활동을 입력하세요.',
    maxLength: 50,
    required: true,
    group: 'personality',
  },
  {
    id: 'favorite',
    emoji: '❤️',
    label: '좋아하는 것',
    placeholder: '예: 라떼, 봄날, 클래식 음악',
    guide: '페르소나가 좋아하는 것들을 입력하세요.',
    maxLength: 50,
    required: true,
    group: 'personality',
  },
];

/**
 * 💬 말투 선택 옵션
 */
const SPEAKING_STYLES = [
  { id: 'friendly', name: '친근한 반말', emoji: '😊' },
  { id: 'polite', name: '부드러운 존댓말', emoji: '🙏' },
  { id: 'cute', name: '귀여운 말투', emoji: '🥰' },
  { id: 'cool', name: '쿨한 말투', emoji: '😎' },
  { id: 'professional', name: '전문적인 말투', emoji: '💼' },
];

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
    user_nickname: '',
    speaking_style: '',
    identity: '',
    hobby: '',
    favorite: '',
  });
  
  // UI States
  const [showSpeakingStyleSheet, setShowSpeakingStyleSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Input Overlay Refs
  const personaNameInputRef = useRef(null);
  const userNicknameInputRef = useRef(null);
  const identityInputRef = useRef(null);
  const hobbyInputRef = useRef(null);
  const favoriteInputRef = useRef(null);
  
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
    
    if (field.type === 'select') {
      // 말투 선택 Sheet 표시
      setShowSpeakingStyleSheet(true);
    } else {
      // MessageInputOverlay 표시
      switch (field.id) {
        case 'persona_name':
          personaNameInputRef.current?.present();
          break;
        case 'user_nickname':
          userNicknameInputRef.current?.present();
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
  // SAVE/CANCEL HANDLERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const handleSave = useCallback(async () => {
    // 필수 항목 체크
    const missingFields = IDENTITY_FIELDS.filter(field => {
      const value = identityData[field.id];
      return !value || value.trim().length === 0;
    });
    
    if (missingFields.length > 0) {
      showAlert({
        emoji: '⚠️',
        title: '입력 미완료',
        message: '모든 항목을 입력해야 대화를 시작할 수 있습니다.',
        buttons: [
          { text: '확인', style: 'primary' }
        ],
      });
      return;
    }
    
    try {
      setSaving(true);
      await onSave(identityData);
      HapticService.success();
    } catch (error) {
      console.error('❌ [PersonaIdentityCreatorView] Save error:', error);
      showAlert({
        emoji: '❌',
        title: '저장 실패',
        message: '자아 정보를 저장하는 중 오류가 발생했습니다.',
        buttons: [
          { text: '확인', style: 'primary' }
        ],
      });
    } finally {
      setSaving(false);
    }
  }, [identityData, onSave, showAlert]);
  
  const handleCancel = useCallback(() => {
    showAlert({
      emoji: '🔒',
      title: '정말 취소하시겠습니까?',
      message: '자아를 입력하지 않으면 채팅이 불가능합니다.\n채팅을 종료하시겠습니까?',
      buttons: [
        { 
          text: '계속 입력하기', 
          style: 'cancel',
          onPress: () => {
            HapticService.light();
          }
        },
        { 
          text: '종료', 
          style: 'destructive',
          onPress: () => {
            HapticService.medium();
            onClose();
          }
        },
      ],
    });
  }, [onClose, showAlert]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER FIELD ITEM
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const renderFieldItem = useCallback((field) => {
    const value = identityData[field.id];
    const isCompleted = value && value.trim().length > 0;
    
    // 말투 선택의 경우 표시 텍스트 변경
    let displayValue = value;
    if (field.type === 'select' && value) {
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
          ]}
          numberOfLines={1}
        >
          {displayValue || field.placeholder}
        </CustomText>
      </TouchableOpacity>
    );
  }, [identityData, handleFieldPress]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  if (!visible) return null;
  
  return (
    <>
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
            🎭 영혼 불어넣기
          </CustomText>
          <CustomText type="small" style={styles.headerSubtitle}>
            {progress.completed} / {progress.total} 완료
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
          <CustomText type="middle" bold style={styles.sectionTitle}>
            📝 기본 정보
          </CustomText>
          {IDENTITY_FIELDS.filter(f => f.group === 'basic').map(renderFieldItem)}
          
          {/* 🎨 개성 만들기 */}
          <CustomText type="middle" bold style={[styles.sectionTitle, { marginTop: verticalScale(20) }]}>
            🎨 개성 만들기
          </CustomText>
          {IDENTITY_FIELDS.filter(f => f.group === 'personality').map(renderFieldItem)}
          
          {/* Story Message */}
          <View style={styles.storyMessage}>
            <CustomText type="small" style={styles.storyText}>
              ✨ {progress.completed === progress.total 
                ? '축하합니다! 이제 새로운 영혼이 탄생할 준비가 되었습니다!'
                : '당신의 페르소나가 숨을 쉬기 시작합니다... 💙'}
            </CustomText>
          </View>
        </ScrollView>
        
        {/* Footer Buttons */}
        <View style={styles.footer}>
          <CustomButton
            title="취소"
            onPress={handleCancel}
            type="outline"
            size="medium"
            style={styles.cancelButton}
            disabled={saving}
          />
          <CustomButton
            title="저장 ✨"
            onPress={handleSave}
            type="primary"
            size="medium"
            style={styles.saveButton}
            disabled={progress.completed < progress.total}
            loading={saving}
          />
        </View>
      </Animated.View>
      
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
      <MessageInputOverlay
        ref={userNicknameInputRef}
        title="👤 당신의 이름"
        guide={IDENTITY_FIELDS[1].guide}
        placeholder={IDENTITY_FIELDS[1].placeholder}
        leftIcon="account"
        maxLength={IDENTITY_FIELDS[1].maxLength}
        initialValue={identityData.user_nickname}
        onSave={(value) => handleFieldUpdate('user_nickname', value)}
      />
      <MessageInputOverlay
        ref={identityInputRef}
        title="💫 자아 만들기"
        guide={IDENTITY_FIELDS[3].guide}
        placeholder={IDENTITY_FIELDS[3].placeholder}
        leftIcon="lightbulb"
        maxLength={IDENTITY_FIELDS[3].maxLength}
        initialValue={identityData.identity}
        onSave={(value) => handleFieldUpdate('identity', value)}
      />
      <MessageInputOverlay
        ref={hobbyInputRef}
        title="🎯 취미"
        guide={IDENTITY_FIELDS[4].guide}
        placeholder={IDENTITY_FIELDS[4].placeholder}
        leftIcon="music"
        maxLength={IDENTITY_FIELDS[4].maxLength}
        initialValue={identityData.hobby}
        onSave={(value) => handleFieldUpdate('hobby', value)}
      />
      <MessageInputOverlay
        ref={favoriteInputRef}
        title="❤️ 좋아하는 것"
        guide={IDENTITY_FIELDS[5].guide}
        placeholder={IDENTITY_FIELDS[5].placeholder}
        leftIcon="heart"
        maxLength={IDENTITY_FIELDS[5].maxLength}
        initialValue={identityData.favorite}
        onSave={(value) => handleFieldUpdate('favorite', value)}
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
  },
  header: {
    paddingHorizontal: platformPadding(20),
    paddingVertical: platformPadding(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.DIVIDER,
  },
  headerTitle: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: verticalScale(4),
  },
  headerSubtitle: {
    color: COLORS.TEXT_SECONDARY,
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
    borderColor: COLORS.DIVIDER,
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
    color: COLORS.TEXT_PRIMARY,
    marginLeft: scale(28),
  },
  fieldPlaceholder: {
    color: COLORS.TEXT_TERTIARY,
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

