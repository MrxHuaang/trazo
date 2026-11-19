import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Sin esto tailwind-merge toma text-body como color y borra el text-ink que venga al lado.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['display', 'number', 'title', 'heading', 'body-lg', 'body', 'label', 'caption'] }],
    },
  },
});

/** Une clases; si dos chocan gana la última, así className puede sobrescribir los defaults. */
export function cn(...clases: ClassValue[]) {
  return twMerge(clsx(clases));
}
