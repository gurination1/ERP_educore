import React, { createContext, useContext, useState, useEffect } from 'react';

export type CampusId = 'campus_01' | 'campus_02' | 'all';

export interface CampusContextType {
  selectedCampus: CampusId;
  setSelectedCampus: (campus: CampusId) => void;
}

const STORAGE_KEY = 'educore_active_campus';

const CampusContext = createContext<CampusContextType>({
  selectedCampus: 'campus_01',
  setSelectedCampus: () => {},
});

export const CampusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCampus, setSelectedCampusState] = useState<CampusId>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'campus_01' || stored === 'campus_02' || stored === 'all') {
        return stored;
      }
    } catch (_) {}
    return 'campus_01';
  });

  const setSelectedCampus = (campus: CampusId) => {
    setSelectedCampusState(campus);
    try {
      localStorage.setItem(STORAGE_KEY, campus);
    } catch (_) {}
  };

  return (
    <CampusContext.Provider value={{ selectedCampus, setSelectedCampus }}>
      {children}
    </CampusContext.Provider>
  );
};

export const useCampus = () => useContext(CampusContext);
