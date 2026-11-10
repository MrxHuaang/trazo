import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { AppState } from 'react-native';

/** bloqueada: pide identidad · sin-seguridad: el teléfono no tiene bloqueo (aviso) · abierta: contenido visible. */
export type EstadoCandado = 'bloqueada' | 'sin-seguridad' | 'abierta';

const INACTIVIDAD_MS = 2 * 60 * 1000;
const REVISION_MS = 5000;
const SIN_SEGURIDAD: LocalAuthentication.LocalAuthenticationError[] = ['not_enrolled', 'passcode_not_set', 'not_available'];
const CANCELADO: LocalAuthentication.LocalAuthenticationError[] = ['user_cancel', 'system_cancel', 'app_cancel'];

type Verificacion = 'ok' | 'sin-seguridad' | 'demasiados-intentos' | 'cancelada' | 'fallida';

let enCurso: Promise<Verificacion> | null = null;

/** Pide biometría o el código del teléfono. Si ya hay una petición abierta, se reutiliza. */
function verificarIdentidad(): Promise<Verificacion> {
  if (enCurso) return enCurso;
  const peticion = (async (): Promise<Verificacion> => {
    try {
      const nivel = await LocalAuthentication.getEnrolledLevelAsync();
      if (nivel === LocalAuthentication.SecurityLevel.NONE) return 'sin-seguridad';
      const resultado = await LocalAuthentication.authenticateAsync({ promptMessage: 'Abrir nota privada', cancelLabel: 'Cancelar' });
      if (resultado.success) return 'ok';
      if (SIN_SEGURIDAD.includes(resultado.error)) return 'sin-seguridad';
      if (resultado.error === 'lockout') return 'demasiados-intentos';
      return CANCELADO.includes(resultado.error) ? 'cancelada' : 'fallida';
    } catch {
      // Sin módulo de autenticación (p. ej. web): se trata como teléfono sin bloqueo.
      return 'sin-seguridad';
    }
  })();
  enCurso = peticion;
  void peticion.finally(() => {
    if (enCurso === peticion) enCurso = null;
  });
  return peticion;
}

/**
 * Candado de la nota privada (HU-12): pide biometría o el código del teléfono al abrir,
 * y vuelve a bloquear cuando la app deja de estar al frente o tras 2 minutos sin actividad.
 * `alBloquear` se llama justo antes de cerrar, para guardar el borrador y limpiar el contenido.
 */
export function useCandado(alBloquear: () => void) {
  const [estado, setEstado] = useState<EstadoCandado>('bloqueada');
  const [verificando, setVerificando] = useState(true);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const ultimaActividad = useRef(0);

  const aplicar = (verificacion: Verificacion) => {
    setVerificando(false);
    if (verificacion === 'ok') {
      setMensaje(null);
      setEstado('abierta');
    } else if (verificacion === 'sin-seguridad') {
      setEstado('sin-seguridad');
    } else if (verificacion === 'demasiados-intentos') {
      setMensaje('Demasiados intentos. Espera un momento y vuelve a intentar.');
    } else if (verificacion === 'fallida') {
      setMensaje('No se pudo verificar tu identidad. Intenta de nuevo.');
    }
  };

  const cerrar = (motivo: string | null) => {
    alBloquear();
    setMensaje(motivo);
    setEstado('bloqueada');
  };

  const aplicarAlAbrir = useEffectEvent(aplicar);
  const cerrarSolo = useEffectEvent(cerrar);

  // Al abrir la hoja se pide la identidad una vez, sin esperar a que toquen el botón.
  useEffect(() => {
    let vigente = true;
    void verificarIdentidad().then((verificacion) => {
      if (vigente) aplicarAlAbrir(verificacion);
    });
    return () => {
      vigente = false;
    };
  }, []);

  useEffect(() => {
    if (estado !== 'abierta') return;
    ultimaActividad.current = Date.now();
    const suscripcion = AppState.addEventListener('change', (siguiente) => {
      if (siguiente !== 'active') cerrarSolo('Se bloqueó al salir de la app.');
    });
    const reloj = setInterval(() => {
      if (Date.now() - ultimaActividad.current >= INACTIVIDAD_MS) cerrarSolo('Se bloqueó tras 2 minutos sin actividad.');
    }, REVISION_MS);
    return () => {
      suscripcion.remove();
      clearInterval(reloj);
    };
  }, [estado]);

  return {
    estado,
    verificando,
    mensaje,
    desbloquear: () => {
      setMensaje(null);
      setVerificando(true);
      void verificarIdentidad().then(aplicar);
    },
    /** Solo desde el aviso de teléfono sin bloqueo. */
    continuarSinSeguridad: () => setEstado('abierta'),
    bloquear: () => cerrar(null),
    /** Cualquier toque o tecla reinicia la cuenta de inactividad. */
    registrarActividad: () => {
      ultimaActividad.current = Date.now();
    },
  };
}
