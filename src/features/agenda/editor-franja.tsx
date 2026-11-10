import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Disponibilidad, Modalidad } from '@/domain/types';
import { color, radius, space } from '@/theme';
import { Button, Segmented, Text } from '@/ui';

import { BotonIcono } from './boton-icono';
import { confirmar } from './confirmar';
import { useBorrarFranja, useGuardarFranja } from './hooks';
import { aHora, aMinutos, MODALIDADES, NOMBRES_DIA, PASO_MIN, seCruzan, VENTANA_FIN, VENTANA_INICIO } from './rules';
import { HoraTira } from './selectores';

type Props = {
  /** 1 = lunes … 7 = domingo */
  dia: number;
  /** Franja que se edita; sin ella se crea una nueva. */
  franja?: Disponibilidad;
  /** Las demás franjas del mismo día, para avisar si se cruzan. */
  otras: Disponibilidad[];
  onCerrar: () => void;
};

const horasEntre = (desde: number, hasta: number) => {
  const res: string[] = [];
  for (let m = desde; m <= hasta; m += PASO_MIN) res.push(aHora(m));
  return res;
};

/** Primer tramo libre razonable para una franja nueva: después de la última, o 8:00 a 12:00. */
function sugerir(otras: Disponibilidad[]) {
  const ultimoFin = Math.max(0, ...otras.map((f) => aMinutos(f.horaFin)));
  const ini = otras.length && ultimoFin + 120 <= VENTANA_FIN - 60 ? ultimoFin + 120 : otras.length ? VENTANA_INICIO : 8 * 60;
  return { ini, fin: Math.min(VENTANA_FIN, ini + 240) };
}

/** Editor en el sitio de una franja: inicio, fin y modalidad. */
export function EditorFranja({ dia, franja, otras, onCerrar }: Props) {
  const inicial = franja ? { ini: aMinutos(franja.horaInicio), fin: aMinutos(franja.horaFin) } : sugerir(otras);
  const [ini, setIni] = useState(inicial.ini);
  const [fin, setFin] = useState(inicial.fin);
  const [modalidad, setModalidad] = useState<Modalidad>(franja?.modalidad ?? 'presencial');
  const [error, setError] = useState<string | null>(null);
  const guardar = useGuardarFranja();
  const borrar = useBorrarFranja();

  const cruce = otras.some((f) => seCruzan({ ini, fin }, { ini: aMinutos(f.horaInicio), fin: aMinutos(f.horaFin) }));
  const nombreDia = NOMBRES_DIA[dia - 1] ?? '';

  const alGuardar = async () => {
    setError(null);
    try {
      await guardar.mutateAsync({
        id: franja?.id,
        datos: { diaSemana: dia, horaInicio: aHora(ini), horaFin: aHora(fin), modalidad },
      });
      onCerrar();
    } catch (e) {
      setError(e instanceof Error && e.name === 'ErrorFranja' ? e.message : 'No se pudo guardar la franja. Intenta de nuevo.');
    }
  };

  const alBorrar = async () => {
    if (!franja) return;
    const seguir = await confirmar({
      titulo: 'Borrar la franja',
      mensaje: `${nombreDia} de ${franja.horaInicio} a ${franja.horaFin} deja de ofrecerse. Las citas ya agendadas no cambian.`,
      aceptar: 'Borrar',
      destructiva: true,
    });
    if (!seguir) return;
    try {
      await borrar.mutateAsync(franja.id);
      onCerrar();
    } catch {
      setError('No se pudo borrar la franja. Intenta de nuevo.');
    }
  };

  return (
    <View style={styles.panel}>
      <View style={styles.cabecera}>
        <Text variant="bodyMedium" style={styles.flex}>
          {franja ? `Editar franja del ${nombreDia.toLowerCase()}` : `Nueva franja del ${nombreDia.toLowerCase()}`}
        </Text>
        {franja ? (
          <BotonIcono etiqueta="Borrar franja" icono={<TrashIcon size={18} color={color.danger} />} onPress={alBorrar} />
        ) : null}
      </View>

      <View style={styles.bloque}>
        <Text variant="label">Desde las {aHora(ini)}</Text>
        <HoraTira
          etiqueta="Inicio"
          horas={horasEntre(VENTANA_INICIO, VENTANA_FIN - PASO_MIN)}
          valor={aHora(ini)}
          onChange={(h) => {
            const m = aMinutos(h);
            setIni(m);
            if (fin <= m) setFin(Math.min(VENTANA_FIN, m + 60));
            setError(null);
          }}
        />
      </View>

      <View style={styles.bloque}>
        <Text variant="label">Hasta las {aHora(fin)}</Text>
        <HoraTira
          etiqueta="Fin"
          horas={horasEntre(ini + PASO_MIN, VENTANA_FIN)}
          valor={aHora(fin)}
          onChange={(h) => {
            setFin(aMinutos(h));
            setError(null);
          }}
        />
      </View>

      <Segmented options={MODALIDADES} value={modalidad} onChange={setModalidad} accessibilityLabel="Modalidad de la franja" />

      {cruce || error ? (
        <Text variant="caption" tone={color.danger} accessibilityRole="alert">
          {cruce ? 'Se cruza con otra franja de este día. Ajusta las horas.' : error}
        </Text>
      ) : null}

      <View style={styles.acciones}>
        <Button label="Volver" variant="ghost" onPress={onCerrar} style={styles.flex} />
        <Button label="Guardar" onPress={alGuardar} loading={guardar.isPending} disabled={cruce || borrar.isPending} style={styles.flex} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
    overflow: 'hidden',
  },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 40 },
  bloque: { gap: space.sm },
  acciones: { flexDirection: 'row', gap: space.sm },
  flex: { flex: 1 },
});
