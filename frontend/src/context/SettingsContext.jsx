import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/apiClient";

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);

  const load = async () => {
    try {
      const res = await api.get("/settings");
      setSettings(res.data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, reload: load }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
