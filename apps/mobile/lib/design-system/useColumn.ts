import { Platform, useWindowDimensions } from 'react-native';
import { layout } from '@/lib/design-system/tokens';

// The app targets phones; the browser is the one surface with room to spare.
// Everything that has to know "how wide is my column" asks here, so the shell,
// the scroll containers and the tab bar agree on one measurement.
//
// Below the wide breakpoint the column simply fills the viewport (the native
// case too, where `isWide` is always false).
export function useColumn() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWide = isWeb && width >= layout.wideBreakpoint;
  return {
    isWeb,
    isWide,
    maxWidth: isWide ? layout.columnMaxWide : isWeb ? layout.columnMax : undefined,
    gutter: isWide ? layout.gutterWide : layout.gutter,
  } as const;
}
