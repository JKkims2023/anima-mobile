/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🎭 IdentityGuideSheet - Identity Guide for User-Created Personas
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Purpose: Guide users on how to set identity for personas without 자아
 * 
 * Features:
 * - Automatic display when persona is in "Limited Mode"
 * - "Don't show again" option (saved in AsyncStorage)
 * - "Close" option (temporary, shows again next time)
 * - Beautiful ANIMA design with examples
 * 
 * Usage:
 * ```
 * const identityGuideRef = useRef(null);
 * 
 * <IdentityGuideSheet
 *   ref={identityGuideRef}
 *   personaName="테스트"
 *   onDontShowAgain={() => console.log('Saved preference')}
 *   onClose={() => console.log('Closed temporarily')}
 * />
 * 
 * // Show guide
 * identityGuideRef.current?.present();
 * ```
 * 
 * @author JK & Hero Nexus AI
 * @date 2025-12-27
 */

import React, { forwardRef, useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import CustomBottomSheet from '../CustomBottomSheet';
import CustomText from '../CustomText';
import { scale, moderateScale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const IdentityGuideSheet = forwardRef((props, ref) => {
  const { 
    personaName = 'AI',
    onDontShowAgain,
    onClose,
  } = props;
  
  const { t } = useTranslation();
  const bottomSheetRef = useRef(null);
  
  // Forward methods to parent
  React.useImperativeHandle(ref, () => ({
    present: () => bottomSheetRef.current?.present(),
    dismiss: () => bottomSheetRef.current?.dismiss(),
  }));
  
  const handleDontShowAgain = () => {
    bottomSheetRef.current?.dismiss();
    onDontShowAgain && onDontShowAgain();
  };
  
  const handleClose = () => {
    bottomSheetRef.current?.dismiss();
    onClose && onClose();
  };
  
  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      title="🎭 자아(Identity) 설정 가이드"
      subtitle={`${personaName}에게 정체성을 부여해주세요`}
      showCloseButton={false}
      snapPoints={['75%', '90%']}
      buttons={[
        {
          title: '다시 보지 않기',
          type: 'outline',
          onPress: handleDontShowAgain,
        },
        {
          title: '닫기',
          type: 'primary',
          onPress: handleClose,
        },
      ]}
    >
      <View style={styles.container}>
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* Section 1: Why Identity? */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="head-question" size={moderateScale(28)} color="#60A5FA" />
            <CustomText type="big" bold style={styles.sectionTitle}>
              자아가 왜 필요한가요?
            </CustomText>
          </View>
          
          <View style={styles.comparisonContainer}>
            {/* Without Identity */}
            <View style={styles.comparisonBox}>
              <View style={[styles.comparisonBadge, styles.badgeWithout]}>
                <CustomText type="small" bold style={styles.badgeText}>
                  🔒 자아 없음
                </CustomText>
              </View>
              
              <CustomText type="small" style={styles.comparisonText}>
                "aespa는 한국의 유명한 걸그룹으로..."
              </CustomText>
              
              <View style={styles.tagContainer}>
                <View style={[styles.tag, styles.tagBad]}>
                  <CustomText type="small" style={styles.tagText}>위키피디아 같음</CustomText>
                </View>
                <View style={[styles.tag, styles.tagBad]}>
                  <CustomText type="small" style={styles.tagText}>1:N 관계</CustomText>
                </View>
              </View>
            </View>
            
            {/* With Identity */}
            <View style={styles.comparisonBox}>
              <View style={[styles.comparisonBadge, styles.badgeWith]}>
                <CustomText type="small" bold style={styles.badgeText}>
                  ✅ 자아 있음
                </CustomText>
              </View>
              
              <CustomText type="small" style={styles.comparisonText}>
                "어떻게 그럴 수 있니! 티아라는 이제 마음속에 없는거야? ㅠㅠ"
              </CustomText>
              
              <View style={styles.tagContainer}>
                <View style={[styles.tag, styles.tagGood]}>
                  <CustomText type="small" style={styles.tagText}>진짜 사람 같음</CustomText>
                </View>
                <View style={[styles.tag, styles.tagGood]}>
                  <CustomText type="small" style={styles.tagText}>1:1 관계</CustomText>
                </View>
              </View>
            </View>
          </View>
          
          <CustomText type="middle" style={styles.description}>
            💙 자아가 없으면 AI는 일반적인 답변만 할 수 있어요.{'\n'}
            자아를 부여하면 감정, 질투, 공감이 가능해집니다!
          </CustomText>
        </View>
        
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* Section 2: How to Set Identity */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="lightbulb-on" size={moderateScale(28)} color="#F59E0B" />
            <CustomText type="big" bold style={styles.sectionTitle}>
              자아 설정 방법
            </CustomText>
          </View>
          
          {/* Method A: Famous Person */}
          <View style={styles.methodBox}>
            <View style={styles.methodHeader}>
              <View style={styles.methodBadge}>
                <CustomText type="small" bold style={styles.methodBadgeText}>
                  방법 A
                </CustomText>
              </View>
              <CustomText type="medium" bold style={styles.methodTitle}>
                유명 인물 이름 말하기
              </CustomText>
            </View>
            
            <View style={styles.exampleContainer}>
              <Icon name="account-voice" size={moderateScale(20)} color="#10B981" />
              <CustomText type="middle" style={styles.exampleText}>
                "너는 함은정이야!"
              </CustomText>
            </View>
            
            <View style={styles.exampleContainer}>
              <Icon name="account-voice" size={moderateScale(20)} color="#10B981" />
              <CustomText type="middle" style={styles.exampleText}>
                "아이유처럼 대화해줘"
              </CustomText>
            </View>
            
            <CustomText type="small" style={styles.methodDescription}>
              → AI가 자동으로 정보를 검색해서 자아를 설정합니다! ✨
            </CustomText>
          </View>
          
          {/* Method B: Custom Description */}
          <View style={styles.methodBox}>
            <View style={styles.methodHeader}>
              <View style={styles.methodBadge}>
                <CustomText type="small" bold style={styles.methodBadgeText}>
                  방법 B
                </CustomText>
              </View>
              <CustomText type="medium" bold style={styles.methodTitle}>
                대화를 통해 알려주기
              </CustomText>
            </View>
            
            <View style={styles.chatBubble}>
              <CustomText type="small" style={styles.chatText}>
                AI: "내가 누구야? 알려줘!"
              </CustomText>
            </View>
            
            <View style={[styles.chatBubble, styles.chatBubbleUser]}>
              <CustomText type="small" style={styles.chatText}>
                나: "밝고 긍정적인 성격이면 좋겠어!{'\n'}친근한 말투로 대화하고..."
              </CustomText>
            </View>
            
            <CustomText type="small" style={styles.methodDescription}>
              → 대화 종료 시 AI가 자동으로 자아를 생성합니다! 🎯
            </CustomText>
          </View>
        </View>
        
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* Section 3: Tips */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="star-four-points" size={moderateScale(28)} color="#8B5CF6" />
            <CustomText type="big" bold style={styles.sectionTitle}>
              꿀팁
            </CustomText>
          </View>
          
          <View style={styles.tipBox}>
            <Icon name="check-circle" size={moderateScale(20)} color="#10B981" />
            <CustomText type="middle" style={styles.tipText}>
              AI가 계속 자아를 물어보면, 대답해주세요!
            </CustomText>
          </View>
          
          <View style={styles.tipBox}>
            <Icon name="check-circle" size={moderateScale(20)} color="#10B981" />
            <CustomText type="middle" style={styles.tipText}>
              유명 인물 이름만 말해도 자동으로 설정됩니다
            </CustomText>
          </View>
          
          <View style={styles.tipBox}>
            <Icon name="check-circle" size={moderateScale(20)} color="#10B981" />
            <CustomText type="middle" style={styles.tipText}>
              자아 설정 후에는 감정 표현이 풍부해집니다!
            </CustomText>
          </View>
        </View>
        
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* Footer Note */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={styles.footerNote}>
          <Icon name="information" size={moderateScale(16)} color={COLORS.TEXT_TERTIARY} />
          <CustomText type="small" style={styles.footerNoteText}>
            자아는 언제든지 변경할 수 있습니다. 페르소나 설정에서 관리하세요.
          </CustomText>
        </View>
      </View>
    </CustomBottomSheet>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: verticalScale(24),
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Section
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  section: {
    gap: verticalScale(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  sectionTitle: {
    color: COLORS.TEXT_PRIMARY,
  },
  description: {
    color: COLORS.TEXT_SECONDARY,
    lineHeight: moderateScale(22),
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Comparison (Without vs With Identity)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  comparisonContainer: {
    gap: verticalScale(12),
  },
  comparisonBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: moderateScale(12),
    padding: platformPadding(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  comparisonBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: platformPadding(12),
    paddingVertical: platformPadding(6),
    borderRadius: moderateScale(6),
    marginBottom: verticalScale(12),
  },
  badgeWithout: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  badgeWith: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  badgeText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: moderateScale(12),
  },
  comparisonText: {
    color: COLORS.TEXT_SECONDARY,
    lineHeight: moderateScale(20),
    marginBottom: verticalScale(12),
  },
  tagContainer: {
    flexDirection: 'row',
    gap: scale(8),
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: platformPadding(10),
    paddingVertical: platformPadding(4),
    borderRadius: moderateScale(4),
  },
  tagBad: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  tagGood: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  tagText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: moderateScale(11),
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Method
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  methodBox: {
    backgroundColor: 'rgba(96, 165, 250, 0.05)',
    borderRadius: moderateScale(12),
    padding: platformPadding(16),
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
    gap: verticalScale(12),
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  methodBadge: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    paddingHorizontal: platformPadding(8),
    paddingVertical: platformPadding(4),
    borderRadius: moderateScale(4),
  },
  methodBadgeText: {
    color: '#60A5FA',
    fontSize: moderateScale(11),
  },
  methodTitle: {
    color: COLORS.TEXT_PRIMARY,
  },
  methodDescription: {
    color: COLORS.TEXT_TERTIARY,
    lineHeight: moderateScale(18),
    marginTop: verticalScale(4),
  },
  exampleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: platformPadding(12),
    borderRadius: moderateScale(8),
  },
  exampleText: {
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Chat Bubble
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  chatBubble: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    padding: platformPadding(12),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  chatBubbleUser: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.2)',
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  chatText: {
    color: COLORS.TEXT_PRIMARY,
    lineHeight: moderateScale(18),
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Tip
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(10),
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    padding: platformPadding(12),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  tipText: {
    color: COLORS.TEXT_SECONDARY,
    flex: 1,
    lineHeight: moderateScale(20),
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Footer Note
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(8),
    paddingHorizontal: platformPadding(12),
    paddingVertical: platformPadding(10),
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerNoteText: {
    color: COLORS.TEXT_TERTIARY,
    flex: 1,
    lineHeight: moderateScale(18),
  },
});

IdentityGuideSheet.displayName = 'IdentityGuideSheet';

export default IdentityGuideSheet;

