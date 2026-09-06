import { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { BottomTabBar } from './BottomTabBar';
import { colors } from '@/lib/design-system/tokens';
export function TabScreen({ children }: PropsWithChildren) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
        {children}
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}
