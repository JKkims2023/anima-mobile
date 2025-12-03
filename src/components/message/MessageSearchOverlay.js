// ═══════════════════════════════════════════════════════════════════════════
// MessageSearchOverlay.js
// YouTube-style full-screen search overlay for message history
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
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const MessageSearchOverlay = ({
  visible = false,
  messages = [],
  onClose,
  onSelectMessage,
}) => {
  const { currentTheme: theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const inputRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMessages, setFilteredMessages] = useState(messages);

  // ═══════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════

  // Auto-focus input when overlay opens
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setFilteredMessages(messages);
      // Delay to ensure modal is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [visible, messages]);

  // Filter messages by search query (title OR content)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMessages(messages);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = messages.filter((message) => {
      const title = message.message_title?.toLowerCase() || '';
      const content = message.message_content?.toLowerCase() || '';
      return title.includes(query) || content.includes(query);
    });

    setFilteredMessages(filtered);
  }, [searchQuery, messages]);

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

  const handleSelectMessage = (message) => {
    HapticService.medium();
    Keyboard.dismiss();
    onSelectMessage?.(message);
    handleClose();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return t('common.today');
    } else if (diffDays === 1) {
      return t('common.yesterday');
    } else if (diffDays < 7) {
      return t('common.days_ago', { count: diffDays });
    } else {
      return date.toLocaleDateString();
    }
  };

  // Truncate content
  const truncateContent = (content, maxLength = 50) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: Message Item
  // ═══════════════════════════════════════════════════════════════════════

  const renderMessageItem = ({ item: message }) => {
    return (
      <TouchableOpacity
        style={[
          styles.messageItem,
          {
            backgroundColor: theme.bgSecondary,
            borderColor: theme.borderColor,
          },
        ]}
        onPress={() => handleSelectMessage(message)}
        activeOpacity={0.7}
      >
        {/* Persona Image */}
        <View style={styles.messageImageContainer}>
          <Image
            source={{ uri: message.persona_image_url }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        </View>

        {/* Message Info */}
        <View style={styles.messageInfo}>
          <View style={styles.messageTitleRow}>
            <CustomText type="body" bold style={{ color: theme.textPrimary, flex: 1 }} numberOfLines={1}>
              {message.message_title}
            </CustomText>
            {message.has_password === 'Y' && (
              <Icon name="lock" size={scale(14)} color={theme.textSecondary} style={{ marginLeft: platformPadding(8) }} />
            )}
          </View>
          <CustomText
            type="small"
            style={{ color: theme.textSecondary, marginTop: verticalScale(4) }}
            numberOfLines={2}
          >
            {truncateContent(message.message_content)}
          </CustomText>
          <View style={styles.messageMetaRow}>
            <CustomText type="small" style={{ color: theme.textTertiary }}>
              {message.persona_name}
            </CustomText>
            <CustomText type="small" style={{ color: theme.textTertiary, marginLeft: platformPadding(8) }}>
              • {formatDate(message.created_at)}
            </CustomText>
          </View>
        </View>

        {/* Arrow Icon */}
        <Icon
          name="chevron-right"
          size={scale(24)}
          color={theme.textSecondary}
        />
      </TouchableOpacity>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: Empty State
  // ═══════════════════════════════════════════════════════════════════════

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="message-text-outline" size={scale(64)} color={theme.textSecondary} />
      <CustomText type="body" style={{ color: theme.textSecondary, marginTop: verticalScale(16) }}>
        {searchQuery ? t('search.no_results') : t('search.message.empty')}
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
              placeholder={t('search.placeholder.message')}
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
        {/* Search Results */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <FlatList
          data={filteredMessages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.message_key}
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

  // ⭐ List
  listContent: {
    paddingHorizontal: platformPadding(16),
    paddingTop: platformPadding(16),
  },

  // ⭐ Message Item
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: platformPadding(12),
    borderRadius: scale(12),
    borderWidth: 1,
    marginBottom: platformPadding(12),
  },

  messageImageContainer: {
    marginRight: platformPadding(12),
  },

  messageImage: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(8),
  },

  messageInfo: {
    flex: 1,
  },

  messageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  messageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(4),
  },

  // ⭐ Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(60),
  },
});

export default MessageSearchOverlay;

