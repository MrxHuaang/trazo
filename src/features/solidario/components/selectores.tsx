import { ScrollView, View } from 'react-native';

import { cn } from '@/lib/cn';
import { fechaLarga, isoDesde, numeroDia } from '@/lib/dates';
import { Presionable, Text } from '@/ui';

import { capitalizar, diaCorto, diaMes } from '../rules';

const ANCHO_DIA = 58;
const ANCHO_HORA = 72;
const GAP = 8;

/** Desplazamiento inicial para que la opción elegida quede a la vista (con una antes). */
const desplazamiento = (indice: number, ancho: number) => ({ x: Math.max(indice - 1, 0) * (ancho + GAP), y: 0 });

type SelectorDiaProps = {
  label: string;
  /** Fechas 'yyyy-MM-dd' en orden. */
  dias: string[];
  valor: string;
  hoy: string;
  onChange: (dia: string) => void;
};

/** Fila deslizable de días (hoy y los siguientes) con la fecha completa debajo. */
export function SelectorDia({ label, dias, valor, hoy, onChange }: SelectorDiaProps) {
  const indice = Math.max(dias.indexOf(valor), 0);
  return (
    <View className="gap-1.5">
      <Text variant="label">{label}</Text>
      {/* La fila se sale del margen de la hoja (-mx-5) para deslizar de borde a borde. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-5"
        contentContainerClassName="gap-2 px-5"
        contentOffset={desplazamiento(indice, ANCHO_DIA)}
        accessibilityRole="radiogroup"
        accessibilityLabel={label}>
        {dias.map((d) => {
          const activo = d === valor;
          const primeroDelMes = d.endsWith('-01');
          return (
            <Presionable
              key={d}
              accessibilityRole="radio"
              accessibilityState={{ selected: activo }}
              accessibilityLabel={capitalizar(fechaLarga(isoDesde(d)))}
              haptico={!activo}
              onPress={() => onChange(d)}
              contentClassName={cn(
                'min-h-[60px] w-[58px] items-center justify-center gap-0.5 rounded-field border',
                activo ? 'border-ink bg-ink' : 'border-line bg-surface',
              )}>
              <Text variant="caption" className={activo ? 'text-accent-on' : 'text-ink-soft'}>
                {d === hoy ? 'hoy' : primeroDelMes ? diaMes(d).split(' ')[1] : diaCorto(d)}
              </Text>
              <Text variant="heading" className={activo ? 'text-accent-on' : 'text-ink'}>
                {numeroDia(d)}
              </Text>
            </Presionable>
          );
        })}
      </ScrollView>
      <Text variant="caption" className="text-ink-soft">
        {capitalizar(fechaLarga(isoDesde(valor)))}
      </Text>
    </View>
  );
}

type SelectorHoraProps = {
  label: string;
  /** Horas 'HH:mm' en orden. */
  horas: string[];
  valor: string;
  onChange: (hora: string) => void;
};

/** Fila deslizable de horas cada 30 minutos. */
export function SelectorHora({ label, horas, valor, onChange }: SelectorHoraProps) {
  const indice = Math.max(horas.indexOf(valor), 0);
  return (
    <View className="gap-1.5">
      <Text variant="label">{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-5"
        contentContainerClassName="gap-2 px-5"
        contentOffset={desplazamiento(indice, ANCHO_HORA)}
        accessibilityRole="radiogroup"
        accessibilityLabel={label}>
        {horas.map((h) => {
          const activo = h === valor;
          return (
            <Presionable
              key={h}
              accessibilityRole="radio"
              accessibilityState={{ selected: activo }}
              accessibilityLabel={`${label} ${h}`}
              haptico={!activo}
              onPress={() => onChange(h)}
              contentClassName={cn(
                'min-h-[44px] w-[72px] items-center justify-center rounded-full border',
                activo ? 'border-ink bg-ink' : 'border-line bg-surface',
              )}>
              <Text variant="mono" className={activo ? 'text-accent-on' : 'text-ink'}>
                {h}
              </Text>
            </Presionable>
          );
        })}
      </ScrollView>
    </View>
  );
}
