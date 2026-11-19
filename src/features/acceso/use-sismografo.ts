// Movimiento del teléfono convertido en energía del Trazo (expo-sensors viene en Expo Go).
// Las muestras van directo a un SharedValue y no a estado de React, para no re-renderizar 30 veces por segundo.
import { Accelerometer, type AccelerometerMeasurement } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Easing, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { useEstadoApp } from '@/features/acceso/use-estado-app';

// Unas 30 muestras por segundo: se ve fluido sin gastar batería de más.
const INTERVALO_MS = 33;
// Filtro paso bajo para estimar la gravedad; entre más bajo, más lento sigue al sensor.
const SEGUIR_GRAVEDAD = 0.08;
// En g. Por debajo es ruido del sensor o el pulso de la mano.
const PISO = 0.012;
// En g. Desde aquí ya es energía máxima.
const TECHO = 0.5;
// Sube rápido y baja despacio: se agita al instante y se calma con suavidad.
const SUBIDA = 0.55;
const BAJADA = 0.07;

type Opciones = {
  /** Solo escucha el sensor mientras es true. */
  activo?: boolean;
  /** Energía inicial, para que el Trazo entre agitado y se calme solo. */
  impulso?: number;
};

export type Sismografo = {
  /** De 0 a 1; va tal cual a `<TraceLine energia>`. */
  energia: SharedValue<number>;
  /** null mientras consulta; false en web o sin acelerómetro. */
  disponible: boolean | null;
};

/** Pura y exportada para poder probarla sin sensor. */
export function energiaDelMovimiento(movimientoEnG: number) {
  const sobrante = Math.max(0, movimientoEnG - PISO) / TECHO;
  // El exponente 0.6 realza los movimientos pequeños para que un balanceo suave ya se note.
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
      // Dividir por la gravedad estimada evita depender de la unidad que entregue el sensor.
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
