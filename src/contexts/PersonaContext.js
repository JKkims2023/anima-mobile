/**
 * PersonaContext - Persona state management (isolated)
 * 
 * Features:
 * - Manager AI default setup
 * - Persona list management (API integrated)
 * - Selected persona tracking
 * - Real-time persona data
 * 
 * @author JK & Hero AI
 * @date 2024-11-21
 * @updated 2024-11-21 - API integration
 */

import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { getPersonaList } from '../services/api/personaApi';
import { useUser } from '../contexts/UserContext';

const PersonaContext = createContext();

// ✅ Hardcoded user_key for development
const DEV_USER_KEY = '5e3ee6dd-7809-4f04-9cee-cc32bfaf0512';

export const PersonaProvider = ({ children }) => {
  const [personas, setPersonas] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState('sage'); // 'sage' | 'persona'
  const { user } = useUser();
  
  // ⭐ FIX: initializePersonas MUST depend on 'user' to avoid closure capture
  const initializePersonas = useCallback(async () => {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎭 [PersonaContext] initializePersonas called');
      console.log('👤 [PersonaContext] user:', user ? user.user_id : 'null');
      console.log('🔑 [PersonaContext] user_key:', user ? user.user_key : 'null');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      setIsLoading(true);

      // ✅ Manager AI (SAGE) - Always first
      const managerAI = {
        persona_key: 'MANAGER_AI',
        persona_name: 'SAGE',
        persona_type: 'manager',
        persona_url: null,
        isManager: true,
        selected_dress_video_url: 'https://babi-cdn.logbrix.ai/babi/real/babi/46fb3532-e41a-4b96-8105-a39e64f39407_00001_.mp4',
        created_at: new Date().toISOString(),
      };

      // ✅ Fetch user's personas from API (only if user exists)
      try {
        if (!user || !user.user_key) {
          console.log('⚠️  [PersonaContext] No user logged in, using empty persona list');
          setPersonas([]);
          setIsLoading(false);
          return;
        }

        console.log('🔍 [PersonaContext] Fetching personas for user_key:', user.user_key);
        
        const userPersonas = await getPersonaList(user.user_key);
        
        console.log('✅ [PersonaContext] User personas loaded:', userPersonas.length);

        // ✅ Combine: Manager AI first, then user personas
        const allPersonas = [
         // managerAI,
          ...userPersonas.map(p => ({
            ...p,
            isManager: false,
          }))
        ];

        console.log('✅ [PersonaContext] Total personas:', allPersonas.length);
        console.log('📊 [PersonaContext] Names:', allPersonas.map(p => p.persona_name).join(', '));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        setPersonas(allPersonas);
      } catch (apiError) {
        console.error('❌ [PersonaContext] API error:', apiError);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        // Fallback: Empty array
        setPersonas([]);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('❌ [PersonaContext] Initialization error:', error);
      setIsLoading(false);
    }
  }, [user]); // ⭐ FIX: Add 'user' dependency!

  useEffect(() => {
    initializePersonas();
  }, [initializePersonas]); // ⭐ FIX: Depend on initializePersonas, not user

  /**
   * Switch between SAGE mode and Persona mode
   * - SAGE mode: SAGE only (rendered separately)
   * - Persona mode: User personas only (rendered separately, no SAGE)
   */
  const switchMode = useCallback(() => {
    if (mode === 'sage') {
      // Switch to Persona mode
      if (personas.length > 1) {
        // Has personas: switch to persona mode
        setMode('persona');
        setSelectedIndex(0); // ✅ First persona (no SAGE in PersonaSwipeViewer)
        
        if (__DEV__) {
          console.log('[PersonaContext] 🔄 Switched to Persona mode');
        }
      } else {
        // No personas: stay in SAGE mode
        if (__DEV__) {
          console.log('[PersonaContext] ⚠️ No personas available. Stay in SAGE mode.');
        }
        // TODO: Show create persona message
      }
    } else {
      // Switch to SAGE mode
      setMode('sage');
      setSelectedIndex(0); // ✅ Index doesn't matter for SAGE mode
      
      if (__DEV__) {
        console.log('[PersonaContext] 🔄 Switched to SAGE mode');
      }
    }
  }, [mode, personas.length]);

  const selectedPersona = personas[selectedIndex] || null;

  // ✅ Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    personas,
    setPersonas,
    selectedIndex,
    setSelectedIndex,
    selectedPersona,
    isLoading,
    mode,
    switchMode,
  }), [personas, selectedIndex, selectedPersona, isLoading, mode, switchMode, setPersonas, setSelectedIndex]);

  return (
    <PersonaContext.Provider value={value}>
      {children}
    </PersonaContext.Provider>
  );
};

// Custom hook for easy access
export const usePersona = () => {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error('usePersona must be used within PersonaProvider');
  }
  return context;
};

export default PersonaContext;

