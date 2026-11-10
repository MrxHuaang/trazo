import { Switch, View } from 'react-native';

import { color } from '@/theme';

import { Text } from './text';

type ToggleRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onChange: (valor: boolean) => void;
};

export function ToggleRow({ label, description, value, onChange }: ToggleRowProps) {
  return (
    <View className="flex-row items-center gap-3 py-2">
      <View className="flex-1 gap-0.5">
        <Text variant="bodyMedium">{label}</Text>
        {description ? (
          <Text variant="caption" className="text-ink-soft">
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: color.accent, false: color.line }}
        thumbColor={color.surface}
      />
    </View>
  );
}
