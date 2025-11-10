import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import commonstyles from '../styles/commonstyles';

// Theme storage key
const THEME_STORAGE_KEY = 'anima-app-theme';

// Theme constants
export const THEMES = {
  DARK: 'dark',
  WHITE: 'white',
};

// Create ThemeContext
const ThemeContext = createContext();

/**
 * ThemeProvider - Provides theme state and functions to entire app
 */
export const ThemeProvider = ({ children }) => {
  // Default theme: Dark 🌙
  const [theme, setTheme] = useState(THEMES.DARK);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load saved theme from AsyncStorage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && (savedTheme === THEMES.DARK || savedTheme === THEMES.WHITE)) {
          setTheme(savedTheme);
          console.log(`[Theme] Loaded saved theme: ${savedTheme}`);
        } else {
          // If no saved theme, use default Dark theme
          console.log('[Theme] No saved theme, using default: Dark');
        }
      } catch (error) {
        console.log('[Theme] Failed to load saved theme:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTheme();
  }, []);
  
  // Change theme function
  const changeTheme = async (newTheme) => {
    if (newTheme !== THEMES.DARK && newTheme !== THEMES.WHITE) {
      console.warn(`[Theme] Invalid theme: ${newTheme}`);
      return;
    }
    
    try {
      setTheme(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      console.log(`[Theme] Theme changed to: ${newTheme}`);
    } catch (error) {
      console.log('[Theme] Failed to save theme:', error);
    }
  };
  
  // Toggle theme (Dark ↔ White)
  const toggleTheme = () => {
    const newTheme = theme === THEMES.DARK ? THEMES.WHITE : THEMES.DARK;
    changeTheme(newTheme);
  };
  
  // Get current theme styles
  const currentTheme = theme === THEMES.DARK 
    ? commonstyles.darkTheme 
    : commonstyles.whiteTheme;
  
  // Check if dark theme
  const isDark = theme === THEMES.DARK;
  
  const value = {
    theme,              // Current theme ('dark' or 'white')
    changeTheme,        // Function to change theme
    toggleTheme,        // Function to toggle theme
    currentTheme,       // Current theme style object
    isDark,             // Whether current theme is dark
    isLoading,          // Whether theme is loading
  };
  
  // Don't render children until theme is loaded
  if (isLoading) {
    return null;
  }
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * useTheme - Custom hook to use theme
 * @returns {Object} - Theme state and functions
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default ThemeContext;


