/**
 * 🎵 Music Selection Overlay Component (Redesigned)
 * 
 * CustomBottomSheet-based music selection with FloatingChipNavigation
 * Matches the design of ParticleEffect selection for consistency
 * 
 * Features:
 * - 4 Groups: 없음, 기본, 사용자 제작, 즐겨찾기
 * - Simplified info: 제목, 타입, 생성일
 * - No search, no sorting (removed for simplicity)
 * - Play preview + Select
 * - Consistent design with ParticleEffect bottomsheet
 * 
 * @author JK & Hero Nexus AI
 */

import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Video from 'react-native-video';
import CustomBottomSheet from '../CustomBottomSheet';
import FloatingChipNavigation from '../FloatingChipNavigation';
import MusicListView from './MusicListView';
import { scale, verticalScale } from '../../utils/responsive-utils';
import { useUser } from '../../contexts/UserContext';
import HapticService from '../../utils/HapticService';
import musicService from '../../services/api/musicService';

const MusicSelectionOverlay = forwardRef(({ onSelect, selectedMusicKey }, ref) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const sheetRef = useRef(null);
  const videoRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // State Management
  // ═══════════════════════════════════════════════════════════════════════════
  const [visible, setVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('none'); // none, default, user_generated, favorites
  const [musicList, setMusicList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playingMusicKey, setPlayingMusicKey] = useState(null);
  const [playingMusicUrl, setPlayingMusicUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // Expose methods to parent
  // ═══════════════════════════════════════════════════════════════════════════
  useImperativeHandle(ref, () => ({
    present: () => {
      setVisible(true);
      setTimeout(() => {
        sheetRef.current?.present();
      }, 100);
    },
    dismiss: () => {
      sheetRef.current?.dismiss();
    },
  }));

  // ═══════════════════════════════════════════════════════════════════════════
  // Fetch music list
  // ═══════════════════════════════════════════════════════════════════════════
  const fetchMusicList = useCallback(async () => {
    if (!user?.user_key) return;

    setLoading(true);

    try {
      const result = await musicService.listMusic(user.user_key, {
        page: 1,
        limit: 100,
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
  }, [user]);

  // Fetch on mount
  useEffect(() => {
    if (visible) {
      fetchMusicList();
    }
  }, [visible, fetchMusicList]);

  // Cleanup: Stop music on unmount
  useEffect(() => {
    return () => {
      if (isPlaying) {
        setIsPlaying(false);
        setPlayingMusicKey(null);
        setPlayingMusicUrl(null);
      }
    };
  }, [isPlaying]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Group music by category
  // ═══════════════════════════════════════════════════════════════════════════
  const getMusicGroups = useCallback(() => {
    // "없음" group (standalone)
    const noneGroup = {
      id: 'none',
      emoji: '🚫',
      title: () => t('music.group.none', '없음'),
      items: [
        {
          music_key: 'none',
          music_title: t('music.no_music_option', '음원 없음'),
          music_type: 'none',
          music_url: null,
          created_at: new Date().toISOString(),
        },
      ],
    };

    // "기본" group
    const defaultGroup = {
      id: 'default',
      emoji: '🎵',
      title: () => t('music.group.default', '기본'),
      items: musicList.filter((music) => music.is_default === 'Y'),
    };

    // "사용자 제작" group
    const userGeneratedGroup = {
      id: 'user_generated',
      emoji: '🤖',
      title: () => t('music.group.user_generated', '사용자 제작'),
      items: musicList.filter((music) => music.is_default === 'N' && music.favorite_yn !== 'Y'),
    };

    // "즐겨찾기" group
    const favoritesGroup = {
      id: 'favorites',
      emoji: '⭐',
      title: () => t('music.group.favorites', '즐겨찾기'),
      items: musicList.filter((music) => music.favorite_yn === 'Y'),
    };

    return [noneGroup, defaultGroup, userGeneratedGroup, favoritesGroup];
  }, [musicList, t]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Handlers
  // ═══════════════════════════════════════════════════════════════════════════
  const handlePlayMusic = useCallback((music) => {
    // If clicking the same music, just stop
    if (playingMusicKey === music.music_key) {
      setIsPlaying(false);
      setPlayingMusicKey(null);
      setPlayingMusicUrl(null);
      console.log('🎵 [MusicSelectionOverlay] Stopped playing:', music.music_title);
      return;
    }

    // Play new music
    console.log('🎵 [MusicSelectionOverlay] Start playing:', music.music_title, music.music_url);
    setPlayingMusicKey(music.music_key);
    setPlayingMusicUrl(music.music_url);
    setIsPlaying(true);
  }, [playingMusicKey]);

  const handleSelectMusic = useCallback((music) => {
    // Stop preview if playing
    if (isPlaying) {
      setIsPlaying(false);
      setPlayingMusicKey(null);
      setPlayingMusicUrl(null);
    }

    onSelect && onSelect(music);
    sheetRef.current?.dismiss();
  }, [isPlaying, onSelect]);

  const handleClose = useCallback(() => {
    HapticService.light();

    // Stop preview if playing
    if (isPlaying) {
      setIsPlaying(false);
      setPlayingMusicKey(null);
      setPlayingMusicUrl(null);
    }

    sheetRef.current?.dismiss();
  }, [isPlaying]);

  const handleVideoEnd = useCallback(() => {
    console.log('🎵 [MusicSelectionOverlay] Music finished playing');
    setIsPlaying(false);
    setPlayingMusicKey(null);
    setPlayingMusicUrl(null);
  }, []);

  const handleVideoError = useCallback((error) => {
    console.error('❌ [MusicSelectionOverlay] Failed to load music:', error);
    setIsPlaying(false);
    setPlayingMusicKey(null);
    setPlayingMusicUrl(null);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // Get current group's items
  // ═══════════════════════════════════════════════════════════════════════════
  const getCurrentGroupItems = useCallback(() => {
    const groups = getMusicGroups();
    const currentGroup = groups.find((group) => group.id === selectedGroup);
    return currentGroup ? currentGroup.items : [];
  }, [selectedGroup, getMusicGroups]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════
  if (!visible) return null;

  return (
    <>
      <CustomBottomSheet
        ref={sheetRef}
        title={t('music.select_title', '음원 선택')}
        snapPoints={['70%']}
        enableDynamicSizing={false}
        onDismiss={() => {
          console.log('[MusicSelectionOverlay] Bottomsheet dismissed');
          setVisible(false);
          
          // Stop playing music
          if (isPlaying) {
            setIsPlaying(false);
            setPlayingMusicKey(null);
            setPlayingMusicUrl(null);
          }
        }}
        buttons={[
          {
            title: t('common.close'),
            type: 'primary',
            onPress: handleClose,
          },
        ]}
      >
        {/* ⭐ Floating Chip Navigation (Top) */}
        <FloatingChipNavigation
          groups={getMusicGroups().map((group) => ({
            id: group.id,
            emoji: group.emoji,
            title: group.title,
          }))}
          selectedGroupId={selectedGroup}
          onSelectGroup={(groupId) => {
            setSelectedGroup(groupId);
            console.log('[MusicSelectionOverlay] Music group changed:', groupId);
          }}
        />

        {/* ⭐ Music List View (Bottom) */}
        <MusicListView
          items={getCurrentGroupItems()}
          selectedValue={selectedMusicKey}
          onSelect={handleSelectMusic}
          onPlay={handlePlayMusic}
          playingMusicKey={playingMusicKey}
        />
      </CustomBottomSheet>

      {/* Background Music Player (Hidden) */}
      {isPlaying && playingMusicUrl && (
        <Video
          ref={videoRef}
          source={{ uri: playingMusicUrl }}
          audioOnly
          paused={!isPlaying}
          volume={1.0}
          onEnd={handleVideoEnd}
          onError={handleVideoError}
        />
      )}
    </>
  );
});

export default MusicSelectionOverlay;
