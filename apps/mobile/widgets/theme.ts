// Widget-safe subset of the app's design tokens (lib/design-system/tokens.ts).
// RemoteViews text only supports fonts bundled as Android assets — the
// config plugin (see app.json's react-native-android-widget entry) copies
// these two families in from assets/fonts, named to match here.
export const widgetColors = {
  canvas: '#fcfcfb',
  surface: '#ffffff',
  text: '#201f1d',
  muted: '#7d7979',
  divider: '#eae7e7',
  accent: '#b68235',
  accentStrong: '#a06f24',
  accentSoft: '#fbf5ec',
} as const;

export const widgetFonts = {
  heading: 'CormorantGaramond_600SemiBold',
  body: 'Lora_400Regular',
  bodyMedium: 'Lora_600SemiBold',
} as const;
