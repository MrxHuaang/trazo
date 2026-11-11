import { useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useActualizarConsultorio, useConsultorio } from '@/data/hooks';
import { PLANTILLA_CONFIRMACION, PLANTILLA_RECORDATORIO } from '@/data/repos/consultorio';
import type { Consultorio } from '@/domain/types';
import { hoyClave } from '@/lib/dates';
import { Aparecer, Button, EmptyState, Field, Presionable, Sheet, Text } from '@/ui';

import { Cabecera, volver } from './cabecera';
import { mensajeDesdePlantilla, VARIABLES, valoresEjemplo, variablesDesconocidas } from './mensajes';

/** Plantillas de WhatsApp del consultorio (HU-06): recordatorio y confirmación, con vista previa. */
export function PlantillasScreen() {
  const { data: consultorio, isPending } = useConsultorio();
  if (consultorio) return <FormularioPlantillas consultorio={consultorio} />;
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-canvas">
      <Cabecera />
      <View className="px-5">
        {isPending ? null : (
          <EmptyState title="Aún no hay consultorio" body="Crea tu consultorio para poder editar los mensajes." />
        )}
      </View>
    </SafeAreaView>
  );
}

function validar(texto: string) {
  if (!texto.trim()) return 'Escribe el mensaje.';
  const desconocidas = variablesDesconocidas(texto).map((v) => `{${v}}`);
  if (desconocidas.length === 1) return `${desconocidas[0]} no es una variable válida. Usa las de la lista.`;
  if (desconocidas.length > 1) return `${desconocidas.join(', ')} no son variables válidas. Usa las de la lista.`;
  return undefined;
}

function FormularioPlantillas({ consultorio }: { consultorio: Consultorio }) {
  const [recordatorio, setRecordatorio] = useState(consultorio.plantillaRecordatorio);
  const [confirmacion, setConfirmacion] = useState(consultorio.plantillaConfirmacion);
  const [ejemplo] = useState(() => valoresEjemplo(hoyClave()));
  const actualizar = useActualizarConsultorio();

  const errorRecordatorio = validar(recordatorio);
  const errorConfirmacion = validar(confirmacion);
  const hayCambios =
    recordatorio !== consultorio.plantillaRecordatorio || confirmacion !== consultorio.plantillaConfirmacion;

  function guardar() {
    actualizar.mutate(
      { plantillaRecordatorio: recordatorio.trim(), plantillaConfirmacion: confirmacion.trim() },
      {
        onSuccess: volver,
        onError: (e) => Alert.alert('No se guardaron los cambios', e instanceof Error ? e.message : 'Intenta de nuevo.'),
      },
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <Sheet
        header={<Cabecera />}
        footer={
          <Button
            label="Guardar cambios"
            onPress={guardar}
            loading={actualizar.isPending}
            disabled={!hayCambios || !!errorRecordatorio || !!errorConfirmacion}
          />
        }>
        <Aparecer orden={0} className="gap-2">
          <Text variant="display" accessibilityRole="header">
            Plantillas
          </Text>
          <Text variant="body" className="text-ink-soft">
            Trazo los prepara en WhatsApp con los datos de cada cita.
          </Text>
        </Aparecer>

        <EditorPlantilla
          orden={1}
          titulo="Recordatorio"
          ayuda="Se envía un día antes de la cita."
          valor={recordatorio}
          onChange={setRecordatorio}
          original={PLANTILLA_RECORDATORIO}
          ejemplo={ejemplo}
          error={errorRecordatorio}
        />
        <EditorPlantilla
          orden={2}
          titulo="Confirmación"
          ayuda="Se envía al confirmar una solicitud."
          valor={confirmacion}
          onChange={setConfirmacion}
          original={PLANTILLA_CONFIRMACION}
          ejemplo={ejemplo}
          error={errorConfirmacion}
        />
      </Sheet>
    </SafeAreaView>
  );
}

type EditorPlantillaProps = {
  orden: number;
  titulo: string;
  ayuda: string;
  valor: string;
  onChange: (valor: string) => void;
  original: string;
  ejemplo: Record<string, string>;
  error?: string;
};

function EditorPlantilla({ orden, titulo, ayuda, valor, onChange, original, ejemplo, error }: EditorPlantillaProps) {
  // Posición del cursor; solo se lee al tocar una variable.
  const seleccion = useRef({ start: valor.length, end: valor.length });

  function insertar(clave: string) {
    const token = `{${clave}}`;
    const inicio = Math.min(seleccion.current.start, valor.length);
    const fin = Math.min(Math.max(seleccion.current.end, inicio), valor.length);
    const antes = valor.slice(0, inicio);
    const espacio = antes && !/\s$/.test(antes) ? ' ' : '';
    onChange(`${antes}${espacio}${token}${valor.slice(fin)}`);
    const cursor = inicio + espacio.length + token.length;
    seleccion.current = { start: cursor, end: cursor };
  }

  const vistaPrevia = mensajeDesdePlantilla(valor, ejemplo);

  return (
    <Aparecer orden={orden} className="mt-2 gap-3">
      <Field
        label={titulo}
        helper={ayuda}
        error={error}
        multiline
        value={valor}
        onChangeText={onChange}
        onSelectionChange={(e) => {
          seleccion.current = e.nativeEvent.selection;
        }}
        autoCapitalize="sentences"
      />
      <View className="flex-row flex-wrap gap-2">
        {VARIABLES.map((v) => (
          <Presionable
            key={v.clave}
            accessibilityRole="button"
            accessibilityLabel={`Insertar ${v.clave} en ${titulo.toLowerCase()}`}
            accessibilityHint={v.descripcion}
            onPress={() => insertar(v.clave)}
            contentClassName="min-h-[44px] items-center justify-center rounded-full border border-line bg-surface px-3">
            <Text variant="mono">{`{${v.clave}}`}</Text>
          </Presionable>
        ))}
      </View>
      <View className="gap-2">
        <Text variant="label" className="text-ink-soft">
          Vista previa
        </Text>
        <View className="rounded-field rounded-tl-[4px] bg-quiet p-4">
          <Text variant="body" className={vistaPrevia ? 'text-ink' : 'text-ink-soft'}>
            {vistaPrevia || 'El mensaje está vacío.'}
          </Text>
        </View>
      </View>
      {valor !== original ? (
        <Button
          label="Volver al mensaje original"
          variant="ghost"
          size="sm"
          onPress={() => onChange(original)}
          className="self-start"
        />
      ) : null}
    </Aparecer>
  );
}
