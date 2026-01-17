/**
 * 💰 CompactPointPurchaseTab - Ultra Compact Point Purchase UI
 * 
 * ✨ Design Philosophy:
 * - NO SCROLL! (모든 옵션이 한 눈에!)
 * - 3-Column Grid (가로로 나란히)
 * - Tiny fonts & padding (공간 효율 최대화)
 * - Click to accumulate (기존 로직 유지)
 * - Bottom fixed area for total & buttons
 * 
 * @author JK & Hero Nexus
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import CustomText from '../CustomText';
import CustomButton from '../CustomButton';
import { useUser } from '../../contexts/UserContext';
import { purchasePoints } from '../../services/api/pointService';
import { scale, moderateScale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';
import { useAnima } from '../../contexts/AnimaContext';

// ⭐ COMPACT Point Packages (3개만!)
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
    label: '스탠다드',
    color: '#3B82F6', // Blue
  },
  {
    amount: 10000,
    emoji: '💎',
    label: '프리미엄',
    color: '#8B5CF6', // Purple
  },
];

/**
 * 💰 CompactPointPurchaseTab Component
 */
const CompactPointPurchaseTab = ({ onCancel }) => {
  const { t } = useTranslation();
  const { user, refreshUser } = useUser();
  const { showToast, showAlert } = useAnima();
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  // ⭐ Handle Package Select (누적)
  const handlePackageSelect = (amount) => {
    HapticService.light();
    setTotalAmount((prev) => prev + amount);
  };

  // ⭐ Handle Reset (초기화)
  const handleReset = () => {
    HapticService.light();
    setTotalAmount(0);
  };

  // ✅ Execute Purchase
  const executePurchase = async () => {
    if (!user?.user_key) {
      showAlert({
        title: t('common.error', '오류가 발생했습니다'),
        message: t('common.error', '오류가 발생했습니다'),
        emoji: '❌',
        buttons: [
          {
            text: t('common.cancel', '취소'),
            style: 'cancel',
          },
        ],
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

        showAlert({
          emoji: '🎉',
          title: t('points.purchase_success_title', '포인트 충전 성공'),
          message: t('points.purchase_success_message', `${totalAmount.toLocaleString()} P가 충전되었습니다!`),
          buttons: [
            {
              text: t('common.confirm', '확인'),
              style: 'primary',
              onPress: () => {
                onCancel();
              },
            },
          ],
        });

        // Reset total
        setTotalAmount(0);

      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('[CompactPointPurchaseTab] Purchase error:', error);
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

  // ✅ Handle Purchase Button Press
  const handlePurchase = () => {
    if (totalAmount === 0) return;
    
    HapticService.medium();

    showAlert({
      title: t('points.purchase_confirm_title', '포인트 충전'),
      message: t('points.purchase_confirm_message', {amount: totalAmount.toLocaleString()}),
      emoji: '💰',
      buttons: [
        {
          text: t('common.cancel', '취소'),
          style: 'cancel',
        },
        {
          text: t('points.purchase', '충전하기'),
          style: 'primary',
          onPress: () => {
            executePurchase();
          },
        },
      ],
    });

  };

  return (
    <View style={styles.container}>
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Title (Compact!) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <CustomText type="title"  style={styles.title}>
        {t('points.select_amount', '충전할 금액을 선택하세요')}
      </CustomText>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Package Grid (3 Columns, 1 Row) ⭐ NO SCROLL! */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <View style={styles.packageGrid}>
        {POINT_PACKAGES.map((pkg, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.packageCard, { borderColor: pkg.color }]}
            onPress={() => handlePackageSelect(pkg.amount)}
            activeOpacity={0.7}
            disabled={loading}
          >
            {/* Emoji */}
            <CustomText type="big" style={styles.packageEmoji}>
              {pkg.emoji}
            </CustomText>
            
            {/* Label */}
            <CustomText type="tiny" style={styles.packageLabel}>
              {pkg.label}
            </CustomText>
            
            {/* Amount */}
            <CustomText
              type="middle"
              bold
              style={[styles.packageAmount, { color: pkg.color }]}
            >
              +{pkg.amount.toLocaleString()}P
            </CustomText>
          </TouchableOpacity>
        ))}
      </View>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Total Amount (Compact, at Bottom) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {true && (
        <View style={styles.totalAmountCard}>
          <View style={styles.totalAmountContent}>
            <CustomText type="tiny" style={styles.totalAmountLabel}>
              💰 선택한 금액
            </CustomText>
            <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
              <CustomText type="tiny" bold style={styles.resetButtonText}>
                초기화
              </CustomText>
            </TouchableOpacity>
          </View>
          <CustomText type="big" bold style={styles.totalAmountValue}>
            {totalAmount.toLocaleString()} P
          </CustomText>
        </View>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Buttons (Fixed at Bottom) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <View style={styles.buttonContainer}>
        
        <CustomButton
          title={
            loading
              ? t('points.purchasing', '충전 중...')
              : totalAmount > 0
              ? `${totalAmount.toLocaleString()} P ${t('points.purchase_button', '충전하기')}`
              : t('points.purchase_button', '충전하기')
          }
          onPress={handlePurchase}
          disabled={totalAmount === 0 || loading}
          type="primary"
          fullWidth
          style={styles.purchaseButton}
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
      {/* Info (Compact!) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <View style={styles.infoCard}>
        <CustomText type="tiny" style={styles.infoText}>
          💡 {t('points.info', '포인트는 페르소나 생성, 음원 제작 등에 사용됩니다')}
        </CustomText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: platformPadding(0),
    paddingBottom: platformPadding(20),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Title
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  title: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: platformPadding(12), // ⭐ 작게!
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Package Grid (3 Columns, 1 Row) ⭐ KEY!
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  packageGrid: {
    flexDirection: 'row',
    gap: scale(8), // ⭐ 작게!
    marginBottom: platformPadding(12),
    marginTop: platformPadding(12),
  },
  packageCard: {
    flex: 1, // ⭐ 3등분!
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    padding: platformPadding(12), // ⭐ 작게!
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageEmoji: {
    marginBottom: verticalScale(4), // ⭐ 작게!
    display: 'none',
  },
  packageLabel: {
    color: COLORS.TEXT_SECONDARY,
    display: 'none',
  },
  packageAmount: {
    // Color is dynamic
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Total Amount (Compact, at Bottom)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  totalAmountCard: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderRadius: moderateScale(10),
    padding: platformPadding(12), // ⭐ 작게!
    marginBottom: platformPadding(12),
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    marginTop: platformPadding(10),
  },
  totalAmountContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  totalAmountLabel: {
    color: COLORS.TEXT_SECONDARY,
  },
  totalAmountValue: {
    color: COLORS.DEEP_BLUE,
  },
  resetButton: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  resetButtonText: {
    color: '#EF4444',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Buttons (Fixed at Bottom)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  buttonContainer: {
    flexDirection: 'row',
    gap: scale(10),
    marginTop: platformPadding(12),
  },
  cancelButton: {
    flex: 1,
  },
  purchaseButton: {
    flex: 1.5, // ⭐ 충전 버튼이 약간 더 크게!
  },

  loadingIndicator: {
    marginVertical: platformPadding(8),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Info (Compact!)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: moderateScale(8),
    padding: platformPadding(10), // ⭐ 작게!
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    display: 'none',
  },
  infoText: {
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
});

export default CompactPointPurchaseTab;
