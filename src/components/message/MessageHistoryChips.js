/**
 * 🎯 MessageHistoryChips Component
 * 
 * Quick action chips for message history (우측 상단)
 * - Favorite (toggle)
 * - Share
 * - Delete
 * 
 * Positioned at the top-right of HistoryScreen
 * 
 * @author JK & Hero Nexus AI
 */

import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet, Share, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, verticalScale } from '../../utils/responsive-utils';
import { useTheme } from '../../contexts/ThemeContext';
import HapticService from '../../utils/HapticService';

/**
 * MessageHistoryChips Component
 */
const MessageHistoryChips = memo(({
  message,
  onFavoriteToggle,
  onDelete,
}) => {
  const { currentTheme } = useTheme();
  
  const isFavorite = message?.favorite_yn === 'Y';

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handlers
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const handleFavoritePress = () => {
    HapticService.light();
    onFavoriteToggle?.();
  };

  const handleSharePress = async () => {
    HapticService.light();
    
    try {
      const shareUrl = message?.share_url || 
        `https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/m/${message?.persona_key}/${message?.short_code}`;
      
      await Share.share({
        message: Platform.OS === 'ios' 
          ? `${message?.message_title || 'Check out this message!'}\n\n${shareUrl}`
          : shareUrl,
        url: Platform.OS === 'ios' ? shareUrl : undefined,
        title: message?.message_title || 'Share Message',
      });
    } catch (error) {
      console.error('[MessageHistoryChips] Share error:', error);
    }
  };

  const handleDeletePress = () => {
    HapticService.warning();
    onDelete?.();
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return (
    <View style={styles.container}>
      {/* Favorite Button */}
      <TouchableOpacity
        style={[
          styles.chip,
          { backgroundColor: currentTheme.cardBackground },
          isFavorite && { backgroundColor: currentTheme.mainColor }
        ]}
        onPress={handleFavoritePress}
        activeOpacity={0.7}
      >
        <Icon
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={scale(20)}
          color={isFavorite ? '#FFFFFF' : currentTheme.mainColor}
        />
      </TouchableOpacity>

      {/* Share Button */}
      <TouchableOpacity
        style={[
          styles.chip,
          { backgroundColor: currentTheme.cardBackground }
        ]}
        onPress={handleSharePress}
        activeOpacity={0.7}
      >
        <Icon
          name="share-variant"
          size={scale(20)}
          color={currentTheme.mainColor}
        />
      </TouchableOpacity>

      {/* Delete Button */}
      <TouchableOpacity
        style={[
          styles.chip,
          { backgroundColor: currentTheme.cardBackground }
        ]}
        onPress={handleDeletePress}
        activeOpacity={0.7}
      >
        <Icon
          name="trash-can-outline"
          size={scale(20)}
          color="#FF4444"
        />
      </TouchableOpacity>
    </View>
  );
});

MessageHistoryChips.displayName = 'MessageHistoryChips';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: verticalScale(120), // Below header
    right: scale(16),
    gap: verticalScale(10),
    zIndex: 100,
    elevation: 10, // Android
  },
  chip: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 5,
  },
});

export default MessageHistoryChips;

