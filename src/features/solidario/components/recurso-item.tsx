import { PhoneIcon } from 'phosphor-react-native/src/icons/Phone';
import { ShareNetworkIcon } from 'phosphor-react-native/src/icons/ShareNetwork';
import { StyleSheet, View } from 'react-native';

import type { Recurso } from '@/domain/types';
import { formatoTelefono } from '@/lib/format';
import { color, space } from '@/theme';
import { Text, Tile } from '@/ui';

import { compartirTexto, llamarA } from '../dispositivo';
import { textoRecurso } from '../rules';
import { Accion } from './accion';

/** Línea de ayuda: nombre, para qué sirve, número y acciones Llamar y Compartir. */
export function RecursoItem({ recurso: r }: { recurso: Recurso }) {
  const numeros = [
    r.telefono ? formatoTelefono(r.telefono) : null,
    r.whatsapp ? `WhatsApp ${formatoTelefono(r.whatsapp)}` : null,
  ].filter(Boolean);

  return (
    <Tile tone="neutral" contentStyle={styles.contenido}>
      <View style={styles.textos}>
        <Text variant="bodyMedium">{r.titulo}</Text>
        {r.descripcion ? (
          <Text variant="caption" tone={color.inkSoft}>
            {r.descripcion}
          </Text>
        ) : null}
        {numeros.length ? (
          <Text variant="mono" tone={color.inkSoft}>
            {numeros.join('  ·  ')}
          </Text>
        ) : null}
      </View>
      <View style={styles.acciones}>
        {r.telefono ? (
          <Accion label="Llamar" icon={PhoneIcon} onPress={() => llamarA(r.telefono)} accessibilityLabel={`Llamar a ${r.titulo}`} />
        ) : null}
        <Accion
          label="Compartir"
          icon={ShareNetworkIcon}
          onPress={() => compartirTexto(textoRecurso(r), r.titulo)}
          accessibilityLabel={`Compartir ${r.titulo}`}
          accessibilityHint="Abre las opciones para enviarla, por ejemplo por WhatsApp"
        />
      </View>
    </Tile>
  );
}

const styles = StyleSheet.create({
  contenido: { gap: space.md },
  textos: { gap: 2 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
