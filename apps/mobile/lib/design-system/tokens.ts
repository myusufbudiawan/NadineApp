import { Platform } from 'react-native';

export const colors = {
  canvas: '#FFFFFF',
  text: '#25242B',
  muted: '#7D7B84',
  line: '#EEEAF0',
  pink: '#FF6D8D',
  pinkSoft: '#FFF0F3',
  violet: '#9B6BD2',
  violetSoft: '#F1E9FB',
  blue: '#31BFC8',
  blueSoft: '#E6F8F9',
  yellow: '#FFB52E',
  yellowSoft: '#FFF6DF',
  orange: '#FF835D',
  orangeSoft: '#FFF0EA',
  green: '#25AF83',
  greenSoft: '#E8F8F2',
  graySoft: '#F6F6F8',
  white: '#FFFFFF',
  danger: '#C5354F',
} as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;
export const type = {
  body: 16,
  caption: 13,
  label: 14,
  title: 24,
  display: 30,
  font: Platform.select({ ios: 'System', android: 'sans-serif' }),
} as const;
export const shadow = Platform.select({
  ios: {
    shadowColor: '#372738',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 2 },
})!;
