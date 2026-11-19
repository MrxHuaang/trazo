import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { tabBarInset } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  /** Lo que flota fuera del scroll, como el Fab. */
  overlay?: ReactNode;
};

/** El padding inferior extra deja libre el Fab además de la barra de pestañas. */
export function Screen({ children, overlay }: ScreenProps) {
  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
        <ScrollView
          contentContainerClassName="gap-3 px-5 pt-4"
          contentContainerStyle={{ paddingBottom: tabBarInset + 96 }}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </SafeAreaView>
      {overlay}
    </View>
  );
}
