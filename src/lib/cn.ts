import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/** tailwind-merge debe saber que estas clases `text-*` son tamaños, no colores. */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['display', 'number', 'title', 'heading', 'body-lg', 'body', 'label', 'caption'] }],
    },
  },
});

/** Une clases de NativeWind; si dos chocan (p. ej. dos colores de texto), gana la última. */
export function cn(...clases: ClassValue[]) {
  return twMerge(clsx(clases));
}
