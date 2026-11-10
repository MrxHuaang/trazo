import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useActualizarConsultorio, useConsultorio } from '@/data/hooks';
import { PLANTILLA_CONFIRMACION, PLANTILLA_RECORDATORIO } from '@/data/repos/consultorio';
import type { Consultorio } from '@/domain/types';
import { hoyClave } from '@/lib/dates';
import { color, radius, space } from '@/theme';
import { Button, EmptyState, Field, Sheet, Text } from '@/ui';

import { Cabecera, volver } from './cabecera';
import { mensajeDesdePlantilla, VARIABLES, valoresEjemplo, variablesDesconocidas } from './mensajes';

/** Plantillas de WhatsApp del consultorio (HU-06): recordatorio y confirmación, con vista previa. */
export function PlantillasScreen() {
  const { data: consultorio, isPending } = useConsultorio();
  if (consultorio) return <FormularioPlantillas consultorio={consultorio} />;
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <Cabecera />
      <View style={styles.vacio}>
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
    <SafeAreaView edges={['top']} style={styles.root}>
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
        <View style={styles.intro}>
          <Text variant="display" accessibilityRole="header">
            Plantillas
          </Text>
          <Text variant="body" tone={color.inkSoft}>
            Trazo prepara estos mensajes en WhatsApp con los datos de cada cita. Tú los revisas y los envías.
          </Text>
        </View>

        <View style={styles.ayuda}>
          <Text variant="label">Variables</Text>
          {VARIABLES.map((v) => (
            <View key={v.clave} style={styles.ayudaFila}>
              <Text variant="mono" style={styles.ayudaClave}>
                {`{${v.clave}}`}
              </Text>
              <Text variant="caption" tone={color.inkSoft} style={styles.ayudaTexto}>
                {v.descripcion}
              </Text>
            </View>
          ))}
          <Text variant="caption" tone={color.inkSoft}>
            Toca una variable debajo de cada mensaje para insertarla donde está el cursor.
          </Text>
        </View>

        <EditorPlantilla
          titulo="Recordatorio"
          ayuda="Se envía desde Por confirmar, hasta 24 horas antes de la cita."
          valor={recordatorio}
          onChange={setRecordatorio}
          original={PLANTILLA_RECORDATORIO}
          ejemplo={ejemplo}
          error={errorRecordatorio}
        />
        <EditorPlantilla
          titulo="Confirmación"
          ayuda="Se envía al confirmar una solicitud de cita."
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
  titulo: string;
  ayuda: string;
  valor: string;
  onChange: (valor: string) => void;
  original: string;
  ejemplo: Record<string, string>;
  error?: string;
};

function EditorPlantilla({ titulo, ayuda, valor, onChange, original, ejemplo, error }: EditorPlantillaProps) {
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
    <View style={styles.editor}>
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
      <View style={styles.variables}>
        {VARIABLES.map((v) => (
          <Pressable
            key={v.clave}
            accessibilityRole="button"
            accessibilityLabel={`Insertar ${v.clave} en ${titulo.toLowerCase()}`}
            accessibilityHint={v.descripcion}
            onPress={() => insertar(v.clave)}
            style={({ pressed }) => [styles.variable, pressed && styles.variablePressed]}>
            <Text variant="mono">{`{${v.clave}}`}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.preview}>
        <Text variant="label" tone={color.inkSoft}>
          Vista previa con datos de ejemplo
        </Text>
        <View style={styles.burbuja}>
          <Text variant="body" tone={vistaPrevia ? color.ink : color.inkSoft}>
            {vistaPrevia || 'El mensaje está vacío.'}
          </Text>
        </View>
      </View>
      {valor !== original ? (
        <Button label="Volver al mensaje original" variant="ghost" onPress={() => onChange(original)} style={styles.restaurar} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  vacio: { paddingHorizontal: space.xl },
  intro: { gap: space.sm },
  ayuda: {
    gap: space.sm,
    padding: space.lg,
    borderRadius: radius.field,
    backgroundColor: color.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.line,
  },
  ayudaFila: { flexDirection: 'row', alignItems: 'baseline', gap: space.md },
  ayudaClave: { width: 96 },
  ayudaTexto: { flex: 1 },
  editor: { gap: space.md, marginTop: space.sm },
  variables: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  variable: {
    minHeight: 44,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variablePressed: { backgroundColor: color.quiet },
  preview: { gap: space.sm },
  burbuja: {
    padding: space.lg,
    borderRadius: radius.field,
    borderTopLeftRadius: space.xs,
    backgroundColor: color.quiet,
  },
  restaurar: { alignSelf: 'flex-start', paddingHorizontal: 0 },
});
