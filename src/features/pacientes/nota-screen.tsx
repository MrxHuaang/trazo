import { useQueryClient } from '@tanstack/react-query';
import { router, usePreventRemove } from 'expo-router';
import { LockSimpleIcon } from 'phosphor-react-native/src/icons/LockSimple';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { color, radius, space, tile } from '@/theme';
import { Button, EmptyState, Field, Sheet, SheetHeader, Text, TraceLine } from '@/ui';

import { fechaHistoria } from './historia';
import { llaveContenidoNota, useContenidoNota, useContextoNota, useGuardarNota } from './hooks';
import { useCandado } from './use-candado';

type NotaScreenProps = {
  /** Id de una cita, id de una nota sin cita, o `nueva`. */
  id: string;
  /** Requerido cuando `id` es `nueva`. */
  pacienteId?: string;
};

/**
 * Nota de sesión privada (HU-12). El contenido solo se lee de la base con la nota desbloqueada
 * y se retira de la memoria al bloquearla; el borrador se guarda antes de bloquear.
 */
export function NotaScreen({ id, pacienteId }: NotaScreenProps) {
  const qc = useQueryClient();
  const contexto = useContextoNota(id, pacienteId);
  const guardar = useGuardarNota();
  /** null = sin editar: se muestra lo guardado. */
  const [texto, setTexto] = useState<string | null>(null);
  const [notaCreada, setNotaCreada] = useState<string | null>(null);
  const [salir, setSalir] = useState(false);

  const ctx = contexto.data;
  const notaId = ctx?.notaId ?? notaCreada;

  const persistir = async (contenido: string) => {
    if (!ctx?.pacienteId) return;
    const guardada = await guardar.mutateAsync({ notaId, pacienteId: ctx.pacienteId, citaId: ctx.citaId, contenido });
    setNotaCreada(guardada);
  };

  const candado = useCandado(() => {
    // Antes de bloquear: el borrador no se pierde y el contenido sale de la memoria.
    const guardado = notaId ? (qc.getQueryData<string>([...llaveContenidoNota, notaId]) ?? '') : '';
    if (texto !== null && texto.trim() && texto !== guardado) persistir(texto).catch(() => undefined);
    setTexto(null);
    qc.removeQueries({ queryKey: llaveContenidoNota });
  });
  const abierta = candado.estado === 'abierta';

  const contenido = useContenidoNota(notaId, abierta);
  const original = contenido.data ?? '';
  const valor = texto ?? original;
  const conCambios = texto !== null && texto !== original;
  const editorListo = !notaId || contenido.isSuccess;

  const permitirSalida = usePreventRemove(abierta && conCambios && !salir, ({ repeat }) => {
    Alert.alert('¿Salir sin guardar?', 'Lo que escribiste en esta nota se pierde.', [
      { text: 'Seguir escribiendo', style: 'cancel' },
      {
        text: 'Salir sin guardar',
        style: 'destructive',
        onPress: () => {
          setSalir(true);
          repeat();
        },
      },
    ]);
  });

  const guardarYSalir = async () => {
    try {
      await persistir(valor.trim());
      setSalir(true);
      permitirSalida();
      router.back();
    } catch {
      Alert.alert('No se pudo guardar la nota', 'El texto sigue aquí. Intenta de nuevo.');
    }
  };

  const fecha = ctx?.fecha ? fechaHistoria(ctx.fecha) : null;
  const subtitulo = ctx?.citaId && fecha ? `Sesión: ${fecha}` : (fecha ?? (id === 'nueva' ? 'Nueva' : undefined));
  const encabezado = (
    <SheetHeader
      title="Nota privada"
      subtitle={abierta && ctx?.pacienteNombre ? [ctx.pacienteNombre, subtitulo].filter(Boolean).join(' · ') : subtitulo}
      action={
        abierta ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Bloquear nota"
            hitSlop={10}
            onPress={candado.bloquear}
            style={styles.botonCandado}>
            <LockSimpleIcon size={18} color={color.ink} />
          </Pressable>
        ) : undefined
      }
    />
  );

  if (contexto.isPending) {
    return (
      <Sheet header={encabezado}>
        <TraceLine height={40} />
      </Sheet>
    );
  }

  if (!ctx?.pacienteId) {
    return (
      <Sheet header={encabezado}>
        <EmptyState title="No encontramos esta nota" body="Ábrela desde la cita o desde la historia del paciente." />
      </Sheet>
    );
  }

  if (!abierta) {
    const sinSeguridad = candado.estado === 'sin-seguridad';
    return (
      <Sheet header={encabezado}>
        <View style={styles.cerrada}>
          <View style={styles.circulo}>
            <LockSimpleIcon size={28} color={tile.consulta.fg} />
          </View>
          <Text variant="title" style={styles.centrado}>
            {sinSeguridad ? 'Este teléfono no tiene bloqueo' : 'Nota bajo llave'}
          </Text>
          <Text variant="body" tone={color.inkSoft} style={styles.centrado}>
            {sinSeguridad
              ? 'Sin huella, rostro ni código, cualquiera que tenga el teléfono puede leer las notas. Activa un bloqueo de pantalla en los ajustes del teléfono.'
              : 'Usa tu huella, tu rostro o el código del teléfono para leerla o escribir.'}
          </Text>
          {candado.mensaje ? (
            <Text variant="label" tone={color.inkSoft} style={styles.centrado} accessibilityLiveRegion="polite">
              {candado.mensaje}
            </Text>
          ) : null}
          {sinSeguridad ? (
            <Button label="Abrir sin bloqueo" variant="secondary" onPress={candado.continuarSinSeguridad} style={styles.boton} />
          ) : (
            <Button label="Desbloquear" loading={candado.verificando} onPress={candado.desbloquear} style={styles.boton} />
          )}
        </View>
      </Sheet>
    );
  }

  return (
    <Sheet
      header={encabezado}
      footer={
        <Button
          label="Guardar"
          loading={guardar.isPending}
          disabled={!conCambios || !valor.trim()}
          onPress={() => void guardarYSalir()}
        />
      }>
      <View onTouchStart={candado.registrarActividad} style={styles.editor}>
        {editorListo ? (
          <Field
            label="Nota de la sesión"
            value={valor}
            onChangeText={(v) => {
              candado.registrarActividad();
              setTexto(v);
            }}
            onScroll={candado.registrarActividad}
            multiline
            autoCapitalize="sentences"
            placeholder="Lo trabajado, acuerdos y tareas."
            helper="Solo tú la ves. Se bloquea al salir de la app o tras 2 minutos sin actividad; lo escrito se guarda antes."
            style={styles.entrada}
          />
        ) : contenido.isError ? (
          <EmptyState title="No se pudo abrir la nota" body="Cierra esta hoja y vuelve a intentarlo." />
        ) : (
          <TraceLine height={40} />
        )}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  cerrada: { alignItems: 'center', gap: space.md, paddingTop: space.xxxl, paddingHorizontal: space.sm },
  circulo: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: tile.consulta.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centrado: { textAlign: 'center' },
  boton: { alignSelf: 'stretch', marginTop: space.sm },
  botonCandado: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: color.quiet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editor: { gap: space.md },
  entrada: { minHeight: 260 },
});
