import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { Text, type TextProps } from './text';

type NumeroAnimadoProps = Omit<TextProps, 'children'> & {
  valor: number;
  /** p. ej. formatoCOP */
  formato?: (n: number) => string;
  duracionMs?: number;
};

// ease-out cúbico
const suavizar = (t: number) => 1 - Math.pow(1 - t, 3);

/** Cuenta desde el valor anterior hasta el nuevo. Con Reducir movimiento salta directo. */
export function NumeroAnimado({ valor, formato = (n) => String(Math.round(n)), duracionMs = 650, ...rest }: NumeroAnimadoProps) {
  const [mostrado, setMostrado] = useState(0);
  const desde = useRef(0);

  useEffect(() => {
    let cuadro = 0;
    let cancelado = false;
    const inicio = Date.now();
    const origen = desde.current;

    const paso = () => {
      if (cancelado) return;
      const t = Math.min((Date.now() - inicio) / duracionMs, 1);
      const actual = origen + (valor - origen) * suavizar(t);
      desde.current = actual;
      setMostrado(actual);
      if (t < 1) cuadro = requestAnimationFrame(paso);
    };

    void AccessibilityInfo.isReduceMotionEnabled().then((reducir) => {
      if (cancelado) return;
      if (reducir) {
        desde.current = valor;
        setMostrado(valor);
      } else {
        cuadro = requestAnimationFrame(paso);
      }
    });

    return () => {
      cancelado = true;
      cancelAnimationFrame(cuadro);
    };
  }, [valor, duracionMs]);

  // El lector de pantalla lee el valor final, no cada cuadro intermedio.
  return (
    <Text {...rest} accessibilityLabel={formato(valor)}>
      {formato(mostrado)}
    </Text>
  );
}
