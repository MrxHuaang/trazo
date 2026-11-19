import { EmptyState, Screen, Text } from '@/ui';

type PlaceholderScreenProps = {
  title: string;
  emptyTitle: string;
  emptyBody: string;
};

/** Provisional para las rutas que todavía no tienen pantalla. */
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
