import React, { createContext, useContext, useState, useEffect } from 'react';

type AiProvider = 'groq' | 'bedrock';

interface SettingsContextType {
  aiProvider: AiProvider;
  setAiProvider: (provider: AiProvider) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [aiProvider, setAiProvider] = useState<AiProvider>(() => {
    const saved = localStorage.getItem('aiProvider');
    return (saved as AiProvider) || 'groq';
  });

  useEffect(() => {
    localStorage.setItem('aiProvider', aiProvider);
  }, [aiProvider]);

  return (
    <SettingsContext.Provider value={{ aiProvider, setAiProvider }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
