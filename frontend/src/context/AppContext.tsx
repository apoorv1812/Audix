import React, { createContext, useContext, useState, ReactNode } from 'react';

type AppState = 'idle' | 'uploading' | 'processing' | 'results';

interface AppContextType {
  appState: AppState;
  setAppState: (state: AppState) => void;
  progress: number;
  setProgress: (progress: number) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  results: any | null;
  setResults: (results: any | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [appState, setAppState] = useState<AppState>('idle');
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<any | null>(null);

  return (
    <AppContext.Provider value={{ appState, setAppState, progress, setProgress, file, setFile, results, setResults }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
