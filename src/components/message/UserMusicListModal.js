/**
 * 🎼 UserMusicListModal.js - 사용자 생성 음원 선택 모달
 * 
 * ANIMA Philosophy:
 * - 사용자가 직접 생성한 음원만 표시 (is_default === 'N')
 * - EffectDetailModal과 동일한 디자인 언어
 * - 선택 시 즉시 재생 + 플레이어 활성화
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-16
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Animated,
  BackHandler,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import CustomText from '../CustomText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, verticalScale } from '../../utils/responsive-utils';
import musicService from '../../services/api/musicService';
import { useUser } from '../../contexts/UserContext';
import HapticService from '../../utils/HapticService';

const { width, height } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Music Item Component (Memoized)
// ═══════════════════════════════════════════════════════════════════════════

const MusicItem = React.memo(({ music, isSelected, onSelect }) => {
  const handlePress = useCallback(() => {
    HapticService.light();
    onSelect(music);
  }, [music, onSelect]);

  return (
    <TouchableOpacity
      style={[
        styles.musicItem,
        isSelected && styles.musicItemSelected,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.musicItemContent}>
        {/* Icon */}
        <View style={styles.musicIcon}>
          <Icon name="music-note" size={scale(20)} color="#FFFFFF" />
        </View>

        {/* Title & Type */}
        <View style={styles.musicInfo}>
          <CustomText style={styles.musicTitle} weight="medium" numberOfLines={1}>
            {music.music_title}
          </CustomText>
          <CustomText style={styles.musicType} weight="light" numberOfLines={1}>
            {music.music_type === 'instrumental' ? '연주곡' : '보컬곡'}
            {music.tag ? ` • ${music.tag.split(',')[0]}` : ''}
          </CustomText>
        </View>

        {/* Selection Indicator */}
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Icon name="check-circle" size={scale(20)} color="#4CAF50" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

MusicItem.displayName = 'MusicItem';

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Main Component
// ═══════════════════════════════════════════════════════════════════════════

const UserMusicListModal = ({
  visible,
  onClose,
  onSelectMusic, // (music_key, music_url, music_title) => void
  currentMusicKey,
}) => {
  const { user } = useUser();

  // ═══════════════════════════════════════════════════════════════════════════
  // State
  // ═══════════════════════════════════════════════════════════════════════════
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [opacityAnim] = useState(new Animated.Value(0));
  const [musicList, setMusicList] = useState([]);
  const [loading, setLoading] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // Fetch user music list
  // ═══════════════════════════════════════════════════════════════════════════
  const fetchUserMusic = useCallback(async () => {
    if (!user?.user_key) return;

    setLoading(true);

    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎼 [UserMusicListModal] Fetching user music...');
      console.log('   user_key:', user.user_key);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const result = await musicService.listMusic(user.user_key, {
        page: 1,
        limit: 100,
      });

      if (result.success && result.data?.music_list) {
        // ⭐ Filter: Only user-generated music (is_default === 'N')
        const userMusic = result.data.music_list.filter(
          (music) => music.is_default === 'N' && music.status === 'completed'
        );

        console.log('   ✅ Found', userMusic.length, 'user-generated music');
        setMusicList(userMusic);
      } else {
        console.error('   ❌ Failed to fetch music:', result.errorCode);
        setMusicList([]);
      }
    } catch (error) {
      console.error('   ❌ Error:', error);
      setMusicList([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSelectMusic = useCallback((music) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎼 [UserMusicListModal] Music selected!');
    console.log('   music_key:', music.music_key);
    console.log('   music_title:', music.music_title);
    console.log('   music_url:', music.music_url);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    onSelectMusic(music.music_key, music.music_url, music.music_title);
    onClose();
  }, [onSelectMusic, onClose]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Effects
  // ═══════════════════════════════════════════════════════════════════════════

  // Fetch on mount
  useEffect(() => {
    if (visible) {
      fetchUserMusic();
    }
  }, [visible, fetchUserMusic]);

  // Animation
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 12,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  // BackHandler for Android
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('🔙 [UserMusicListModal] Back button pressed');
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
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Centered Container */}
      <View style={styles.centeredContainer}>
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            {/* Header */}
            <LinearGradient
              colors={['#a8edea', '#fed6e3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <CustomText style={styles.headerTitle} weight="bold">
                🎼 커스텀 음악
              </CustomText>
              <CustomText style={styles.headerSubtitle} weight="light">
                직접 생성한 음악을 선택하세요
              </CustomText>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeIconButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Icon name="close-circle" size={scale(24)} color="rgba(0, 0, 0, 0.6)" />
              </TouchableOpacity>
            </LinearGradient>

            {/* Music List */}
            <View style={styles.musicListContainer}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#a8edea" />
                  <CustomText style={styles.loadingText} weight="light">
                    음악 불러오는 중...
                  </CustomText>
                </View>
              ) : musicList.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Icon name="music-note-off" size={scale(48)} color="rgba(255, 255, 255, 0.3)" />
                  <CustomText style={styles.emptyText} weight="light">
                    생성된 음악이 없습니다
                  </CustomText>
                  <CustomText style={styles.emptySubtext} weight="light">
                    Music 탭에서 음악을 생성해보세요
                  </CustomText>
                </View>
              ) : (
                <ScrollView
                  style={styles.musicList}
                  contentContainerStyle={styles.musicListContent}
                  showsVerticalScrollIndicator={false}
                >
                  {musicList.map((music) => (
                    <MusicItem
                      key={music.music_key}
                      music={music}
                      isSelected={currentMusicKey === music.music_key}
                      onSelect={handleSelectMusic}
                    />
                  ))}
                </ScrollView>
              )}
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Styles
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.6,
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  header: {
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(16),
    paddingHorizontal: scale(20),
    position: 'relative',
  },
  headerTitle: {
    fontSize: scale(20),
    color: '#000000',
    textAlign: 'center',
    marginBottom: verticalScale(4),
  },
  headerSubtitle: {
    fontSize: scale(13),
    color: 'rgba(0, 0, 0, 0.7)',
    textAlign: 'center',
  },
  closeIconButton: {
    position: 'absolute',
    top: verticalScale(12),
    right: scale(12),
    padding: scale(8),
  },
  musicListContainer: {
    height: height * 0.6 - 90, // Modal max height - header height
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: verticalScale(12),
  },
  loadingText: {
    fontSize: scale(14),
    color: 'rgba(255, 255, 255, 0.6)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: verticalScale(12),
    paddingHorizontal: scale(20),
  },
  emptyText: {
    fontSize: scale(16),
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: scale(13),
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  musicList: {
    flex: 1,
  },
  musicListContent: {
    padding: scale(16),
    gap: verticalScale(8),
  },
  musicItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: scale(16),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  musicItemSelected: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderColor: '#4CAF50',
  },
  musicItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  musicIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(168, 237, 234, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  musicInfo: {
    flex: 1,
  },
  musicTitle: {
    fontSize: scale(15),
    color: '#FFFFFF',
    marginBottom: verticalScale(4),
  },
  musicType: {
    fontSize: scale(12),
    color: 'rgba(255, 255, 255, 0.6)',
  },
  selectedBadge: {
    marginLeft: 'auto',
  },
});

export default React.memo(UserMusicListModal);
