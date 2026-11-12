import { EmptyState, Screen, Text } from '@/ui';

type PlaceholderScreenProps = {
  title: string;
  emptyTitle: string;
  emptyBody: string;
};

/** Pantalla provisional mientras se construye el módulo en su sprint. */
export function PlaceholderScreen({ title, emptyTitle, emptyBody }: PlaceholderScreenProps) {
  return (
    <Screen>
      <Text variant="display" accessibilityRole="header">
        {title}
      </Text>
      <EmptyState title={emptyTitle} body={emptyBody} />
    </Screen>
  );
}
