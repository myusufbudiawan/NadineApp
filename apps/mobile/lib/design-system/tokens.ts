// "Classical" editorial theme — Cormorant Garamond headings over Lora body,
// a warm near-white ground, and a single gold accent applied as stroke/text
// rather than fill. See the imported Claude Design system for the full spec.
const palette = (c: {
  canvas: string; surface: string; text: string; muted: string; faint: string; line: string;
  divider: string; accent: string; accentStrong: string; accentDeep: string; accentSoft: string;
  ring: string; graySoft: string; white: string; danger: string;
}) => ({
  ...c,
  // Legacy tone names kept so existing call sites (`tone="pink"`, etc.) keep
  // compiling — the design system is deliberately monochrome, so every tone
  // resolves to the same gold accent rather than a distinct hue.
  pink: c.accentStrong, violet: c.accentStrong, blue: c.accentStrong,
  yellow: c.accentStrong, orange: c.accentStrong, green: c.accentStrong,
  pinkSoft: c.accentSoft, violetSoft: c.accentSoft, blueSoft: c.accentSoft,
  yellowSoft: c.accentSoft, orangeSoft: c.accentSoft, greenSoft: c.accentSoft,
});

export const palettes = {
  light: palette({
    canvas: '#fcfcfb',
    surface: '#ffffff',
    text: '#201f1d',
    muted: '#7d7979',
    faint: '#9b9797',
    line: '#eae7e7',
    divider: 'rgba(32,31,29,0.16)',
    accent: '#b68235',
    accentStrong: '#a06f24',
    accentDeep: '#7d5411',
    accentSoft: '#fbf5ec',
    ring: 'rgba(32,31,29,0.35)',
    graySoft: '#f7f6f6',
    white: '#ffffff',
    danger: '#9e3526',
  }),
  dark: palette({
    canvas: '#141312',
    surface: '#1e1d1b',
    text: '#f1efec',
    muted: '#a29e9a',
    faint: '#7d7976',
    line: '#34312f',
    divider: 'rgba(241,239,236,0.18)',
    accent: '#d4a24f',
    accentStrong: '#dcae5f',
    accentDeep: '#e8c27f',
    accentSoft: '#2e2518',
    ring: 'rgba(241,239,236,0.4)',
    graySoft: '#262523',
    white: '#1e1d1b',
    danger: '#e0705f',
  }),
};

// Mutable on purpose: ThemeProvider swaps the active palette in place and
// remounts the tree, so the ~50 files reading `colors.x` at render need no change.
export const colors: Record<keyof typeof palettes.light, string> = { ...palettes.light };

// Screen background gradient — the design tints the whole app subtly by the
// baby's sex (a soft blush or a soft blue) fading into the canvas.
export const screenGradient = {
  girl: ['#f6c3b6', '#f9ddd1', '#fcfcfb'] as const,
  boy: ['#b9d5f0', '#dbe9f6', '#fcfcfb'] as const,
  locations: [0, 0.32, 0.6] as const,
};
export const darkGradient = {
  girl: ['#4a2a28', '#2e1f1e', '#141312'] as const,
  boy: ['#23364d', '#1b2530', '#141312'] as const,
};
export const space = { xs: 5, sm: 9, md: 14, lg: 18, xl: 28, xxl: 37 } as const;
export const radius = { sm: 2, md: 4, lg: 7, pill: 999 } as const;
export const type = {
  body: 15,
  caption: 12,
  label: 14,
  title: 26,
  display: 32,
  fontHeading: 'CormorantGaramond_600SemiBold',
  fontBody: 'Lora_400Regular',
  fontBodyMedium: 'Lora_600SemiBold',
} as const;
export const shadow = {
  shadowColor: '#2d2b2b',
  shadowOpacity: 0.14,
  shadowRadius: 2,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
} as const;
