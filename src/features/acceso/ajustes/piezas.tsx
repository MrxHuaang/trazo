/**
 * Piezas de la pantalla de ajustes. Solo las usa este módulo, por eso no viven en src/ui.
 */
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { color, radius, space, type TextVariant } from '@/theme';
import { Button, Field, Text } from '@/ui';

/* ---------- Sección ---------- */

export function Seccion({ titulo, nota, children }: { titulo: string; nota?: string; children: ReactNode }) {
  return (
    <View style={styles.seccion}>
      <View style={styles.seccionTitulo}>
        <Text variant="heading" accessibilityRole="header">
          {titulo}
        </Text>
        {nota ? (
          <Text variant="caption" tone={color.inkSoft}>
            {nota}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/* ---------- Valor editable en línea ---------- */

type ValorEditableProps = {
  etiqueta: string;
  /** Texto que se muestra (ya formateado). */
  valor: string;
  /** Texto cuando el valor está vacío. */
  vacio?: string;
  variante?: TextVariant;
  abierto: boolean;
  onAbrir: () => void;
  ultimo?: boolean;
  editor: Omit<EditorEnLineaProps, 'etiqueta'>;
};

/** Fila que muestra un dato y, al tocarla, se convierte en un campo con Guardar y Cancelar. */
export function ValorEditable({ etiqueta, valor, vacio, variante = 'bodyMedium', abierto, onAbrir, ultimo, editor }: ValorEditableProps) {
  if (abierto) {
    return (
      <View style={[styles.fila, !ultimo && styles.divisor]}>
        <EditorEnLinea etiqueta={etiqueta} {...editor} />
      </View>
    );
  }
  const texto = valor || vacio || '';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${etiqueta}: ${texto}`}
      accessibilityHint="Toca para editar"
      onPress={onAbrir}
      style={({ pressed }) => [styles.fila, styles.filaFila, !ultimo && styles.divisor, pressed && styles.presionado]}>
      <View style={styles.cuerpo}>
        <Text variant="caption" tone={color.inkSoft}>
          {etiqueta}
        </Text>
        <Text variant={variante} tone={valor ? color.ink : color.inkSoft}>
          {texto}
        </Text>
      </View>
      <PencilSimpleIcon size={18} color={color.inkSoft} />
    </Pressable>
  );
}

/* ---------- Editor en línea ---------- */

type EditorEnLineaProps = {
  etiqueta: string;
  inicial: string;
  /** Da formato mientras se escribe (p. ej. pesos con puntos de miles). */
  formatear?: (texto: string) => string;
  /** Devuelve el mensaje de error o null. */
  validar: (texto: string) => string | null;
  guardar: (texto: string) => Promise<unknown>;
  onCerrar: () => void;
  helper?: string;
  campo?: Omit<ComponentProps<typeof Field>, 'label' | 'value' | 'onChangeText' | 'error' | 'helper'>;
};

export function EditorEnLinea({ etiqueta, inicial, formatear, validar, guardar, onCerrar, helper, campo }: EditorEnLineaProps) {
  const [texto, setTexto] = useState(inicial);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const confirmar = async () => {
    const mensaje = validar(texto);
    if (mensaje) {
      setError(mensaje);
      return;
    }
    setGuardando(true);
    try {
      await guardar(texto);
      onCerrar();
    } catch {
      setError('No pudimos guardar el cambio. Intenta de nuevo.');
      setGuardando(false);
    }
  };

  return (
    <View style={styles.editor}>
      <Field
        label={etiqueta}
        value={texto}
        onChangeText={(t) => {
          setTexto(formatear ? formatear(t) : t);
          if (error) setError(null);
        }}
        error={error ?? undefined}
        helper={helper}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={() => void confirmar()}
        {...campo}
      />
      <View style={styles.editorAcciones}>
        <Button label="Cancelar" variant="ghost" size="sm" onPress={onCerrar} style={styles.botonCompacto} />
        <Button
          label="Guardar"
          variant="accent"
          size="sm"
          loading={guardando}
          onPress={() => void confirmar()}
          style={styles.botonCompacto}
        />
      </View>
    </View>
  );
}

/* ---------- Acceso a otra pantalla ---------- */

type FilaEnlaceProps = {
  icono: ReactNode;
  titulo: string;
  detalle?: string;
  marca?: ReactNode;
  onPress: () => void;
  ultimo?: boolean;
};

export function FilaEnlace({ icono, titulo, detalle, marca, onPress, ultimo }: FilaEnlaceProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={detalle ? `${titulo}. ${detalle}` : titulo}
      onPress={onPress}
      style={({ pressed }) => [styles.fila, styles.filaFila, !ultimo && styles.divisor, pressed && styles.presionado]}>
      <View style={styles.icono}>{icono}</View>
      <View style={styles.cuerpo}>
        <View style={styles.tituloFila}>
          <Text variant="bodyMedium">{titulo}</Text>
          {marca}
        </View>
        {detalle ? (
          <Text variant="caption" tone={color.inkSoft} numberOfLines={1}>
            {detalle}
          </Text>
        ) : null}
      </View>
      <CaretRightIcon size={18} color={color.inkSoft} />
    </Pressable>
  );
}

/* ---------- Acción con confirmación en el mismo lugar ---------- */

type AccionConfirmadaProps = {
  icono: ReactNode;
  titulo: string;
  detalle: string;
  /** Explica qué pasa al confirmar. */
  aviso: string;
  confirmar: string;
  destructiva?: boolean;
  abierta: boolean;
  onAbrir: () => void;
  onCerrar: () => void;
  onConfirmar: () => void;
  cargando?: boolean;
  error?: string | null;
  ultimo?: boolean;
};

/**
 * Fila de acción que, al tocarla, muestra la confirmación justo debajo (sin diálogos del sistema,
 * que en web no existen). Las acciones destructivas usan el tono de error.
 */
export function AccionConfirmada({
  icono, titulo, detalle, aviso, confirmar, destructiva, abierta, onAbrir, onCerrar, onConfirmar, cargando, error, ultimo,
}: AccionConfirmadaProps) {
  const tono = destructiva ? color.danger : color.ink;
  return (
    <View style={!ultimo && styles.divisor}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={titulo}
        accessibilityHint={detalle}
        accessibilityState={{ expanded: abierta }}
        disabled={abierta}
        onPress={onAbrir}
        style={({ pressed }) => [styles.fila, styles.filaFila, pressed && styles.presionado]}>
        <View style={[styles.icono, destructiva && styles.iconoPeligro]}>{icono}</View>
        <View style={styles.cuerpo}>
          <Text variant="bodyMedium" tone={tono}>
            {titulo}
          </Text>
          <Text variant="caption" tone={color.inkSoft}>
            {detalle}
          </Text>
        </View>
      </Pressable>
      {abierta ? (
        <View style={[styles.confirmacion, destructiva && styles.confirmacionPeligro]} accessibilityLiveRegion="polite">
          <Text variant="body" tone={destructiva ? color.danger : color.ink}>
            {aviso}
          </Text>
          {error ? (
            <Text variant="label" tone={color.danger}>
              {error}
            </Text>
          ) : null}
          <View style={styles.confirmacionAcciones}>
            <Button label="Cancelar" variant="secondary" onPress={onCerrar} disabled={cargando} style={styles.flex} />
            <Button
              label={confirmar}
              variant={destructiva ? 'danger' : 'primary'}
              onPress={onConfirmar}
              loading={cargando}
              style={styles.flex}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  seccion: { gap: space.xs, marginTop: space.xl },
  seccionTitulo: { gap: 2, marginBottom: space.xs },
  fila: { paddingVertical: space.md, minHeight: 56 },
  filaFila: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  divisor: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
  presionado: { opacity: 0.6 },
  cuerpo: { flex: 1, gap: 2 },
  tituloFila: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  icono: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: color.quiet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoPeligro: { backgroundColor: color.dangerBg },
  editor: { gap: space.sm },
  editorAcciones: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm },
  botonCompacto: { minHeight: 44 },
  confirmacion: {
    gap: space.md,
    padding: space.lg,
    marginBottom: space.md,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
  },
  confirmacionPeligro: { borderColor: color.danger, backgroundColor: color.dangerBg },
  confirmacionAcciones: { flexDirection: 'row', gap: space.sm },
  flex: { flex: 1 },
});
