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
  const [selectedPersona, setSelectedPersona] = useState(null); // ⭐ NEW: Direct persona storage
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState('sage'); // 'sage' | 'persona'
  const { user } = useUser();
  
  // ⚡ PERFORMANCE FIX: Only depend on user_key, not entire user object
  // This prevents unnecessary re-creation of initializePersonas
  const userKey = user?.user_key; // Extract user_key for stable dependency
  
  const initializePersonas = useCallback(async () => {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎭 [PersonaContext] initializePersonas called');
      console.log('🔑 [PersonaContext] user_key:', userKey);
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
        /*
        if (!userKey) {
          console.log('⚠️  [PersonaContext] No user logged in, using empty persona list');
          setPersonas([]);
          setIsLoading(false);
          return;
        }
        */


        const userPersonas = await getPersonaList(userKey != null ? userKey : 'empty');
        
       // console.log('✅ [PersonaContext] User personas loaded:', userPersonas.length);

        // ✅ Combine: Manager AI first, then user personas
        const allPersonas = [
         // managerAI,
          ...userPersonas.map(p => ({
            ...p,
            isManager: false,
          }))
        ];

       /*
        console.log('✅ [PersonaContext] Total personas:', allPersonas.length);
        console.log('📊 [PersonaContext] Names:', allPersonas.map(p => p.persona_name).join(', '));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        */
        setPersonas(allPersonas);
        setIsLoading(false);
        
        // ✅ FIX: Return latest personas for immediate access!
        return allPersonas;
      } catch (apiError) {
        console.error('❌ [PersonaContext] API error:', apiError);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        // Fallback: Empty array
        setPersonas([]);
        setIsLoading(false);
        return [];
      }
    } catch (error) {
      console.error('❌ [PersonaContext] Initialization error:', error);
      setIsLoading(false);
      return [];
    }
  }, [userKey]); // ⚡ CRITICAL FIX: Only depend on userKey, not entire user object!

  // ⚡ PERFORMANCE FIX: Only initialize once on mount + when user changes
  // DO NOT depend on initializePersonas itself to avoid infinite loops!
  useEffect(() => {
    initializePersonas();
  }, [user?.user_key]); // ⭐ CRITICAL FIX: Only depend on user_key, not entire user or initializePersonas!

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
         // console.log('[PersonaContext] 🔄 Switched to Persona mode');
        }
      } else {
        // No personas: stay in SAGE mode
        if (__DEV__) {
         // console.log('[PersonaContext] ⚠️ No personas available. Stay in SAGE mode.');
        }
        // TODO: Show create persona message
      }
    } else {
      // Switch to SAGE mode
      setMode('sage');
      setSelectedIndex(0); // ✅ Index doesn't matter for SAGE mode
      
      if (__DEV__) {
       // console.log('[PersonaContext] 🔄 Switched to SAGE mode');
      }
    }
  }, [mode, personas.length]);

  // ⭐ FIX: Use direct selectedPersona state (set by PersonaStudioScreen)
  // Fallback to personas[selectedIndex] if not set
  // 🔥 CRITICAL FIX: Memoize effectivePersona to maintain stable reference
  const effectivePersona = useMemo(() => {
    const result = selectedPersona || personas[selectedIndex] || null;
    
    if (__DEV__ && result) {
      console.log('🎭 [PersonaContext] effectivePersona calculated:', {
        source: selectedPersona ? 'direct' : 'from_array',
        persona_name: result.persona_name,
        persona_key: result.persona_key,
        done_yn: result.done_yn,
        identity_key: result.identity_key,
      });
    }
    
    return result;
  }, [selectedPersona, personas, selectedIndex]); // ⚡ Keep original dependencies (safest approach)

  // 🔍 DEBUG: Log selectedPersona changes
  useEffect(() => {
    /*
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎭 [PersonaContext] selectedPersona changed');
    console.log('   Index:', selectedIndex);
    console.log('   Direct Persona:', selectedPersona ? selectedPersona.persona_name : 'null');
    console.log('   Effective Persona:', effectivePersona ? effectivePersona.persona_name : 'null');
    console.log('   persona_key:', effectivePersona?.persona_key);
    console.log('   identity_name:', effectivePersona?.identity_name);
    console.log('   identity_enabled:', effectivePersona?.identity_enabled);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    */
  }, [selectedPersona, effectivePersona, selectedIndex]);

  // ✅ Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    personas,
    setPersonas,
    selectedIndex,
    setSelectedIndex,
    selectedPersona: effectivePersona, // ⭐ FIX: Use effectivePersona
    setSelectedPersona, // ⭐ NEW: Expose setSelectedPersona
    isLoading,
    mode,
    switchMode,
    initializePersonas, // ⭐ NEW: Expose initializePersonas for manual refresh
  }), [personas, selectedIndex, effectivePersona, isLoading, mode, switchMode, setPersonas, setSelectedIndex, setSelectedPersona, initializePersonas]);

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

