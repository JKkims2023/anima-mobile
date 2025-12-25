/**
 * AI Settings Screen
 * 
 * Features:
 * - Configure AI personality settings
 * - Speech style, response style, advice level
 * - Real-time preview
 * - Instant save
 * 
 * @author JK & Hero AI
 * @version 1.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomText from '../components/CustomText';
import { COLORS } from '../styles/commonstyles';
import { moderateScale, verticalScale, platformPadding } from '../utils/responsive-utils';
import { useUser } from '../contexts/UserContext';
import { chatApi } from '../services/api';
import { SETTING_CATEGORIES, DEFAULT_SETTINGS, getPreviewText } from '../constants/aiSettings';
import HapticService from '../utils/HapticService';

const AISettingsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await chatApi.getAIPreferences(user.user_key);
      
      if (response.success) {
        setSettings({
          speech_style: response.data.speech_style || DEFAULT_SETTINGS.speech_style,
          response_style: response.data.response_style || DEFAULT_SETTINGS.response_style,
          advice_level: response.data.advice_level || DEFAULT_SETTINGS.advice_level,
        });
      }
    } catch (error) {
      console.error('[AISettings] Load error:', error);
      Alert.alert('오류', '설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  const updateSetting = async (key, value) => {
    // Optimistic update
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    HapticService.light();
    
    try {
      setSaving(true);
      const response = await chatApi.updateAIPreferences(user.user_key, newSettings);
      
      if (response.success) {
        HapticService.success();
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('[AISettings] Update error:', error);
      // Revert on error
      setSettings(settings);
      HapticService.error();
      Alert.alert('오류', '설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };
  
  const renderOption = useCallback((category, option) => {
    const isSelected = settings[category.key] === option.id;
    
    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.optionCard,
          isSelected && styles.optionCardSelected,
        ]}
        onPress={() => updateSetting(category.key, option.id)}
        activeOpacity={0.7}
        disabled={saving}
      >
        <View style={styles.optionHeader}>
          <CustomText style={styles.optionEmoji}>{option.emoji}</CustomText>
          <View style={styles.optionTexts}>
            <CustomText type="medium" bold style={[
              styles.optionName,
              isSelected && styles.optionNameSelected
            ]}>
              {option.name}
            </CustomText>
            <CustomText type="small" style={styles.optionDescription}>
              {option.description}
            </CustomText>
          </View>
          {isSelected && (
            <CustomText style={styles.checkmark}>✓</CustomText>
          )}
        </View>
        
        {option.example && (
          <View style={styles.optionExample}>
            <CustomText type="small" style={styles.exampleText}>
              {option.example}
            </CustomText>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [settings, saving]);
  
  const renderCategory = useCallback((category) => {
    return (
      <View key={category.key} style={styles.categoryContainer}>
        <View style={styles.categoryHeader}>
          <CustomText type="big" bold style={styles.categoryTitle}>
            {category.title}
          </CustomText>
          <CustomText type="small" style={styles.categoryDescription}>
            {category.description}
          </CustomText>
        </View>
        
        <View style={styles.optionsContainer}>
          {category.options.map((option) => renderOption(category, option))}
        </View>
      </View>
    );
  }, [renderOption]);
  
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <CustomText type="medium" style={styles.loadingText}>
          설정 불러오는 중...
        </CustomText>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <CustomText style={styles.backIcon}>←</CustomText>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <CustomText type="big" bold style={styles.headerTitle}>
            🎭 AI 성격 설정
          </CustomText>
          <CustomText type="small" style={styles.headerSubtitle}>
            SAGE의 말투와 응답 스타일을 설정하세요
          </CustomText>
        </View>
        
        <View style={styles.backButton} />
      </View>
      
      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + verticalScale(20) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {SETTING_CATEGORIES.map((category) => renderCategory(category))}
        
        {/* Preview */}
        <View style={styles.previewContainer}>
          <CustomText type="medium" bold style={styles.previewTitle}>
            ✨ 설정 미리보기
          </CustomText>
          <View style={styles.previewBox}>
            <CustomText type="small" style={styles.previewText}>
              {getPreviewText(settings)}
            </CustomText>
          </View>
        </View>
        
        {/* Save indicator */}
        {saving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color="#FFF" />
            <CustomText type="small" style={styles.savingText}>
              저장 중...
            </CustomText>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.DEEP_BLUE_DARK,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.TEXT_SECONDARY,
    marginTop: verticalScale(16),
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: platformPadding(20),
    paddingVertical: platformPadding(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.2)',
  },
  backButton: {
    width: moderateScale(40),
  },
  backIcon: {
    fontSize: moderateScale(28),
    color: COLORS.TEXT_PRIMARY,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.TEXT_PRIMARY,
  },
  headerSubtitle: {
    color: COLORS.TEXT_SECONDARY,
    marginTop: verticalScale(4),
  },
  
  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: platformPadding(20),
    paddingTop: verticalScale(20),
  },
  
  // Category
  categoryContainer: {
    marginBottom: verticalScale(32),
  },
  categoryHeader: {
    marginBottom: verticalScale(16),
  },
  categoryTitle: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: verticalScale(8),
  },
  categoryDescription: {
    color: COLORS.TEXT_SECONDARY,
  },
  optionsContainer: {
    gap: verticalScale(12),
  },
  
  // Option Card
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: moderateScale(16),
    padding: platformPadding(16),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionEmoji: {
    fontSize: moderateScale(28),
    marginRight: moderateScale(12),
  },
  optionTexts: {
    flex: 1,
  },
  optionName: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: verticalScale(4),
  },
  optionNameSelected: {
    color: '#3B82F6',
  },
  optionDescription: {
    color: COLORS.TEXT_SECONDARY,
  },
  checkmark: {
    fontSize: moderateScale(24),
    color: '#3B82F6',
    marginLeft: moderateScale(8),
  },
  optionExample: {
    marginTop: verticalScale(12),
    paddingTop: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  exampleText: {
    color: COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
  },
  
  // Preview
  previewContainer: {
    marginTop: verticalScale(16),
    marginBottom: verticalScale(32),
  },
  previewTitle: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: verticalScale(12),
  },
  previewBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: moderateScale(12),
    padding: platformPadding(16),
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  previewText: {
    color: COLORS.TEXT_PRIMARY,
    lineHeight: moderateScale(22),
  },
  
  // Saving
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    borderRadius: moderateScale(8),
    padding: platformPadding(12),
    marginTop: verticalScale(16),
  },
  savingText: {
    color: '#FFF',
    marginLeft: moderateScale(8),
  },
});

export default AISettingsScreen;

