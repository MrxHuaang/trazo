/**
 * RN-03: los cupos solidarios se cuentan por semana calendario (lunes a domingo)
 * y superarlos requiere confirmación explícita.
 *
 * Lo usa el módulo agenda al crear o marcar una cita como solidaria:
 *   if (esSolidaria && !(await confirmarCupoSolidario(fechaClave(inicio)))) return;
 */
import { Alert } from 'react-native';

import { contarSolidariasSemana } from '@/data/repos/citas';
import { obtenerConsultorio } from '@/data/repos/consultorio';

import { plural } from './rules';

/**
 * Resuelve `true` si hay cupo o si la profesional decide continuar; `false` si cancela.
 * @param clave 'yyyy-MM-dd' (hora de Colombia) de la cita.
 * @param descontar citas solidarias de esa semana que no deben contarse (p. ej. la misma cita al editarla).
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
