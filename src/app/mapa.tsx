import { useLocalSearchParams } from 'expo-router';

import { ElegirPuntoScreen } from '@/features/solidario/mapa/elegir-punto-screen';
import { MapaScreen } from '@/features/solidario/mapa/mapa-screen';

/**
 * Mapa solidario: jornadas, sismos recientes y la ubicación propia.
 * `?jornada=<id>` centra una jornada · `?elegir=1` abre el modo para ubicar una jornada (desde su formulario).
 */
export default function MapaRoute() {
  const { jornada, elegir } = useLocalSearchParams<{ jornada?: string; elegir?: string }>();
  if (elegir === '1') return <ElegirPuntoScreen />;
  return <MapaScreen jornadaId={jornada} />;
}
