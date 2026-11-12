import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { View } from 'react-native';

import { color, space, tabBarInset } from '@/theme';

import { Presionable } from './presionable';
import { Text } from './text';

type FabProps = {
  label: string;
  onPress: () => void;
};

/** Botón flotante principal (único en la pantalla): píldora en tinta con círculo cobalto. */
export function Fab({ label, onPress }: FabProps) {
  return (
    <View pointerEvents="box-none" className="absolute left-5 right-5" style={{ bottom: tabBarInset + space.lg }}>
      <Presionable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        contentClassName="h-14 flex-row items-center justify-between rounded-full bg-ink pl-6 pr-2"
        contentStyle={{ boxShadow: '0 10px 24px rgba(35, 64, 224, 0.22)' }}>
        <Text variant="bodyMedium" className="text-accent-on">
          {label}
        </Text>
        <View className="h-10 w-10 items-center justify-center rounded-full bg-accent">
          <PlusIcon size={20} color={color.onAccent} weight="bold" />
        </View>
      </Presionable>
    </View>
  );
}
