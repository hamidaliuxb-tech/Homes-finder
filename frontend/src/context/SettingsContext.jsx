import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { getCachedSettings, setCachedSettings, fetchWithRetry } from "@/lib/cache";

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  // Initialize with cached settings immediately so UI is never blank
  const [settings, setSettings] = useState(() => getCachedSettings());

  const load = async () => {
    try {
      const res = await fetchWithRetry(() => api.get("/settings"), 2, 2000);
      if (res && res.data) {
        setSettings(res.data);
        setCachedSettings(res.data);
      }
    } catch {
      // Retain existing cached settings on cold start error
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, reload: load }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
