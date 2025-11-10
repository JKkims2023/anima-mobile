import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import language files
import en from './locales/en.json';
import ko from './locales/ko.json';

// Language storage key
const LANGUAGE_STORAGE_KEY = 'anima-app-language';

// Language resources
const resources = {
  en: {
    translation: en,
  },
  ko: {
    translation: ko,
  },
};

// Get saved language from AsyncStorage
const getSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return savedLanguage;
  } catch (error) {
    console.log('Failed to load saved language:', error);
    return null;
  }
};

// Get device default language
const getDeviceLanguage = () => {
  const locales = getLocales();
  if (locales && locales.length > 0) {
    const deviceLanguage = locales[0].languageCode;
    // Only return if supported, otherwise fallback to 'ko'
    return ['en', 'ko'].includes(deviceLanguage) ? deviceLanguage : 'ko';
  }
  return 'ko';
};

// Initialize i18n
const initializeI18n = async () => {
  // Try to get saved language first
  const savedLanguage = await getSavedLanguage();
  
  // If no saved language, use device language
  const initialLanguage = savedLanguage || getDeviceLanguage();
  
  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage, // Initial language
      fallbackLng: 'ko', // Fallback to Korean if language is not available
      supportedLngs: ['en', 'ko'], // Supported languages
      compatibilityJSON: 'v3',
      interpolation: {
        escapeValue: false, // React already escapes
      },
      react: {
        useSuspense: false, // Disable suspense for React Native
      },
    });
  
  console.log(`[i18n] Initialized with language: ${initialLanguage}`);
  
  return i18n;
};

// Save language to AsyncStorage when changed
i18n.on('languageChanged', async (lng) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
    console.log(`[i18n] Language changed to: ${lng}`);
  } catch (error) {
    console.log('Failed to save language:', error);
  }
});

// Initialize immediately
initializeI18n();

export default i18n;


