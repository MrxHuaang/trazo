import Constants from 'expo-constants';
import { router } from 'expo-router';
import { CalendarBlankIcon } from 'phosphor-react-native/src/icons/CalendarBlank';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { DatabaseIcon } from 'phosphor-react-native/src/icons/Database';
import { HandHeartIcon } from 'phosphor-react-native/src/icons/HandHeart';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { WhatsappLogoIcon } from 'phosphor-react-native/src/icons/WhatsappLogo';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useActualizarConsultorio, useConsultorio } from '@/data/hooks';
import type { Consultorio } from '@/domain/types';
import { formatoCOP } from '@/lib/format';
import { color, radius, space, tile } from '@/theme';
import { Segmented, SolidarioMark, Text, Tile, ToggleRow, TraceLine } from '@/ui';

import { useBorrarTodo, useCargarDemo } from '../hooks';
import { abrirSesion } from '../sesion';
import { useTelefonoProtegido } from '../use-telefono-protegido';
import { pesosDesdeTexto, pesosEnEdicion, validarCampo } from '../validacion';
import { verificarIdentidad } from '../verificacion';
import { AccionConfirmada, FilaEnlace, Seccion, ValorEditable } from './piezas';

type Campo = 'nombre' | 'profesional' | 'correo' | 'tarifaBase' | 'tarifaSocial';
type Confirmacion = 'demo' | 'borrar';

const DURACIONES = [30, 45, 50, 60, 90];

