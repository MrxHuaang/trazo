import { View } from 'react-native';

import { Text } from './text';
import { TraceLine } from './trace-line';

type EmptyStateProps = {
  title: string;
  body: string;
};

/** El Trazo va casi plano: vacío también es calma. */
export function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <View className="gap-2 py-6">
      <TraceLine height={32} agitation={0.35} calmFrom={0.2} />
      <Text variant="heading">{title}</Text>
      <Text variant="body" className="text-ink-soft">
        {body}
      </Text>
    </View>
  );
}
