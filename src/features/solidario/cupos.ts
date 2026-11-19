// RN-03: los cupos se cuentan por semana (lunes a domingo) y pasarse pide confirmación.
import { Alert } from 'react-native';

import { contarSolidariasSemana } from '@/data/repos/citas';
import { obtenerConsultorio } from '@/data/repos/consultorio';

import { plural } from './rules';

/**
 * `true` si hay cupo o si la profesional decide seguir igual.
 * `descontar` sirve al editar, para no contar la misma cita dos veces.
 */
export async function confirmarCupoSolidario(clave: string, descontar = 0): Promise<boolean> {
  const [contadas, consultorio] = await Promise.all([contarSolidariasSemana(clave), obtenerConsultorio()]);
  const usados = Math.max(contadas - descontar, 0);
  const total = consultorio?.cuposSolidariosSemana ?? 0;
  if (usados < total) return true;

  return new Promise((resolve) => {
    Alert.alert(
      'Cupos solidarios completos',
      `Esa semana ya ${plural(usados, 'tiene 1 cita solidaria', `tiene ${usados} citas solidarias`)} de ${total} ${plural(
        total,
        'cupo',
        'cupos',
      )}. Puedes agendarla igual si lo decides.`,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Agendar de todos modos', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
