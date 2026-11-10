import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { ClockClockwiseIcon } from 'phosphor-react-native/src/icons/ClockClockwise';
import { PhoneIcon } from 'phosphor-react-native/src/icons/Phone';
import { WhatsappLogoIcon } from 'phosphor-react-native/src/icons/WhatsappLogo';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useActualizarSeguimiento, useCrearSeguimiento } from '@/data/hooks';
import type { Seguimiento } from '@/domain/types';
import { sumarDias } from '@/lib/dates';
import { color, radius, space } from '@/theme';
import { Button, Field, Text, ToggleRow } from '@/ui';

import { avisarError, escribirPorWhatsApp, llamarA } from '../dispositivo';
import { DIAS_SEGUIMIENTO, detalleSeguimiento, diaMes, etiquetaDia, fechaPospuesta, mensajeSeguimiento } from '../rules';
import { Accion } from './accion';

type SeguimientoItemProps = {
  seguimiento: Seguimiento;
  hoy: string;
  /** Muestra la acción WhatsApp (en la lista completa). */
  conWhatsApp?: boolean;
  /** "Hecho" abre un panel con nota opcional y la opción de programar otro (RN-08). */
  conNota?: boolean;
  profesional?: string | null;
  last?: boolean;
};

/** Seguimiento pendiente o hecho con sus acciones: Llamar, WhatsApp, Hecho y Posponer 7 días. */
export function SeguimientoItem({ seguimiento: s, hoy, conWhatsApp, conNota, profesional, last }: SeguimientoItemProps) {
  const actualizar = useActualizarSeguimiento();
  const crear = useCrearSeguimiento();
  const [cerrando, setCerrando] = useState(false);
  const [nota, setNota] = useState('');
  const [otro, setOtro] = useState(false);

  const hecho = s.estado === 'hecho';
  const vencido = !hecho && s.fechaObjetivo < hoy;
  const sinTelefono = !s.telefono;

  const marcarHecho = async (conTexto: boolean) => {
    try {
      await actualizar.mutateAsync({
        id: s.id,
        cambios: conTexto ? { estado: 'hecho', nota: nota.trim() ? nota.trim() : null } : { estado: 'hecho' },
      });
      if (conTexto && otro) {
        await crear.mutateAsync({
          nombre: s.nombre,
          telefono: s.telefono,
          fechaObjetivo: sumarDias(hoy, DIAS_SEGUIMIENTO),
          motivo: s.motivo,
          pacienteId: s.pacienteId,
          asistenteId: s.asistenteId,
        });
      }
    } catch (e) {
      avisarError('No se pudo marcar como hecho')(e);
    }
  };

  const posponer = () => {
    actualizar.mutate(
      { id: s.id, cambios: { fechaObjetivo: fechaPospuesta(s.fechaObjetivo, hoy) } },
      { onError: avisarError('No se pudo posponer') },
    );
  };

  return (
    <View style={[styles.item, !last && styles.divisor]}>
      <View style={styles.cabecera}>
        <Text variant="mono" tone={vencido ? color.danger : color.inkSoft} style={styles.lead}>
          {hecho ? diaMes(s.fechaObjetivo) : etiquetaDia(s.fechaObjetivo, hoy)}
        </Text>
        <View style={styles.textos}>
          <Text variant="bodyMedium" numberOfLines={1}>
            {s.nombre}
          </Text>
          <Text variant="caption" tone={color.inkSoft} numberOfLines={3}>
            {detalleSeguimiento(s, hoy)}
          </Text>
        </View>
      </View>

      {!hecho && !cerrando ? (
        <View style={styles.acciones}>
          <Accion
            label="Llamar"
            icon={PhoneIcon}
            onPress={() => llamarA(s.telefono)}
            disabled={sinTelefono}
            accessibilityLabel={`Llamar a ${s.nombre}`}
            accessibilityHint={sinTelefono ? 'No tiene teléfono registrado' : undefined}
          />
          {conWhatsApp ? (
            <Accion
              label="WhatsApp"
              icon={WhatsappLogoIcon}
              onPress={() => escribirPorWhatsApp(s.telefono, mensajeSeguimiento(s.nombre, profesional))}
              disabled={sinTelefono}
              accessibilityLabel={`Escribir a ${s.nombre} por WhatsApp`}
              accessibilityHint={sinTelefono ? 'No tiene teléfono registrado' : 'Abre WhatsApp con un saludo listo'}
            />
          ) : null}
          <Accion
            label="Hecho"
            icon={CheckIcon}
            onPress={() => (conNota ? setCerrando(true) : void marcarHecho(false))}
            disabled={actualizar.isPending}
            accessibilityLabel={`Marcar hecho el seguimiento de ${s.nombre}`}
          />
          <Accion
            label="Posponer 7 días"
            icon={ClockClockwiseIcon}
            onPress={posponer}
            disabled={actualizar.isPending}
            accessibilityLabel={`Posponer 7 días el seguimiento de ${s.nombre}`}
          />
        </View>
      ) : null}

      {cerrando ? (
        <View style={styles.panel}>
          <Field
            label="Nota (opcional)"
            value={nota}
            onChangeText={setNota}
            multiline
            style={styles.nota}
            helper="Queda en el seguimiento. No aparece en el informe."
            autoFocus
          />
          <ToggleRow
            label="Programar otro en 7 días"
            description="Crea un nuevo seguimiento para la misma persona."
            value={otro}
            onChange={setOtro}
          />
          <View style={styles.botones}>
            <Button label="Cancelar" variant="ghost" size="sm" onPress={() => setCerrando(false)} />
            <Button
              label="Marcar hecho"
              size="sm"
              onPress={() => void marcarHecho(true)}
              loading={actualizar.isPending || crear.isPending}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { paddingVertical: space.md, gap: space.sm },
  divisor: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
  cabecera: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  lead: { width: 52, paddingTop: 2 },
  textos: { flex: 1, gap: 2 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, paddingLeft: 52 + space.md },
  panel: {
    gap: space.sm,
    padding: space.lg,
    borderRadius: radius.field,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
  },
  nota: { minHeight: 84 },
  botones: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm },
});
