import { StyleSheet, Switch, View } from 'react-native';

import { color, space } from '@/theme';

import { Text } from './text';

type ToggleRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onChange: (valor: boolean) => void;
};

export function ToggleRow({ label, description, value, onChange }: ToggleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text variant="bodyMedium">{label}</Text>
        {description ? (
          <Text variant="caption" tone={color.inkSoft}>
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

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  text: { flex: 1, gap: 2 },
});
