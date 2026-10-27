import { createContext, Fragment, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';
import { secureStoreAdapter } from '@/lib/auth/session';
import { colors, palettes } from '@/lib/design-system/tokens';

export type ThemePref = 'auto' | 'light' | 'dark';

// Client-only preference (mirrors features/privacy/photoBlur.ts).
const KEY = 'preemietrack.theme';

const ThemeContext = createContext<{
  pref: ThemePref;
  scheme: 'light' | 'dark';
  setPref: (pref: ThemePref) => void;
}>({ pref: 'auto', scheme: 'light', setPref: () => {} });

const setNative = (scheme: 'light' | 'dark' | 'unspecified') => {
  if (Platform.OS !== 'web') Appearance.setColorScheme(scheme);
};

export const useTheme = () => useContext(ThemeContext);

// Mounted once at the root. The scheme is derived here (react-native-web ignores
// Appearance.setColorScheme); the native call keeps Switch/keyboard/alerts in step.
// `colors` is swapped in place during render; navigators wrap their screens in
// ThemedScreen so each screen remounts and re-reads `colors.x`.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>('auto');
  const system = useColorScheme();
  const scheme = (pref === 'auto' ? system : pref) === 'dark' ? 'dark' : 'light';
  Object.assign(colors, palettes[scheme]);

  useEffect(() => {
    secureStoreAdapter
      .getItem(KEY)
      .then((raw) => {
        if (raw === 'light' || raw === 'dark') {
          setPrefState(raw);
          setNative(raw);
        }
      })
      .catch(() => {});
  }, []);

  const setPref = useCallback((next: ThemePref) => {
    setPrefState(next);
    setNative(next === 'auto' ? 'unspecified' : next);
    secureStoreAdapter.setItem(KEY, next).catch(() => {});
  }, []);

  return (
    <ThemeContext.Provider value={{ pref, scheme, setPref }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Use as a navigator's `screenLayout`. Remounts the screen (not the navigator,
// which would reset navigation back to `/`) when the scheme flips.
export function ThemedScreen({ children }: { children: ReactNode }) {
  return <Fragment key={useTheme().scheme}>{children}</Fragment>;
}
