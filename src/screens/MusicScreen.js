/**
 * 🎵 MusicScreen - AI Music Generation & Management
 * 
 * Features:
 * - View generated music list
 * - Play/Pause music
 * - Share music
 * - Generate new music (via CenterAIButton)
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
 * MusicScreen Component
 */
const MusicScreen = () => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { user, isAuthenticated } = useUser();

  // ✅ Music list state (TODO: Fetch from API)
  const [musicList, setMusicList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Load music list on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadMusicList();
    }
  }, [isAuthenticated]);

  // ✅ Load music list
  const loadMusicList = async () => {
    setIsLoading(true);
    try {
      // TODO: Fetch music list from API
      // const result = await musicService.getMyMusicList();
      // setMusicList(result.data);
      
      // Temporary empty state
      setMusicList([]);
    } catch (error) {
      console.error('[MusicScreen] Failed to load music:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      {/* Icon */}
      <View style={styles.emptyIconContainer}>
        <Icon name="music-note" size={moderateScale(80)} color={COLORS.DEEP_BLUE} />
      </View>

      {/* Title */}
      <CustomText type="title" bold style={styles.emptyTitle}>
        {t('music.empty.title')}
      </CustomText>

      {/* Description */}
      <CustomText type="normal" style={styles.emptyDescription}>
        {t('music.empty.description')}
      </CustomText>

      {/* CTA */}
      <CustomText type="small" style={styles.emptyCTA}>
        {t('music.empty.cta')}
      </CustomText>
    </View>
  );

  // ✅ Render music list
  const renderMusicList = () => (
    <ScrollView
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    >
      {musicList.map((music, index) => (
        <MusicCard key={music.id || index} music={music} />
      ))}
    </ScrollView>
  );

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
            {t('music.title')}
          </CustomText>
          <CustomText type="small" style={styles.headerSubtitle}>
            {t('music.subtitle')}
          </CustomText>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <CustomText type="normal" style={styles.loadingText}>
              {t('common.loading')}...
            </CustomText>
          </View>
        ) : musicList.length === 0 ? (
          renderEmptyState()
        ) : (
          renderMusicList()
        )}
      </View>
    </SafeScreen>
  );
};

/**
 * MusicCard Component (Individual Music Item)
 */
const MusicCard = ({ music }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implement play/pause logic
  };

  return (
    <View style={styles.musicCard}>
      {/* Glow Layer */}
      <View style={styles.cardGlow} />

      {/* Card Content */}
      <View style={styles.cardContent}>
        {/* Left: Album Art */}
        <View style={styles.albumArt}>
          <Icon name="music" size={moderateScale(32)} color={COLORS.DEEP_BLUE} />
        </View>

        {/* Center: Info */}
        <View style={styles.musicInfo}>
          <CustomText type="normal" bold style={styles.musicTitle} numberOfLines={1}>
            {music.title || 'Untitled'}
          </CustomText>
          <CustomText type="small" style={styles.musicDate} numberOfLines={1}>
            {music.date || '2024-01-01'}
          </CustomText>
        </View>

        {/* Right: Play Button */}
        <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
          <Icon
            name={isPlaying ? 'pause-circle' : 'play-circle'}
            size={moderateScale(40)}
            color={COLORS.DEEP_BLUE}
          />
        </TouchableOpacity>
      </View>
    </View>
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
  // Empty State
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: platformPadding(40),
  },
  emptyIconContainer: {
    marginBottom: scale(24),
  },
  emptyTitle: {
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: scale(12),
  },
  emptyDescription: {
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: scale(24),
    lineHeight: scale(22),
  },
  emptyCTA: {
    color: COLORS.DEEP_BLUE,
    textAlign: 'center',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Loading State
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.TEXT_SECONDARY,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Music List
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  listContainer: {
    paddingBottom: platformPadding(100),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Music Card
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  musicCard: {
    marginBottom: scale(16),
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: COLORS.DEEP_BLUE,
    shadowColor: COLORS.DEEP_BLUE,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
    elevation: 0,
    opacity: 0.5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 46, 0.8)',
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(62, 80, 180, 0.3)',
    paddingHorizontal: platformPadding(16),
    paddingVertical: platformPadding(16),
  },
  albumArt: {
    width: scale(56),
    height: scale(56),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(16),
  },
  musicInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  musicTitle: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: scale(4),
  },
  musicDate: {
    color: COLORS.TEXT_SECONDARY,
  },
  playButton: {
    marginLeft: scale(12),
  },
});

export default MusicScreen;

