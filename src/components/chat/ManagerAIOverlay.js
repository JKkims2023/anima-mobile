/**
 * 🤖 ManagerAIOverlay - Universal Manager AI Chat Overlay
 * 
 * Features:
 * - Full-screen overlay (no background video/image)
 * - Context-aware AI responses
 * - Reuses ChatMessageList & ChatInputBar
 * - Simple & Stable keyboard handling
 * - Optimized for performance
 * 
 * Context Types:
 * - 'home': Message creation, Persona creation
 * - 'music': Music generation
 * - 'point': Points & Premium membership
 * - 'settings': General settings help
 * 
 * @author JK & Hero AI
 * @version 2.0 - Simplified & Optimized
 */

import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { 
  View, 
  Modal, 
  StyleSheet, 
  TouchableOpacity,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
  Alert,
  Image, // 🆕 For image preview
  AppState, // 🎵 NEW: For background state detection
  BackHandler, // ⭐ NEW: For Android back button handling
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import IconSearch from 'react-native-vector-icons/MaterialCommunityIcons';
import ChatMessageList from './ChatMessageList';
import ChatInputBar from './ChatInputBar';
import CustomText from '../CustomText';
import IdentitySettingsSheet from './IdentitySettingsSheet'; // 🎭 NEW: Identity settings
import SpeakingPatternSheet from './SpeakingPatternSheet'; // 🗣️ NEW: Speaking pattern settings
import CreateMusicSheet from './CreateMusicSheet'; // 🎵 NEW: Create music sheet
import ChatLimitSheet from './ChatLimitSheet'; // 💰 NEW: Limit reached sheet
import FloatingChatLimitButton from './FloatingChatLimitButton'; // 💰 NEW: Floating chat limit button
import HiddenYoutubePlayer from './HiddenYoutubePlayer'; // 🎵 NEW: Hidden YouTube player for audio
import MiniYoutubeVideoPlayer from './MiniYoutubeVideoPlayer'; // 🎬 NEW: Mini YouTube video player
import TierUpgradeSheet from '../tier/TierUpgradeSheet'; // 🎖️ NEW: Tier upgrade sheet
// import LimitedModeChips from './LimitedModeChips'; // ⚠️ DEPRECATED: LIMITED MODE 폐기 (클라이언트 측 직접 입력으로 전환)
import PersonaIdentityCreatorView from './PersonaIdentityCreatorView'; // 🎭 NEW: Identity Creator
import { chatApi } from '../../services/api';
import { createPersona, createPersonaIdentity } from '../../services/api/personaApi'; // 🎭 NEW: For persona creation & identity
import { scale, moderateScale, verticalScale, platformPadding } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import HapticService from '../../utils/HapticService';
import { useUser } from '../../contexts/UserContext';
import { useAnima } from '../../contexts/AnimaContext'; // ⭐ NEW: Alert function
import { usePersona } from '../../contexts/PersonaContext'; // 🎭 NEW: For identity update sync
import { useMusicPlayer } from '../../hooks/useMusicPlayer'; // 🎵 NEW: Music player hook
import useChatLimit from '../../hooks/useChatLimit'; // 💰 NEW: Chat limit hook
import useIdentitySettings from '../../hooks/useIdentitySettings'; // 🎭 NEW: Identity settings hook
import uuid from 'react-native-uuid';
import { useTheme } from '../../contexts/ThemeContext';
import ChatHelpSheet from './ChatHelpSheet';
import { gameApi } from '../../services/api'; // 🎮 NEW: Game API for LLM
// ⭐ NEW: Chat helpers and constants
import { 
  AI_BEHAVIOR, 
  TIMING, 
  IDENTITY_EVOLUTION,
  SPECIAL_MARKERS,
  IDENTITY_FIELD_LABELS,
  CHAT_HISTORY,
} from '../../utils/chatConstants';
import { 
  CancelableTimeout,
  addAIMessageWithTyping, // ⚠️ DEPRECATED: Will be replaced with addAIMessageWithBubbles

  cancelableDelay,
  normalizeMessage,
  createErrorMessage,
  createUserMessage,
} from '../../utils/chatHelpers';
import { parseRichContent } from '../../utils/chatResponseParser';
import { addAIMessageWithBubbles, parseAIMessage } from '../../utils/smartBubbleHelpers'; // 🎯 NEW: Smart bubble system (2026-01-11)

/**
 * 🌟 IdentityEvolutionOverlay - Minimal notification for identity updates
 * 
 * @param {object} evolution - { field, value, action }
 */
const IdentityEvolutionOverlay = ({ evolution }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Fade out after 2 seconds
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 200000);
  }, []);
  
  // Field labels from constants
  const label = IDENTITY_FIELD_LABELS[evolution.field] || { icon: '✨', text: evolution.field };
  
  return (
    <Animated.View
      style={[
        styles.evolutionOverlay,
        {
          opacity: fadeAnim,
          transform: [
            {
              scale: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        },
      ]}
    >
      <CustomText type="huge" style={styles.evolutionIcon}>
        {label.icon}
      </CustomText>
      <CustomText type="medium" bold style={styles.evolutionText}>
        {label.text} 강화
      </CustomText>
    </Animated.View>
  );
};

/**
 * ManagerAIOverlay Component (Simplified)
 */
const ManagerAIOverlay = ({ 
  visible = false, 
  onClose,
  context = 'home',
  onCreateMessage,
  persona = null, // ⭐ NEW: Selected persona (from PersonaContext)
  onGameSelect, // 🎮 NEW: Callback for game selection
  onTierUpgrade // 🎖️ NEW: Callback for tier upgrade
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useUser(); // ✅ Get user info from context
  const { showAlert, showOverlayAlert } = useAnima(); // ⭐ NEW: Alert function for chat limit warnings
  const { currentTheme } = useTheme();
  const { initializePersonas } = usePersona(); // 🎭 NEW: For identity update sync
  
  // 🔥 PERFORMANCE DEBUG: Render counter
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  if (__DEV__) {
    console.log(`🔥 [ManagerAIOverlay] Render #${renderCountRef.current}, visible: ${visible}`);
  }
  
  // ✅ Chat state (⚡ OPTIMIZED: No more setTypingMessage spam!)
  const [messages, setMessages] = useState([]);
  const [messageVersion, setMessageVersion] = useState(0); // 🎯 NEW: Trigger FlashList updates for Smart Bubble system
  const [isInitializing, setIsInitializing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // ⚡ Boolean only (true/false)
  const [currentTypingText, setCurrentTypingText] = useState(''); // ⚡ Complete text (set once!)
  
  // 😴 NEW (2026-01-13): Real-time emotion from LLM
  const [currentEmotion, setCurrentEmotion] = useState('sleeping');
  
  // 😴 Reset emotion when chat opens/closes
  useEffect(() => {
    if (visible) {
      setCurrentEmotion('sleeping');
      console.log('😴 [Emotion] Reset to sleeping');
    }
  }, [visible]);
  
  // 🔥 [STATE LOG] messages
  useEffect(() => {
    if (__DEV__) {
      console.log(`🔥 [STATE] messages changed: ${messages.length} messages`);
    }
  }, [messages]);
  
  // 🔥 [STATE LOG] messageVersion
  useEffect(() => {
    if (__DEV__) {
      console.log(`🔥 [STATE] messageVersion changed: ${messageVersion}`);
    }
  }, [messageVersion]);
  
  // 🔥 [STATE LOG] isInitializing
  useEffect(() => {
    if (__DEV__) {
      console.log(`🔥 [STATE] isInitializing changed: ${isInitializing}`);
    }
  }, [isInitializing]);
  
  // 🔥 [STATE LOG] isLoading
  useEffect(() => {
    if (__DEV__) {
      console.log(`🔥 [STATE] isLoading changed: ${isLoading}`);
    }
  }, [isLoading]);
  
  // 🔥 [STATE LOG] isTyping
  useEffect(() => {
    if (__DEV__) {
      console.log(`🔥 [STATE] isTyping changed: ${isTyping}`);
    }
  }, [isTyping]);
  
  // 🔥 [STATE LOG] currentTypingText
  useEffect(() => {
    if (__DEV__) {
      console.log(`🔥 [STATE] currentTypingText changed: ${currentTypingText?.substring(0, 50)}...`);
    }
  }, [currentTypingText]);
  
  // ⭐ NEW: Continuous conversation state
  const [isAIContinuing, setIsAIContinuing] = useState(false);
  const aiContinueCountRef = useRef(0); // ⭐ Use ref instead of state to avoid stale closure
  
  // 🔥 [STATE LOG] isAIContinuing
  useEffect(() => {
    if (__DEV__) {
      console.log(`🔥 [STATE] isAIContinuing changed: ${isAIContinuing}, count: ${aiContinueCountRef.current}`);
    }
  }, [isAIContinuing]);
  
  // 🔒 [DEPRECATED 2026-01-08] LIMITED MODE state (Replaced by client-side identity creator)
  // const [requiredFields, setRequiredFields] = useState([]); // Array of { field_name, label, emoji, completed }
  // const [showLimitedModeChips, setShowLimitedModeChips] = useState(false); // Show/hide chips
  
  // 🎭 NEW: Identity Creator state
  const [showIdentityCreator, setShowIdentityCreator] = useState(false);
  
  // 🔥 [STATE LOG] showIdentityCreator
  useEffect(() => {
    if (__DEV__) {
      console.log(`🔥 [STATE] showIdentityCreator changed: ${showIdentityCreator}`);
    }
  }, [showIdentityCreator]);
  
  // 🔥 CRITICAL FIX: Refs to capture latest state for handleClose
  const messagesRef = useRef(messages);
  const userRef = useRef(user);
  const personaRef = useRef(persona);
  const isClosingRef = useRef(false); // 🛡️ NEW: Prevent duplicate close calls
  const userMessageCountRef = useRef(0); // 🎯 SIMPLE: Track only real-time user messages sent via handleSend
  
  // 🔄 Update refs whenever state changes
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  
  useEffect(() => {
    personaRef.current = persona;
  }, [persona]);
  
  // ⭐ NEW: Chat history state
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [currentPersonaKey, setCurrentPersonaKey] = useState(null); // ⭐ Track current persona
  
  // 🔥 [STATE LOG] Chat history states
  useEffect(() => {
    if (__DEV__) {
      console.log(`🔥 [STATE] loadingHistory changed: ${loadingHistory}`);
    }
  }, [loadingHistory]);
  
  useEffect(() => {
    if (__DEV__) {
      console.log(`🔥 [STATE] hasMoreHistory changed: ${hasMoreHistory}`);
    }
  }, [hasMoreHistory]);
  
  useEffect(() => {
    if (__DEV__) {
      console.log(`🔥 [STATE] historyOffset changed: ${historyOffset}`);
    }
  }, [historyOffset]);
  
  useEffect(() => {
    if (__DEV__) {
      console.log(`🔥 [STATE] currentPersonaKey changed: ${currentPersonaKey}`);
    }
  }, [currentPersonaKey]);
  
  // 🎭 REMOVED: Settings states (moved to useIdentitySettings hook)
  
  // 🆕 Vision state
  const [selectedImage, setSelectedImage] = useState(null); // Holds selected image before sending
  
  // 🔥 [STATE LOG] selectedImage
  useEffect(() => {
    if (__DEV__) {
      console.log(`🔥 [STATE] selectedImage changed: ${selectedImage ? 'Image selected' : 'No image'}`);
    }
  }, [selectedImage]);
  
  // 🌟 Identity Evolution Notification State
  const [identityEvolutionDisplay, setIdentityEvolutionDisplay] = useState(null);
  
  // 🔥 [STATE LOG] identityEvolutionDisplay
  useEffect(() => {
    if (__DEV__) {
      console.log(`🔥 [STATE] identityEvolutionDisplay changed:`, identityEvolutionDisplay?.field);
    }
  }, [identityEvolutionDisplay]);

  // 🆕 Help Open State
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  // 🔥 [STATE LOG] isHelpOpen
  useEffect(() => {
    if (__DEV__) {
      console.log(`🔥 [STATE] isHelpOpen changed: ${isHelpOpen}`);
    }
  }, [isHelpOpen]);
  
  // 💰 NEW: FloatingChatLimitButton Tooltip State (Lifted up for back button handling!)
  const [isLimitTooltipOpen, setIsLimitTooltipOpen] = useState(false);
  const limitTooltipRef = useRef(null); // ⭐ Ref to access closeTooltip function
  
  // 🔥 [STATE LOG] isLimitTooltipOpen
  useEffect(() => {
    if (__DEV__) {
      console.log(`🔥 [STATE] isLimitTooltipOpen changed: ${isLimitTooltipOpen}`);
    }
  }, [isLimitTooltipOpen]);
  
  // 🎛️ NEW: ChatInputBar Settings Menu State (Lifted up from child!)
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  
  // 🔥 [STATE LOG] isSettingsMenuOpen
  useEffect(() => {
    if (__DEV__) {
      console.log(`🔥 [STATE] isSettingsMenuOpen changed: ${isSettingsMenuOpen}`);
    }
  }, [isSettingsMenuOpen]);
  
  // 🎖️ NEW: Tier Upgrade Sheet State
  const [showTierUpgrade, setShowTierUpgrade] = useState(false);
  
  // 🔥 [STATE LOG] showTierUpgrade
  useEffect(() => {
    if (__DEV__) {
      console.log(`🔥 [STATE] showTierUpgrade changed: ${showTierUpgrade}`);
    }
  }, [showTierUpgrade]);
  
  // 🎵 Music Player Hook (replaces floatingContent, showYouTubePlayer, currentVideo + handlers)
  const {
    floatingContent,
    setFloatingContent,
    showYouTubePlayer,
    currentVideo,
    handleMusicPress,
    handleMusicClose, // ⭐ NEW: Renamed from handleMusicStop
    handleYouTubePress,
    handleYouTubeClose,
  } = useMusicPlayer();
  
  // 🔥 [HOOK LOG] useMusicPlayer
  useEffect(() => {
    if (__DEV__) {
      console.log(`🎣 [HOOK] useMusicPlayer changed:`, {
        hasFloatingContent: !!floatingContent,
        showYouTubePlayer,
        hasVideo: !!currentVideo
      });
    }
  }, [floatingContent, showYouTubePlayer, currentVideo]);
  
  // 💰 NEW: Chat Limit Hook (manages tier limits, loading, sheet)
  const {
    serviceConfig,
    loadingServiceConfig,
    showLimitSheet,
    setShowLimitSheet,
    limitReachedData,
    checkLimit,
    incrementChatCount,
    showLimitReachedSheet,
  } = useChatLimit(visible, user, showAlert, showOverlayAlert);
  
  // 🔥 [HOOK LOG] useChatLimit
  useEffect(() => {
    if (__DEV__) {
      console.log(`🎣 [HOOK] useChatLimit changed:`, {
        hasServiceConfig: !!serviceConfig,
        loadingServiceConfig,
        showLimitSheet,
        hasLimitData: !!limitReachedData
      });
    }
  }, [serviceConfig, loadingServiceConfig, showLimitSheet, limitReachedData]);
  
  // 🎭 NEW: Identity Settings Hook (manages AI preferences, sheets)
  const {
    settings,
    loadingSettings,
    savingSettings,
    showIdentitySettings,
    setShowIdentitySettings,
    showSpeakingPattern,
    setShowSpeakingPattern,
    showCreateMusic,
    setShowCreateMusic,
    updateSetting,
    handleToggleSettings,
  } = useIdentitySettings(visible, user);
  
  // 🔥 [HOOK LOG] useIdentitySettings
  useEffect(() => {
    if (__DEV__) {
      console.log(`🎣 [HOOK] useIdentitySettings changed:`, {
        hasSettings: !!settings,
        loadingSettings,
        savingSettings,
        showIdentitySettings,
        showSpeakingPattern,
        showCreateMusic
      });
    }
  }, [settings, loadingSettings, savingSettings, showIdentitySettings, showSpeakingPattern, showCreateMusic]);
  
  // 🛑 NEW: Timeout Manager for cleanup
  const timeoutManagerRef = useRef(null);
  
  // 🧹 Initialize and cleanup timeout manager
  useEffect(() => {
    if (__DEV__) {
      console.log(`⚡ [EFFECT] Timeout Manager Effect (visible: ${visible})`);
    }
    
    // Create timeout manager when component mounts or becomes visible
    if (visible && !timeoutManagerRef.current) {
      timeoutManagerRef.current = new CancelableTimeout();
      if (__DEV__) {
        console.log(`⚡ [EFFECT] Timeout Manager created`);
      }
    }
    
    // Cleanup when component unmounts or becomes invisible
    return () => {
      if (__DEV__) {
        console.log(`⚡ [EFFECT] Timeout Manager cleanup (visible: ${visible})`);
      }
      
      if (timeoutManagerRef.current) {
        timeoutManagerRef.current.cancelAll();
        timeoutManagerRef.current = null;
      }

      setMessages([]);
      setCurrentTypingText('');
      setIsTyping(false);
      setIsLoading(false);
      setIsAIContinuing(false);
      aiContinueCountRef.current = 0;
      setCurrentPersonaKey(null);
      setShowIdentityCreator(false);
    };
  }, [visible]);
  
  // ⭐ NEW: Unified Back Button Handler (used by both Modal and BackHandler!)
  const handleBackPress = useCallback(() => {
    if (__DEV__) {
      console.log(`🔧 [HANDLER] handleBackPress called @ ${Date.now()}`);
      console.log(`   isLimitTooltipOpen: ${isLimitTooltipOpen}`);
      console.log(`   isSettingsMenuOpen: ${isSettingsMenuOpen}`);
      console.log(`   showTierUpgrade: ${showTierUpgrade}`);
      console.log(`   showIdentitySettings: ${showIdentitySettings}`);
      console.log(`   showSpeakingPattern: ${showSpeakingPattern}`);
      console.log(`   showCreateMusic: ${showCreateMusic}`);
      console.log(`   showYouTubePlayer: ${showYouTubePlayer}`);
      console.log(`   floatingContent?.showPlayer: ${floatingContent?.showPlayer}`);
      console.log(`   isHelpOpen: ${isHelpOpen}`);
    }
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎯 PRIORITY ORDER (Top to Bottom)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    // 💰 PRIORITY 0: FloatingChatLimitButton Tooltip (HIGHEST PRIORITY!)
    if (isLimitTooltipOpen) {
      if (__DEV__) {
        console.log(`🔧 [HANDLER] handleBackPress → Closing limit tooltip`);
      }
      // Close tooltip via ref
      if (limitTooltipRef.current?.closeTooltip) {
        limitTooltipRef.current.closeTooltip();
      }
      HapticService.light();
      return true; // ⭐ Event handled!
    }
    
    // 🎛️ PRIORITY 1: Settings Menu (ChatInputBar)
    if (isSettingsMenuOpen) {
      setIsSettingsMenuOpen(false);
      HapticService.light();
      return true; // ⭐ Event handled!
    }
    
    // 🎖️ PRIORITY 2: Tier Upgrade Sheet
    if (showTierUpgrade) {
      setShowTierUpgrade(false);
      HapticService.light();
      return true; // ⭐ Event handled!
    }
    
    // 🎭 PRIORITY 3: Identity Settings Sheet
    if (showIdentitySettings) {
      setShowIdentitySettings(false);
      HapticService.light();
      return true; // ⭐ Event handled!
    }
    
    // 🗣️ PRIORITY 4: Speaking Pattern Sheet
    if (showSpeakingPattern) {
      setShowSpeakingPattern(false);
      HapticService.light();
      return true; // ⭐ Event handled!
    }
    
    // 🎵 PRIORITY 5: Create Music Sheet
    if (showCreateMusic) {
      setShowCreateMusic(false);
      HapticService.light();
      return true; // ⭐ Event handled!
    }
    
    // 🎬 PRIORITY 6: YouTube Video Player
    if (showYouTubePlayer) {
      handleYouTubeClose();
      HapticService.light();
      return true; // ⭐ Event handled!
    }
    
    // 🎵 PRIORITY 7: YouTube Music Player (Overlay)
    if (floatingContent?.showPlayer) {
      handleMusicClose(); // ⭐ Close music player
      return true; // ⭐ Event handled!
    }
    
    // ❓ PRIORITY 8: Help Sheet
    if (isHelpOpen) {
      setIsHelpOpen(false);
      HapticService.light();
      return true; // ⭐ Event handled!
    }
    
    // 💬 PRIORITY 9: Close entire chat (if nothing is open)
    handleClose();
    return true; // ⭐ Event handled!
  }, [
    isLimitTooltipOpen, // 💰 NEW: FloatingChatLimitButton tooltip state
    isSettingsMenuOpen,
    showTierUpgrade, 
    showIdentitySettings, 
    showSpeakingPattern, 
    showCreateMusic, 
    showYouTubePlayer,
    floatingContent?.showPlayer,
    isHelpOpen, 
    handleClose, // ✅ KEPT: handleBackPress NEEDS handleClose (not circular!)
    handleYouTubeClose,
    handleMusicClose, // ✅ FIXED: Added handleMusicClose to dependencies
  ]);
  
  // ⭐ NEW: Android Back Button Handler (uses handleBackPress!)
  useEffect(() => {
    if (!visible) return;
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      
      backHandler.remove();
    };
  }, [visible, handleBackPress]);
    
  // 🔥 CRITICAL FIX: Separate useEffect for personaRef sync (performance optimization!)
  // Only updates when persona.persona_key or persona.done_yn actually changes
  useEffect(() => {
    if (__DEV__) {
      console.log(`⚡ [EFFECT] personaRef sync effect triggered`);
      console.log(`   visible: ${visible}, hasPersona: ${!!persona}`);
    }
    
    if (visible && persona) {
      personaRef.current = persona;
      
      if (__DEV__) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔄 [ManagerAIOverlay] personaRef synced with latest prop');
        console.log('   persona_name:', persona.persona_name);
        console.log('   persona_key:', persona.persona_key);
        console.log('   done_yn:', persona.done_yn);
        console.log('   identity_key:', persona.identity_key);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
    }
  }, [visible, persona?.persona_key, persona?.done_yn, persona?.identity_key]); // ⚡ Only watch specific fields!
  
  // ⭐ NEW: Load chat history when visible or persona changes
  useEffect(() => {
    if (__DEV__) {
      console.log(`⚡ [EFFECT] Chat history loading effect triggered`);
      console.log(`   visible: ${visible}`);
      console.log(`   user: ${user?.user_key?.substring(0, 8)}...`);
      console.log(`   persona_key: ${persona?.persona_key?.substring(0, 8)}...`);
      console.log(`   currentPersonaKey: ${currentPersonaKey?.substring(0, 8)}...`);
    }
    
    const personaKey = persona?.persona_key || 'SAGE';
    
    // 🔥 CRITICAL: Only load if user is fully loaded!
    if (!user || !user.user_key) {
      if (__DEV__) {
        console.log(`⚡ [EFFECT] User not loaded, showing not-login message`);
      }
      // ✅ FIX BUG 1: showNotLoginMessage now handles its own loading states!
      setIsInitializing(false);
      setTimeout(() => {
        showNotLoginMessage();
      }, 2000);

      return; // ⚠️ Don't proceed without user!
    }
    
    // Load history if:
    // 1. Overlay becomes visible
    // 2. Persona changes OR persona key was reset (null)
    if (visible) {
      if (__DEV__) {
        console.log(`⚡ [EFFECT] Overlay visible, checking persona change`);
      }
      
      // 🎯 SIMPLE: Reset user message count when chat opens
      userMessageCountRef.current = 0;
      console.log(`🔄 [Chat Open] User message count reset to 0`);
      
      if (currentPersonaKey !== personaKey) {
        if (__DEV__) {
          console.log(`⚡ [EFFECT] Persona changed, loading history`);
          console.log(`   Old: ${currentPersonaKey?.substring(0, 8)}...`);
          console.log(`   New: ${personaKey?.substring(0, 8)}...`);
        }
        
        setCurrentPersonaKey(personaKey);
        setMessages([]); // Clear previous persona's messages
        setHistoryOffset(0); // Reset offset
        setHasMoreHistory(false); // ⭐ Reset hasMore flag
        loadChatHistory();
      }
    }
  }, [visible, user, persona?.persona_key, currentPersonaKey]); // ⚡ Removed 'persona' object - only watch persona_key
  
  const handleCreateMusic = async () => {
    handleToggleSettings('music');
  }

  const handleCreateMessage = async () => {
    // TODO: Implement message creation
  }
  
  // 🗣️ NEW: Save speaking pattern
  const handleSaveSpeakingPattern = useCallback(async (pattern) => {
    if (!user?.user_key || !persona?.persona_key) {
      console.error('[말투 설정] 사용자 또는 페르소나 키 누락');
      return;
    }
    
    try {
      const response = await fetch(`https://port-next-idol-companion-mh8fy4v6b1e8187d.sel3.cloudtype.app/api/persona/identity/speaking-pattern`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          persona_key: persona.persona_key,
          user_key: user.user_key,
          speaking_pattern: pattern,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        HapticService.success();
        
        // ✨ Show notification message
        const personaName = persona.persona_name || 'AI';
        showNotificationMessage(`✨ ${personaName}의 새로운 말투가 적용되었습니다! 이제부터 더 자연스럽게 대화할게요!`, 2500);
      } else {
        throw new Error(data.error || 'Failed to save speaking pattern');
      }
    } catch (error) {
      console.error('❌ [말투 설정] 저장 에러:', error);
      HapticService.error();
      throw error;
    }
  }, [user, persona, showNotificationMessage]);

  const handleSaveCreateMusic = async (music) => {
    // TODO: Implement music creation
  }
  
  // ⭐ NEW: Load chat history
  const loadChatHistory = useCallback(async (isLoadMore = false) => {
    if (__DEV__) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🔧 [HANDLER] loadChatHistory called @ ${Date.now()}`);
      console.log(`   isLoadMore: ${isLoadMore}`);
      console.log(`   loadingHistory: ${loadingHistory}`);
      console.log(`   historyOffset: ${historyOffset}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    }
    
    if (loadingHistory) {
      if (__DEV__) {
        console.log(`⚠️ [HANDLER] loadChatHistory: Already loading, skipping`);
      }
      return;
    }
    
    try {
      setLoadingHistory(true);
      const userKey = user?.user_key;
      const personaKey = persona?.persona_key || 'SAGE';
      
      if (!userKey) {
        if (__DEV__) {
          console.log(`⚠️ [HANDLER] loadChatHistory: User not logged in`);
        }
        console.log('user not login?')
        // ✅ FIX BUG 2, 3: showWelcomeMessage now handles its own loading states!
        setIsInitializing(true);
        setTimeout(() => {
          showWelcomeMessage();
          setLoadingHistory(false); // ✅ FIX: Move inside setTimeout for proper sequence!
        }, 2000);

        return;
      }
      
      if (__DEV__) {
        console.log(`🔧 [HANDLER] loadChatHistory: Fetching from API`);
        console.log(`   user_key: ${userKey?.substring(0, 8)}...`);
        console.log(`   persona_key: ${personaKey?.substring(0, 8)}...`);
        console.log(`   limit: ${isLoadMore ? CHAT_HISTORY.LOAD_MORE_LIMIT : CHAT_HISTORY.INITIAL_LIMIT}`);
        console.log(`   offset: ${isLoadMore ? historyOffset : 0}`);
      }
      
      const response = await chatApi.getChatHistory({
        user_key: userKey,
        persona_key: personaKey,
        limit: isLoadMore ? CHAT_HISTORY.LOAD_MORE_LIMIT : CHAT_HISTORY.INITIAL_LIMIT,
        offset: isLoadMore ? historyOffset : 0,
      });
      
      if (response.success && response.data.messages.length > 0) {
        // ✅ Use helper function to normalize messages
        const historyMessages = response.data.messages.map(normalizeMessage);
        
        if (isLoadMore) {
          // Prepend to existing messages
          setMessages(prev => [...historyMessages, ...prev]);
          setHistoryOffset(prev => prev + historyMessages.length);
        } else {
          // Initial load
          setMessages(historyMessages);
          setHistoryOffset(historyMessages.length);
          
          // ⚠️ DON'T auto-start if there's already conversation history
        }
        
        setHasMoreHistory(response.data.hasMore);
      } else {

        console.log('why not call here?')
        setIsLoading(true);
//        setIsTyping(true);
      
        if(persona?.default_yn != 'Y') {
          if(!persona.identity_key || persona.identity_key === '') {
            setIsInitializing(true);
          }else{
            setIsInitializing(false);
          }
        }else{
          setIsInitializing(false);
        }
        // ✅ FIX BUG 4: showWelcomeMessage now handles its own loading states!
        setTimeout(() => {
          setIsLoading(false);
          showWelcomeMessage();
        }, 1000);

      }
    } catch (error) {
      console.error('❌ [채팅 히스토리] 에러:', error);
      // ✅ FIX BUG 4 & 5: showWelcomeMessage now handles its own loading states!
      showWelcomeMessage();
    } finally {
      setLoadingHistory(false);
    }
  }, [user, persona, loadingHistory, historyOffset, showWelcomeMessage]); // ✅ FIXED BUG 3: Removed unused startAIConversation
  
  // 🎨 SMART BUBBLE: Show notification message (Fade-in effect!)
  const showNotificationMessage = useCallback((message, autoHideDuration = 2000) => {
    try {
      // ✨ Parse message (even short messages benefit from consistent UX)
      const { bubbles } = parseAIMessage({ message });
      
      // 🚀 Display bubbles sequentially using setTimeout chain
      let cumulativeDelay = 0;
      
      bubbles.forEach((bubble, index) => {
        cumulativeDelay += bubble.delay;
        
        setTimeout(() => {
          // Show loading between bubbles
          if (index > 0 && index < bubbles.length) {
            setIsLoading(true);
            setTimeout(() => {
              setIsLoading(false);
              
              const notificationMessage = {
                id: `notification-${Date.now()}-${index}`,
        role: 'assistant',
                text: bubble.text,
        timestamp: new Date().toISOString(),
              };
              
              setMessages(prev => [...prev, notificationMessage]);
              setMessageVersion(v => v + 1);
              
              // Auto-hide after duration (only for last bubble)
              if (autoHideDuration > 0 && index === bubbles.length - 1) {
                setTimeout(() => {
                  setMessages(prev => prev.filter(m => !m.id.startsWith('notification-')));
                }, autoHideDuration);
              }
            }, 50);
          } else {
            // First bubble - no loading
            const notificationMessage = {
              id: `notification-${Date.now()}-${index}`,
              role: 'assistant',
              text: bubble.text,
              timestamp: new Date().toISOString(),
            };
            
            setMessages(prev => [...prev, notificationMessage]);
            setMessageVersion(v => v + 1);
            
            // Auto-hide after duration (only for last bubble)
            if (autoHideDuration > 0 && index === bubbles.length - 1) {
              setTimeout(() => {
                setMessages(prev => prev.filter(m => !m.id.startsWith('notification-')));
              }, autoHideDuration);
            }
          }
        }, cumulativeDelay);
      });
    } catch (error) {
      console.error('❌ [showNotificationMessage] Error:', error);
      // Fallback: show simple message
      const fallbackMessage = {
        id: `notification-${Date.now()}`,
        role: 'assistant',
        text: message,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
      setMessageVersion(v => v + 1);
    }
  }, []);
  
  // 🎨 SMART BUBBLE: Show welcome message (Fade-in effect!)
  const showWelcomeMessage = useCallback(() => {
    try {
      // 🎭 Check if persona needs identity setup (user-created persona without identity)
      const needsIdentitySetup = persona && 
                                 !['573db390-a505-4c9e-809f-cc511c235cbb', 'af444146-e796-468c-8e2c-0daf4f9b9248'].includes(persona.persona_key) &&
                                 (!persona.identity_key || persona.identity_key === '');
      
      console.log('persona: ', persona);
      console.log('needsIdentitySetup: ', needsIdentitySetup);
      console.log('persona.identity_key: ', persona.identity_key);
      
      if (needsIdentitySetup) {
        // Show identity setup welcome message
        const identityGreeting = `안녕!😊\n나는 아직 자아가 없어서 너와 제대로 대화하기 어려워.\n내게 영혼을 불어넣어줄래?`;
        
        // ✨ Parse message
        const { bubbles } = parseAIMessage({ message: identityGreeting });
        
        const allMessages = [];
        let cumulativeDelay = 0;
        
        // 🚀 Display bubbles sequentially using setTimeout chain
        bubbles.forEach((bubble, index) => {
          cumulativeDelay += (bubble.delay - 500);
          
          setTimeout(() => {
            if (bubble.delay > 0 && index > 0) {
              setIsLoading(true);
              setTimeout(() => {
                setIsLoading(false);
                
                const greetingMessage = {
                  id: `greeting-identity-${Date.now()}-${index}`,
                  role: 'assistant',
                  text: bubble.text,
                  timestamp: new Date().toISOString(),
                };
                
                setMessages(prev => [...prev, greetingMessage]);
                setMessageVersion(v => v + 1);
              }, 1000);
            } else {
              const greetingMessage = {
                id: `greeting-identity-${Date.now()}-${index}`,
                role: 'assistant',
                text: bubble.text,
                timestamp: new Date().toISOString(),
              };
              
              setMessages(prev => [...prev, greetingMessage]);
              setMessageVersion(v => v + 1);
            }
          }, cumulativeDelay);
        });
        
        // Add button after all bubbles
        setTimeout(() => {
          const buttonMessage = {
            id: 'button-identity-start',
            role: 'button',
            text: '✨ 자아 입력 시작',
            timestamp: new Date().toISOString(),
            onPress: () => {
    HapticService.medium();
              setShowIdentityCreator(true);
            },
          };
          
          setMessages(prev => [...prev, buttonMessage]);
          setMessageVersion(v => v + 1);
        }, cumulativeDelay + 2000);
        
      } else {
        // Normal welcome message
        const greetingKey = 'managerAI.public';
        const greeting = t(greetingKey);
        
        // ✨ Parse message
        const { bubbles } = parseAIMessage({ message: greeting });
        
        let cumulativeDelay = 0;
        
        // 🚀 Display bubbles sequentially using setTimeout chain
        bubbles.forEach((bubble, index) => {
          cumulativeDelay += bubble.delay;
          
          setTimeout(() => {
            if (bubble.delay > 0 && index > 0) {
              setIsLoading(true);
              setTimeout(() => {
                setIsLoading(false);
                
                const greetingMessage = {
                  id: `greeting-${Date.now()}-${index}`,
                  role: 'assistant',
                  text: bubble.text,
      timestamp: new Date().toISOString(),
    };
    
                setMessages(prev => [...prev, greetingMessage]);
                setMessageVersion(v => v + 1);
              }, 50);
            } else {
              const greetingMessage = {
                id: `greeting-${Date.now()}-${index}`,
                role: 'assistant',
                text: bubble.text,
                timestamp: new Date().toISOString(),
              };
              
              setMessages(prev => [...prev, greetingMessage]);
              setMessageVersion(v => v + 1);
            }
          }, cumulativeDelay);
        });
      }
    } catch (error) {
      console.error('❌ [showWelcomeMessage] Error:', error);
      // Fallback: show simple welcome
      const fallbackMessage = {
        id: `greeting-${Date.now()}`,
        role: 'assistant',
        text: '안녕하세요! 😊',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
      setMessageVersion(v => v + 1);
    }
  }, [context, t, persona]);

  // 🎨 SMART BUBBLE: Show not-login message (Fade-in effect!)
  const showNotLoginMessage = useCallback(() => {
    try {
      const greeting = t('ai_comment.not_login');
      
      // ✨ Parse message
      const { bubbles } = parseAIMessage({ message: greeting });
      
      let cumulativeDelay = 0;
      
      // 🚀 Display bubbles sequentially using setTimeout chain
      bubbles.forEach((bubble, index) => {
        cumulativeDelay += bubble.delay;
        
        setTimeout(() => {
          if (bubble.delay > 0 && index > 0) {
    setIsLoading(true);
            setTimeout(() => {
              setIsLoading(false);
              
              const greetingMessage = {
                id: `not-login-${Date.now()}-${index}`,
                role: 'assistant',
                text: bubble.text,
                timestamp: new Date().toISOString(),
              };
              
              setMessages(prev => [...prev, greetingMessage]);
              setMessageVersion(v => v + 1);
            }, 50);
          } else {
            const greetingMessage = {
              id: `not-login-${Date.now()}-${index}`,
              role: 'assistant',
              text: bubble.text,
              timestamp: new Date().toISOString(),
            };
            
            setMessages(prev => [...prev, greetingMessage]);
            setMessageVersion(v => v + 1);
          }
        }, cumulativeDelay);
      });
    } catch (error) {
      console.error('❌ [showNotLoginMessage] Error:', error);
      // Fallback: show simple message
      const fallbackMessage = {
        id: `not-login-${Date.now()}`,
        role: 'assistant',
        text: t('ai_comment.not_login'),
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
      setMessageVersion(v => v + 1);
    }
  }, [context, t]);
  
  // 🎨 SMART BUBBLE: AI auto conversation starter (Fade-in effect!)
  // ⚠️ NOTE: Currently NOT USED - Function exists for potential future use
  // ⚠️ BUG 6: Dead Code - Consider removing if not needed
  const startAIConversation = useCallback((userKey) => {
    // ⚡ Show loading indicator
    setIsLoading(true);
    
    setTimeout(async () => {
      try {
      const response = await chatApi.sendManagerAIMessage({
          user_key: userKey,
          question: '[AUTO_START]', // Special marker for AI to start conversation
          persona_key: persona?.persona_key || null,
        });
        
        if (response.success && response.data?.answer) {
          const answer = response.data.answer;
          const richContent = response.data.rich_content || { images: [], videos: [], links: [] };
          
          // ✨ Parse AI message with Smart Bubble
          const { bubbles } = parseAIMessage(response.data);
          
          setIsLoading(false);
          
          let cumulativeDelay = 0;
          
          // 🚀 Display bubbles sequentially using setTimeout chain
          bubbles.forEach((bubble, index) => {
            cumulativeDelay += bubble.delay;
            
            setTimeout(() => {
              if (bubble.delay > 0 && index > 0) {
                setIsLoading(true);
                setTimeout(() => {
                  setIsLoading(false);
            
            const aiMessage = {
                    id: `ai-start-${Date.now()}-${index}`,
              role: 'assistant',
                    text: bubble.text,
              timestamp: new Date().toISOString(),
                    // ⭐ Rich media content (only on first bubble to avoid duplication)
                    images: index === 0 ? richContent.images : [],
                    videos: index === 0 ? richContent.videos : [],
                    links: index === 0 ? richContent.links : [],
            };
            
            setMessages(prev => [...prev, aiMessage]);
                  setMessageVersion(v => v + 1);
                }, 50);
      } else {
                const aiMessage = {
                  id: `ai-start-${Date.now()}-${index}`,
          role: 'assistant',
                  text: bubble.text,
          timestamp: new Date().toISOString(),
                  // ⭐ Rich media content (only on first bubble to avoid duplication)
                  images: index === 0 ? richContent.images : [],
                  videos: index === 0 ? richContent.videos : [],
                  links: index === 0 ? richContent.links : [],
                };
                
                setMessages(prev => [...prev, aiMessage]);
                setMessageVersion(v => v + 1);
              }
            }, cumulativeDelay);
          });
          
          // Check for continuation
          if (response.data.continue_conversation) {
            setTimeout(() => {
              handleAIContinue(userKey);
            }, cumulativeDelay + 800);
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ [채팅] 자동 시작 에러:', error);
        setIsLoading(false);
      }
    }, 800);
  }, [persona, chatApi]);
  
  // 🆕 Handle image selection
  const handleImageSelect = useCallback(async (imageData) => {
    // Normal image analysis mode
    // Store image temporarily
    setSelectedImage(imageData);
    
    // Success haptic feedback
    HapticService.success();
  }, []);
  
  // ⭐ NEW: Handle AI continuous conversation (✅ WITH CLEANUP SUPPORT)
  const handleAIContinue = useCallback(async (userKey) => {
    // ⭐ Check count using ref
    if (aiContinueCountRef.current >= AI_BEHAVIOR.MAX_CONTINUES) {
      setIsAIContinuing(false);
      aiContinueCountRef.current = 0; // Reset
      setIsLoading(false);
      return;
    }
    
    // 🛑 Check if timeout manager is cancelled (component closed)
    if (timeoutManagerRef.current?.isCancelledStatus()) {
      return; // Stop execution if component is closing
    }
    
    // ⭐ Increment count
    aiContinueCountRef.current += 1;
    
    setIsAIContinuing(true);
    setIsLoading(true);
    
    try {
      const response = await chatApi.sendManagerAIMessage({
        user_key: userKey,
        question: SPECIAL_MARKERS.CONTINUE, // Use constant
        persona_key: persona?.persona_key || null,
      });
      
      if (response.success && response.data?.answer) {
        const answer = response.data.answer;
        const richContent = response.data.rich_content || { images: [], videos: [], links: [] };
        
        // 🎯 NEW: Use smart bubble system (replaces typing animation)
        const aiMessage = await addAIMessageWithBubbles({
          answer,
          richContent,
          setIsTyping,
          setCurrentTypingText,
          setIsLoading,
          setMessages,
          timeoutManager: timeoutManagerRef.current,
        });
        
        // 🛑 Check if cancelled during typing
        if (!aiMessage) {
          return; // Component was closed during typing
        }
        
        // Check if AI wants to continue AGAIN
        if (response.data.continue_conversation) {
          // ⭐ Show TypingIndicator
          setIsLoading(true);
          
          // ✅ Use cancelable delay
          await cancelableDelay(TIMING.AI_CONTINUE_DELAY, timeoutManagerRef.current);
          
          // 🛑 Check if cancelled during delay
          if (timeoutManagerRef.current?.isCancelledStatus()) {
            return;
          }
          
          // Recursive call
          await handleAIContinue(userKey);
        } else {
          // Conversation ended
          setIsAIContinuing(false);
          aiContinueCountRef.current = 0; // ⭐ Reset ref
        }
      } else {
        setIsAIContinuing(false);
        aiContinueCountRef.current = 0; // ⭐ Reset ref
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error('[채팅] AI 이어말하기 에러:', error);
      setIsAIContinuing(false);
      aiContinueCountRef.current = 0; // ⭐ Reset ref
      setIsLoading(false);
    }
  }, [persona, chatApi]); // ⭐ Removed aiContinueCount from dependencies
  
  // ✅ Send message handler (✅ WITH CLEANUP SUPPORT)
  const handleSend = useCallback(async (text) => {
    if (__DEV__) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🔧 [HANDLER] handleSend called @ ${Date.now()}`);
      console.log(`   text length: ${text?.length}`);
      console.log(`   hasImage: ${!!selectedImage}`);
      console.log(`   current messages: ${messages.length}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    }
    
    HapticService.medium();
    
    // ✅ FIX BUG 1: Create Data URI for image metadata storage
    const imageDataUri = selectedImage 
      ? `data:${selectedImage.type};base64,${selectedImage.base64}`
      : null;
    
    // ✅ Use helper function to create user message
    const userMessage = createUserMessage(text, selectedImage);
    
    // Optimistic UI update
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    // 🎯 SIMPLE: Increment user message count (real-time conversation only)
    userMessageCountRef.current++;
    console.log(`📊 [handleSend] User message count: ${userMessageCountRef.current}`);
    
    try {
      const userKey = user?.user_key;
      
      // Check if user is logged in
      if (!userKey) {
        showNotLoginMessage();

        return;
      }
      
      // 💰 Check daily chat limit BEFORE sending to server!
      const limitCheck = checkLimit(userMessage.id);
      
      if (!limitCheck.allowed) {
        if (limitCheck.reason === 'loading') {
          // Already showed alert in checkLimit
          return;
        } else if (limitCheck.reason === 'limit_reached') {
          // Remove user message from UI (revert optimistic update)
          setMessages(prev => prev.filter(m => m.id !== userMessage.id));
          setIsLoading(false);
          
          // Show limit sheet
          showLimitReachedSheet(limitCheck.limitData);
          
          return; // ⚡ STOP! Don't send to server!
        }
      }
      
      // 🔍 DEBUG: Log API request parameters
      console.log('📤 [메시지 전송] 요청:', { persona: persona?.persona_key?.substring(0, 8) });
      
      const response = await chatApi.sendManagerAIMessage({
        user_key: userKey,
        question: text,
        persona_key: persona?.persona_key || null, // ⭐ NEW: Include persona_key
        // 🆕 Include image data if available
        image: selectedImage ? {
          uri: imageDataUri, // ✅ FIXED: Now properly defined!
          data: selectedImage.base64,
          mimeType: selectedImage.type,
        } : null,
      });
      
      // 🔍 DEBUG: Log raw server response
      console.log('📥 [메시지 전송] 응답:', {
        success: response.success,
        answerLength: response.data?.answer?.length || 0,
        hasEvolution: !!response.data?.identity_evolution
      });
      
      // 🆕 Clear selected image after sending
      setSelectedImage(null);
      
      if (response.success && response.data?.answer) {
        // ✅ Parse rich content (simplified with helper)
        const {
          answer,
          shouldContinue,
          richContent,
          musicData,
          youtubeData,
          identityEvolution,
          identityDraftPending,
        } = parseRichContent(response.data);
        
        // 😴 NEW (2026-01-13): Update emotion indicator
        if (response.data?.user_emotion?.primary) {
          setCurrentEmotion(response.data.user_emotion.primary);
          console.log('😴 [Emotion] Updated:', response.data.user_emotion.primary);
        }
        
        // 🔍 DEBUG: Log parsed content
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        // Core parsed content log (simplified)
        if (identityEvolution || richContent) {
          console.log('🔄 [파싱] 진화:', !!identityEvolution, '/ 미디어:', !!richContent);
        }
        
        // 🌟 Show identity evolution notification (ENHANCED for LIMITED MODE)
        if (identityEvolution) {
          // 🆕 NEW: Handle new structure { updates, metadata }
          const updates = identityEvolution.updates || identityEvolution; // Fallback for old structure
          const metadata = identityEvolution.metadata || {}; // New metadata object
          
          console.log('🌟 [자아 진화] 감지:', {
            updates: updates.length,
            break_conversation: metadata.break_conversation,
            required_fields: metadata.required_fields?.length || 0
          });
          
          // 🔒 [DEPRECATED 2026-01-08] LIMITED MODE chips initialization (Replaced by client-side identity creator)
          /* if (metadata.required_fields && metadata.required_fields.length > 0) {
            console.log('🔒 [LIMITED MODE] Initializing chips with', metadata.required_fields.length, 'fields');
            setRequiredFields(metadata.required_fields);
            setShowLimitedModeChips(true);
          }
          
          // 🆕 [DEPRECATED] Handle LIMITED MODE - Update required fields
          if (updates && updates.length > 0 && requiredFields.length > 0) {
            setRequiredFields(prev => {
              const updated = [...prev];
              updates.forEach(update => {
                const fieldIndex = updated.findIndex(f => f.field_name === update.field);
                if (fieldIndex !== -1) {
                  updated[fieldIndex] = { ...updated[fieldIndex], completed: true };
                  console.log(`   ✅ [LIMITED MODE] Field completed: ${update.field}`);
                }
              });
              
              const allCompleted = updated.every(f => f.completed);
              if (allCompleted) {
                console.log('🎉 [LIMITED MODE] All fields completed! Hiding chips...');
                timeoutManagerRef.current?.setTimeout(() => {
                  if (!timeoutManagerRef.current?.isCancelledStatus()) {
                    setShowLimitedModeChips(false);
                  }
                }, 3000);
              }
              
              return updated;
            });
          } */
          
          // Show evolution display (existing logic)
          if (updates && updates.length > 0) {
            const evolutions = Array.isArray(updates) ? updates : [updates];
            
            // Show each evolution sequentially with cleanup support
            evolutions.forEach((evolution, index) => {
              if (evolution && evolution.field && timeoutManagerRef.current) {
                
                timeoutManagerRef.current.setTimeout(() => {
                  // Check if still active
                  if (!timeoutManagerRef.current?.isCancelledStatus()) {
                    setIdentityEvolutionDisplay(evolution);
                    
                    // Auto-hide after duration
                    timeoutManagerRef.current?.setTimeout(() => {
                      if (!timeoutManagerRef.current?.isCancelledStatus()) {
                        console.log(`   👋 Hiding evolution ${index + 1}`);
                        setIdentityEvolutionDisplay(null);
                      }
                    }, IDENTITY_EVOLUTION.DISPLAY_DURATION);
                    
                    // Haptic feedback
                    HapticService.trigger('success');
                  } else {
                    console.log(`   ⚠️ Evolution ${index + 1} cancelled (timeout manager inactive)`);
                  }
                }, index * IDENTITY_EVOLUTION.INTERVAL);
              } else {
                console.log(`   ❌ Skipping evolution ${index + 1}:`, {
                  hasEvolution: !!evolution,
                  hasField: evolution?.field,
                  hasTimeoutManager: !!timeoutManagerRef.current,
                });
              }
            });
          }
          
          // 🆕 NEW: Handle break_conversation (LIMITED MODE enforcement)
          if (metadata.break_conversation) {
            console.log('🔒 [LIMITED MODE] AI requested conversation break (irrelevant response)');
            // Auto-close after 2 seconds (user can read AI message)
            timeoutManagerRef.current?.setTimeout(() => {
              if (!timeoutManagerRef.current?.isCancelledStatus()) {
                handleAutoClose();
              }
            }, 2000);
          }
        } else {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('⚠️  [handleSend] No Identity Evolution Data');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }
        
        // 🎭 NEW: Update pending identity draft state
        if (identityDraftPending) {
          setPendingIdentityDraft(identityDraftPending);
        }
        
        // 🎵 Haptic feedback for rich content
        if (musicData || youtubeData || richContent.images.length > 0) {
          HapticService.trigger('success');
        }
        
        // 🎯 NEW: Use smart bubble system (replaces typing animation)
        const aiMessage = await addAIMessageWithBubbles({
          answer,
          richContent,
          music: musicData,
          youtube: youtubeData,
          setIsTyping,
          setCurrentTypingText,
          setIsLoading,
          setMessages,
          timeoutManager: timeoutManagerRef.current,
        });
        
        // 🛑 Check if cancelled during typing
        if (!aiMessage) {
          return; // Component was closed during typing
        }
        
        // 💰 Update chat count after successful message
        incrementChatCount();
        
        // ⭐ Check if AI wants to continue talking
        if (shouldContinue) {
          // ⭐ Show TypingIndicator
          setIsLoading(true);
          
          // ✅ Use cancelable delay
          await cancelableDelay(TIMING.AI_CONTINUE_DELAY, timeoutManagerRef.current);
          
          // 🛑 Check if cancelled during delay
          if (timeoutManagerRef.current?.isCancelledStatus()) {
            return;
          }
          
          // Continue conversation
          await handleAIContinue(userKey);
        } else {
          aiContinueCountRef.current = 0; // ⭐ Reset counter
        }
        
      } else {
        // ✅ Use helper function for error message
        const errorMessage = createErrorMessage(t('errors.MANAGER_AI_ERROR'));
        setMessages(prev => [...prev, errorMessage]);
      }
      
    } catch (error) {
      console.error('[ManagerAIOverlay] Error:', error);
      
      if (__DEV__) {
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`❌ [HANDLER] handleSend ERROR @ ${Date.now()}`);
        console.log(`   error:`, error);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      }
      
      // ✅ Use helper function for error message
      const errorMessage = createErrorMessage(t('errors.MANAGER_AI_ERROR'));
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      
      if (__DEV__) {
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`✅ [HANDLER] handleSend COMPLETED @ ${Date.now()}`);
        console.log(`   final messages count: ${messages.length + 1}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      }
    }
  }, [t, user, persona, handleAIContinue, selectedImage, checkLimit, incrementChatCount, showLimitReachedSheet]); // ⭐ FIX: Add chat limit dependencies (removed requiredFields - DEPRECATED)
  
  // 🔒 NEW: Auto-close for LIMITED MODE (when AI requests conversation break)
  const handleAutoClose = useCallback(() => {
    console.log('🔒 [LIMITED MODE] Auto-closing chat (irrelevant user response)');
    // Call handleClose directly (triggers background learning)
    handleClose();
  }, [handleClose]);
  
  // 🎭 NEW: Handle identity save (ENHANCED with Optimistic Update + Background Sync)
  const handleIdentitySave = useCallback(async (identityData) => {
    console.log('🎭 [Identity Creator] Saving identity:', identityData);
    
    try {
      const userKey = user?.user_key;
      const personaKey = persona?.persona_key;
      
      if (!userKey || !personaKey) {
        throw new Error('User or persona key missing');
      }

      console.log('JK identityData: ', identityData);

      console.log('JK userKey: ', userKey);
      console.log('JK personaKey: ', personaKey);
      console.log('JK identityData: ', identityData);
      
      // ✅ Call personaApi.createPersonaIdentity (single API call!)
      const result = await createPersonaIdentity(
        userKey, 
        personaKey, identityData);
      
      if (result.success) {
        console.log('✅ [Identity Creator] Identity saved successfully');
        console.log('📦 [Identity Creator] API Response:', result.data);
        
        // 🎯 1️⃣ OPTIMISTIC UPDATE: 즉시 로컬 persona 업데이트
        // (사용자가 바로 채팅을 시작할 수 있도록)
        if (personaRef.current) {
          personaRef.current = {
            ...personaRef.current,
            identity_key: result.data?.identity_key || 'pending', // API 응답에서 받거나 임시 값
            identity_name: identityData.persona_name,
            identity_enabled: 'Y',
            speaking_style: identityData.speaking_style,
          };
          console.log('🚀 [Identity Creator] Optimistic update applied to personaRef');
          console.log('   identity_key:', personaRef.current.identity_key);
          console.log('   identity_name:', personaRef.current.identity_name);
        }
        
        // 🎯 2️⃣ BACKGROUND SYNC: PersonaContext 전체 동기화
        // (다른 컴포넌트들도 최신 데이터를 받을 수 있도록)
        setTimeout(async () => {
          try {
            console.log('🔄 [Identity Creator] Syncing PersonaContext in background...');
            await initializePersonas();
            console.log('✅ [Identity Creator] PersonaContext synced successfully');
          } catch (syncError) {
            console.error('⚠️ [Identity Creator] Context sync failed (non-critical):', syncError);
            // Non-critical error: User can still chat, but other components might have stale data
          }
        }, 500); // 0.5초 후 백그라운드에서 동기화
        
        // 🎯 3️⃣ UI UPDATE: Identity creator 닫기 및 상태 초기화
        setIsInitializing(false);
        setShowIdentityCreator(false); // ⭐ NEW: Identity Creator 자동 닫기
        
        setMessages([]);

        setIsLoading(true);
        setTimeout(() => {

          setIsLoading(false);
          // Show success message
          const personaName = identityData.persona_name || persona?.persona_name || '페르소나';
          showNotificationMessage(`🎉 ${personaName}의 영혼이 탄생했습니다! 이제 대화를 시작할게요!`, 2500);
        
        }, 2000);
 

      } else {
        throw new Error(result.error?.error_code || 'Failed to save identity');
      }
    } catch (error) {
      console.error('❌ [Identity Creator] Save error:', error);
      throw error; // PersonaIdentityCreatorView가 에러 처리
    }
  }, [user, persona, showNotificationMessage, initializePersonas]); // ⭐ initializePersonas 추가
  
  const handleClose = useCallback(() => {
    const closeCallId = Date.now();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🚪 [handleClose] CALLED - ID: ${closeCallId}`);
    console.log(`   isClosingRef.current: ${isClosingRef.current}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 🛡️ STEP 0: Prevent duplicate close calls (CRITICAL!)
    if (isClosingRef.current) {
      console.warn(`⚠️  [handleClose] Already closing, skip duplicate call! (ID: ${closeCallId})`);
      return;
    }
    isClosingRef.current = true; // 🔒 Lock
    console.log(`🔒 [handleClose] Lock acquired (ID: ${closeCallId})`);
    
    // 🔥 CRITICAL FIX: Use refs to get LATEST state (not closure values!)
    const currentMessages = messagesRef.current;
    const currentUser = userRef.current;
    const currentPersona = personaRef.current;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🚪 [handleClose] State Captured (ID: ${closeCallId})`);
    console.log(`   messages.length: ${currentMessages.length}`);
    console.log(`   user?.user_key: ${currentUser?.user_key?.substring(0, 8)}...`);
    console.log(`   persona?.persona_key: ${currentPersona?.persona_key?.substring(0, 8)}...`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // ⭐ NEW: Check if any UI is open, close that first (not the entire chat!)
    
    // 💰 PRIORITY 0: FloatingChatLimitButton Tooltip (HIGHEST PRIORITY!)
    if (isLimitTooltipOpen) {
      console.log(`🔓 [handleClose] Unlocking - Tooltip close only (ID: ${closeCallId})`);
      if (limitTooltipRef.current?.closeTooltip) {
        limitTooltipRef.current.closeTooltip();
      }
    HapticService.light();
      isClosingRef.current = false; // 🔓 Unlock
      return; // ⭐ Don't close chat!
    }
    
    // 🎛️ PRIORITY 1: Settings Menu
    if (isSettingsMenuOpen) {
      console.log(`🔓 [handleClose] Unlocking - Settings close only (ID: ${closeCallId})`);
      setIsSettingsMenuOpen(false);
      HapticService.light();
      isClosingRef.current = false; // 🔓 Unlock
      return; // ⭐ Don't close chat!
    }
    
    // 🎖️ PRIORITY 2: Tier Upgrade Sheet
    if (showTierUpgrade) {
      console.log(`🔓 [handleClose] Unlocking - Tier upgrade close only (ID: ${closeCallId})`);
      setShowTierUpgrade(false);
      HapticService.light();
      isClosingRef.current = false; // 🔓 Unlock
      return; // ⭐ Don't close chat!
    }
    
    // 🎭 PRIORITY 3: Identity Settings Sheet
    if (showIdentitySettings) {
      console.log(`🔓 [handleClose] Unlocking - Identity settings close only (ID: ${closeCallId})`);
      setShowIdentitySettings(false);
      HapticService.light();
      isClosingRef.current = false; // 🔓 Unlock
      return; // ⭐ Don't close chat!
    }
    
    // 🗣️ PRIORITY 4: Speaking Pattern Sheet
    if (showSpeakingPattern) {
      console.log(`🔓 [handleClose] Unlocking - Speaking pattern close only (ID: ${closeCallId})`);
      setShowSpeakingPattern(false);
      HapticService.light();
      isClosingRef.current = false; // 🔓 Unlock
      return; // ⭐ Don't close chat!
    }
    
    // 🎵 PRIORITY 5: Create Music Sheet
    if (showCreateMusic) {
      console.log(`🔓 [handleClose] Unlocking - Music sheet close only (ID: ${closeCallId})`);
      setShowCreateMusic(false);
      HapticService.light();
      isClosingRef.current = false; // 🔓 Unlock
      return; // ⭐ Don't close chat!
    }
    
    // ❓ PRIORITY 6: Help Sheet
    if (isHelpOpen) {
      console.log(`🔓 [handleClose] Unlocking - Help sheet close only (ID: ${closeCallId})`);
      setIsHelpOpen(false);
      HapticService.light();
      isClosingRef.current = false; // 🔓 Unlock
      return; // ⭐ Don't close chat!
    }
    
    // ⭐ If no UI is open, proceed with normal close logic
    
    // 🧹 Clear all UI states before closing
    setFloatingContent(null);
    setIsHelpOpen(false);
    setIsSettingsMenuOpen(false); // ✅ FIX: Reset settings menu state!
    setShowTierUpgrade(false); // ✅ FIX: Reset tier upgrade state!
    setIsInitializing(false);

    
    // 🆕 Helper function to trigger background learning
    const triggerBackgroundLearning = (capturedUser, capturedPersona) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎓 [ManagerAIOverlay] Trigger Background Learning');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // 🎯 SIMPLE: Check user message count from ref (real-time messages only)
      const userMessageCount = userMessageCountRef.current;
      
      console.log('   user message count (real-time):', userMessageCount);
      console.log('   user?.user_key:', capturedUser?.user_key);
      console.log('   persona?.persona_key:', capturedPersona?.persona_key);
      
      // 🔥 SIMPLE: Only trigger if user sent 3+ real-time messages
      // This AUTOMATICALLY excludes:
      // - History messages (not sent via handleSend)
      // - Welcome messages (not sent via handleSend)
      // - Notification messages (not sent via handleSend)
      // - Button clicks (not sent via handleSend)
      if (userMessageCount >= 3 && capturedUser?.user_key && capturedPersona?.persona_key) {
        const session_id = chatApi.getCurrentSessionId(capturedPersona.persona_key);
        
        console.log('   session_id:', session_id);
        
        // ✅ Check session_id is valid
        if (session_id && session_id !== 'undefined' && session_id !== 'null' && session_id !== '') {
          console.log(`✅ [ManagerAIOverlay] ${userMessageCount} messages sent → Calling closeChatSession...`);
          
          // Fire-and-forget (don't wait for result)
          chatApi.closeChatSession({
            user_key: capturedUser.user_key,
            persona_key: capturedPersona.persona_key,
            session_id: session_id,
          }).catch(err => {
            console.error('❌ [ManagerAIOverlay] Background learning failed:', err);
          });
        } else {
          console.warn('⚠️  [ManagerAIOverlay] Invalid session_id - skipping');
          console.warn('   - session_id:', session_id);
        }
      } else {
        console.warn('⚠️  [ManagerAIOverlay] Conditions not met for background learning');
        console.warn(`   - user message count >= 3: ${userMessageCount >= 3} (current: ${userMessageCount})`);
        console.warn('   - user?.user_key exists:', !!capturedUser?.user_key);
        console.warn('   - persona?.persona_key exists:', !!capturedPersona?.persona_key);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    };
    
    // ⭐ NEW: Prevent closing if AI is continuing conversation
    if (isAIContinuing || isLoading || isTyping) {
      console.log(`⚠️  [handleClose] AI is active, showing alert (ID: ${closeCallId})`);
      // ✅ FIXED: Restore showAlert with AnimaContext component
      showAlert({
        emoji: '💬',
        title: 'AI가 대화 중입니다',
        message: 'AI가 아직 답변을 완료하지 못했습니다.\n정말 채팅을 종료하시겠습니까?',
        buttons: [
          {
            text: '계속 대화하기',
            style: 'cancel',
            onPress: () => {
              console.log(`🔓 [handleClose] Unlocking - User canceled (ID: ${closeCallId})`);
              HapticService.light();
              isClosingRef.current = false; // 🔓 Unlock
            }
          },
          {
            text: '종료',
            style: 'destructive',
            onPress: () => {
              console.log(`🔴 [handleClose] Force closing during AI response (ID: ${closeCallId})`);
              // ✅ FIXED BUG 4: Removed duplicate initialization
              // Force stop AI conversation immediately
              setIsAIContinuing(false);
              setIsLoading(false);
              setIsTyping(false);
              
              // 🆕 Trigger background learning before closing
              triggerBackgroundLearning(currentUser, currentPersona);
              
              // Close overlay with haptic feedback
              HapticService.medium();
    Keyboard.dismiss();
    
              // 🧹 Unified cleanup in setTimeout
    setTimeout(() => {
                console.log(`🧹 [handleClose] Cleanup complete, unlocking (ID: ${closeCallId})`);
                // Reset all chat states
      setMessages([]);
                setCurrentTypingText('');
      setIsTyping(false);
                setIsLoading(false);
                setIsAIContinuing(false);
                aiContinueCountRef.current = 0;
                setCurrentPersonaKey(null);
                
                // 🎯 SIMPLE: Reset user message count for next session
                userMessageCountRef.current = 0;
                console.log(`🔄 [Chat Close] User message count reset to 0`);
                
                // Reset all sheet/modal states
                setIsSettingsMenuOpen(false);
                setShowTierUpgrade(false);
                setShowIdentitySettings(false);
                setShowSpeakingPattern(false);
                setShowCreateMusic(false);
                setShowIdentityCreator(false);
                setIsHelpOpen(false);
                setFloatingContent(null);
    
    if (onClose) {
      onClose();
    }
                
                // 🔓 Unlock after close
                isClosingRef.current = false;
                console.log(`🔓 [handleClose] Lock released (ID: ${closeCallId})`);
              }, 200); // ⚡ 200ms delay for Alert animation
            }
          }
        ]
      });
      console.log(`🔓 [handleClose] Unlocking - Early return for AI active (ID: ${closeCallId})`);
      isClosingRef.current = false; // 🔓 Unlock for alert case
      return; // ✅ CRITICAL FIX: Early exit to prevent triggerBackgroundLearning!
    }
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ FIXED BUG 4: Unified cleanup logic (removed duplicate initializations)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    console.log(`✅ [handleClose] Proceeding with normal close (ID: ${closeCallId})`);
    HapticService.light();
    Keyboard.dismiss();
    
    // 🔥 CRITICAL: Trigger background learning IMMEDIATELY with captured refs
    // This MUST happen before any async operations or component unmount!
    triggerBackgroundLearning(currentUser, currentPersona);
    
    // 🧹 Clear all states and close overlay
    // ⚠️ IMPORTANT: Delay onClose slightly to ensure background learning starts safely
    setTimeout(() => {
      console.log(`🧹 [handleClose] Normal cleanup complete, unlocking (ID: ${closeCallId})`);
      // Reset all chat states
      setMessages([]);
      setCurrentTypingText('');
      setIsTyping(false);
      setIsLoading(false);
      setIsAIContinuing(false);
      aiContinueCountRef.current = 0;
      setCurrentPersonaKey(null); // ⭐ CRITICAL FIX: Reset persona key to force reload on reopen
      
      // 🎯 SIMPLE: Reset user message count for next session
      userMessageCountRef.current = 0;
      console.log(`🔄 [Chat Close] User message count reset to 0`);
      
      // Reset all sheet/modal states
      setIsSettingsMenuOpen(false);
      setShowTierUpgrade(false);
      setShowIdentitySettings(false);
      setShowSpeakingPattern(false);
      setShowCreateMusic(false);
      setShowIdentityCreator(false);
      setIsHelpOpen(false);
      setFloatingContent(null);
      
      // 🚪 Close overlay AFTER state cleanup (prevents premature unmount)
      if (onClose) {
        onClose();
      }
      
      // 🔓 Unlock after close (allow new close calls)
      isClosingRef.current = false;
      console.log(`🔓 [handleClose] Lock released after normal close (ID: ${closeCallId})`);
    }, 50); // ⚡ Minimal delay (50ms) - enough for background learning to start
  }, [onClose, isAIContinuing, isLoading, isTyping, isLimitTooltipOpen, isSettingsMenuOpen, showTierUpgrade, showIdentitySettings, showSpeakingPattern, showCreateMusic, isHelpOpen]); // ✅ FIXED BUG 2: Removed handleClose from its own dependencies!
  

  const handleLimitFailed = useCallback((gameName, data) => {

    try{

      console.log(user);
      setTimeout(() => {

      if(Platform.OS === 'ios'){
        showOverlayAlert({
          title: t('game.limit_modal.title'),
          emoji: '🔒',
          message: 
          gameName === 'fortress' ? t('game.limit_modal.message', { tier: user?.user_level, count: data.daily_limit, time_until_reset: data.time_until_reset }) :
          gameName === 'tarot' ? t('game.limit_modal.tarot_message', { tier: user?.user_level, count: data.daily_limit, time_until_reset: data.time_until_reset }) :
          gameName === 'confession' ? t('game.limit_modal.confession_message', { tier: user?.user_level, count: data.daily_limit, time_until_reset: data.time_until_reset }) : '',
          buttons: [
            { text: t('common.cancel'), style: 'cancel', onPress: () => {} },
            { text: t('common.confirm'), style: 'primary', onPress: () => {
              onTierUpgrade();
              onClose();
            } }
          ]
        });
      }else{
        showAlert({
          title: t('game.limit_modal.title'),
          emoji: '🔒',
          message: 
          gameName === 'fortress' ? t('game.limit_modal.message', { tier: user?.user_level, count: data.daily_limit, time_until_reset: data.time_until_reset }) :
          gameName === 'tarot' ? t('game.limit_modal.tarot_message', { tier: user?.user_level, count: data.daily_limit, time_until_reset: data.time_until_reset }) :
          gameName === 'confession' ? t('game.limit_modal.confession_message', { tier: user?.user_level, count: data.daily_limit, time_until_reset: data.time_until_reset }) : '',
          buttons: [
            { text: t('common.cancel'), style: 'cancel', onPress: () => {} },
            { text: t('common.confirm'), style: 'primary', onPress: () => {
              onTierUpgrade();
              onClose();
            } }
          ]
        });
      }
    }, 100);

    }catch(error){
      console.log('❌ [ManagerAIOverlay] Limit failed:', error);
    }
  }, [t, user, showAlert, showOverlayAlert, onTierUpgrade, onClose]);

  const handleGameSelect = async (gameName) => {
  
    try{

      let canPlay = false;
      let status = '';

      setIsSettingsMenuOpen(false);

      const response = await gameApi.getGameStats({
        user_key: user.user_key,
        persona_key: persona.persona_key,
        game_type: 'fortress',
      });

      console.log('🎮 [ManagerAIOverlay] Game stats:', response);

      const limitCheck = await gameApi.checkGameLimit({
        user_key: user.user_key,
        game_type: gameName,
      });
      
      console.log('what gameName: ', gameName);
      console.log('limitCheck: ', limitCheck);

      if (limitCheck.success && limitCheck.data.can_play) {

        console.log('handleLimitSuccess Can play');
        canPlay = true;

      }

      if (response.success) {

        console.log(`✅ [Fortress] Stats loaded: ${response.data.record_text}`);
      }

      /*
      if(Platform.OS === 'ios'){

        onGameSelect(gameName);
        return;
      }
      */

      // 🎮 Game Images
      const gameImages = {
        fortress: persona?.selected_dress_image_url || persona?.original_url,
        tarot: 'https://babi-cdn.logbrix.ai/babi/real/babi/e832b7d9-4ff2-41f1-8c5f-0b08b055fe9d_00001_.png', // SAGE
        confession: 'https://babi-cdn.logbrix.ai/babi/real/babi/344c4082-0cbb-4271-bb85-c3762e1516b2_00001_.png', // NEXUS
      };
      
      // 🎮 Game Messages
      const gameMessages = {
        fortress: t('game.width_persona', { persona_name: persona.persona_name, status: '준비중' }),
        tarot: t('game.tarot_message'),
        confession: t('game.confession_message'),
      };

      console.log('gameImages[gameName]: ', gameImages[gameName]);

      if(Platform.OS === 'ios'){
        console.log('showOverlayAlert');
      showOverlayAlert({
        title: t('game.game_title'),
        image: gameImages[gameName] || gameImages.fortress,
        message: gameMessages[gameName] || gameMessages.fortress,
        buttons: [
          {
            text: t('common.cancel'),
            style: 'cancel',
            onPress: () => {
              console.log('❌ [ManagerAIOverlay] Game select cancelled');
            }
          },
          { 
          text: t('common.confirm'), 
          style: 'primary', 
          onPress: () => {
            if(canPlay){
              onGameSelect(gameName);
            }else{

              console.log('limitCheck.data: ', limitCheck.data);
              handleLimitFailed(gameName, limitCheck.data);
            }

          } }],
      });
      }else{

        console.log('showAlert');
        showAlert({
          title: t('game.game_title'),
          image: gameImages[gameName] || gameImages.fortress,
          message: gameMessages[gameName] || gameMessages.fortress,
          buttons: [
            {
              text: t('common.cancel'),
              style: 'cancel',
              onPress: () => {
                console.log('❌ [ManagerAIOverlay] Game select cancelled');
              }
            },
            { 
            text: t('common.confirm'), 
            style: 'primary', 
            onPress: () => {
              if(canPlay){
                onGameSelect(gameName);
              }else{

                console.log('limitCheck.data: ', limitCheck.data);
                handleLimitFailed(gameName, limitCheck.data);
              }

            } }],
        });
      }

    }catch(error){
      console.log('❌ [ManagerAIOverlay] Game select failed:', error);
    }
  };

  // 🔥 [RENDER LOG] Conditional rendering evaluation
  if (__DEV__) {
    console.log(`🎭 [RENDER] Evaluating sheet/modal rendering:`);
    console.log(`   visible: ${visible}`);
    console.log(`   showIdentitySettings: ${showIdentitySettings}`);
    console.log(`   showSpeakingPattern: ${showSpeakingPattern}`);
    console.log(`   showCreateMusic: ${showCreateMusic}`);
    console.log(`   showLimitSheet: ${showLimitSheet}`);
    console.log(`   showTierUpgrade: ${showTierUpgrade}`);
    console.log(`   isHelpOpen: ${isHelpOpen}`);
    console.log(`   showIdentityCreator: ${showIdentityCreator}`);
    console.log(`   showYouTubePlayer: ${showYouTubePlayer}`);
    console.log(`   floatingContent?.showPlayer: ${floatingContent?.showPlayer}`);
    console.log(`   identityEvolutionDisplay: ${!!identityEvolutionDisplay}`);
  }
  
  if (!visible) {
    if (__DEV__) {
      console.log(`🎭 [RENDER] NOT VISIBLE - returning null`);
    }
    return null;
  }
  
  return (
    <>
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleBackPress} // ⭐ FIX: Use unified back press handler!
    >
      {/* ✅ Simple Dark Background (No BlurView!) */}
      <View style={styles.container}>
        <View style={styles.backdrop} />
        
        {/* ✅ KeyboardAvoidingView (Stable & Simple) */}
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View
            style={[
              styles.contentContainer,
              {
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
              },
            ]}
          >
            {/* ✅ Header */}
            <View style={styles.header}>
              {/* 🆕 Left: Back Button */}
              <TouchableOpacity 
                onPress={handleClose}
                style={styles.backButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="chevron-back" size={moderateScale(18)} color={COLORS.TEXT_PRIMARY} />
              </TouchableOpacity>
              
              {/* Center: Persona Info */}
              <View style={styles.headerCenter}>
                <CustomText type="title" bold style={styles.headerTitle}>
                  {persona ? `${persona.persona_name}` : '💙 SAGE AI'}
                </CustomText>
                {false && (
                  <CustomText type="small" style={styles.headerSubtitle}>
                    {t('persona.identity.as', '자아')}: {persona.identity_name}
                  </CustomText>
                )}
            </View>
              {/* Help Icon */}
              <TouchableOpacity
                style={styles.helpButton}
                onPress={() => {
                  console.log('🔍 [ManagerAIOverlay] Help button pressed');
                  setIsHelpOpen(true);
                }}
                activeOpacity={0.7}
              >
                <IconSearch name="help-circle-outline" size={moderateScale(28)} color={currentTheme.textPrimary} />
              </TouchableOpacity>
              
            </View>
            
            {/* 🔒 [DEPRECATED 2026-01-08] LIMITED MODE Chips (Replaced by client-side identity creator) */}
            {/* {showLimitedModeChips && requiredFields.length > 0 && (
              <LimitedModeChips requiredFields={requiredFields} />
            )} */}
            
            {/* ✅ Chat Messages (Scrollable) */}
            <View style={styles.chatContainer}>
              <ChatMessageList
                completedMessages={messages}
                isTyping={isTyping} // ⚡ OPTIMIZED: Boolean flag only
                currentTypingText={currentTypingText} // ⚡ OPTIMIZED: Complete text (set once!)
                messageVersion={messageVersion} // 🎯 FIXED: Use state-managed version for Smart Bubble system
                isLoading={isLoading}
                onLoadMore={() => loadChatHistory(true)} // ⭐ NEW: Load more history
                loadingHistory={loadingHistory} // ⭐ NEW: Loading indicator
                hasMoreHistory={hasMoreHistory} // ⭐ NEW: Has more to load
                personaUrl={persona?.selected_dress_image_url || persona?.original_url}
                onMusicPress={handleMusicPress} // 🎵 NEW: Music playback handler
                onYouTubePress={handleYouTubePress} // 🎬 NEW: YouTube playback handler
              />
            </View>
            
            {/* 🆕 Image Preview (if selected) */}
            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <View style={styles.imagePreviewWrapper}>
                  <Image
                    source={{ uri: selectedImage.uri }}
                    style={styles.selectedImagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      setSelectedImage(null);
                      HapticService.light();
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon name="close-circle" size={moderateScale(28)} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                <CustomText type="small" style={styles.imagePreviewHint}>
                  📷 이미지와 함께 메시지를 보내세요
                </CustomText>
              </View>
            )}
            
            {/* 🎛️ NEW: Chat Settings Menu (Floating above input!) */}
            {isSettingsMenuOpen && !showIdentitySettings && !showSpeakingPattern && !showCreateMusic && (
              <View style={styles.settingsMenuContainer}>
                <View style={styles.settingsMenu}>
                  {/* 🧠 Brain Settings Section */}
                  <CustomText type='middle' bold style={styles.settingsMenuTitle}>
                    {t('ai_comment.brain_title')}
                  </CustomText>

                  {/* 🎭 자아 설정 */}
                  <TouchableOpacity
                    style={[styles.menuItem, {  }]}
                    onPress={() => {
                      handleToggleSettings('identity');
                      setIsSettingsMenuOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <CustomText type='middle' style={styles.menuIcon}>🧠</CustomText>
                    <CustomText type='middle' style={styles.menuText}>
                      {t('ai_comment.identity_setting_title')}
                    </CustomText>
                  </TouchableOpacity>
                  
                  {/* 🗣️ 말투 설정 (User-created personas only) {persona && !['573db390-a505-4c9e-809f-cc511c235cbb', 'af444146-e796-468c-8e2c-0daf4f9b9248'].includes(persona.persona_key) && ( */}
                  {persona && (
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {

                        if(persona.persona_key === '573db390-a505-4c9e-809f-cc511c235cbb' || persona.persona_key === 'af444146-e796-468c-8e2c-0daf4f9b9248') {
                          showAlert({
                            emoji: '⚠️',
                            title: t('speaking_pattern_sheet.warning.title'),
                            message: t('speaking_pattern_sheet.warning.description'),
                            buttons: [{ text: t('common.close'), style: 'primary', onPress: () => {} }],
                          });
                          return;
                        }
                        handleToggleSettings('speaking');
                        setIsSettingsMenuOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <CustomText type='middle' style={styles.menuIcon}>🗣️</CustomText>
                      <CustomText type='middle' style={styles.menuText}>
                        {t('ai_comment.speaking_setting_title')}
                      </CustomText>
                    </TouchableOpacity>
                  )}

                  {/* 🎮 NEW: Games Section */}
                  {persona && onGameSelect && (
                    <>
                      {/* 구분선 */}
                      <View style={styles.menuDivider} />

                      {/* 🎮 Games Title */}
                      <CustomText type='middle' bold style={styles.settingsMenuTitle}>
                        {t('game.game_title')}
                      </CustomText>

                      {/* 🏰 Fortress */}
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {

                          handleGameSelect('fortress');
//                          setIsSettingsMenuOpen(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <CustomText type='middle' style={styles.menuIcon}>🏰</CustomText>
                        <CustomText type='middle' style={styles.menuText}>
                          {t('game.fortress_title', { persona_name: persona.persona_name })}
                        </CustomText>
                      </TouchableOpacity>

                      {/* 🙏 Confession */}
                      <TouchableOpacity
                        style={styles.menuItem}
                        activeOpacity={0.7}
                        onPress={() => {
                          handleGameSelect('confession');
//                          setIsSettingsMenuOpen(false);
                        }}
                      >
                        <CustomText type='middle' style={styles.menuIcon}>🙏</CustomText>
                        <CustomText type='middle' style={styles.menuText}>
                          {t('game.confession_title')}
                        </CustomText>
                      </TouchableOpacity>

                      {/* 🔮 Tarot */}
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
//                          onGameSelect('tarot');
                          handleGameSelect('tarot');
//                          setIsSettingsMenuOpen(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <CustomText type='middle' style={styles.menuIcon}>🔮</CustomText>
                        <CustomText type='middle' style={styles.menuText}>
                          {t('game.tarot_title')}
                        </CustomText>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            )}
            
            {/* ✅ Chat Input Bar */}
            <View style={styles.inputContainer}>
              <ChatInputBar
                onSend={handleSend}
                onImageSelect={handleImageSelect} // 🆕 Image selection callback
                disabled={loadingServiceConfig || isLoading || isTyping || isAIContinuing || isInitializing} // ⭐ NEW: Disable when loading config or AI is continuing
                placeholder={
                  isInitializing ? t('chatBottomSheet.initializing') :
                    isLoading ? t('chatBottomSheet.loading') :
                    isTyping ? t('chatBottomSheet.ai_thinking') :
                  t('chatBottomSheet.placeholder')
                }
                onSettingsPress={() => setIsSettingsMenuOpen(prev => !prev)} // 🎛️ NEW: Toggle settings menu!
                onCreateMusic={handleCreateMusic} // 🆕 Create music callback
                onCreateMessage={handleCreateMessage} // 🆕 Create message callback
                visionMode={settings.vision_mode} // 🆕 Vision mode setting
                hasSelectedImage={!!selectedImage} // 🆕 FIX: Tell ChatInputBar if image is selected
                persona={persona} // 🗣️ NEW: Pass persona for speaking pattern visibility
                currentEmotion={currentEmotion} // 😴 NEW (2026-01-13): Real-time emotion indicator
              />
            </View>
            
            {/* 💰 NEW: Floating Chat Limit Button */}
            {serviceConfig && (
              <FloatingChatLimitButton
                currentCount={serviceConfig.dailyChatCount || 0}
                dailyLimit={serviceConfig.dailyChatLimit || 0}
                tier={user?.user_level || 'free'}
                isOnboarding={serviceConfig.isOnboarding || false}
                onUpgradePress={() => {
                  // ⭐ Open TierUpgradeSheet directly
                  HapticService.light();
                  setShowTierUpgrade(true);
                }}
                onBuyPointPress={() => {
                  console.log('💰 [ManagerAIOverlay] Buy point button pressed');
                  // TODO: Navigate to Buy Point Sheet
                }}
                onTooltipVisibilityChange={setIsLimitTooltipOpen} // ⭐ NEW: Track tooltip state for back button
                tooltipVisibleRef={limitTooltipRef} // ⭐ NEW: Access closeTooltip function
              />
            )}
          </View>
        </KeyboardAvoidingView>
      
      {/* 🎵 NEW: Floating YouTube Music Player (Overlay, does NOT push chat) */}
      {floatingContent?.contentType === 'music' && 
       floatingContent?.track?.source === 'youtube' && 
       floatingContent?.track?.videoId && 
       floatingContent?.showPlayer && (  // ✅ Only mount when showPlayer is true
        <HiddenYoutubePlayer
          videoId={floatingContent.track.videoId}
          isPlaying={floatingContent.isPlaying}
          visible={true}  // Always visible when mounted (animation on mount)
          topPosition={insets.top + verticalScale(52)} // Header height
          onClose={handleMusicClose} // ⭐ NEW: Close button handler
          onStateChange={(state) => {
            // Handle state changes if needed
            if (state === 'ended') {
              // Music ended, close player
              handleMusicClose();
            }
          }}
          onError={(error) => {
            console.error('❌ [YouTube Player] Error:', error);
            Alert.alert(
              '재생 오류',
              '음악 재생 중 오류가 발생했습니다.',
              [{ text: '확인' }]
            );
          }}
        />
      )}
      
      {/* 🎬 NEW: Mini YouTube Video Player (Overlay, 100% identical position to Music!) */}
      {showYouTubePlayer && currentVideo?.videoId && (
        <MiniYoutubeVideoPlayer
          videoId={currentVideo.videoId}
          title={currentVideo.title}
          onClose={handleYouTubeClose}
          topPosition={insets.top + verticalScale(52)} // ⭐ 100% identical to HiddenYoutubePlayer!
          visible={true}
        />
      )}
      
      {/* 🌟 Identity Evolution Notification Overlay */}
      {identityEvolutionDisplay && (
        <IdentityEvolutionOverlay evolution={identityEvolutionDisplay} />
      )}
      
      </View>
    </Modal>
    
    {/* 🎭 Identity Settings Sheet (Independent Modal - Outside ManagerAIOverlay Modal) */}
    {user && (
    <IdentitySettingsSheet
      isOpen={showIdentitySettings}
      onClose={() => setShowIdentitySettings(false)}
      settings={settings}
      onUpdateSetting={updateSetting}
      loading={loadingSettings}
      saving={savingSettings}
    />
    )}
    
    {/* 🗣️ Speaking Pattern Sheet (Independent Modal - Outside ManagerAIOverlay Modal) */}
    {user && persona && !['573db390-a505-4c9e-809f-cc511c235cbb', 'af444146-e796-468c-8e2c-0daf4f9b9248'].includes(persona.persona_key) && (
      <SpeakingPatternSheet
        isOpen={showSpeakingPattern}
        onClose={() => setShowSpeakingPattern(false)}
        personaKey={persona.persona_key}
        personaName={persona.persona_name}
        userKey={user.user_key}
        onSave={handleSaveSpeakingPattern}
      />
    )}

    {/* 🎵 Create Music Sheet (Independent Modal - Outside ManagerAIOverlay Modal) */}
    {user && persona && (
    <CreateMusicSheet
      isOpen={showCreateMusic}
      onClose={() => setShowCreateMusic(false)}
      personaKey={persona.persona_key}
      personaName={persona.persona_name}
      userKey={user.user_key}
      onSave={handleSaveCreateMusic}
    />
    )}
    
    {/* 💰 NEW: Chat Limit Sheet (Independent Modal - Outside ManagerAIOverlay Modal) */}
    {limitReachedData && (
      <ChatLimitSheet
        isOpen={showLimitSheet}
        onClose={() => setShowLimitSheet(false)}
        tier={limitReachedData.tier}
        limit={limitReachedData.limit}
        resetTime={limitReachedData.resetTime}
        canUpgrade={limitReachedData.tier !== 'ultimate'}
        onUpgrade={() => {
          setShowLimitSheet(false);
          // ⭐ Open TierUpgradeSheet
          setShowTierUpgrade(true);
        }}
        isOnboarding={limitReachedData.isOnboarding}
      />
    )}
    
    {/* 🎖️ NEW: Tier Upgrade Sheet (Independent Modal - Outside ManagerAIOverlay Modal) */}
    {user && (
      <TierUpgradeSheet
        isOpen={showTierUpgrade}
        onClose={() => setShowTierUpgrade(false)}
        currentTier={user.user_level || 'basic'}
        userKey={user.user_key}
        onUpgradeSuccess={(newTier) => {
          console.log('✅ [ManagerAIOverlay] Tier upgraded to:', newTier);
          // ⭐ Reload service config to update chat limits
          // (This will be handled by useChatLimit hook on next render)

        }}
      />
    )}
    
    {/* 🎬 Chat Help Sheet (Independent Modal - Outside ManagerAIOverlay Modal) */}
    { isHelpOpen && (
      <ChatHelpSheet
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    )}
    
    {/* 🎭 NEW: Identity Creator View (Covers entire chat area) */}
    {showIdentityCreator && (
      <PersonaIdentityCreatorView
        visible={showIdentityCreator}
        onClose={() => {
          // Close identity creator and close entire chat
          setShowIdentityCreator(false);
          setTimeout(() => {
            onClose?.();
          }, 200);
        }}
        onSave={async (identityData) => {
          // Save identity to server
          await handleIdentitySave(identityData);
          // Close identity creator
          setShowIdentityCreator(false);
        }}
        personaName={persona?.persona_name || '페르소나'}
        showAlert={showAlert}
      />
    )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)', // Simple dark background
  },
  keyboardView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Header
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: platformPadding(16),
    paddingVertical: platformPadding(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.2)',
    backgroundColor: COLORS.DEEP_BLUE_DARK,
    marginTop: Platform.OS === 'ios' ? 0 : -30,
  },
  backButton: {
    padding: scale(8),
    marginRight: scale(8),
    paddingLeft: scale(0),
  },
  headerCenter: {
    flex: 1,
    alignItems: 'flex-start',
    marginLeft: scale(-10),
  },
  headerTitle: {
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: COLORS.TEXT_SECONDARY,
    marginTop: verticalScale(2),
    opacity: 0.7,
    textAlign: 'center',
    fontSize: moderateScale(11),
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Chat
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  chatContainer: {
    flex: 1,
    paddingHorizontal: platformPadding(20),
    paddingTop: platformPadding(10),



  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Input
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  inputContainer: {
    paddingHorizontal: platformPadding(0),
    paddingTop: platformPadding(10),
    marginBottom: Platform.OS === 'ios' ? -10 : -50,
  },
  
  // 🆕 Image Preview
  imagePreviewContainer: {
    paddingHorizontal: moderateScale(15),
    paddingVertical: verticalScale(10),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  imagePreviewWrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedImagePreview: {
    width: moderateScale(120),
    height: moderateScale(120),
  },
  removeImageButton: {
    position: 'absolute',
    top: moderateScale(4),
    right: moderateScale(4),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: moderateScale(14),
  },
  imagePreviewHint: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: verticalScale(8),
    fontSize: moderateScale(12),
  },
  
  // 🌟 Identity Evolution Overlay Styles
  evolutionOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? '17%' : '10%',
    left: '3%',
    transform: [{ translateX: -scale(120) }, { translateY: -verticalScale(50) }],
    width: scale(200),
    height: verticalScale(100),
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: moderateScale(16),
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.6)', // Purple glow
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 9999,
  },
  evolutionIcon: {
    fontSize: Platform.OS === 'ios' ? moderateScale(16) : moderateScale(20),
    marginBottom: verticalScale(8),
  },
  evolutionText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    letterSpacing: 0.5,
  },
  helpButton: {
    marginRight: platformPadding(40),
    padding: platformPadding(8),
    display: 'none',


  },
  settingsMenuContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? verticalScale(100) : verticalScale(70), // Above input bar!
    left: platformPadding(0),
    right: platformPadding(0),
    paddingHorizontal: platformPadding(10),
    zIndex: 1000, // Float above everything!
  },
  settingsMenu: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(4),
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  settingsMenuTitle: {
    marginLeft: moderateScale(12),
    marginTop: verticalScale(8),
    marginBottom: verticalScale(8),
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: moderateScale(18),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
    marginHorizontal: moderateScale(4),
  },
  menuIcon: {
    fontSize: moderateScale(18),
    marginRight: moderateScale(8),
  },
  menuText: {
    color: '#FFF',
    fontSize: moderateScale(15),
  },
  // 🎮 NEW: Disabled menu item styles
  menuItemDisabled: {
    opacity: 0.4,
  },
  menuIconDisabled: {
    opacity: 0.5,
  },
  menuTextDisabled: {
    color: '#888',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: verticalScale(8),
    marginHorizontal: moderateScale(12),
  },
  
});

export default memo(ManagerAIOverlay);
