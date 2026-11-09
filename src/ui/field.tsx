import type { ComponentProps } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { color, font, radius, space } from '@/theme';

import { Text } from './text';

type FieldProps = ComponentProps<typeof TextInput> & {
  label: string;
  error?: string;
  helper?: string;
};

/** Campo de texto: etiqueta arriba, ayuda y error abajo (nunca placeholder como etiqueta). */
export function Field({ label, error, helper, style, multiline, ...rest }: FieldProps) {
  return (
    <View style={styles.wrap}>
      <Text variant="label" tone={color.ink}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={color.inkSoft}
        accessibilityLabel={label}
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline, !!error && styles.inputError, style]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" tone={color.danger}>
          {error}
        </Text>
      ) : helper ? (
        <Text variant="caption" tone={color.inkSoft}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  input: {
    minHeight: 50,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    fontFamily: font.body,
    fontSize: 16,
    color: color.ink,
  },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  inputError: { borderColor: color.danger },
});
