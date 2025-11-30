/**
 * 🌟 CenterAIActionSheet - AI Feature Selection
 * 
 * Features:
 * - 4 AI features selection
 * - Message Creator (메시지 생성)
 * - Persona Creator (페르소나 생성)
 * - Music Generator (음원 생성)
 * - Manager SAGE (AI 매니저 채팅)
 * 
 * Design: CustomBottomSheet + SettingsItem style
 * 
 * @author JK & Hero AI
 */

import React, { forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import CustomBottomSheet from './CustomBottomSheet';
import SettingsItem from './SettingsItem';
import { scale, platformPadding } from '../utils/responsive-utils';

/**
 * CenterAIActionSheet Component
 */
const CenterAIActionSheet = forwardRef(({ onClose, onFeatureSelect }, ref) => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  // ✅ Handle feature selection
  const handleFeatureSelect = (feature) => {
    // Close sheet first
    ref.current?.dismiss();

    // Notify parent if callback provided
    if (onFeatureSelect) {
      onFeatureSelect(feature);
    }

    // Navigate or trigger action based on feature
    setTimeout(() => {
      switch (feature) {
        case 'message_creator':
          // TODO: Open MessageCreatorSheet
          console.log('🎁 Open Message Creator');
          break;
        case 'persona_creator':
          // Navigate to Persona screen
          navigation.navigate('Persona');
          break;
        case 'music_generator':
          // TODO: Open MusicGeneratorSheet
          console.log('🎵 Open Music Generator');
          break;
        case 'manager_sage':
          // Navigate to Home screen (SAGE)
          navigation.navigate('Home');
          break;
        default:
          break;
      }
    }, 100);
  };

  return (
    <CustomBottomSheet
      ref={ref}
      title={t('centerAI.title')}
      onClose={onClose}
      snapPoints={['60%', '80%']}
      enablePanDownToClose={true}
    >
      <View style={styles.container}>
        {/* 1️⃣ Message Creator */}
        <SettingsItem
          icon="🎁"
          title={t('centerAI.message_creator')}
          description={t('centerAI.message_creator_desc')}
          onPress={() => handleFeatureSelect('message_creator')}
          showBorder={true}
        />

        {/* 2️⃣ Persona Creator */}
        <SettingsItem
          icon="🎨"
          title={t('centerAI.persona_creator')}
          description={t('centerAI.persona_creator_desc')}
          onPress={() => handleFeatureSelect('persona_creator')}
          showBorder={true}
        />

        {/* 3️⃣ Music Generator */}
        <SettingsItem
          icon="🎵"
          title={t('centerAI.music_generator')}
          description={t('centerAI.music_generator_desc')}
          onPress={() => handleFeatureSelect('music_generator')}
          showBorder={true}
        />

        {/* 4️⃣ Manager SAGE */}
        <SettingsItem
          icon="🤖"
          title={t('centerAI.manager_sage')}
          description={t('centerAI.manager_sage_desc')}
          onPress={() => handleFeatureSelect('manager_sage')}
          showBorder={false}
        />
      </View>
    </CustomBottomSheet>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingBottom: platformPadding(20),
  },
});

export default CenterAIActionSheet;

