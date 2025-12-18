/**
 * 💰 PointPurchaseTab - 포인트 충전 탭
 * 
 * ANIMA 감성:
 * - 간결한 충전 UI
 * - 즉시 피드백
 * - 부드러운 애니메이션
 * 
 * @author JK & Hero Nexus
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import CustomText from '../CustomText';
import CustomButton from '../CustomButton';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { useAnima } from '../../contexts/AnimaContext';
import { scale, moderateScale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';
import { purchasePoints } from '../../services/api/pointService';

/**
 * 포인트 패키지 정의
 */
const POINT_PACKAGES = [
  {
    amount: 1000,
    emoji: '🌱',
    label: '스타터',
    color: '#10B981', // Green
  },
  {
    amount: 5000,
    emoji: '⭐',
    label: '인기',
    color: '#F59E0B', // Amber
    popular: true,
  },
  {
    amount: 10000,
    emoji: '💎',
    label: '프리미엄',
    color: '#8B5CF6', // Purple
  },
];

/**
 * 💰 PointPurchaseTab Component
 */
const PointPurchaseTab = ({ onCancel }) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { user, refreshUser } = useUser();
  const { showToast, showAlert } = useAnima();

  // ✅ State
  const [totalAmount, setTotalAmount] = useState(0); // ⭐ 누적 금액
  const [loading, setLoading] = useState(false);

  // ✅ Handle Package Select (누적)
  const handlePackageSelect = (amount) => {
    HapticService.light();
    setTotalAmount(prev => prev + amount); // ⭐ 누적!
  };

  // ✅ Handle Purchase
  const handlePurchase = async () => {
    if (!totalAmount || totalAmount === 0) {
      showToast({
        type: 'info',
        emoji: '💡',
        message: t('points.select_package', '충전할 포인트를 선택해주세요'),
      });
      return;
    }

    // Show confirmation
    showAlert({
      title: t('points.purchase_confirm_title', '포인트 충전'),
      message: t('points.purchase_confirm_message', `${totalAmount.toLocaleString()}`),
      emoji: '💰',
      buttons: [
        {
          text: t('common.cancel', '취소'),
          style: 'cancel',
        },
        {
          text: t('points.purchase', '충전하기'),
          onPress: async () => {
            await executePurchase();
          },
        },
      ],
    });
  };

  // ⭐ Handle Reset (초기화)
  const handleReset = () => {
    HapticService.light();
    setTotalAmount(0);
  };

  // ✅ Execute Purchase
  const executePurchase = async () => {
    if (!user?.user_key) {
      showToast({
        type: 'error',
        emoji: '❌',
        message: t('common.error', '오류가 발생했습니다'),
      });
      return;
    }

    setLoading(true);
    HapticService.medium();

    try {
      const result = await purchasePoints(user.user_key, totalAmount);

      if (result.success) {
        // ✅ Success!
        HapticService.success();
        
        // Refresh user data
        await refreshUser();

        showToast({
          type: 'success',
          emoji: '🎉',
          message: t('points.purchase_success', `${totalAmount.toLocaleString()} P가 충전되었습니다!`),
        });

        // Reset total
        setTotalAmount(0);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('[PointPurchaseTab] Purchase error:', error);
      HapticService.error();
      
      showToast({
        type: 'error',
        emoji: '❌',
        message: error.message || t('points.purchase_error', '충전에 실패했습니다'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Title */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <CustomText type="title" bold style={styles.sectionTitle}>
        {t('points.select_amount', '충전할 금액을 선택하세요')}
      </CustomText>

      {/* ⭐ 누적 금액 표시 */}
      {true && (
        <View style={styles.totalAmountCard}>
          <View style={styles.totalAmountHeader}>
            <CustomText type="normal" style={styles.totalAmountLabel}>
              💰 충전할 포인트
            </CustomText>
            <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
              <CustomText type="tiny" style={styles.resetButtonText}>
                X
              </CustomText>
            </TouchableOpacity>
          </View>
          <CustomText type="huge" bold style={styles.totalAmountValue}>
            {totalAmount.toLocaleString()} P
          </CustomText>
        </View>
      )}

      <View style={styles.packageContainer}>

        <TouchableOpacity
          style={[
            styles.packageCard,
            { borderColor: POINT_PACKAGES[0].color },
          ]}
          onPress={() => handlePackageSelect(POINT_PACKAGES[0].amount)}
          activeOpacity={0.7}
          disabled={loading}
        >
          {/* Popular Badge */}
          {false && (
            <View style={[styles.popularBadge, { backgroundColor: POINT_PACKAGES[0].color }]}>
              <CustomText type="tiny" bold style={styles.popularBadgeText}>
                인기
              </CustomText>
            </View>
          )}

          {/* Content */}
          <View style={styles.packageContent}>
            <CustomText type="huge" style={styles.packageEmoji}>
              {POINT_PACKAGES[0].emoji}
            </CustomText>
            <View style={styles.packageInfo}>
              <CustomText type="small" style={styles.packageLabel}>
                {POINT_PACKAGES[0].label}
              </CustomText>
              <CustomText type="big" bold style={[styles.packageAmount, { color: POINT_PACKAGES[0].color }]}>
                +{POINT_PACKAGES[0].amount.toLocaleString()} P
              </CustomText>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.packageCard,
            { borderColor: POINT_PACKAGES[1].color },
          ]}
          onPress={() => handlePackageSelect(POINT_PACKAGES[1].amount)}
          activeOpacity={0.7}
          disabled={loading}
        >
          {/* Popular Badge */}
          {false && (
            <View style={[styles.popularBadge, { backgroundColor: POINT_PACKAGES[1].color }]}>
              <CustomText type="tiny" bold style={styles.popularBadgeText}>
                인기
              </CustomText>
            </View>
          )}

          {/* Content */}
          <View style={styles.packageContent}>
            <CustomText type="huge" style={styles.packageEmoji}>
              {POINT_PACKAGES[1].emoji}
            </CustomText>
            <View style={styles.packageInfo}>
              <CustomText type="small" style={styles.packageLabel}>
                {POINT_PACKAGES[1].label}
              </CustomText>
              <CustomText type="big" bold style={[styles.packageAmount, { color: POINT_PACKAGES[1].color }]}>
                +{POINT_PACKAGES[1].amount.toLocaleString()} P
              </CustomText>
            </View>
          </View>
        </TouchableOpacity>

      </View>

      <TouchableOpacity
          style={[
            styles.packageCard,
            { borderColor: POINT_PACKAGES[2].color },
          ]}
          onPress={() => handlePackageSelect(POINT_PACKAGES[2].amount)}
          activeOpacity={0.7}
          disabled={loading}
        >
          {/* Popular Badge */}
          {false && (
            <View style={[styles.popularBadge, { backgroundColor: POINT_PACKAGES[2].color }]}>
              <CustomText type="tiny" bold style={styles.popularBadgeText}>
                인기
              </CustomText>
            </View>
          )}

          {/* Content */}
          <View style={styles.packageContent}>
            <CustomText type="huge" style={styles.packageEmoji}>
              {POINT_PACKAGES[2].emoji}
            </CustomText>
            <View style={styles.packageInfo}>
              <CustomText type="small" style={styles.packageLabel}>
                {POINT_PACKAGES[2].label}
              </CustomText>
              <CustomText type="big" bold style={[styles.packageAmount, { color: POINT_PACKAGES[2].color }]}>
                +{POINT_PACKAGES[2].amount.toLocaleString()} P
              </CustomText>
            </View>
          </View>
      </TouchableOpacity>



      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Purchase Button */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <View style={styles.purchaseButtonContainer}>
      <CustomButton
          title={
            t('common.cancel', '취소')
          }
          onPress={onCancel}
          style={{
            flex: 1,
            marginRight: platformPadding(5),
          }}
          fullWidth={true}
          type="outline"
        />
        <CustomButton
          title={
            loading
              ? t('points.purchasing', '충전 중...')
              : t('points.purchase_button')
              
          }
          onPress={handlePurchase}
          style={[{
            
              flex: 1,
              marginLeft: platformPadding(5),
            },
            totalAmount === 0 && styles.purchaseButtonDisabled,
          ]}
          disabled={totalAmount === 0 || loading}
          type="primary"
          fullWidth
        />
      </View>

      {loading && (
        <ActivityIndicator
          size="small"
          color={COLORS.DEEP_BLUE}
          style={styles.loadingIndicator}
        />
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Info */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <View style={styles.infoCard}>
        <CustomText type="small" style={styles.infoText}>
          💡 {t('points.info', '포인트는 페르소나 생성, 음원 제작 등에 사용됩니다')}
        </CustomText>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: platformPadding(20),
    paddingBottom: platformPadding(40),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Title
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  sectionTitle: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: platformPadding(20),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Total Amount Card
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  totalAmountCard: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    borderRadius: moderateScale(16),
    padding: platformPadding(20),
    marginBottom: platformPadding(24),
    borderWidth: 2,
    borderColor: COLORS.DEEP_BLUE,
  },
  totalAmountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: platformPadding(8),
  },
  totalAmountLabel: {
    color: COLORS.TEXT_SECONDARY,
  },
  totalAmountValue: {
    color: COLORS.DEEP_BLUE,
    fontSize: moderateScale(28),
  },
  resetButton: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  resetButtonText: {
    color: '#EF4444',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Package Card
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  packageCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: moderateScale(16),
    padding: platformPadding(20),
    marginBottom: platformPadding(16),
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  packageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packageEmoji: {
    fontSize: moderateScale(32),
    marginRight: scale(16),
    display: 'none',
  },
  packageInfo: {
    flex: 1,
  },
  packageLabel: {
    color: COLORS.TEXT_SECONDARY,
    marginBottom: scale(4),
    display: 'none',
  },
  packageAmount: {
    fontSize: moderateScale(28),
  },
  popularBadge: {
    position: 'absolute',

    
    right: scale(16),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },
  popularBadgeText: {
    color: '#FFFFFF',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Purchase Button
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  purchaseButton: {
    marginTop: platformPadding(10),
    marginBottom: platformPadding(20),
  },
  purchaseButtonDisabled: {
    opacity: 0.5,
  },
  loadingIndicator: {
    marginTop: platformPadding(10),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Info Card
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  infoCard: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderRadius: moderateScale(12),
    padding: platformPadding(16),
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    display: 'none',
  },
  infoText: {
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  packageContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: platformPadding(16),
  },
  purchaseButtonContainer: {
    marginTop: platformPadding(10),
    marginBottom: platformPadding(20),
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

export default PointPurchaseTab;

