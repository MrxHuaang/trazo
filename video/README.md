# Trazo · video de exposición (Remotion)

Composición `Trazo`, 1920 x 1080, 30 fps.

## Comandos

```console
npm i                                              # dependencias
npx remotion render Trazo out/trazo-exposicion.mp4 # video final
node scripts/fotogramas.mjs s4+120 stack+200       # fotogramas sueltos en out/fotogramas
python scripts/musica.py 330                       # regenerar public/musica.wav (segundos)
npx remotion studio --port 3123                    # vista previa (opcional)
```

## Dónde se cambia cada cosa

- Textos, etiquetas, módulo y color de cada sección: `src/secciones.ts`.
  `*palabra*` sale en serif itálica; `momentos` fija en qué segundo del clip aparece cada etiqueta.
- Tiempos (tarjeta, transición, portada, anexo, cierre, marcador): `src/tema.ts` (`TIEMPO`).
- Grabaciones: `public/clips/NN-nombre.mp4`. La duración se lee sola; si falta un archivo se muestra un marcador de 8 s.
