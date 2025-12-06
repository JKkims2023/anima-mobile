/**
 * 🎵 MusicControlArea Component
 * 
 * Top control area (180dp fixed height)
 * Switches between 3 modes: Create, Creating, Playing
 * 
 * @author JK & Hero Nexus AI
 */

import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { verticalScale } from '../../utils/responsive-utils';
import MusicCreateCard from './MusicCreateCard';
import MusicCreatingCard from './MusicCreatingCard';
import MusicPlayerCard from './MusicPlayerCard';

const CONTROL_AREA_HEIGHT = verticalScale(180);

/**
 * MusicControlArea Component
 */
const MusicControlArea = memo(({
  mode, // 'create' | 'creating' | 'playing'
  selectedMusic,
  creatingProgress,
  estimatedTime,
  onCreatePress,
  onDelete,
  onShare,
  onAttachToMessage,
}) => {
  return (
    <View style={styles.container}>
      {mode === 'creating' && (
        <MusicCreatingCard
          progress={creatingProgress}
          estimatedTime={estimatedTime}
        />
      )}

      {mode === 'playing' && selectedMusic && (
        <MusicPlayerCard
          music={selectedMusic}
          onDelete={onDelete}
          onShare={onShare}
          onAttachToMessage={onAttachToMessage}
        />
      )}

      {mode === 'create' && (
        <MusicCreateCard
          onPress={onCreatePress}
          disabled={mode === 'creating'}
        />
      )}
    </View>
  );
});

MusicControlArea.displayName = 'MusicControlArea';

const styles = StyleSheet.create({
  container: {
    height: CONTROL_AREA_HEIGHT,
    justifyContent: 'center',
  },
});

export default MusicControlArea;

