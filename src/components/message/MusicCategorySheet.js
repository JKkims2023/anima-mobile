/**
 * 🎵 MusicCategorySheet.js - 음악 카테고리 선택
 * 
 * ANIMA Philosophy:
 * - 6개 카테고리 (2x3 그리드): 사랑, 슬픔, 위로, 축하, 커스텀, 없음
 * - 기본 음원: DB에서 URL 자동 로드 후 즉시 재생
 * - 커스텀: UserMusicListModal 열기 (사용자 생성 음원)
 * - EffectCategorySheet와 동일한 디자인 언어
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-16
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  Modal,
  Animated,
  Vibration,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import CustomText from '../CustomText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, verticalScale } from '../../utils/responsive-utils';
import musicService from '../../services/api/musicService';
import { useUser } from '../../contexts/UserContext';

const { width, height } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════════════
// 🎵 Music Category Definitions
// ═══════════════════════════════════════════════════════════════════════════

const MUSIC_CATEGORIES = [
  {
    id: 'love',
    emoji: '💕',
    name: '사랑',
    description: '설레는 감정',
    music_key: 'default_music_love_inst',
    colorScheme: ['#FF6B9D', '#FFC3A0'],
  },
  {
    id: 'sorrow',
    emoji: '💙',
    name: '슬픔',
    description: '잔잔한 위로',
    music_key: 'default_music_sorrow_inst',
    colorScheme: ['#667eea', '#764ba2'],
  },
  {
    id: 'comfort',
    emoji: '🤗',
    name: '위로',
    description: '따뜻한 포옹',
    music_key: 'default_music_help_inst',
    colorScheme: ['#f093fb', '#f5576c'],
  },
  {
    id: 'celebration',
    emoji: '🎉',
    name: '축하',
    description: '기쁨을 함께',
    music_key: 'default_music_congrats_inst',
    colorScheme: ['#4facfe', '#00f2fe'],
  },
  {
    id: 'custom',
    emoji: '🎼',
    name: '커스텀',
    description: '나만의 음악',
    colorScheme: ['#a8edea', '#fed6e3'],
    type: 'modal', // ⭐ Opens UserMusicListModal
  },
  {
    id: 'none',
    emoji: '🔇',
    name: '없음',
    description: '음악 없이',
    colorScheme: ['#e0e0e0', '#c0c0c0'],
    type: 'direct', // ⭐ Direct selection (no music)
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Category Item Component (Memoized)
// ═══════════════════════════════════════════════════════════════════════════

const CategoryItem = React.memo(({ category, onSelect, isLoading, isSelected }) => {
  const handlePress = useCallback(() => {
    if (isLoading) return; // ⭐ Prevent double-click while loading
    
    Vibration.vibrate(10);
    onSelect(category);
  }, [category, onSelect, isLoading]);

  return (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={isLoading}
    >
      <LinearGradient
        colors={category.colorScheme}
        style={styles.categoryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Emoji */}
        <Text style={styles.categoryEmoji}>{category.emoji}</Text>

        {/* Name */}
        <CustomText style={styles.categoryName} weight="medium">
          {category.name}
        </CustomText>

        {/* Description */}
        <CustomText style={styles.categoryDescription} weight="light">
          {category.description}
        </CustomText>

        {/* Loading Indicator (음원 로딩 중) */}
        {isLoading && isSelected && (
          <View style={styles.loadingBadge}>
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        )}

        {/* Type Badge (커스텀 또는 없음) */}
        {(category.type === 'modal' || category.type === 'direct') && (
          <View style={styles.typeBadge}>
            <Icon 
              name={category.type === 'modal' ? 'chevron-right' : 'check'} 
              size={scale(16)} 
              color="#FFFFFF" 
            />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
});

CategoryItem.displayName = 'CategoryItem';

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Main Component
// ═══════════════════════════════════════════════════════════════════════════

