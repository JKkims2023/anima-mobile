/**
 * 🎵 MusicScreen - AI Music Generation & Management
 * 
 * Features:
 * - Music Control Area (Create/Creating/Playing)
 * - Music List (Scrollable)
 * - Music Creator Sheet (Bottom Sheet)
 * - Smart Polling System
 * 
 * Structure:
 * ┌─────────────────────────────────────┐
 * │  MusicControlArea (180dp fixed)    │
 * ├─────────────────────────────────────┤
 * │  MusicList (Scrollable)             │
 * └─────────────────────────────────────┘
 * 
 * @author JK & Hero Nexus AI
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Share, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import SafeScreen from '../components/SafeScreen';
import MusicControlArea from '../components/music/MusicControlArea';
import MusicList from '../components/music/MusicList';
import MusicCreatorSheet from '../components/music/MusicCreatorSheet';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useAnima } from '../contexts/AnimaContext';
import musicService from '../services/api/musicService';
import { COLORS } from '../styles/commonstyles';
import { scale, verticalScale, platformPadding } from '../utils/responsive-utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomText from '../components/CustomText';
import IconSearch from 'react-native-vector-icons/Ionicons';
import { TouchableOpacity } from 'react-native';

/**
 * MusicScreen Component
 */
const MusicScreen = () => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { user, isAuthenticated } = useUser();
  const { showAlert, showToast } = useAnima();

  // Refs
  const creatorSheetRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Music list state
  const [musicList, setMusicList] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Control area state
  const [controlMode, setControlMode] = useState('create'); // 'create' | 'creating' | 'playing'
  const [selectedMusic, setSelectedMusic] = useState(null);
  
  // Creating state
  const [creatingMusicKey, setCreatingMusicKey] = useState(null);
  const [creatingProgress, setCreatingProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(30);

  // Screen focus state
  const [isScreenFocused, setIsScreenFocused] = useState(false);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Screen focus effect
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      if (isAuthenticated) {
        loadMusicList();
      }
      return () => {
        setIsScreenFocused(false);
      };
    }, [isAuthenticated])
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Load music list from API
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const loadMusicList = async () => {
    setIsLoadingList(true);
    try {
      if (__DEV__) {
        console.log('[MusicScreen] Loading music list for user:', user?.user_key);
      }

      const result = await musicService.listMusic(user.user_key, {
        music_type: 'all',
        sort_by: 'created_desc',
      });

      if (__DEV__) {
        console.log('[MusicScreen] Music list result:', result);
      }

      if (result.success && result.data?.music_list) {
        setMusicList(result.data.music_list);
      } else {
        console.error('[MusicScreen] Failed to load music:', result.errorCode);
        setMusicList([]);
      }
    } catch (error) {
      console.error('[MusicScreen] Load music error:', error);
      setMusicList([]);
    } finally {
      setIsLoadingList(false);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle create button press
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleCreatePress = () => {
    if (controlMode === 'creating') {
      showToast({
        type: 'warning',
        message: t('music.creating_in_progress'),
        emoji: '⏳',
      });
      return;
    }

    // Check authentication
    if (!isAuthenticated) {
      showToast({
        type: 'warning',
        message: t('auth.login_required'),
        emoji: '🔒',
      });
      return;
    }

    creatorSheetRef.current?.present();
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle music creation submit
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleMusicCreationSubmit = async (formData) => {
    if (__DEV__) {
      console.log('[MusicScreen] Music creation submit:', formData);
    }

    try {
      const result = await musicService.createMusic({
        user_key: user.user_key,
        music_title: formData.music_title,
        music_type: formData.music_type,
        prompt: formData.prompt,
        lyrics: formData.lyrics,
      });

      if (__DEV__) {
        console.log('[MusicScreen] Create result:', result);
      }

      if (result.success) {
        // Start creating mode
        setControlMode('creating');
        setCreatingMusicKey(result.data.music_key);
        setCreatingProgress(0);
        setEstimatedTime(result.data.estimated_time || 30);

        showToast({
          type: 'success',
          message: t('music.toast.create_started'),
          emoji: '🎵',
        });

        // Start polling
        startPolling(result.data.music_key, result.data.estimated_time || 30);
      } else {
        showToast({
          type: 'error',
          message: t('music.toast.create_failed'),
          emoji: '❌',
        });
      }
    } catch (error) {
      console.error('[MusicScreen] Create music error:', error);
      showToast({
        type: 'error',
        message: t('music.toast.create_failed'),
        emoji: '❌',
      });
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Smart Polling System
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const startPolling = (music_key, estimated_time) => {
    if (__DEV__) {
      console.log('[MusicScreen] Starting polling:', music_key, estimated_time);
    }

    // Clear existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Calculate polling interval based on estimated time
    const pollingInterval = estimated_time < 20 ? 2000 : 3000; // 2s or 3s

    let elapsedTime = 0;

    pollingIntervalRef.current = setInterval(async () => {
      elapsedTime += pollingInterval / 1000;

      // Update progress (estimated)
      const estimatedProgress = Math.min(95, (elapsedTime / estimated_time) * 100);
      setCreatingProgress(Math.round(estimatedProgress));

      // Check status
      try {
        const result = await musicService.checkMusicStatus(music_key);

        if (__DEV__) {
          console.log('[MusicScreen] Polling result:', result);
        }

        if (result.success) {
          if (result.data.status === 'completed') {
            // ✅ Completed
            setCreatingProgress(100);
            stopPolling();

            showToast({
              type: 'success',
              message: t('music.toast.create_completed'),
              emoji: '🎉',
            });

            // Reload music list
            loadMusicList();

            // Reset to create mode
            setTimeout(() => {
              setControlMode('create');
              setCreatingMusicKey(null);
              setCreatingProgress(0);
            }, 1500);

          } else if (result.data.status === 'failed') {
            // ❌ Failed
            stopPolling();

            showToast({
              type: 'error',
              message: t('music.toast.create_failed'),
              emoji: '❌',
            });

            // Reset to create mode
            setControlMode('create');
            setCreatingMusicKey(null);
            setCreatingProgress(0);

          } else {
            // ⏳ Still processing - update progress from API
            if (result.data.progress !== undefined) {
              setCreatingProgress(result.data.progress);
            }
          }
        }
      } catch (error) {
        console.error('[MusicScreen] Polling error:', error);
      }
    }, pollingInterval);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle music selection from list
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleSelectMusic = (music) => {
    if (__DEV__) {
      console.log('[MusicScreen] Selected music:', music.music_key);
    }

    setSelectedMusic(music);
    setControlMode('playing');
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle delete music
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleDeleteMusic = (music) => {
    // Prevent deletion of default music
    if (music.is_default === 'Y') {
      showToast({
        type: 'warning',
        message: t('music.toast.cannot_delete_default'),
        emoji: '⚠️',
      });
      return;
    }

    showAlert({
      title: t('music.player.delete_confirm'),
      message: t('music.player.delete_confirm_message'),
      emoji: '🗑️',
      buttons: [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('music.player.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await musicService.deleteMusic(music.music_key);

              if (result.success) {
                // ⭐ 핵심: 내부 state 업데이트 (DB 재조회 없음)
                setMusicList(prev => prev.filter(m => m.music_key !== music.music_key));
                
                // Reset control mode
                setControlMode('create');
                setSelectedMusic(null);

                showToast({
                  type: 'success',
                  message: t('music.player.delete_success'),
                  emoji: '✅',
                });
              } else {
                showToast({
                  type: 'error',
                  message: t('common.error'),
                  emoji: '❌',
                });
              }
            } catch (error) {
              console.error('[MusicScreen] Delete music error:', error);
              showToast({
                type: 'error',
                message: t('common.error'),
                emoji: '❌',
              });
            }
          },
        },
      ],
    });
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle share music
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleShareMusic = async (music) => {
    try {
      await Share.share({
        message: Platform.OS === 'ios'
          ? `${music.music_title}\n\n${music.music_url}`
          : music.music_url,
        url: Platform.OS === 'ios' ? music.music_url : undefined,
        title: music.music_title,
      });
    } catch (error) {
      console.error('[MusicScreen] Share error:', error);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle attach music to message
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleAttachToMessage = (music) => {
    // TODO: Navigate to MessageCreatorView with selected music
    showToast({
      type: 'success',
      message: t('music.toast.attached_to_message'),
      emoji: '🔗',
    });
  };

  const handleSearchOpen = () => {
    showToast({
      type: 'success',
      message: t('music.toast.search_open'),
      emoji: '🔍',
    });
  };

  return (
    <SafeScreen
      backgroundColor={currentTheme.backgroundColor || COLORS.BACKGROUND}
      statusBarStyle={currentTheme.statusBarStyle || 'light-content'}
      edges={{ top: true, bottom: false }}
      keyboardAware={false}
    >
      {/* Header with Search Icon */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <CustomText type="big" bold style={styles.headerTitle}>
            {t('navigation.title.studio')}
          </CustomText>
          <CustomText type="small" style={styles.headerSubtitle}>
            {t('navigation.subtitle.studio')}
          </CustomText>
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearchOpen}
          activeOpacity={0.7}
        >
          <IconSearch name="search-outline" size={scale(24)} color={currentTheme.mainColor} />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        {/* Music Control Area (Top - 180dp fixed) */}
        <MusicControlArea
          mode={controlMode}
          selectedMusic={selectedMusic}
          creatingProgress={creatingProgress}
          estimatedTime={estimatedTime}
          onCreatePress={handleCreatePress}
          onDelete={handleDeleteMusic}
          onShare={handleShareMusic}
          onAttachToMessage={handleAttachToMessage}
        />

        {/* Music List (Bottom - Scrollable) */}
        <MusicList
          musicList={musicList}
          selectedMusicKey={selectedMusic?.music_key}
          isLoading={isLoadingList}
          onSelectMusic={handleSelectMusic}
        />
      </View>

      {/* Music Creator Bottom Sheet */}
      <MusicCreatorSheet
        ref={creatorSheetRef}
        onSubmit={handleMusicCreationSubmit}
      />
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row', // ⭐ Horizontal layout for title + search button
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: platformPadding(20),
    paddingBottom: platformPadding(16),
    paddingHorizontal: platformPadding(20),
  },
  headerContent: {
    flex: 1, // ⭐ Take remaining space
  },
  headerTitle: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: scale(4),
  },
  headerSubtitle: {
    color: COLORS.TEXT_SECONDARY,
  },
  searchButton: {
    marginLeft: platformPadding(12),
    padding: platformPadding(8),
  },
});

export default MusicScreen;
