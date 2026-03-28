import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed } from '@angular/core';
import { db } from '@storee/data-access-db';

interface SettingsState {
  pin_hash: string | null;
  language: string;
  theme: 'light' | 'dark';
  loaded: boolean;
}

export const SettingsStore = signalStore(
  { providedIn: 'root' },
  withState<SettingsState>({ pin_hash: null, language: 'en', theme: 'light', loaded: false }),
  withComputed(({ pin_hash }) => ({
    hasPIN: computed(() => !!pin_hash()),
  })),
  withMethods((store) => ({
    async load(): Promise<void> {
      const rows = await db.settings.toArray();
      const map: Record<string, string> = {};
      for (const row of rows) map[row.key] = row.value;
      patchState(store, {
        pin_hash: map['pin_hash'] ?? null,
        language: map['language'] ?? navigator.language.split('-')[0] ?? 'en',
        theme: (map['theme'] as 'light' | 'dark') ?? 'light',
        loaded: true,
      });
    },

    async set(key: string, value: string): Promise<void> {
      await db.settings.put({ key, value });
      patchState(store, { [key]: value } as Partial<SettingsState>);
    },

    async setTheme(theme: 'light' | 'dark'): Promise<void> {
      await db.settings.put({ key: 'theme', value: theme });
      patchState(store, { theme });
      document.documentElement.classList.toggle('dark', theme === 'dark');
    },

    async setLanguage(lang: string): Promise<void> {
      await db.settings.put({ key: 'language', value: lang });
      patchState(store, { language: lang });
    },
  })),
);
