import { UserPlusIcon } from 'phosphor-react-native/src/icons/UserPlus';
import { useState } from 'react';
import { Keyboard, Pressable, View } from 'react-native';
import Animated, { FadeIn, LinearTransition, ReduceMotion } from 'react-native-reanimated';

import { useCrearPaciente, usePacientes } from '@/data/hooks';
import type { Paciente } from '@/domain/types';
import { formatoTelefono } from '@/lib/format';
import { color } from '@/theme';
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

const FILA = 'min-h-[52px] flex-row items-center gap-3 py-2 active:opacity-60';

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
      <View className="gap-2">
        <Text variant="label">Paciente</Text>
        <Animated.View
          entering={FadeIn.duration(200).reduceMotion(ReduceMotion.System)}
          className="min-h-[56px] flex-row items-center gap-3 rounded-field border border-line bg-surface py-2 pl-4 pr-3">
          <View className="flex-1 gap-0.5">
            <View className="flex-row items-center gap-2">
              <Text variant="bodyMedium" numberOfLines={1} className="shrink">
                {valor.nombre}
              </Text>
              {valor.afectadoSismo ? <SolidarioMark /> : null}
            </View>
            <Text variant="caption" className="text-ink-soft" numberOfLines={1}>
              {nuevo ? 'Paciente nuevo. Completa sus datos en su ficha.' : detallePaciente(valor)}
            </Text>
          </View>
          <BotonTexto etiqueta="Cambiar" accessibilityLabel="Cambiar paciente" onPress={() => onChange(null, false)} />
        </Animated.View>
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
    <View className="gap-2">
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
          <Animated.View key={p.id} layout={LinearTransition.duration(160).reduceMotion(ReduceMotion.System)}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${p.nombre}, ${detallePaciente(p)}`}
              onPress={() => {
                Keyboard.dismiss();
                setBusqueda('');
                onChange(p, false);
              }}
              className={`${FILA} border-b border-line`}>
              <View className="flex-1 gap-0.5">
                <View className="flex-row items-center gap-2">
                  <Text variant="bodyMedium" numberOfLines={1} className="shrink">
                    {p.nombre}
                  </Text>
                  {p.afectadoSismo ? <SolidarioMark /> : null}
                </View>
                <Text variant="caption" className="text-ink-soft" numberOfLines={1}>
                  {detallePaciente(p)}
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        ))}
        {lista.length > MAXIMO ? (
          <Text variant="caption" className="py-2 text-ink-soft">
            Hay {lista.length - MAXIMO} más. Escribe para afinar la búsqueda.
          </Text>
        ) : null}
        {puedeCrear ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Crear paciente ${texto}`}
            disabled={crear.isPending}
            onPress={crearPaciente}
            className={FILA}>
            <UserPlusIcon size={20} color={color.accent} />
            <Text variant="bodyMedium" className="shrink text-accent" numberOfLines={1}>
              Crear paciente «{texto}»
            </Text>
          </Pressable>
        ) : null}
        {lista.length === 0 && !puedeCrear ? (
          <Text variant="caption" className="py-2 text-ink-soft">
            {texto ? 'Sin resultados.' : 'Escribe un nombre para buscar o crear un paciente.'}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
