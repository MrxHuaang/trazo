# Video de exposición de Trazo (Remotion)

## Qué es
Video de 3 a 4 minutos para proyectar en clase mientras el estudiante habla encima. Muestra la app Trazo (app móvil Expo para una psicóloga en Pereira: agenda de consulta + programa solidario post-sismo) navegando por todas sus vistas con grabaciones reales del emulador Pixel 8. No lleva voz; solo música muy suave. Proyecto académico, datos ficticios.

## Dirección visual (lo más importante)
Minimalista moderno, estilo sitio de Awwwards. Que NO parezca hecho con plantilla o IA:
- Lienzo claro y plano `#F6F7F9`, tinta `#17171C`, gris de apoyo `#5E6068`, línea `#E3E5EA`, un solo acento cobalto `#2340E0`. Los colores de la app aparecen solo como bloques planos cuando se habla del módulo: lavanda `#D9D2FF`/`#241A5C`, menta `#C6EFD9`/`#0E3B26`, durazno `#FFD3BF`/`#4A1D0B`, mantequilla `#FFEFA8`/`#3D3102`.
- PROHIBIDO: degradados, glassmorphism, brillos, sombras difusas grandes, partículas, emojis, íconos genéricos de stock, textos "lorem", títulos centrados con subtítulo gris y botón (layout de plantilla), tarjetas flotando en 3D, efectos de "glitch".
- Tipografía protagonista, tamaños enormes: títulos de sección de 160 a 240 px en Bricolage Grotesque 800 (la marca de la app) con tracking negativo; etiquetas e índices en Geist Mono (ej. `03 / 11`, `HU-31`, `RN-01`); texto de apoyo en Geist 400/500 a 40-48 px. Un acento editorial opcional en Instrument Serif italic para una o dos palabras por escena, con mesura. Cargar con `@remotion/google-fonts` (ver la guía de google-fonts de la skill).
- Composición editorial asimétrica: rejilla de 12 columnas, márgenes amplios (120 px), el teléfono a un lado y el texto grande al otro, alternando lados por sección. Reglas finas de 1-2 px, numeración de sección, mucho espacio vacío.
- Firma visual: el Trazo, una línea de sismógrafo que empieza agitada y se calma (función `y = mid + amp * envelope * (sin(x*0.16+1.2+f)*0.8 + sin(x*0.41+1.3+f*1.7)*0.2)`, envolvente que decae). Úsala como transición entre secciones (la línea cruza la pantalla y se aquieta) y en la portada y el cierre. Es el único elemento "decorativo".
- Movimiento sobrio con sentido: entradas por máscara/recorte de texto palabra por palabra o línea por línea, deslizamientos cortos, interpolaciones con `spring` amortiguado sin rebote exagerado, cortes limpios. Nada de zoom mareante. Velocidad calma: el público incluye personas afectadas por un sismo.
- El teléfono: marco propio dibujado con CSS (rectángulo redondeado negro fino tipo Pixel, sin sombras grandes), con la grabación `OffthreadVideo` dentro, escalado para que la pantalla mida unos 900 px de alto en un lienzo de 1920x1080. Las grabaciones son 1080x2400.

## Formato
1920x1080, 30 fps, MP4 H.264. Composición con id `Trazo`.

## Estructura (secciones)
Cada sección: tarjeta de título grande (2 a 3 s) y luego la grabación en el teléfono con 2 o 3 etiquetas cortas que aparecen a un lado en el momento oportuno (no párrafos). La duración de cada sección = duración de su clip + la tarjeta. Lee la duración real de cada clip (calculateMetadata / parseMedia o mediabunny, ver skill `remotion-multimedia`) para que el total cuadre solo. Si un clip no existe todavía, muestra un rectángulo `#E3E5EA` con el nombre del archivo en mono y duración 8 s, para poder previsualizar.

Clips en `public/clips/` (los graba otra persona en paralelo; pueden faltar al principio):

