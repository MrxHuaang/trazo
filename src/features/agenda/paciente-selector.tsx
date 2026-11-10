import { UserPlusIcon } from 'phosphor-react-native/src/icons/UserPlus';
import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';

import { useCrearPaciente, usePacientes } from '@/data/hooks';
import type { Paciente } from '@/domain/types';
import { formatoTelefono } from '@/lib/format';
import { color, radius, space } from '@/theme';
import { Field, SolidarioMark, Text } from '@/ui';

import { BotonTexto } from './boton-icono';

const TARIFA: Record<Paciente['tarifa'], string> = { normal: 'Tarifa normal', social: 'Tarifa social', gratuita: 'Sin costo' };
const MAXIMO = 6;

export const detallePaciente = (p: Pick<Paciente, 'telefono' | 'tarifa'>) =>
  `${p.telefono ? formatoTelefono(p.telefono) : 'Sin teléfono'} · ${TARIFA[p.tarifa]}`;

type Props = {
  valor: Paciente | null;
  /** `nuevo` indica que se acaba de crear desde el buscador (HU-08). */
  onChange: (paciente: Paciente | null, nuevo: boolean) => void;
  nuevo?: boolean;
  autoFocus?: boolean;
};

/**
 * Paciente de la cita: buscador por nombre o teléfono y creación en contexto.
 * Si el nombre no existe aparece "Crear paciente «…»"; los demás datos se completan en su ficha.
 */
export function PacienteSelector({ valor, onChange, nuevo, autoFocus }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const texto = busqueda.trim();
  const lista = usePacientes({ busqueda: texto }).data ?? [];
  const crear = useCrearPaciente();
  const [error, setError] = useState<string | null>(null);

  if (valor) {
    return (
      <View style={styles.wrap}>
        <Text variant="label">Paciente</Text>
        <View style={styles.elegido}>
          <View style={styles.cuerpo}>
            <View style={styles.nombreFila}>
              <Text variant="bodyMedium" numberOfLines={1} style={styles.nombre}>
                {valor.nombre}
              </Text>
              {valor.afectadoSismo ? <SolidarioMark /> : null}
            </View>
            <Text variant="caption" tone={color.inkSoft} numberOfLines={1}>
              {nuevo ? 'Paciente nuevo. Completa sus datos en su ficha.' : detallePaciente(valor)}
            </Text>
          </View>
          <BotonTexto etiqueta="Cambiar" accessibilityLabel="Cambiar paciente" onPress={() => onChange(null, false)} />
        </View>
      </View>
    );
  }

  const existe = lista.some((p) => p.nombre.trim().toLowerCase() === texto.toLowerCase());
  const puedeCrear = texto.length >= 2 && /\p{L}/u.test(texto) && !existe;
  const visibles = lista.slice(0, MAXIMO);

  const crearPaciente = async () => {
    setError(null);
    try {
      const p = await crear.mutateAsync({ nombre: texto });
      Keyboard.dismiss();
      setBusqueda('');
      onChange(p, true);
    } catch {
      setError('No se pudo crear el paciente. Intenta de nuevo.');
    }
  };

  return (
    <View style={styles.wrap}>
      <Field
        label="Paciente"
        placeholder="Nombre o teléfono"
        value={busqueda}
        onChangeText={setBusqueda}
        autoFocus={autoFocus}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="search"
        error={error ?? undefined}
      />
      <View>
        {visibles.map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            accessibilityLabel={`${p.nombre}, ${detallePaciente(p)}`}
            onPress={() => {
              Keyboard.dismiss();
              setBusqueda('');
              onChange(p, false);
            }}
            style={({ pressed }) => [styles.fila, pressed && styles.pressed]}>
            <View style={styles.cuerpo}>
              <View style={styles.nombreFila}>
                <Text variant="bodyMedium" numberOfLines={1} style={styles.nombre}>
                  {p.nombre}
                </Text>
                {p.afectadoSismo ? <SolidarioMark /> : null}
              </View>
              <Text variant="caption" tone={color.inkSoft} numberOfLines={1}>
                {detallePaciente(p)}
              </Text>
            </View>
          </Pressable>
        ))}
        {lista.length > MAXIMO ? (
          <Text variant="caption" tone={color.inkSoft} style={styles.nota}>
            Hay {lista.length - MAXIMO} más. Escribe para afinar la búsqueda.
          </Text>
        ) : null}
        {puedeCrear ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Crear paciente ${texto}`}
            disabled={crear.isPending}
            onPress={crearPaciente}
            style={({ pressed }) => [styles.fila, styles.crear, pressed && styles.pressed]}>
            <UserPlusIcon size={20} color={color.accent} />
            <Text variant="bodyMedium" tone={color.accent} numberOfLines={1} style={styles.nombre}>
              Crear paciente «{texto}»
            </Text>
          </Pressable>
        ) : null}
        {lista.length === 0 && !puedeCrear ? (
          <Text variant="caption" tone={color.inkSoft} style={styles.nota}>
            {texto ? 'Sin resultados.' : 'Escribe un nombre para buscar o crear un paciente.'}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  elegido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 56,
    paddingLeft: space.lg,
    paddingRight: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 52,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.line,
  },
  crear: { borderBottomWidth: 0 },
  cuerpo: { flex: 1, gap: 2 },
  nombreFila: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  nombre: { flexShrink: 1 },
  nota: { paddingVertical: space.sm },
  pressed: { opacity: 0.6 },
});
