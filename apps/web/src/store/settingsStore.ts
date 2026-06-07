import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserSettings } from '@cleartrail/shared';
import { DEFAULT_USER_SETTINGS } from '@cleartrail/shared';

interface SettingsState extends UserSettings {
  setSettings: (settings: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_USER_SETTINGS,
      setSettings: (settings) => set((state) => ({ ...state, ...settings })),
      resetSettings: () => set(DEFAULT_USER_SETTINGS),
    }),
    { name: 'cleartrail-settings' }
  )
);
