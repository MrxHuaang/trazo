import { PhoneIcon } from 'phosphor-react-native/src/icons/Phone';
import { ShareNetworkIcon } from 'phosphor-react-native/src/icons/ShareNetwork';
import { View } from 'react-native';

import type { Recurso } from '@/domain/types';
import { formatoTelefono } from '@/lib/format';
import { color } from '@/theme';
import { Text, Tile } from '@/ui';

import { compartirTexto, llamarA } from '../dispositivo';
import { textoRecurso } from '../rules';
import { Accion, BotonIcono } from './accion';

/** Línea de ayuda: nombre, para qué sirve, Llamar (con el número) y Compartir. */
export function RecursoItem({ recurso: r }: { recurso: Recurso }) {
  return (
    <Tile tone="neutral" contentClassName="gap-3">
      <View className="gap-0.5">
        <Text variant="bodyMedium">{r.titulo}</Text>
        {r.descripcion ? (
          <Text variant="caption" className="text-ink-soft">
            {r.descripcion}
          </Text>
        ) : null}
        {r.whatsapp ? (
          <Text variant="mono" className="text-ink-soft">
            {`WhatsApp ${formatoTelefono(r.whatsapp)}`}
          </Text>
        ) : null}
      </View>
      <View className="flex-row items-center gap-2">
        {r.telefono ? (
          <Accion
            label={`Llamar al ${formatoTelefono(r.telefono)}`}
            icon={PhoneIcon}
            onPress={() => llamarA(r.telefono)}
            accessibilityLabel={`Llamar a ${r.titulo}`}
            className="flex-1"
          />
        ) : null}
        <BotonIcono
          icon={ShareNetworkIcon}
          label={`Compartir ${r.titulo}`}
          onPress={() => compartirTexto(textoRecurso(r), r.titulo)}
          tone={color.accent}
        />
      </View>
    </Tile>
  );
}