| # | Archivo | Título grande | Línea de apoyo | Etiquetas |
|---|---|---|---|---|
| 00 | (sin clip) | Trazo | Agenda de consulta y programa solidario después del sismo de Pereira. | Expo SDK 58 · React Native · Desarrollo Móvil 2 |
| 01 | `01-bienvenida.mp4` | Bienvenida | Un sismógrafo que reacciona al teléfono. | Carrusel · Acelerómetro · Datos de demostración |
| 02 | `02-hoy.mp4` | Hoy | El día de un vistazo. | Próxima cita con cuenta regresiva · Trazo interactivo · Bloques por color |
| 03 | `03-semana.mp4` | Tu semana | El resumen en historias. | reanimated-carousel · Cifras que cuentan |
| 04 | `04-agenda.mp4` | Agenda | Arrastrar para reprogramar. | Pasos de 15 min · RN-01 sin choques · Deshacer |
| 05 | `05-nueva-cita.mp4` | Nueva cita | Se agenda tocando un hueco. | Hoja inferior · Cupo solidario RN-03 |
| 06 | `06-pacientes.mp4` | Pacientes | Buscar, filtrar, deslizar. | Zustand · Filas deslizables · WhatsApp |
| 07 | `07-ficha.mp4` | Ficha | La historia como una línea. | Asistencia de un vistazo · Notas bajo bloqueo |
| 08 | `08-solidario.mp4` | Solidario | El programa post-sismo. | Cupos semanales · Jornadas · Seguimientos |
| 09 | `09-mapa.mp4` | Mapa y sismos | Datos públicos, sin datos de pacientes. | Leaflet + WebView · expo-location · USGS con axios |
| 10 | `10-pagos.mp4` | Pagos | Cobros claros, PDF del mes. | TanStack Query · expo-print |
| 11 | `11-ajustes.mp4` | Ajustes | Todo vive en el teléfono. | SQLite local-first · Bloqueo biométrico |
| 12 | (sin clip) | Cómo está hecho | Stack del curso y extras. | lista breve en mono: Expo Router · NativeWind + Tailwind · TanStack Query + axios · Zustand · Reanimated + Gesture Handler · Leaflet + expo-location · SQLite · 5 módulos · 0 servidores · $0 |
| 13 | (sin clip) | Gracias | Juan José Pantoja Ordoñez · github.com/MrxHuaang/trazo | (cierre con el Trazo calmándose) |

Copy en español de Colombia, sin guiones largos (—), sin emojis. Usa el punto medio (·) como separador.

## Música
Genera tú la música (sin descargar nada de internet): un pad ambiental muy suave y cálido sintetizado con Python + numpy, guardado como `public/musica.wav` (44.1 kHz, estéreo). Acordes lentos (por ejemplo Cmaj7 → Am9 → Fmaj7 → G6, 8 s cada uno), ondas senoidales con armónicos leves, ataque y caída largos, un poco de reverb simple (retardos con feedback), sin percusión, volumen bajo (pico cerca de -18 dBFS). Duración mayor que el video. En Remotion, `<Audio>` con volumen ~0.35, fundido de entrada 2 s y de salida 3 s al final.

## Técnica
- Lee primero, completas, estas guías instaladas en `C:\Users\juanj\.claude\skills\`: `remotion-best-practices/SKILL.md`, `remotion-create/REFERENCE.md` (o SKILL.md) y `remotion-create/video-layout.md`, `remotion-markup/SKILL.md`, y de `remotion-markup/`: `compositions.md`, `sequencing.md`, `transitions.md`, `embedding-videos.md`, `audio.md`, `google-fonts.md`, `calculate-metadata.md`, `timing.md`, `video-editing.md`, `measuring-text.md`. Síguelas.
- Proyecto en `D:\Proyectos\Personal\trazo\video` (ya existe la carpeta con este BRIEF). Scaffold con `npx create-video@latest --yes --blank --no-tailwind` según la guía (la carpeta no está vacía: crea el proyecto en una subcarpeta temporal y mueve su contenido a `video/`, o usa la opción que indique la guía). Ya está excluida del tsconfig, del lint y de Metro de la app.
- Estructura limpia: `src/Root.tsx`, `src/Trazo.tsx`, `src/secciones.ts` (datos de la tabla), `src/componentes/` (Telefono, TituloSeccion, Etiqueta, TrazoLinea, Portada, Cierre, Stack).
- No ejecutes `npx remotion studio` en el puerto 3000 si está ocupado; usa otro. No hace falta abrir Studio; sí renderiza fotogramas sueltos (`npx remotion render Trazo out/frames --frames=...` o `npx remotion still`) para revisar el diseño tú mismo y corregir.
- Al final deja listo el comando de render: `npx remotion render Trazo out/trazo-exposicion.mp4` y prueba un render corto de unos segundos para confirmar que funciona. NO hagas el render completo si faltan clips; lo hace el integrador.
- No toques nada fuera de `video/`. No hagas commit.

## Entrega
Informe breve: estructura del proyecto, decisiones de diseño, cómo cambiar textos y duraciones, el comando de render, rutas de 3 o 4 fotogramas de muestra que renderizaste para revisar.
