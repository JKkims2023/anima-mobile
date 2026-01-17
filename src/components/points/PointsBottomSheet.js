/**
 * 💰 PointsBottomSheet - Ultra Compact Point Management
 * 
 * ✨ ANIMA Philosophy:
 * - NO SCROLL in Purchase Tab (모든 옵션이 한 눈에!)
 * - Compact Design (작은 폰트, 작은 패딩)
 * - 3-Column Grid for packages
 * - Emotional Gradient Colors
 * - Efficient Space Usage
 * 
 * Features:
 * - [충전] Tab: Ultra compact 3x1 grid (NO SCROLL!)
 * - [히스토리] Tab: Efficient FlatList
 * - Click to accumulate (기존 로직 유지)
 * - CustomBottomSheet integration
 * 
 * @author JK & Hero Nexus
 */

import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import CustomText from '../CustomText';
import CustomBottomSheet from '../CustomBottomSheet';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { scale, moderateScale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';

// Import Tab Components
import CompactPointPurchaseTab from './CompactPointPurchaseTab';
import PointHistoryTab from './PointHistoryTab';

/**
 * 💰 PointsBottomSheet Component
 */
const PointsBottomSheet = forwardRef((props, ref) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { user, refreshUser } = useUser();
  
  const bottomSheetRef = useRef(null);
  const [activeTab, setActiveTab] = useState('purchase'); // 'purchase' | 'history'

  // ⭐ Expose methods to parent
  useImperativeHandle(ref, () => ({
    present: () => bottomSheetRef.current?.present(),
    dismiss: () => bottomSheetRef.current?.dismiss(),
  }));

  // ✅ Handle Tab Change
  const handleTabChange = (tab) => {
    HapticService.light();
    setActiveTab(tab);
  };

  // ✅ Handle Close
  const handleClose = () => {
    bottomSheetRef.current?.dismiss();
  };

  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      title="💰 포인트"
      snapPoints={['80%', '95%']}
      showCloseButton={true}
      onClose={handleClose}
      enablePanDownToClose={true}
      buttons={[
        {
          title: t('common.close', '닫기'),
          type: 'primary',
          onPress: handleClose,
        },
      ]}
    >
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Points Display Card (Sticky Header) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <View>
      <LinearGradient
        colors={['#FF6B9D', '#FF1493', '#A78BFA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pointsCard}
      >
        <CustomText type="tiny" style={styles.pointsCardLabel}>
          {t('points.my_points', '보유 포인트')}
        </CustomText>
        <View style={styles.pointsCardValue}>
          <CustomText type="title" bold style={styles.pointsCardNumber}>
            {user?.user_point?.toLocaleString() || '0'}
          </CustomText>
          <CustomText type="normal" style={styles.pointsCardUnit}>
            {' P'}
          </CustomText>
        </View>
      </LinearGradient>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Tabs (ANIMA Style) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'purchase' && styles.tabActive,
          ]}
          onPress={() => handleTabChange('purchase')}
          activeOpacity={0.7}
        >
          <CustomText
            type="title"
            bold={activeTab === 'purchase'}
            style={[
              styles.tabText,
              activeTab === 'purchase' && styles.tabTextActive,
            ]}
          >
            {t('points.purchase_tab', '충전')}
          </CustomText>
          {activeTab === 'purchase' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'history' && styles.tabActive,
          ]}
          onPress={() => handleTabChange('history')}
          activeOpacity={0.7}
        >
          <CustomText
            type="title"
            bold={activeTab === 'history'}
            style={[
              styles.tabText,
              activeTab === 'history' && styles.tabTextActive,
            ]}
          >
            {t('points.history_tab', '히스토리')}
          </CustomText>
          {activeTab === 'history' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>
      </View>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Tab Content */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
      {activeTab === 'purchase' && (
        <CompactPointPurchaseTab onCancel={handleClose} />
      )}
      {activeTab === 'history' && (
        <PointHistoryTab />
      )}
      </ScrollView>
    </CustomBottomSheet>
  );
});

const styles = StyleSheet.create({
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Points Card (Gradient)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  pointsCard: {
    marginHorizontal: platformPadding(0),
    marginTop: platformPadding(10),
    marginBottom: platformPadding(16),
    padding: platformPadding(16), // ⭐ 작게!
    borderRadius: moderateScale(12),
    alignItems: 'center',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pointsCardLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: scale(4),
  },
  pointsCardValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pointsCardNumber: {
    color: '#FFFFFF',
    fontSize: moderateScale(24), // ⭐ 작게!
  },
  pointsCardUnit: {
    color: '#FFFFFF',
    fontSize: moderateScale(18), // ⭐ 작게!
    fontWeight: '600',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Tabs (ANIMA Style)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: platformPadding(0),
    marginBottom: platformPadding(16),
    marginTop: platformPadding(-10),
    gap: scale(8),
  },
  tab: {
    flex: 1,
    paddingVertical: verticalScale(10), // ⭐ 작게!
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(8),
    position: 'relative',
  },
  tabActive: {
    // No background - indicator only
  },
  tabText: {
    color: COLORS.TEXT_SECONDARY,
  },
  tabTextActive: {
    color: COLORS.DEEP_BLUE,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: COLORS.DEEP_BLUE,
    borderRadius: 1,
    shadowColor: COLORS.DEEP_BLUE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  content: {
    paddingHorizontal: scale(0),
    paddingBottom: scale(40),
  },
});

export default PointsBottomSheet;
