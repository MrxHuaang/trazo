import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { color, radius, space } from '@/theme';
import { Button, Field, Sheet, Text, ToggleRow, TraceLine } from '@/ui';

import { useCrearConsultorio } from './hooks';
import { pesosEnEdicion, validarConsultorio } from './validacion';

type FormularioConsultorioProps = {
  onVolver: () => void;
  onCreado: () => void;
};

type Valores = { nombre: string; profesional: string; correo: string; tarifaBase: string; tarifaSocial: string };

const INICIALES: Valores = { nombre: '', profesional: '', correo: '', tarifaBase: '70.000', tarifaSocial: '35.000' };

/** HU-26: registro local del consultorio. Sin servidor ni contraseña: todo queda en el teléfono. */
export function FormularioConsultorio({ onVolver, onCreado }: FormularioConsultorioProps) {
  const crear = useCrearConsultorio();
  const [valores, setValores] = useState<Valores>(INICIALES);
  const [bloqueo, setBloqueo] = useState(true);
  const [intentado, setIntentado] = useState(false);

  const validacion = validarConsultorio(valores);
  const errores = intentado && !validacion.ok ? validacion.errores : {};

  const cambiar = (campo: keyof Valores, formatear?: (t: string) => string) => (texto: string) =>
    setValores((v) => ({ ...v, [campo]: formatear ? formatear(texto) : texto }));

  const enviar = () => {
    setIntentado(true);
    if (!validacion.ok) return;
    const { datos } = validacion;
    crear.mutate(
      {
        nombre: datos.nombre,
        profesional: datos.profesional,
        correo: datos.correo || null,
        tarifaBase: datos.tarifaBase,
        tarifaSocial: datos.tarifaSocial,
        bloqueoActivo: bloqueo,
      },
      { onSuccess: onCreado },
    );
  };

  return (
    <Sheet
      header={
        <View style={styles.encabezado}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver a la bienvenida"
            onPress={onVolver}
            disabled={crear.isPending}
            style={({ pressed }) => [styles.volver, pressed && styles.presionado]}>
            <CaretLeftIcon size={22} color={color.ink} />
          </Pressable>
        </View>
      }
      footer={
        <>
          {crear.isError ? (
            <Text variant="label" tone={color.danger} accessibilityLiveRegion="polite">
              No pudimos guardar el consultorio. Intenta de nuevo.
            </Text>
          ) : null}
          <Button label="Crear consultorio" onPress={enviar} loading={crear.isPending} />
        </>
      }>
      <View style={styles.intro}>
        <TraceLine height={28} agitation={0.6} calmFrom={0.3} />
        <Text variant="title" accessibilityRole="header">
          Crea tu consultorio
        </Text>
        <Text variant="body" tone={color.inkSoft}>
          Con estos datos Trazo arma tu agenda y tus cobros. Puedes cambiarlos después en Ajustes.
        </Text>
      </View>

      <Field
        label="Nombre del consultorio"
        value={valores.nombre}
        onChangeText={cambiar('nombre')}
        error={errores.nombre}
        autoCapitalize="words"
        textContentType="organizationName"
        maxLength={80}
      />
      <Field
        label="Tu nombre"
        value={valores.profesional}
        onChangeText={cambiar('profesional')}
        error={errores.profesional}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        maxLength={80}
      />
      <Field
        label="Correo (opcional)"
        value={valores.correo}
        onChangeText={cambiar('correo')}
        error={errores.correo}
        helper="Se guarda solo en este teléfono."
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        maxLength={120}
      />

      <View style={styles.par}>
        <View style={styles.mitad}>
          <Field
            label="Tarifa base"
            value={valores.tarifaBase}
            onChangeText={cambiar('tarifaBase', pesosEnEdicion)}
            error={errores.tarifaBase}
            helper="COP por sesión"
            keyboardType="number-pad"
            accessibilityHint="Valor en pesos colombianos por sesión"
          />
        </View>
        <View style={styles.mitad}>
          <Field
            label="Tarifa social"
            value={valores.tarifaSocial}
            onChangeText={cambiar('tarifaSocial', pesosEnEdicion)}
            error={errores.tarifaSocial}
            helper="COP, cupos solidarios"
            keyboardType="number-pad"
            accessibilityHint="Valor en pesos colombianos para pacientes con tarifa social"
          />
        </View>
      </View>

      <ToggleRow
        label="Bloqueo al abrir"
        description="Pide tu huella, tu rostro o el código del teléfono al abrir Trazo."
        value={bloqueo}
        onChange={setBloqueo}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  encabezado: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.xs },
  volver: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: color.quiet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presionado: { opacity: 0.6 },
  intro: { gap: space.sm, paddingTop: space.sm },
  par: { flexDirection: 'row', gap: space.md },
  mitad: { flex: 1 },
});
