// ═══════════════════════════════════════════════════════════════════════════
// PersonaSearchOverlay.js
// YouTube-style full-screen search overlay for personas
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// ⭐ ANIMA Components
import CustomText from '../CustomText';
import { useTheme } from '../../contexts/ThemeContext';
import { scale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import HapticService from '../../utils/HapticService';

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
const PERSONA_CATEGORIES = [
  { key: 'all', emoji: '🌐' },
  { key: 'normal', emoji: '☀️' },
  { key: 'thanks', emoji: '🙏' },
  { key: 'apologize', emoji: '🙇' },
  { key: 'hope', emoji: '✨' },
  { key: 'cheer_up', emoji: '📣' },
  { key: 'congrats', emoji: '🎉' },
  { key: 'birthday', emoji: '🎂' },
  { key: 'christmas', emoji: '🎄' },
  { key: 'new_year', emoji: '🎊' },
  { key: 'romantic', emoji: '💕' },
  { key: 'comfort', emoji: '🤗' },
  { key: 'sadness', emoji: '😢' },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const PersonaSearchOverlay = ({
  visible = false,
  personas = [],
  onClose,
  onSelectPersona,
  currentPersonaKey = null,
}) => {
  const { currentTheme: theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const inputRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all'); // ⭐ NEW: Category filter
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false); // ⭐ NEW: Dropdown state
  const [filteredPersonas, setFilteredPersonas] = useState(personas);

  // ═══════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════

  // Auto-focus input when overlay opens
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setSelectedCategory('all');
      setIsCategoryDropdownOpen(false);
      setFilteredPersonas(personas);
      // Delay to ensure modal is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [visible, personas]);

  // ⭐ Filter personas by search query AND category
  useEffect(() => {
    let filtered = [...personas];

    // 1️⃣ Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((persona) => persona.category_type === selectedCategory);
    }

    // 2️⃣ Name search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((persona) => {
        const name = persona.persona_name?.toLowerCase() || '';
        return name.includes(query);
      });
    }

    setFilteredPersonas(filtered);
  }, [searchQuery, selectedCategory, personas]);

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  const handleClose = () => {
    HapticService.light();
    Keyboard.dismiss();
    setSearchQuery('');
    onClose?.();
  };

  const handleClearSearch = () => {
    HapticService.light();
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const handleSelectPersona = (persona, index) => {
    HapticService.medium();
    Keyboard.dismiss();
    onSelectPersona?.(persona, index);
    handleClose();
  };

  const handleToggleCategoryDropdown = () => {
    HapticService.light();
    setIsCategoryDropdownOpen((prev) => !prev);
  };

  const handleSelectCategory = (categoryKey) => {
    HapticService.light();
    setSelectedCategory(categoryKey);
    setIsCategoryDropdownOpen(false);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: Persona Item
  // ═══════════════════════════════════════════════════════════════════════

  const renderPersonaItem = ({ item: persona, index }) => {
    const isActive = persona.persona_key === currentPersonaKey;

    return (
      <TouchableOpacity
        style={[
          styles.personaItem,
          {
            backgroundColor: isActive
              ? `${theme.mainColor}15`
              : theme.bgSecondary,
            borderColor: isActive ? theme.mainColor : theme.borderColor,
          },
        ]}
        onPress={() => handleSelectPersona(persona, index)}
        activeOpacity={0.7}
      >
        {/* Persona Image */}
        <View style={styles.personaImageContainer}>
          <Image
            source={{ uri: persona.persona_url || persona.selected_dress_image_url }}
            style={styles.personaImage}
            resizeMode="cover"
          />
          {isActive && (
            <View style={[styles.activeIndicator, { backgroundColor: theme.mainColor }]}>
              <Icon name="check-circle" size={scale(16)} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Persona Info */}
        <View style={styles.personaInfo}>
          <CustomText type="body" bold style={{ color: theme.textPrimary }}>
            {persona.persona_name}
          </CustomText>
          <CustomText
            type="small"
            style={{ color: theme.textSecondary, marginTop: verticalScale(4) }}
          >
            {persona.persona_category || t('persona.category.default')}
          </CustomText>
        </View>

        {/* Arrow Icon */}
        <Icon
          name="chevron-right"
          size={scale(24)}
          color={isActive ? theme.mainColor : theme.textSecondary}
        />
      </TouchableOpacity>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: Category Dropdown
  // ═══════════════════════════════════════════════════════════════════════

  const renderCategoryDropdown = () => {
    const selectedCategoryData = PERSONA_CATEGORIES.find((cat) => cat.key === selectedCategory);

    return (
      <View style={styles.categoryContainer}>
        {/* Dropdown Button */}
        <TouchableOpacity
          style={[
            styles.categoryButton,
            {
              backgroundColor: theme.bgSecondary,
              borderColor: theme.borderColor,
            },
          ]}
          onPress={handleToggleCategoryDropdown}
          activeOpacity={0.7}
        >
          <CustomText type="body" style={{ color: theme.textPrimary }}>
            {selectedCategoryData?.emoji} {t(`category_type.${selectedCategory}`)}
          </CustomText>
          <Icon
            name={isCategoryDropdownOpen ? 'chevron-up' : 'chevron-down'}
            size={scale(20)}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        {/* Dropdown List */}
        {isCategoryDropdownOpen && (
          <View
            style={[
              styles.dropdownList,
              {
                backgroundColor: theme.bgSecondary,
                borderColor: theme.borderColor,
              },
            ]}
          >
            {PERSONA_CATEGORIES.map((category) => {
              const isSelected = category.key === selectedCategory;
              return (
                <TouchableOpacity
                  key={category.key}
                  style={[
                    styles.dropdownItem,
                    isSelected && {
                      backgroundColor: `${theme.mainColor}15`,
                    },
                  ]}
                  onPress={() => handleSelectCategory(category.key)}
                  activeOpacity={0.7}
                >
                  <CustomText
                    type="body"
                    style={{
                      color: isSelected ? theme.mainColor : theme.textPrimary,
                    }}
                  >
                    {category.emoji} {t(`category_type.${category.key}`)}
                  </CustomText>
                  {isSelected && (
                    <Icon name="check" size={scale(20)} color={theme.mainColor} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: Empty State
  // ═══════════════════════════════════════════════════════════════════════

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="magnify-close" size={scale(64)} color={theme.textSecondary} />
      <CustomText type="body" style={{ color: theme.textSecondary, marginTop: verticalScale(16) }}>
        {searchQuery ? t('search.no_results') : t('search.start_typing')}
      </CustomText>
    </View>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* Search Header */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + platformPadding(12),
              backgroundColor: theme.bgSecondary,
              borderBottomColor: theme.borderColor,
            },
          ]}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={scale(24)} color={theme.textPrimary} />
          </TouchableOpacity>

          {/* Search Input */}
          <View
            style={[
              styles.searchInputContainer,
              {
                backgroundColor: theme.backgroundColor,
                borderColor: theme.borderColor,
              },
            ]}
          >
            <Icon
              name="magnify"
              size={scale(20)}
              color={theme.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              ref={inputRef}
              style={[
                styles.searchInput,
                {
                  color: theme.textPrimary,
                  fontFamily: 'Pretendard-Regular',
                },
              ]}
              placeholder={t('search.placeholder.persona')}
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearSearch}
                activeOpacity={0.7}
              >
                <Icon name="close-circle" size={scale(20)} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* Category Dropdown */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {renderCategoryDropdown()}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* Search Results */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <FlatList
          data={filteredPersonas}
          renderItem={renderPersonaItem}
          keyExtractor={(item, index) => `${item.persona_key}-${index}`}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + platformPadding(20) },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ⭐ Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: platformPadding(16),
    paddingBottom: platformPadding(12),
    borderBottomWidth: 1,
  },

  backButton: {
    marginRight: platformPadding(12),
    padding: platformPadding(4),
  },

  // ⭐ Search Input
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scale(12),
    borderWidth: 1,
    paddingHorizontal: platformPadding(12),
    height: verticalScale(44),
  },

  searchIcon: {
    marginRight: platformPadding(8),
  },

  searchInput: {
    flex: 1,
    fontSize: scale(15),
    paddingVertical: 0, // Remove default padding
  },

  clearButton: {
    marginLeft: platformPadding(8),
    padding: platformPadding(4),
  },

  // ⭐ Category Dropdown
  categoryContainer: {
    paddingHorizontal: platformPadding(16),
    paddingTop: platformPadding(16),
    paddingBottom: platformPadding(8),
    position: 'relative',
    zIndex: 1000, // ⭐ Ensure dropdown is above list
  },

  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: scale(12),
    borderWidth: 1,
    paddingHorizontal: platformPadding(16),
    paddingVertical: platformPadding(12),
  },

  dropdownList: {
    position: 'absolute',
    top: platformPadding(72), // Below button
    left: platformPadding(16),
    right: platformPadding(16),
    borderRadius: scale(12),
    borderWidth: 1,
    maxHeight: verticalScale(300), // ⭐ Scrollable if too many items
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },

  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: platformPadding(16),
    paddingVertical: platformPadding(14),
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },

  // ⭐ List
  listContent: {
    paddingHorizontal: platformPadding(16),
    paddingTop: platformPadding(8), // ⭐ Reduced padding (category dropdown above)
  },

  // ⭐ Persona Item
  personaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: platformPadding(12),
    borderRadius: scale(12),
    borderWidth: 1,
    marginBottom: platformPadding(12),
  },

  personaImageContainer: {
    position: 'relative',
    marginRight: platformPadding(12),
  },

  personaImage: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
  },

  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  personaInfo: {
    flex: 1,
  },

  // ⭐ Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(60),
  },
});

export default PersonaSearchOverlay;

