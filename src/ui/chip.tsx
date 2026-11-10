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
      hitSlop={10}
      accessibilityRole={onPress ? 'button' : undefined}
      className={cn('active:opacity-60', kind === 'outline' && 'rounded-full border border-ink px-3 py-[3px]', className)}>
      <Text variant="label" className={kind === 'action' ? 'text-accent' : 'text-ink'}>
        {label}
      </Text>
    </Pressable>
  );
}
