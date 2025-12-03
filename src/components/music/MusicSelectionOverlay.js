/**
 * 🎵 Music Selection Overlay Component
 * 
 * Full-screen overlay for selecting music
 * Features:
 * - Search by keyword
 * - Sort by date/type
 * - Filter by type (all/instrumental/vocal)
 * - Preview music (play button)
 * - Select music
 * 
 * @author JK & Hero Nexus AI
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Modal, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from '../CustomText';
import CustomTextInput from '../CustomTextInput';
import { scale, verticalScale, platformPadding, moderateScale } from '../../utils/responsive-utils';
import { useTheme } from '../../contexts/ThemeContext';
import HapticService from '../../utils/HapticService';
import musicService from '../../services/api/musicService';
import { useUser } from '../../contexts/UserContext';
import Sound from 'react-native-sound';

// Enable playback in silence mode
Sound.setCategory('Playback');

const MusicSelectionOverlay = ({ visible, onClose, onSelect, selectedMusicKey }) => {
  const { t } = useTranslation();
  const { currentTheme: theme } = useTheme();
  const { user } = useUser();
  const insets = useSafeAreaInsets();

  const [musicList, setMusicList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [musicType, setMusicType] = useState('all'); // 'all' | 'instrumental' | 'vocal'
  const [sortBy, setSortBy] = useState('created_desc'); // 'created_desc' | 'created_asc' | 'type_inst' | 'type_vocal'
  const [playingMusicKey, setPlayingMusicKey] = useState(null);
  
  const soundRef = useRef(null);

  // Fetch music list
  const fetchMusicList = useCallback(async () => {
    if (!user?.user_key) return;

    setLoading(true);

    try {
      const result = await musicService.listMusic(user.user_key, {
        search_keyword: searchKeyword,
        music_type: musicType,
        sort_by: sortBy,
        page: 1,
        limit: 50,
      });

      if (result.success) {
        setMusicList(result.data.music_list || []);
      } else {
        console.error('❌ [MusicSelectionOverlay] Failed to fetch music:', result.errorCode);
        setMusicList([]);
      }
    } catch (error) {
      console.error('❌ [MusicSelectionOverlay] Error:', error);
      setMusicList([]);
    } finally {
      setLoading(false);
    }
  }, [user, searchKeyword, musicType, sortBy]);

  // Fetch on mount and when filters change
  useEffect(() => {
    if (visible) {
      fetchMusicList();
    }
  }, [visible, searchKeyword, musicType, sortBy, fetchMusicList]);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.stop();
        soundRef.current.release();
        soundRef.current = null;
      }
    };
  }, []);

  // Handle music preview (play)
  const handlePlayMusic = useCallback((music) => {
    HapticService.light();

    // Stop current sound if playing
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current.release();
      soundRef.current = null;
    }

    // If clicking the same music, just stop
    if (playingMusicKey === music.music_key) {
      setPlayingMusicKey(null);
      return;
    }

    // Play new music
    try {
      const sound = new Sound(music.music_url, null, (error) => {
        if (error) {
          console.error('❌ [MusicSelectionOverlay] Failed to load music:', error);
          setPlayingMusicKey(null);
          return;
        }

        // Play the sound
        sound.play((success) => {
          if (success) {
            console.log('🎵 [MusicSelectionOverlay] Music finished playing');
          } else {
            console.error('❌ [MusicSelectionOverlay] Playback failed');
          }
          setPlayingMusicKey(null);
        });
      });

      soundRef.current = sound;
      setPlayingMusicKey(music.music_key);
    } catch (error) {
      console.error('❌ [MusicSelectionOverlay] Error playing music:', error);
      setPlayingMusicKey(null);
    }
  }, [playingMusicKey]);

  // Handle music selection
  const handleSelectMusic = useCallback((music) => {
    HapticService.success();

    // Stop preview if playing
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current.release();
      soundRef.current = null;
      setPlayingMusicKey(null);
    }

    onSelect && onSelect(music);
    onClose && onClose();
  }, [onSelect, onClose]);

  // Handle close
  const handleClose = useCallback(() => {
    HapticService.light();

    // Stop preview if playing
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current.release();
      soundRef.current = null;
      setPlayingMusicKey(null);
    }

    onClose && onClose();
  }, [onClose]);

  // Get music type icon
  const getMusicTypeIcon = (type) => {
    return type === 'vocal' ? '🎤' : '🎵';
  };

  // Get music type label
  const getMusicTypeLabel = (type) => {
    return type === 'vocal' 
      ? t('music.type.vocal', '보컬')
      : t('music.type.instrumental', '순수음원');
  };

  // Render music card
  const renderMusicCard = ({ item: music }) => {
    const isSelected = selectedMusicKey === music.music_key;
    const isPlaying = playingMusicKey === music.music_key;
    const isDefault = music.is_default === 'Y';

    return (
      <TouchableOpacity
        style={[
          styles.musicCard,
          { 
            backgroundColor: theme.cardBackground,
            borderColor: isSelected ? theme.mainColor : theme.borderColor,
          },
          isSelected && styles.musicCardSelected,
        ]}
        onPress={() => handleSelectMusic(music)}
        activeOpacity={0.7}
      >
        {/* Left: Type Icon */}
        <View style={styles.musicIconContainer}>
          <CustomText type="big" style={styles.musicTypeEmoji}>
            {getMusicTypeIcon(music.music_type)}
          </CustomText>
        </View>

        {/* Center: Info */}
        <View style={styles.musicInfo}>
          <View style={styles.musicTitleRow}>
            <CustomText type="bodyBold" style={{ color: theme.textPrimary }} numberOfLines={1}>
              {music.music_title}
            </CustomText>
            {isDefault && (
              <View style={[styles.defaultBadge, { backgroundColor: theme.mainColor }]}>
                <CustomText type="tiny" style={{ color: '#fff' }}>
                  {t('music.default', '기본')}
                </CustomText>
              </View>
            )}
          </View>
          <CustomText type="small" style={{ color: theme.textSecondary, marginTop: verticalScale(4) }}>
            {getMusicTypeLabel(music.music_type)} • {music.tag || t('music.no_tag', '태그 없음')}
          </CustomText>
          <CustomText type="tiny" style={{ color: theme.textTertiary, marginTop: verticalScale(4) }}>
            {new Date(music.created_at).toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}
          </CustomText>
        </View>

        {/* Right: Play + Select Buttons */}
        <View style={styles.musicActions}>
          {/* Play Button */}
          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: theme.mainColor }]}
            onPress={(e) => {
              e.stopPropagation();
              handlePlayMusic(music);
            }}
          >
            <Icon 
              name={isPlaying ? 'stop' : 'play'} 
              size={scale(16)} 
              color="#fff" 
            />
          </TouchableOpacity>

          {/* Select Check */}
          {isSelected && (
            <Icon 
              name="check-circle" 
              size={scale(24)} 
              color={theme.mainColor} 
              style={{ marginLeft: scale(8) }}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + platformPadding(10), borderBottomColor: theme.borderColor }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Icon name="arrow-left" size={scale(24)} color={theme.textPrimary} />
          </TouchableOpacity>
          <CustomText type="big" bold style={{ color: theme.textPrimary }}>
            {t('music.select_title', '음원 선택')}
          </CustomText>
          <View style={{ width: scale(24) }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <CustomTextInput
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            placeholder={t('music.search_placeholder', '음원 제목, 태그 검색...')}
            leftIcon="magnify"
            style={styles.searchInput}
          />
        </View>

        {/* Sorting Chips */}
        <View style={styles.sortingSection}>
          {/* Sort by Date */}
          <TouchableOpacity
            style={[
              styles.sortChip,
              { backgroundColor: theme.cardBackground, borderColor: theme.borderColor },
              sortBy.startsWith('created') && { borderColor: theme.mainColor }
            ]}
            onPress={() => {
              HapticService.light();
              setSortBy(sortBy === 'created_desc' ? 'created_asc' : 'created_desc');
            }}
          >
            <Icon 
              name={sortBy === 'created_desc' ? 'sort-calendar-descending' : 'sort-calendar-ascending'} 
              size={scale(16)} 
              color={sortBy.startsWith('created') ? theme.mainColor : theme.textSecondary} 
            />
            <CustomText 
              type="small" 
              style={{ 
                marginLeft: scale(6), 
                color: sortBy.startsWith('created') ? theme.mainColor : theme.textSecondary 
              }}
            >
              {sortBy === 'created_desc' ? t('music.sort.newest', '최신순') : t('music.sort.oldest', '오래된순')}
            </CustomText>
          </TouchableOpacity>

          {/* Filter by Type */}
          <TouchableOpacity
            style={[
              styles.sortChip,
              { backgroundColor: theme.cardBackground, borderColor: theme.borderColor },
              musicType !== 'all' && { borderColor: theme.mainColor }
            ]}
            onPress={() => {
              HapticService.light();
              // Cycle: all → instrumental → vocal → all
              if (musicType === 'all') setMusicType('instrumental');
              else if (musicType === 'instrumental') setMusicType('vocal');
              else setMusicType('all');
            }}
          >
            <Icon 
              name={musicType === 'vocal' ? 'microphone' : musicType === 'instrumental' ? 'music-note' : 'music'} 
              size={scale(16)} 
              color={musicType !== 'all' ? theme.mainColor : theme.textSecondary} 
            />
            <CustomText 
              type="small" 
              style={{ 
                marginLeft: scale(6), 
                color: musicType !== 'all' ? theme.mainColor : theme.textSecondary 
              }}
            >
              {musicType === 'vocal' 
                ? t('music.type.vocal', '보컬') 
                : musicType === 'instrumental' 
                  ? t('music.type.instrumental', '순수음원')
                  : t('music.type.all', '전체')}
            </CustomText>
          </TouchableOpacity>
        </View>

        {/* Music List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.mainColor} />
            <CustomText type="body" style={{ color: theme.textSecondary, marginTop: verticalScale(12) }}>
              {t('music.loading', '음원 불러오는 중...')}
            </CustomText>
          </View>
        ) : musicList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CustomText type="big" style={{ fontSize: moderateScale(48) }}>
              🎵
            </CustomText>
            <CustomText type="body" style={{ color: theme.textSecondary, marginTop: verticalScale(12) }}>
              {t('music.no_music', '음원이 없습니다')}
            </CustomText>
          </View>
        ) : (
          <FlatList
            data={musicList}
            renderItem={renderMusicCard}
            keyExtractor={(item) => item.music_key}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: platformPadding(16),
    paddingBottom: platformPadding(12),
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: scale(4),
  },
  searchSection: {
    paddingHorizontal: platformPadding(16),
    paddingVertical: verticalScale(12),
  },
  searchInput: {
    marginBottom: 0,
  },
  sortingSection: {
    flexDirection: 'row',
    paddingHorizontal: platformPadding(16),
    paddingBottom: verticalScale(12),
    gap: scale(8),
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: platformPadding(12),
    paddingVertical: verticalScale(8),
    borderRadius: scale(20),
    borderWidth: 1,
  },
  listContent: {
    paddingHorizontal: platformPadding(16),
    paddingBottom: platformPadding(20),
  },
  musicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: platformPadding(16),
    borderRadius: scale(12),
    marginBottom: verticalScale(12),
    borderWidth: 2,
  },
  musicCardSelected: {
    shadowColor: '#4FACFE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  musicIconContainer: {
    width: scale(50),
    height: scale(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  musicTypeEmoji: {
    fontSize: moderateScale(36),
  },
  musicInfo: {
    flex: 1,
  },
  musicTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  defaultBadge: {
    paddingHorizontal: platformPadding(8),
    paddingVertical: verticalScale(2),
    borderRadius: scale(4),
  },
  musicActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: scale(12),
  },
  playButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MusicSelectionOverlay;