/** Ajustes: datos del consultorio editables en línea, seguridad, accesos y datos del teléfono. */
export function AjustesScreen() {
  const { data: consultorio } = useConsultorio();
  const actualizar = useActualizarConsultorio();
  const cargarDemo = useCargarDemo();
  const borrarTodo = useBorrarTodo();
  const telefonoProtegido = useTelefonoProtegido();

  const [editando, setEditando] = useState<Campo | null>(null);
  const [confirmando, setConfirmando] = useState<Confirmacion | null>(null);
  const [errorBloqueo, setErrorBloqueo] = useState<string | null>(null);

  const volver = () => (router.canGoBack() ? router.back() : router.replace('/'));

  // Sin consultorio (recién borrado) el AccessGate ya está llevando a la bienvenida.
  if (!consultorio) return <View style={styles.root} />;

  const guardar = (cambios: Partial<Omit<Consultorio, 'id' | 'creadoEn'>>) => actualizar.mutateAsync(cambios);
  const abrir = (campo: Campo) => () => {
    setConfirmando(null);
    setEditando(campo);
  };
  const cerrar = () => setEditando(null);

  const validarTarifa = (campo: 'tarifaBase' | 'tarifaSocial') => (texto: string) => {
    const valor = pesosDesdeTexto(texto);
    const error = validarCampo(campo, valor);
    if (error) return error;
    if (campo === 'tarifaSocial' && valor > consultorio.tarifaBase) return 'La tarifa social no puede superar la tarifa base.';
    if (campo === 'tarifaBase' && valor < consultorio.tarifaSocial) return 'La tarifa base no puede quedar por debajo de la tarifa social.';
    return null;
  };

  // Activar o quitar el bloqueo pide verificar identidad, para que nadie más lo cambie.
  const cambiarBloqueo = async (activo: boolean) => {
    setErrorBloqueo(null);
    const resultado = await verificarIdentidad();
    if (resultado.tipo === 'cancelado') return;
    if (resultado.tipo === 'error') {
      setErrorBloqueo(resultado.mensaje);
      return;
    }
    // La sesión queda abierta: activar el bloqueo no debe bloquear la pantalla en la que se está.
    abrirSesion();
    actualizar.mutate(
      { bloqueoActivo: activo },
      { onError: () => setErrorBloqueo('No pudimos guardar el cambio. Intenta de nuevo.') },
    );
  };

  const duraciones = [...new Set([...DURACIONES, consultorio.duracionCita])].sort((a, b) => a - b);
  const version = Constants.expoConfig?.version;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={volver}
            style={({ pressed }) => [styles.volver, pressed && styles.presionado]}>
            <CaretLeftIcon size={22} color={color.ink} />
          </Pressable>

          <Text variant="display" accessibilityRole="header">
            Ajustes
          </Text>

          {/* Consultorio: la identidad va en un bloque y cada dato se edita donde está. */}
          <Tile tone="consulta" style={styles.identidad}>
            <TraceLine height={24} agitation={0.7} calmFrom={0.3} animate={false} />
            <Text variant="title" tone={tile.consulta.fg}>
              {consultorio.nombre}
            </Text>
            <Text variant="bodyMedium" tone={tile.consulta.fg}>
              {consultorio.profesional}
            </Text>
          </Tile>

          <Seccion titulo="Consultorio" nota="Toca un dato para cambiarlo.">
            <ValorEditable
              etiqueta="Nombre del consultorio"
              valor={consultorio.nombre}
              abierto={editando === 'nombre'}
              onAbrir={abrir('nombre')}
              editor={{
                inicial: consultorio.nombre,
                validar: (t) => validarCampo('nombre', t),
                guardar: (t) => guardar({ nombre: t.trim() }),
                onCerrar: cerrar,
                campo: { autoCapitalize: 'words', maxLength: 80 },
              }}
            />
            <ValorEditable
              etiqueta="Profesional"
              valor={consultorio.profesional}
              abierto={editando === 'profesional'}
              onAbrir={abrir('profesional')}
              editor={{
                inicial: consultorio.profesional,
                validar: (t) => validarCampo('profesional', t),
                guardar: (t) => guardar({ profesional: t.trim() }),
                onCerrar: cerrar,
                campo: { autoCapitalize: 'words', maxLength: 80 },
              }}
            />
            <ValorEditable
              etiqueta="Correo"
              valor={consultorio.correo ?? ''}
              vacio="Sin correo"
              abierto={editando === 'correo'}
              onAbrir={abrir('correo')}
              editor={{
                inicial: consultorio.correo ?? '',
                validar: (t) => validarCampo('correo', t),
                guardar: (t) => guardar({ correo: t.trim() || null }),
                onCerrar: cerrar,
                helper: 'Opcional. Se guarda solo en este teléfono.',
                campo: { keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false, maxLength: 120 },
              }}
            />
            <ValorEditable
              etiqueta="Tarifa base por sesión"
              valor={formatoCOP(consultorio.tarifaBase)}
              variante="mono"
              abierto={editando === 'tarifaBase'}
              onAbrir={abrir('tarifaBase')}
              editor={{
                inicial: pesosEnEdicion(String(consultorio.tarifaBase)),
                formatear: pesosEnEdicion,
                validar: validarTarifa('tarifaBase'),
                guardar: (t) => guardar({ tarifaBase: pesosDesdeTexto(t) }),
                onCerrar: cerrar,
                helper: 'En pesos colombianos (COP).',
                campo: { keyboardType: 'number-pad' },
              }}
            />
            <ValorEditable
              etiqueta="Tarifa social por sesión"
              valor={formatoCOP(consultorio.tarifaSocial)}
              variante="mono"
              abierto={editando === 'tarifaSocial'}
              onAbrir={abrir('tarifaSocial')}
              editor={{
                inicial: pesosEnEdicion(String(consultorio.tarifaSocial)),
                formatear: pesosEnEdicion,
                validar: validarTarifa('tarifaSocial'),
                guardar: (t) => guardar({ tarifaSocial: pesosDesdeTexto(t) }),
                onCerrar: cerrar,
                helper: 'En pesos colombianos (COP). Aplica a pacientes con tarifa social.',
                campo: { keyboardType: 'number-pad' },
              }}
            />
            <View style={styles.duracion}>
              <Text variant="caption" tone={color.inkSoft}>
                Duración de cada cita
              </Text>
              <Segmented
                accessibilityLabel="Duración de cada cita"
                options={duraciones.map((m) => ({ valor: String(m), etiqueta: `${m} min` }))}
                value={String(consultorio.duracionCita)}
                onChange={(valor) => {
                  if (Number(valor) !== consultorio.duracionCita) actualizar.mutate({ duracionCita: Number(valor) });
                }}
              />
              <Text variant="caption" tone={color.inkSoft}>
                Se usa en las citas nuevas; las que ya están agendadas no cambian.
              </Text>
            </View>
          </Seccion>

          <Seccion titulo="Seguridad">
            <ToggleRow
              label="Bloqueo al abrir"
              description="Pide tu huella, tu rostro o el código del teléfono al abrir Trazo y al volver después de 2 minutos."
              value={consultorio.bloqueoActivo}
              onChange={(valor) => void cambiarBloqueo(valor)}
            />
            {errorBloqueo ? (
              <Text variant="label" tone={color.danger} accessibilityLiveRegion="polite">
                {errorBloqueo}
              </Text>
            ) : telefonoProtegido === false ? (
              <Text variant="caption" tone={color.inkSoft}>
                Este teléfono no tiene código, huella ni rostro configurado. Hasta que lo configures en los ajustes del
                teléfono, Trazo avisará pero dejará entrar sin verificar.
              </Text>
            ) : null}
          </Seccion>

          <Seccion titulo="Agenda y programa">
            <FilaEnlace
              icono={<CalendarBlankIcon size={20} color={color.ink} />}
              titulo="Disponibilidad"
              detalle="Días y horas en los que atiendes"
              onPress={() => router.push('/ajustes/disponibilidad')}
            />
            <FilaEnlace
              icono={<WhatsappLogoIcon size={20} color={color.ink} />}
              titulo="Mensajes de WhatsApp"
              detalle="Recordatorio y confirmación de citas"
              onPress={() => router.push('/ajustes/plantillas')}
            />
            <FilaEnlace
              icono={<HandHeartIcon size={20} color={color.ink} />}
              titulo="Programa solidario"
              marca={<SolidarioMark />}
              detalle={
                consultorio.cuposSolidariosSemana === 1
                  ? '1 cupo solidario por semana'
                  : `${consultorio.cuposSolidariosSemana} cupos solidarios por semana`
              }
              onPress={() => router.push('/ajustes/cupos')}
              ultimo
            />
          </Seccion>

          <Seccion titulo="Datos" nota="Todo se guarda solo en este teléfono.">
            <AccionConfirmada
              icono={<DatabaseIcon size={20} color={color.ink} />}
              titulo="Cargar datos de demostración"
              detalle="Pacientes, citas y jornadas ficticias para recorrer la app"
              aviso="Se reemplaza todo lo que hay en Trazo por los datos de demostración: consultorio, pacientes, citas, pagos y jornadas. No se puede deshacer."
              confirmar="Reemplazar todo"
              abierta={confirmando === 'demo'}
              onAbrir={() => {
                setEditando(null);
                cargarDemo.reset();
                setConfirmando('demo');
              }}
              onCerrar={() => setConfirmando(null)}
              onConfirmar={() =>
                cargarDemo.mutate(undefined, {
                  onSuccess: () => (router.canDismiss() ? router.dismissAll() : router.replace('/')),
                })
              }
              cargando={cargarDemo.isPending}
              error={cargarDemo.isError ? 'No pudimos cargar la demostración. Intenta de nuevo.' : null}
            />
            <AccionConfirmada
              icono={<TrashIcon size={20} color={color.danger} />}
              titulo="Borrar todos los datos"
              detalle="Deja Trazo como recién instalado"
              aviso="Se borran el consultorio, los pacientes, las citas, las notas, los pagos y las jornadas de este teléfono. No hay copia: no se puede deshacer."
              confirmar="Borrar todo"
              destructiva
              abierta={confirmando === 'borrar'}
              onAbrir={() => {
                setEditando(null);
                borrarTodo.reset();
                setConfirmando('borrar');
              }}
              onCerrar={() => setConfirmando(null)}
              onConfirmar={() => borrarTodo.mutate()}
              cargando={borrarTodo.isPending}
              error={borrarTodo.isError ? 'No pudimos borrar los datos. Intenta de nuevo.' : null}
              ultimo
            />
          </Seccion>

          <Seccion titulo="Acerca de">
            <View style={styles.acerca}>
              <View style={styles.version}>
                <Text variant="bodyMedium">Trazo</Text>
                {version ? (
                  <Text variant="mono" tone={color.inkSoft}>
                    v{version}
                  </Text>
                ) : null}
              </View>
              <Text variant="body">Todos los datos de esta versión son ficticios.</Text>
              <Text variant="caption" tone={color.inkSoft}>
                Proyecto académico. Si algún día se usa con pacientes reales, la Ley 1581 de 2012 exige su autorización
                previa, expresa e informada para tratar datos de salud, y les da derecho a conocer, actualizar, rectificar
                y suprimir sus datos. Esta nota no es asesoría legal.
              </Text>
            </View>
          </Seccion>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  contenido: { paddingHorizontal: space.xl, paddingTop: space.sm, paddingBottom: space.xxxl * 2 },
  volver: {
    width: 44,
    height: 44,
    marginLeft: -space.sm,
    marginBottom: space.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presionado: { opacity: 0.6 },
  identidad: { marginTop: space.lg },
  duracion: { gap: space.sm, paddingVertical: space.md },
  acerca: { gap: space.sm, paddingVertical: space.sm },
  version: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
});
