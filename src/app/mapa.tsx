import { useLocalSearchParams } from 'expo-router';

import { ElegirPuntoScreen } from '@/features/solidario/mapa/elegir-punto-screen';
import { MapaScreen } from '@/features/solidario/mapa/mapa-screen';

/**
 * Mapa solidario. `?jornada=<id>` centra esa jornada; `?elegir=1` lo abre desde el formulario
 * de jornada para escoger la ubicación.
 */
export default function MapaRoute() {
  const { jornada, elegir } = useLocalSearchParams<{ jornada?: string; elegir?: string }>();
  if (elegir === '1') return <ElegirPuntoScreen />;
  return <MapaScreen jornadaId={jornada} />;
}
