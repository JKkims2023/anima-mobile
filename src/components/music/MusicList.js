/**
 * 📋 MusicList Component
 * 
 * Scrollable list of music items
 * Shows default + user-created music
 * 
 * @author JK & Hero Nexus AI
 */

import React, { memo } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MusicListItem from './MusicListItem';
import CustomText from '../CustomText';
import { useTheme } from '../../contexts/ThemeContext';
import { scale, verticalScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';

/**
 * MusicList Component
 */
const MusicList = memo(({
  musicList = [],
  selectedMusicKey,
  isLoading = false,
  onSelectMusic,
}) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();

  // Empty state
  if (!isLoading && musicList.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon
          name="music-note-off"
          size={scale(60)}
          color={COLORS.TEXT_SECONDARY}
        />
        <CustomText type="big" bold style={styles.emptyTitle}>
          {t('music.empty_title')}
        </CustomText>
        <CustomText type="normal" style={styles.emptySubtitle}>
          {t('music.empty_subtitle')}
        </CustomText>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={currentTheme.mainColor || COLORS.MAIN_COLOR}
        />
        <CustomText type="normal" style={styles.loadingText}>
          {t('music.list.loading')}
        </CustomText>
      </View>
    );
  }

  // Render item
  const renderItem = ({ item }) => (
    <MusicListItem
      music={item}
      isSelected={item.music_key === selectedMusicKey}
      onPress={onSelectMusic}
    />
  );

  return (
    <FlatList
      data={musicList}
      renderItem={renderItem}
      keyExtractor={(item) => item.music_key}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
});

MusicList.displayName = 'MusicList';

const styles = StyleSheet.create({
  listContent: {
    paddingTop: scale(12),
    paddingBottom: verticalScale(100), // Tab bar padding
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(40),
  },
  emptyTitle: {
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginTop: scale(20),
    marginBottom: scale(12),
  },
  emptySubtitle: {
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.TEXT_SECONDARY,
    marginTop: scale(12),
  },
});

export default MusicList;

