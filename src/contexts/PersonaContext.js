/**
 * PersonaContext - Persona state management (isolated)
 * 
 * Features:
 * - Manager AI default setup
 * - Persona list management
 * - Selected persona tracking
 */

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const PersonaContext = createContext();

export const PersonaProvider = ({ children }) => {
  const [personas, setPersonas] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize with Manager AI on first launch
  useEffect(() => {
    initializePersonas();
  }, []);

  const initializePersonas = useCallback(async () => {
    try {
      // Manager AI default data
      const managerAI = {
        persona_key: 'MANAGER_AI',
        persona_name: 'SAGE',
        persona_type: 'manager',
        persona_url: null, // Will use video/image later
        isManager: true,
        // For future API integration
        created_at: new Date().toISOString(),
      };

      // Check if we have existing personas (from API later)
      // For now, just set Manager AI
      setPersonas([managerAI]);
      setIsLoading(false);
    } catch (error) {
      console.error('[PersonaContext] Initialization error:', error);
      setIsLoading(false);
    }
  }, []);

  const selectedPersona = personas[selectedIndex] || null;

  const value = {
    personas,
    setPersonas,
    selectedIndex,
    setSelectedIndex,
    selectedPersona,
    isLoading,
  };

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

