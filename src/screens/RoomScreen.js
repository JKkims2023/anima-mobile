import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import CustomText from '../components/CustomText';
import { useTheme } from '../contexts/ThemeContext';

/**
 * RoomScreen - Room page
 */
const RoomScreen = () => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <View style={styles.content}>
        <CustomText 
          type="big" 
          bold
          style={{ color: currentTheme.textColor }}
        >
          {t('navigation.room')}
        </CustomText>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RoomScreen;

