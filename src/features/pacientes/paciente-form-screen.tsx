import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { ShieldCheckIcon } from 'phosphor-react-native/src/icons/ShieldCheck';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { useActualizarPaciente, useCrearPaciente, usePaciente } from '@/data/hooks';
import { AFECTACIONES, type Afectacion, type Consentimiento, type Paciente } from '@/domain/types';
import { fechaCorta } from '@/lib/dates';
import { color, radius, space, tile } from '@/theme';
import { Button, EmptyState, Field, Segmented, Sheet, SheetHeader, Text, ToggleRow, TraceLine } from '@/ui';

import { useConsentimientos, useRegistrarConsentimiento } from './hooks';
import {
  aPaciente,
  esMenorDeEdad,
  esquemaPaciente,
  formatearFechaEscrita,
  TARIFAS,
  valoresIniciales,
  type ValoresPaciente,
} from './rules';

type PacienteFormScreenProps = {
  /** Con `id` edita; sin él crea. */
  id?: string;
  /** Nombre escrito en el buscador (HU-08). */
  nombre?: string;
};

/** Hoja para crear o editar un paciente (HU-08, HU-11, HU-17). */
export function PacienteFormScreen({ id, nombre }: PacienteFormScreenProps) {
  const paciente = usePaciente(id);
  const consentimientos = useConsentimientos(id);

  if (id && (paciente.isPending || consentimientos.isPending)) {
    return (
      <Sheet header={<SheetHeader title="Editar paciente" />}>
        <TraceLine height={40} />
      </Sheet>
    );
  }
  if (id && !paciente.data) {
    return (
      <Sheet header={<SheetHeader title="Editar paciente" />}>
        <EmptyState title="No encontramos a este paciente" body="Cierra esta hoja y búscalo en la lista." />
      </Sheet>
    );
  }

  const autorizacion = consentimientos.data?.find((c) => c.tipo === 'datos_personales' && !c.revocadoEn) ?? null;
  return <Formulario paciente={paciente.data ?? null} nombreInicial={nombre} autorizacion={autorizacion} />;
}

