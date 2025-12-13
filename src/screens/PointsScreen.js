/**
 * 💰 PointsScreen - 포인트 관리 (탭 구조)
 * 
 * ANIMA 감성:
 * - 감성적이고 직관적인 디자인
 * - 딱딱하지 않은 부드러운 UI
 * - 명확한 정보 전달
 * 
 * Features:
 * - [충전] 탭: 포인트 구매
 * - [히스토리] 탭: 사용 내역
 * 
 * @author JK & Hero Nexus
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import CustomText from '../components/CustomText';
import SafeScreen from '../components/SafeScreen';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { scale, moderateScale, verticalScale, platformPadding } from '../utils/responsive-utils';
import { COLORS } from '../styles/commonstyles';
import HapticService from '../utils/HapticService';

// Import Tabs
import PointPurchaseTab from '../components/points/PointPurchaseTab';
import PointHistoryTab from '../components/points/PointHistoryTab';

/**
 * 💰 PointsScreen Component
 */
const PointsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { user, refreshUser } = useUser();

  // ✅ Tab state
  const [activeTab, setActiveTab] = useState('purchase'); // 'purchase' | 'history'

  // ✅ Refresh user data when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (user && refreshUser) {
        refreshUser().catch(err => {
          console.warn('[PointsScreen] Failed to refresh user:', err);
        });
      }
    }, [user, refreshUser])
  );

  // ✅ Handle Tab Change
  const handleTabChange = (tab) => {
    HapticService.light();
    setActiveTab(tab);
  };

  return (
    <SafeScreen
      backgroundColor={currentTheme.backgroundColor}
      statusBarStyle={currentTheme.statusBarStyle || 'light-content'}
      edges={{ top: true, bottom: false }}
      keyboardAware={false}
    >
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Header */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <View style={styles.header}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <CustomText type="title" style={styles.backButtonText}>
            ←
          </CustomText>
        </TouchableOpacity>

        {/* Title */}
        <CustomText type="big" bold style={styles.headerTitle}>
          💰 {t('points.title', '포인트')}
        </CustomText>

        {/* Placeholder for alignment */}
        <View style={styles.backButton} />
      </View>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Current Points Card */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <View style={styles.pointsCard}>
        <CustomText type="small" style={styles.pointsCardLabel}>
          {t('points.my_points', '보유 포인트')}
        </CustomText>
        <View style={styles.pointsCardValue}>
          <CustomText type="huge" bold style={styles.pointsCardNumber}>
            {user?.user_point?.toLocaleString() || '0'}
          </CustomText>
          <CustomText type="title" style={styles.pointsCardUnit}>
            P
          </CustomText>
        </View>
      </View>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Tabs */}
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
            type="normal"
            bold={activeTab === 'purchase'}
            style={[
              styles.tabText,
              activeTab === 'purchase' && styles.tabTextActive,
            ]}
          >
            {t('points.purchase_tab', '충전')}
          </CustomText>
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
            type="normal"
            bold={activeTab === 'history'}
            style={[
              styles.tabText,
              activeTab === 'history' && styles.tabTextActive,
            ]}
          >
            {t('points.history_tab', '히스토리')}
          </CustomText>
        </TouchableOpacity>
      </View>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Tab Content */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'purchase' && <PointPurchaseTab />}
      {activeTab === 'history' && <PointHistoryTab />}
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Header
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: platformPadding(20),
    paddingTop: platformPadding(20),
    paddingBottom: scale(16),
    backgroundColor: COLORS.BACKGROUND || '#000',
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: COLORS.DEEP_BLUE,
    fontSize: moderateScale(28),
  },
  headerTitle: {
    color: COLORS.TEXT_PRIMARY,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Points Card
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  pointsCard: {
    marginHorizontal: platformPadding(20),
    marginTop: platformPadding(10),
    marginBottom: platformPadding(20),
    padding: platformPadding(24),
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    alignItems: 'center',
  },
  pointsCardLabel: {
    color: COLORS.TEXT_SECONDARY,
    marginBottom: scale(8),
  },
  pointsCardValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pointsCardNumber: {
    color: COLORS.DEEP_BLUE,
    fontSize: moderateScale(42),
    marginRight: scale(6),
  },
  pointsCardUnit: {
    color: COLORS.DEEP_BLUE,
    fontSize: moderateScale(24),
    fontWeight: '600',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Tabs
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: platformPadding(20),
    marginBottom: platformPadding(20),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: moderateScale(12),
    padding: scale(4),
  },
  tab: {
    flex: 1,
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(8),
  },
  tabActive: {
    backgroundColor: COLORS.DEEP_BLUE,
  },
  tabText: {
    color: COLORS.TEXT_SECONDARY,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});

export default PointsScreen;

