import { Pressable } from 'react-native';

import { cn } from '@/lib/cn';

import { Text } from './text';

type ChipProps = {
  label: string;
  /** `action`: texto cobalto sin borde. `outline`: píldora con borde de tinta. */
  kind?: 'action' | 'outline';
  onPress?: () => void;
  className?: string;
};

export function Chip({ label, kind = 'action', onPress, className }: ChipProps) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      hitSlop={6}
      accessibilityRole={onPress ? 'button' : undefined}
      className={cn('min-h-[44px] justify-center active:opacity-60', kind === 'outline' && 'self-start rounded-full border border-ink px-4', className)}>
      <Text variant="label" className={kind === 'action' ? 'text-accent' : 'text-ink'}>
        {label}
      </Text>
    </Pressable>
  );
}