function Formulario({
  paciente,
  nombreInicial,
  autorizacion,
}: {
  paciente: Paciente | null;
  nombreInicial?: string;
  autorizacion: Consentimiento | null;
}) {
  const esEdicion = !!paciente;
  const crear = useCrearPaciente();
  const actualizar = useActualizarPaciente();
  const registrarConsentimiento = useRegistrarConsentimiento();
  const [guardando, setGuardando] = useState(false);
  const [conErrores, setConErrores] = useState(false);

  const { control, handleSubmit } = useForm<ValoresPaciente>({
    resolver: zodResolver(esquemaPaciente(!esEdicion)),
    defaultValues: valoresIniciales(paciente, nombreInicial),
    mode: 'onTouched',
  });
  const afectado = useWatch({ control, name: 'afectadoSismo' });
  const fechaNacimiento = useWatch({ control, name: 'fechaNacimiento' });
  const menor = esMenorDeEdad(fechaNacimiento);

  const guardar = handleSubmit(
    async (valores) => {
      setConErrores(false);
      setGuardando(true);
      try {
        if (paciente) {
          await actualizar.mutateAsync({ id: paciente.id, cambios: aPaciente(valores) });
          if (!autorizacion && valores.autoriza) await registrarConsentimiento.mutateAsync(paciente.id);
          router.back();
        } else {
          const nuevo = await crear.mutateAsync({ ...aPaciente(valores), autorizaDatos: true });
          router.replace({ pathname: '/paciente/[id]', params: { id: nuevo.id } });
        }
      } catch {
        Alert.alert('No se pudo guardar', 'Los datos siguen en el formulario. Intenta de nuevo.');
      } finally {
        setGuardando(false);
      }
    },
    () => setConErrores(true),
  );

  return (
    <Sheet
      header={<SheetHeader title={esEdicion ? 'Editar paciente' : 'Nuevo paciente'} subtitle={esEdicion ? paciente.nombre : undefined} />}
      footer={
        <>
          {conErrores ? (
            <Text variant="caption" tone={color.danger} accessibilityLiveRegion="polite">
              Revisa los campos marcados en rojo.
            </Text>
          ) : null}
          <Button label={esEdicion ? 'Guardar cambios' : 'Crear paciente'} loading={guardando} onPress={() => void guardar()} />
        </>
      }>
      <Controller
        control={control}
        name="nombre"
        render={({ field, fieldState }) => (
          <Field
            label="Nombre completo"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            autoCapitalize="words"
            autoCorrect={false}
            autoComplete="off"
            returnKeyType="next"
          />
        )}
      />

      <Controller
        control={control}
        name="telefono"
        render={({ field, fieldState }) => (
          <Field
            label="Celular (opcional)"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            helper="10 dígitos, empieza por 3. Sirve para WhatsApp y llamadas."
            keyboardType="phone-pad"
            autoComplete="off"
            maxLength={16}
          />
        )}
      />

      <Controller
        control={control}
        name="correo"
        render={({ field, fieldState }) => (
          <Field
            label="Correo (opcional)"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
          />
        )}
      />

      <Controller
        control={control}
        name="fechaNacimiento"
        render={({ field, fieldState }) => (
          <Field
            label="Fecha de nacimiento (opcional)"
            value={field.value}
            onChangeText={(v) => field.onChange(formatearFechaEscrita(v))}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            helper="Año, mes y día: 1990-04-23. Los guiones se ponen solos."
            placeholder="aaaa-mm-dd"
            keyboardType="number-pad"
            maxLength={10}
          />
        )}
      />

      <View style={styles.grupo}>
        <Text variant="label">Tarifa</Text>
        <Controller
          control={control}
          name="tarifa"
          render={({ field }) => <Segmented options={TARIFAS} value={field.value} onChange={field.onChange} accessibilityLabel="Tarifa" />}
        />
        <Text variant="caption" tone={color.inkSoft}>
          La gratuita se registra como sesión donada, no como deuda.
        </Text>
      </View>

      <View style={styles.grupo}>
        <Controller
          control={control}
          name="afectadoSismo"
          render={({ field }) => (
            <ToggleRow
              label="Afectado por el sismo"
              description="Lo incluye en el programa solidario. Revisa también la tarifa."
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {afectado ? (
          <Controller
            control={control}
            name="afectaciones"
            render={({ field, fieldState }) => (
              <View style={styles.grupo}>
                <Text variant="label">Tipo de afectación</Text>
                <View style={styles.chips} accessibilityLabel="Tipo de afectación">
                  {AFECTACIONES.map((a) => (
                    <ChipAfectacion
                      key={a.valor}
                      etiqueta={a.etiqueta}
                      activo={field.value.includes(a.valor)}
                      onPress={() => field.onChange(alternar(field.value, a.valor))}
                    />
                  ))}
                </View>
                {fieldState.error ? (
                  <Text variant="caption" tone={color.danger}>
                    {fieldState.error.message}
                  </Text>
                ) : (
                  <Text variant="caption" tone={color.inkSoft}>
                    Puedes elegir varios.
                  </Text>
                )}
              </View>
            )}
          />
        ) : null}
      </View>

      <Controller
        control={control}
        name="notasGenerales"
        render={({ field }) => (
          <Field
            label="Notas generales (opcional)"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            helper="Datos prácticos: horarios, quién lo remite. Lo clínico va en las notas de sesión, que quedan bajo llave."
            multiline
          />
        )}
      />

      <View style={styles.autorizacion}>
        <View style={styles.autorizacionTitulo}>
          <ShieldCheckIcon size={20} color={color.ink} />
          <Text variant="heading">Autorización de datos</Text>
        </View>
        {autorizacion ? (
          <Text variant="body" tone={color.inkSoft}>
            Registrada el {fechaCorta(autorizacion.aceptadoEn)} (texto {autorizacion.versionTexto}). La persona puede revocarla o pedir sus
            datos cuando quiera.
          </Text>
        ) : (
          <>
            <Text variant="body" tone={color.inkSoft}>
              Los datos de salud son sensibles y entregarlos es voluntario. Se usan solo para agendar y recordar citas, llevar el
              proceso de atención y gestionar pagos. La persona puede conocer, actualizar, rectificar o pedir que se supriman sus
              datos, y revocar esta autorización.
            </Text>
            {menor ? (
              <Text variant="bodyMedium">Es menor de edad: la autorización la da su representante legal.</Text>
            ) : null}
            <Controller
              control={control}
              name="autoriza"
              render={({ field, fieldState }) => (
                <View>
                  <ToggleRow
                    label={menor ? 'Su representante autoriza el tratamiento' : 'La persona autoriza el tratamiento'}
                    description={`Ley 1581 de 2012. Queda registrada con fecha y versión del texto.${esEdicion ? '' : ' Obligatoria para crear.'}`}
                    value={field.value}
                    onChange={field.onChange}
                  />
                  {fieldState.error ? (
                    <Text variant="caption" tone={color.danger}>
                      {fieldState.error.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />
          </>
        )}
      </View>
    </Sheet>
  );
}

const alternar = (lista: Afectacion[], valor: Afectacion) =>
  lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];

/** Chip de selección múltiple: activo = durazno con marca de verificación (no depende solo del color). */
function ChipAfectacion({ etiqueta, activo, onPress }: { etiqueta: string; activo: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={etiqueta}
      accessibilityState={{ checked: activo }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, activo && styles.chipActivo, pressed && styles.pressed]}>
      {activo ? <CheckIcon size={14} color={tile.solidario.fg} weight="bold" /> : null}
      <Text variant="label" tone={activo ? tile.solidario.fg : color.ink}>
        {etiqueta}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grupo: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    minHeight: 44,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
  },
  chipActivo: { backgroundColor: tile.solidario.bg, borderColor: tile.solidario.fg },
  pressed: { opacity: 0.6 },
  autorizacion: {
    gap: space.sm,
    padding: space.lg,
    borderRadius: radius.tile,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.line,
    backgroundColor: color.surface,
  },
  autorizacionTitulo: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
