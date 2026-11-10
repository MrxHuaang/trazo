/**
 * Sismógrafo vivo: convierte el movimiento real del teléfono en la energía del Trazo.
 *
 * Lee el acelerómetro (expo-sensors, incluido en Expo Go), separa la gravedad del movimiento y
 * escribe una energía de 0 (quieto) a 1 (sacudida) en un SharedValue de Reanimated. Las muestras
 * nunca pasan por estado de React: van del sensor directo al hilo de la interfaz.
 */
import { Accelerometer, type AccelerometerMeasurement } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Easing, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { useEstadoApp } from '@/features/acceso/use-estado-app';

/** Milisegundos entre muestras (unas 30 por segundo: fluido y sin gastar batería de más). */
const INTERVALO_MS = 33;
/** Qué tan rápido la estimación de gravedad sigue al sensor (más bajo = más lento). */
const SEGUIR_GRAVEDAD = 0.08;
/** Movimiento, en g, que se ignora: ruido del sensor y pulso de la mano. */
const PISO = 0.012;
/** Movimiento, en g, que ya cuenta como energía máxima. */
const TECHO = 0.5;
/** La energía sube rápido y baja despacio: el Trazo se agita al instante y se calma con suavidad. */
const SUBIDA = 0.55;
const BAJADA = 0.07;

type Opciones = {
  /** Se suscribe al sensor solo mientras es verdadero (pantalla visible). */
  activo?: boolean;
  /** Energía con la que arranca: el Trazo entra agitado y se calma solo. */
  impulso?: number;
};

export type Sismografo = {
  /** Energía del movimiento, de 0 a 1. Se le pasa tal cual a `<TraceLine energia>`. */
  energia: SharedValue<number>;
  /** null mientras se consulta; false en web o en dispositivos sin acelerómetro (la energía se queda en 0). */
  disponible: boolean | null;
};

/** Movimiento sin gravedad, de 0 a 1. Es una función pura para poder razonarla y probarla. */
export function energiaDelMovimiento(movimientoEnG: number) {
  const sobrante = Math.max(0, movimientoEnG - PISO) / TECHO;
  // La raíz realza los movimientos pequeños: un balanceo suave ya se nota en el Trazo.
  return Math.min(1, Math.pow(sobrante, 0.6));
}

export function useSismografo({ activo = true, impulso = 0 }: Opciones = {}): Sismografo {
  const energia = useSharedValue(activo ? impulso : 0);
  const [disponible, setDisponible] = useState<boolean | null>(Platform.OS === 'web' ? false : null);
  const visible = useEstadoApp() === 'active';
  const yaArranco = useRef(false);

  useEffect(() => {
    const calmar = () => energia.set(withTiming(0, { duration: 1200, easing: Easing.out(Easing.cubic) }));

    if (!activo || !visible || Platform.OS === 'web') {
      calmar();
      return;
    }

    let vigente = true;
    let suscripcion: { remove: () => void } | null = null;
    // La primera vez la energía parte del impulso; después, de la calma.
    let suave = yaArranco.current ? 0 : impulso;
    yaArranco.current = true;
    let gx = 0;
    let gy = 0;
    let gz = 0;
    let hayGravedad = false;

    const alMedir = ({ x, y, z }: AccelerometerMeasurement) => {
      if (!hayGravedad) {
        gx = x;
        gy = y;
        gz = z;
        hayGravedad = true;
      } else {
        gx += (x - gx) * SEGUIR_GRAVEDAD;
        gy += (y - gy) * SEGUIR_GRAVEDAD;
        gz += (z - gz) * SEGUIR_GRAVEDAD;
      }
      // Se divide por la gravedad estimada para no depender de la unidad que entregue el sensor.
      const gravedad = Math.hypot(gx, gy, gz) || 1;
      const movimiento = Math.hypot(x - gx, y - gy, z - gz) / gravedad;
      const cruda = energiaDelMovimiento(movimiento);
      suave += (cruda - suave) * (cruda > suave ? SUBIDA : BAJADA);
      energia.set(withTiming(suave, { duration: INTERVALO_MS * 1.5, easing: Easing.linear }));
    };

    Accelerometer.isAvailableAsync()
      .then((hay) => {
        if (!vigente) return;
        setDisponible(hay);
        if (!hay) {
          calmar();
          return;
        }
        Accelerometer.setUpdateInterval(INTERVALO_MS);
        suscripcion = Accelerometer.addListener(alMedir);
      })
      .catch(() => {
        if (!vigente) return;
        setDisponible(false);
        calmar();
      });

    return () => {
      vigente = false;
      suscripcion?.remove();
    };
  }, [activo, visible, impulso, energia]);

  return { energia, disponible };
}
