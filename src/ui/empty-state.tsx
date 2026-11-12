import { StyleSheet, View } from 'react-native';

import { color, space } from '@/theme';

import { Text } from './text';
import { TraceLine } from './trace-line';

type EmptyStateProps = {
  title: string;
  body: string;
};

/** Estado vacío: el Trazo casi plano dice "aquí está tranquilo". */
export function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <TraceLine height={32} agitation={0.35} calmFrom={0.2} />
      <Text variant="heading">{title}</Text>
      <Text variant="body" tone={color.inkSoft}>
        {body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm, paddingVertical: space.xxl },
});
