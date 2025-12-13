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
const PointPurchaseTab = () => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { user, refreshUser } = useUser();
  const { showToast, showAlert } = useAnima();

  // ✅ State
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Handle Package Select
  const handlePackageSelect = (amount) => {
    HapticService.light();
    setSelectedAmount(amount);
  };

  // ✅ Handle Purchase
  const handlePurchase = async () => {
    if (!selectedAmount) {
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
      message: t('points.purchase_confirm_message', `${selectedAmount.toLocaleString()} P를 충전하시겠습니까?`),
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
      const result = await purchasePoints(user.user_key, selectedAmount);

      if (result.success) {
        // ✅ Success!
        HapticService.success();
        
        // Refresh user data
        await refreshUser();

        showToast({
          type: 'success',
          emoji: '🎉',
          message: t('points.purchase_success', `${selectedAmount.toLocaleString()} P가 충전되었습니다!`),
        });

        // Reset selection
        setSelectedAmount(null);
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

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Packages */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {POINT_PACKAGES.map((pkg) => (
        <TouchableOpacity
          key={pkg.amount}
          style={[
            styles.packageCard,
            selectedAmount === pkg.amount && styles.packageCardSelected,
            { borderColor: pkg.color },
          ]}
          onPress={() => handlePackageSelect(pkg.amount)}
          activeOpacity={0.7}
          disabled={loading}
        >
          {/* Popular Badge */}
          {pkg.popular && (
            <View style={[styles.popularBadge, { backgroundColor: pkg.color }]}>
              <CustomText type="tiny" bold style={styles.popularBadgeText}>
                인기
              </CustomText>
            </View>
          )}

          {/* Content */}
          <View style={styles.packageContent}>
            <CustomText type="huge" style={styles.packageEmoji}>
              {pkg.emoji}
            </CustomText>
            <View style={styles.packageInfo}>
              <CustomText type="small" style={styles.packageLabel}>
                {pkg.label}
              </CustomText>
              <CustomText type="big" bold style={[styles.packageAmount, { color: pkg.color }]}>
                {pkg.amount.toLocaleString()} P
              </CustomText>
            </View>
          </View>

          {/* Checkmark */}
          {selectedAmount === pkg.amount && (
            <View style={[styles.checkmark, { backgroundColor: pkg.color }]}>
              <CustomText type="normal" style={styles.checkmarkText}>
                ✓
              </CustomText>
            </View>
          )}
        </TouchableOpacity>
      ))}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Purchase Button */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <CustomButton
        title={
          loading
            ? t('points.purchasing', '충전 중...')
            : selectedAmount
            ? t('points.purchase_button', `${selectedAmount.toLocaleString()} P 충전하기`)
            : t('points.select_package', '충전할 포인트를 선택해주세요')
        }
        onPress={handlePurchase}
        style={[
          styles.purchaseButton,
          !selectedAmount && styles.purchaseButtonDisabled,
        ]}
        disabled={!selectedAmount || loading}
        type="primary"
      />

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
  // Package Card
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  packageCard: {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: moderateScale(16),
    padding: platformPadding(20),
    marginBottom: platformPadding(16),
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  packageCardSelected: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderWidth: 2,
  },
  packageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packageEmoji: {
    fontSize: moderateScale(48),
    marginRight: scale(16),
  },
  packageInfo: {
    flex: 1,
  },
  packageLabel: {
    color: COLORS.TEXT_SECONDARY,
    marginBottom: scale(4),
  },
  packageAmount: {
    fontSize: moderateScale(28),
  },
  popularBadge: {
    position: 'absolute',
    top: scale(-8),
    right: scale(16),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },
  popularBadgeText: {
    color: '#FFFFFF',
  },
  checkmark: {
    position: 'absolute',
    top: scale(16),
    right: scale(16),
    width: scale(28),
    height: scale(28),
    borderRadius: moderateScale(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
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
  },
  infoText: {
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
});

export default PointPurchaseTab;

