// "Classical" editorial theme — Cormorant Garamond headings over Lora body,
// a warm near-white ground, and a single gold accent applied as stroke/text
// rather than fill. See the imported Claude Design system for the full spec.
export const colors = {
  canvas: '#f3f2f2',
  surface: '#faf8f6',
  text: '#201f1d',
  muted: '#7d7979',
  faint: '#9b9797',
  line: '#eae7e7',
  divider: 'rgba(32,31,29,0.16)',
  accent: '#b68235',
  accentStrong: '#a06f24',
  accentDeep: '#7d5411',
  accentSoft: '#fff3e4',
  ring: 'rgba(32,31,29,0.35)',
  // Legacy tone names kept so existing call sites (`tone="pink"`, etc.) keep
  // compiling — the design system is deliberately monochrome, so every tone
  // now resolves to the same gold accent rather than a distinct hue.
  pink: '#a06f24',
  pinkSoft: '#fff3e4',
  violet: '#a06f24',
  violetSoft: '#fff3e4',
  blue: '#a06f24',
  blueSoft: '#fff3e4',
  yellow: '#a06f24',
  yellowSoft: '#fff3e4',
  orange: '#a06f24',
  orangeSoft: '#fff3e4',
  green: '#a06f24',
  greenSoft: '#fff3e4',
  graySoft: '#f8f4f4',
  white: '#faf8f6',
  danger: '#9e3526',
} as const;
// Screen background gradient — the design tints the whole app subtly by the
// baby's sex (a soft blush or a soft blue) fading into the same warm ground.
export const screenGradient = {
  girl: ['#fbe6e0', '#f9f0ec', '#faf8f6'] as const,
  boy: ['#e2ecf6', '#f6f2ee', '#faf8f6'] as const,
  locations: [0, 0.32, 0.6] as const,
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
