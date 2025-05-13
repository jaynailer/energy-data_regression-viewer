import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RegressionTypeContextType {
  showSimple: boolean;
  setShowSimple: (value: boolean) => void;
}

const RegressionTypeContext = createContext<RegressionTypeContextType | undefined>(undefined);

export function RegressionTypeProvider({ children }: { children: ReactNode }) {
  const [showSimple, setShowSimple] = useState(false);

  return (
    <RegressionTypeContext.Provider value={{ showSimple, setShowSimple }}>
      {children}
    </RegressionTypeContext.Provider>
  );
}

export function useRegressionType() {
  const context = useContext(RegressionTypeContext);
  if (context === undefined) {
    throw new Error('useRegressionType must be used within a RegressionTypeProvider');
  }
  return context;
}