const MusicCategorySheet = ({
  visible,
  onClose,
  onSelectMusic, // (music_key, music_url, music_title) => void
  onOpenCustomModal, // () => void (open UserMusicListModal)
  currentMusicKey, // 현재 선택된 음악
}) => {
  const { user } = useUser();
  
  // ═══════════════════════════════════════════════════════════════════════════
  // State
  // ═══════════════════════════════════════════════════════════════════════════
  const [slideAnim] = useState(new Animated.Value(height));
  const [loadingCategory, setLoadingCategory] = useState(null); // 로딩 중인 카테고리 ID
  const [musicCache, setMusicCache] = useState({}); // music_key -> { url, title } 캐시

  // ═══════════════════════════════════════════════════════════════════════════
  // Callbacks
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSelectCategory = useCallback(async (category) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎵 [MusicCategorySheet] Category selected!');
    console.log('   Category:', category.name, category.emoji);
    console.log('   Type:', category.type);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ═══════════════════════════════════════════════════════════════
    // 1. "없음" 선택 시 → 즉시 적용
    // ═══════════════════════════════════════════════════════════════
    if (category.type === 'direct') {
      console.log('   Direct type (없음) - applying immediately');
      onSelectMusic('none', null, null);
      onClose();
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. "커스텀" 선택 시 → UserMusicListModal 열기
    // ═══════════════════════════════════════════════════════════════
    if (category.type === 'modal') {
      console.log('   Modal type (커스텀) - opening UserMusicListModal');
      onOpenCustomModal && onOpenCustomModal();
      onClose(); // ⭐ 부모 시트 닫기
      return;
    }

    if (category.id === 'none') {
      console.log('   Direct type (없음) - applying immediately');
      onSelectMusic('none', null, null);
      onClose();
      return;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // 3. 기본 음원 선택 시 → DB에서 URL 조회 + 재생
    // ═══════════════════════════════════════════════════════════════
    console.log('   Default music - fetching URL from DB...');
    
    setLoadingCategory(category.id);

    try {
      // ⭐ Check cache first
      if (musicCache[category.music_key]) {
        console.log('   ✅ Using cached music URL');
        const cached = musicCache[category.music_key];
        onSelectMusic(category.music_key, cached.url, cached.title);
        onClose();
        setLoadingCategory(null);
        return;
      }

      // ⭐ Fetch from DB (musicService.listMusic)
      console.log('   📡 Fetching music from DB:', category.music_key);
      
      const result = await musicService.listMusic(user?.user_key, {
        page: 1,
        limit: 100, // ⭐ Fetch all to find default music
      });

      if (result.success && result.data?.music_list) {
        const music = result.data.music_list.find(
          (m) => m.music_key === category.music_key && m.is_default === 'Y'
        );

        if (music && music.music_url) {
          console.log('   ✅ Music found:', music.music_title, music.music_url);
          
          // ⭐ Cache it for future use
          setMusicCache((prev) => ({
            ...prev,
            [category.music_key]: {
              url: music.music_url,
              title: music.music_title,
            },
          }));

          // ⭐ Call parent handler
          onSelectMusic(category.music_key, music.music_url, music.music_title);
          onClose();
        } else {
          console.error('   ❌ Music not found in DB!');
          // ⭐ TODO: Show error alert
          alert('음원을 찾을 수 없습니다.');
        }
      } else {
        console.error('   ❌ Failed to fetch music list:', result.errorCode);
        alert('음원 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('   ❌ Error fetching music:', error);
      alert('음원을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingCategory(null);
    }
  }, [user, musicCache, onSelectMusic, onOpenCustomModal, onClose]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Effects
  // ═══════════════════════════════════════════════════════════════════════════

  // Slide animation
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 100,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  // BackHandler for Android
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('🔙 [MusicCategorySheet] Back button pressed');
      onClose();
      return true;
    });

    return () => backHandler.remove();
  }, [visible, onClose]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} pointerEvents="box-none">
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={10}
            pointerEvents="none"
          />
        </View>
      </TouchableWithoutFeedback>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.sheetContainer,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.handleBar} />

          <CustomText style={styles.title} weight="bold">
            🎵 음악 선택
          </CustomText>

          <CustomText style={styles.subtitle} weight="light">
            메시지에 어울리는 음악을 선택하세요
          </CustomText>
        </View>

        {/* Categories Grid (2x3) */}
        <View style={styles.categoriesContainer}>
          {MUSIC_CATEGORIES.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              onSelect={handleSelectCategory}
              isLoading={loadingCategory === category.id}
              isSelected={currentMusicKey === category.music_key || (currentMusicKey === 'none' && category.type === 'direct')}
            />
          ))}
        </View>

        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <CustomText style={styles.closeButtonText} weight="medium">
            닫기
          </CustomText>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Styles
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 40,
    maxHeight: height * 0.75,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: (width - 48) / 2, // 2-column grid
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  categoryGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    position: 'relative',
  },
  categoryEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  loadingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    marginTop: 16,
    marginHorizontal: 24,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default React.memo(MusicCategorySheet);
