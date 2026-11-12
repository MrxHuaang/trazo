import { useState, type ComponentProps } from 'react';
import { TextInput, View } from 'react-native';

import { cn } from '@/lib/cn';
import { color } from '@/theme';

import { Text } from './text';

type FieldProps = ComponentProps<typeof TextInput> & {
  label: string;
  error?: string;
  helper?: string;
  className?: string;
};

/** Campo de texto: etiqueta arriba, ayuda y error abajo (nunca placeholder como etiqueta). */
export function Field({ label, error, helper, className, multiline, onFocus, onBlur, ...rest }: FieldProps) {
  const [enfocado, setEnfocado] = useState(false);
  return (
    <View className="gap-1.5">
      <Text variant="label">{label}</Text>
      <TextInput
        placeholderTextColor={color.inkSoft}
        accessibilityLabel={label}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        onFocus={(e) => {
          setEnfocado(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setEnfocado(false);
          onBlur?.(e);
        }}
        className={cn(
          'min-h-[50px] rounded-field border bg-surface px-4 py-3 font-body text-[16px] text-ink',
          multiline && 'min-h-[120px]',
          error ? 'border-danger' : enfocado ? 'border-accent' : 'border-line',
          className,
        )}
        {...rest}
      />
      {error ? (
        <Text variant="caption" className="text-danger">
          {error}
        </Text>
      ) : helper ? (
        <Text variant="caption" className="text-ink-soft">
          {helper}
        </Text>
      ) : null}
    </View>
  );
}
