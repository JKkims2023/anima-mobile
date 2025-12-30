/**
 * 🎬 VideoPlayerModal - YouTube Video Player
 * 
 * Features:
 * - Full-screen YouTube player
 * - react-native-youtube-iframe integration
 * - Play/Pause controls
 * - Back button to close
 * 
 * @author Hero Nexus + JK
 * @date 2025-12-30
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import YoutubePlayer from 'react-native-youtube-iframe';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '../CustomText';
import { moderateScale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';

const VideoPlayerModal = ({ visible, videoId, title, onClose }) => {
  const insets = useSafeAreaInsets();
  const [playing, setPlaying] = useState(true);

  const handleStateChange = useCallback((state) => {
    if (state === 'ended') {
      setPlaying(false);
    }
  }, []);

  const handleClose = useCallback(() => {
    HapticService.light();
    setPlaying(false);
    onClose?.();
  }, [onClose]);

  const togglePlaying = useCallback(() => {
    HapticService.medium();
    setPlaying(prev => !prev);
  }, []);

  if (!visible || !videoId) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="chevron-back" size={moderateScale(28)} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <CustomText type="medium" numberOfLines={1} style={styles.titleText}>
              {title}
            </CustomText>
          </View>
        </View>

        {/* YouTube Player */}
        <View style={styles.playerContainer}>
          <YoutubePlayer
            height={verticalScale(250)}
            videoId={videoId}
            play={playing}
            onChangeState={handleStateChange}
            webViewProps={{
              injectedJavaScript: `
                var element = document.getElementsByClassName('container')[0];
                element.style.position = 'unset';
                true;
              `,
            }}
          />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={togglePlaying}
            style={styles.controlButton}
            activeOpacity={0.7}
          >
            <Icon
              name={playing ? 'pause-circle' : 'play-circle'}
              size={moderateScale(64)}
              color={COLORS.PRIMARY}
            />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <CustomText type="small" style={styles.infoText}>
            🎬 YouTube에서 재생 중
          </CustomText>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: platformPadding(16),
    paddingVertical: platformPadding(12),
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: moderateScale(4),
    marginRight: moderateScale(12),
  },
  headerTitle: {
    flex: 1,
  },
  titleText: {
    color: '#fff',
    fontSize: moderateScale(16),
  },
  playerContainer: {
    width: '100%',
    backgroundColor: '#000',
    marginTop: verticalScale(20),
  },
  controls: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(30),
  },
  controlButton: {
    padding: moderateScale(10),
  },
  infoContainer: {
    alignItems: 'center',
    paddingHorizontal: platformPadding(20),
  },
  infoText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: moderateScale(12),
  },
});

export default VideoPlayerModal;

