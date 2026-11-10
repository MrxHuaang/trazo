/**
 * Aviso local antes de cada cita (HU-07). Sin nombres ni motivos en el texto (RN-10).
 * Las notificaciones locales funcionan en Expo Go (las push remotas no, y no se usan).
 * Si la profesional niega el permiso, la app sigue igual, solo que sin avisos.
 */
import * as Notifications from 'expo-notifications';
import { AndroidImportance, IosAuthorizationStatus } from 'expo-notifications';
import { Platform } from 'react-native';

import type { CitaConPaciente } from '@/domain/types';

export const MINUTOS_ANTES = 15;
const CANAL = 'citas';
const disponible = Platform.OS === 'ios' || Platform.OS === 'android';

const idAviso = (citaId: string) => `cita-${citaId}`;

let handlerListo = false;

/** Muestra el aviso también con la app abierta. Se puede llamar varias veces. */
export function configurarAvisos() {
  if (!disponible || handlerListo) return;
  handlerListo = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

let canal: Promise<unknown> | null = null;

/** Android 13+ solo muestra la solicitud de permiso si ya existe un canal. Sin vibración fuerte (calma por diseño). */
function asegurarCanal() {
  if (Platform.OS !== 'android') return Promise.resolve();
  canal ??= Notifications.setNotificationChannelAsync(CANAL, {
    name: 'Citas',
    description: 'Aviso 15 minutos antes de cada cita.',
    importance: AndroidImportance.DEFAULT,
    enableVibrate: false,
    showBadge: false,
  }).catch(() => {
    canal = null;
  });
  return canal;
}

async function tienePermiso() {
  const actual = await Notifications.getPermissionsAsync();
  return actual.granted || actual.ios?.status === IosAuthorizationStatus.PROVISIONAL;
}

/** Pide el permiso la primera vez. Devuelve false si no se concede (sin insistir). */
export async function pedirPermiso(): Promise<boolean> {
  if (!disponible) return false;
  try {
    await asegurarCanal();
    if (await tienePermiso()) return true;
    const actual = await Notifications.getPermissionsAsync();
    if (!actual.canAskAgain) return false;
    const respuesta = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
    return respuesta.granted;
  } catch {
    return false;
  }
}

async function agendarAviso(citaId: string, fecha: Date) {
  await Notifications.scheduleNotificationAsync({
    identifier: idAviso(citaId),
    content: {
      title: 'Tienes una cita pronto',
      body: `Empieza en ${MINUTOS_ANTES} minutos.`,
      data: { citaId },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fecha, channelId: CANAL },
  });
}

const fechaAviso = (inicioIso: string) => new Date(new Date(inicioIso).getTime() - MINUTOS_ANTES * 60_000);

/**
 * Programa (o reprograma) el aviso 15 min antes del inicio. Si ese momento ya pasó, no programa nada.
 * Nunca lanza: un fallo del aviso no debe impedir guardar la cita.
 */
export async function programarAviso(citaId: string, inicioIso: string): Promise<boolean> {
  if (!disponible) return false;
  try {
    configurarAvisos();
    await cancelarAviso(citaId);
    const fecha = fechaAviso(inicioIso);
    if (fecha.getTime() <= Date.now()) return false;
    if (!(await pedirPermiso())) return false;
    await agendarAviso(citaId, fecha);
    return true;
  } catch {
    return false;
  }
}

export async function cancelarAviso(citaId: string) {
  if (!disponible) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(idAviso(citaId));
  } catch {
    // Sin aviso que cancelar.
  }
}

/**
 * Alinea los avisos con las citas dadas sin pedir permiso: programa los que faltan para citas
 * confirmadas futuras y quita los de citas que ya no están confirmadas. Cubre las citas de la demo
 * y las que otros módulos confirman.
 */
export async function sincronizarAvisos(citas: CitaConPaciente[]) {
  if (!disponible) return;
  try {
    if (!(await tienePermiso())) return;
    configurarAvisos();
    await asegurarCanal();
    const programados = new Set((await Notifications.getAllScheduledNotificationsAsync()).map((n) => n.identifier));
    for (const c of citas) {
      const id = idAviso(c.id);
      const fecha = fechaAviso(c.inicio);
      if (c.estado === 'confirmada' && fecha.getTime() > Date.now()) {
        if (!programados.has(id)) await agendarAviso(c.id, fecha);
      } else if (programados.has(id)) {
        await cancelarAviso(c.id);
      }
    }
  } catch {
    // Los avisos son un apoyo; la agenda funciona sin ellos.
  }
}

configurarAvisos();
