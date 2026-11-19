import {COLOR} from '../tema';

type Opciones = {
  /** Ancho total sobre el que se calcula la calma. */
  readonly ancho: number;
  /** Linea media en y. */
  readonly medio: number;
  /** Amplitud maxima en px. */
  readonly amplitud: number;
  /** Fraccion del ancho donde la linea ya esta en calma (0 a 1). */
  readonly calmaDesde: number;
  /** Fase de la onda; moverla hace que la linea "respire". */
  readonly fase?: number;
  /** Hasta que x se dibuja (para el efecto de pluma). */
  readonly hasta?: number;
  /** Escala horizontal de la onda respecto a la app (1 = igual que en el telefono). */
  readonly escala?: number;
};

/**
 * La misma funcion del componente TraceLine de la app:
 * y = medio + amp * envolvente * (sin(x*0.16 + 1.2 + f)*0.8 + sin(x*0.41 + 1.3 + f*1.7)*0.2)
 * con envolvente (1 - x/calma)^1.6. Empieza agitada y se aquieta.
 */
export const trazoY = (x: number, o: Opciones) => {
  const calma = Math.max(1, o.ancho * o.calmaDesde);
  const t = Math.min(x / calma, 1);
  const envolvente = Math.pow(1 - t, 1.6);
  const f = o.fase ?? 0;
  const u = x / (o.escala ?? 2.4);
  const onda = Math.sin(u * 0.16 + 1.2 + f) * 0.8 + Math.sin(u * 0.41 + 1.3 + f * 1.7) * 0.2;
  return o.medio + o.amplitud * envolvente * onda;
};

export const trazoRuta = (o: Opciones) => {
  const hasta = Math.min(o.hasta ?? o.ancho, o.ancho);
  if (hasta <= 0) return '';
  const paso = 2;
  let d = '';
  for (let x = 0; x <= hasta; x += paso) {
    d += `${x === 0 ? 'M' : 'L'}${x.toFixed(1)} ${trazoY(x, o).toFixed(2)}`;
  }
  d += `L${hasta.toFixed(1)} ${trazoY(hasta, o).toFixed(2)}`;
  return d;
};

type Props = Opciones & {
  readonly alto: number;
  readonly grosor?: number;
  readonly color?: string;
  /** Punto de la pluma al final del trazo. */
  readonly pluma?: boolean;
  readonly opacidad?: number;
  readonly style?: React.CSSProperties;
};

/** El Trazo: la linea de sismografo, unico elemento decorativo del video. */
export const TrazoLinea: React.FC<Props> = ({alto, grosor = 3, color = COLOR.acento, pluma = false, opacidad = 1, style, ...o}) => {
  const hasta = Math.min(o.hasta ?? o.ancho, o.ancho);
  return (
    <svg
      width={o.ancho}
      height={alto}
      viewBox={`0 0 ${o.ancho} ${alto}`}
      style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: opacidad, ...style}}
    >
      <path d={trazoRuta(o)} fill="none" stroke={color} strokeWidth={grosor} strokeLinejoin="round" strokeLinecap="round" />
      {pluma && hasta > 0 && hasta < o.ancho - 1 ? <circle cx={hasta} cy={trazoY(hasta, o)} r={grosor * 2.6} fill={color} /> : null}
    </svg>
  );
};
