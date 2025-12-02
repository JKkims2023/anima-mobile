/**
 * 💰 PointScreen - Point Management & In-App Purchase
 * 
 * Features:
 * - View current points
 * - Purchase point packages
 * - View purchase history
 * - Use points for premium features
 * 
 * Design: Modern Card Style with ANIMA branding
 * 
 * @author JK & Hero AI
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from '../components/CustomText';
import CustomButton from '../components/CustomButton';
import SafeScreen from '../components/SafeScreen';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { scale, moderateScale, platformPadding } from '../utils/responsive-utils';
import { COLORS } from '../styles/commonstyles';

/**
 * PointScreen Component
 */
const PointScreen = () => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { user, isAuthenticated } = useUser();

  // ✅ Point packages state (TODO: Fetch from API)
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Current points (from user context)
  const currentPoints = user?.user_point || 0;

  // ✅ Load point packages on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadPointPackages();
    }
  }, [isAuthenticated]);

  // ✅ Load point packages
  const loadPointPackages = async () => {
    setIsLoading(true);
    try {
      // TODO: Fetch point packages from API
      // const result = await pointService.getPackages();
      // setPackages(result.data);
      
      // Temporary empty state
      setPackages([]);
    } catch (error) {
      console.error('[PointScreen] Failed to load packages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeScreen
      backgroundColor={currentTheme.backgroundColor}
      statusBarStyle={currentTheme.statusBarStyle || 'light-content'}
      edges={{ top: true, bottom: false }}
      keyboardAware={false}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <CustomText type="big" bold style={styles.headerTitle}>
            {t('navigation.title.point')}
          </CustomText>
          <CustomText type="small" style={styles.headerSubtitle}>
            {t('navigation.subtitle.point')}
          </CustomText>
        </View>

        {/* Content - Coming Soon */}
        <View style={styles.contentContainer}>
          <CustomText type="normal" style={styles.comingSoonText}>
            포인트 시스템이 곧 준비됩니다! 💰
          </CustomText>
        </View>
      </View>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: platformPadding(20),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Header
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  header: {
    paddingTop: platformPadding(20),
    paddingBottom: platformPadding(16),
  },
  headerTitle: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: scale(4),
  },
  headerSubtitle: {
    color: COLORS.TEXT_SECONDARY,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Content
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: platformPadding(40),
  },
  comingSoonText: {
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
});

export default PointScreen;

