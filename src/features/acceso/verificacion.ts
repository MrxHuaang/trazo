/**
 * Verificación de identidad con expo-local-authentication (HU-01, RNF-01).
 * En Expo Go para iPhone Face ID no está disponible: el sistema pide el código del teléfono.
 * En Android la huella funciona en Expo Go; el PIN o patrón queda como respaldo.
 */
import * as LocalAuthentication from 'expo-local-authentication';

export type ResultadoVerificacion =
  | { tipo: 'ok' }
  /** El teléfono no tiene huella, rostro ni código configurado: se permite entrar con aviso. */
  | { tipo: 'sin-proteccion' }
  | { tipo: 'cancelado' }
  | { tipo: 'error'; mensaje: string };

let enCurso = false;

/**
 * Hay un diálogo de verificación abierto. En Android el PIN abre otra pantalla y la app pasa
 * a segundo plano; ese viaje no debe contar como "salir de la app".
 */
export const verificacionEnCurso = () => enCurso;

/** El teléfono tiene al menos un código, PIN o patrón configurado (o biometría). */
export async function telefonoProtegido(): Promise<boolean> {
  try {
    const nivel = await LocalAuthentication.getEnrolledLevelAsync();
    return nivel !== LocalAuthentication.SecurityLevel.NONE;
  } catch {
    // Web o plataforma sin el módulo nativo.
    return false;
  }
}

export async function verificarIdentidad(): Promise<ResultadoVerificacion> {
  if (enCurso) return { tipo: 'cancelado' };
  if (!(await telefonoProtegido())) return { tipo: 'sin-proteccion' };

  enCurso = true;
  try {
    const resultado = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquear Trazo',
      fallbackLabel: 'Usar código',
      cancelLabel: 'Cancelar',
    });
    if (resultado.success) return { tipo: 'ok' };

    switch (resultado.error) {
      case 'not_enrolled':
      case 'passcode_not_set':
      case 'not_available':
        return { tipo: 'sin-proteccion' };
      case 'user_cancel':
      case 'system_cancel':
      case 'app_cancel':
      case 'user_fallback':
        return { tipo: 'cancelado' };
      case 'lockout':
        return {
          tipo: 'error',
          mensaje: 'Hubo demasiados intentos. Bloquea y desbloquea el teléfono con tu código y vuelve a intentarlo.',
        };
      default:
        return { tipo: 'error', mensaje: 'No pudimos verificar que eres tú. Intenta de nuevo.' };
    }
  } catch {
    return { tipo: 'error', mensaje: 'No pudimos abrir la verificación del teléfono. Intenta de nuevo.' };
  } finally {
    enCurso = false;
  }
}
