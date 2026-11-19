# Trazo · Guía de exposición

Guía para presentar Trazo en clase: qué decir mientras corre el video, cómo hacer la demo en vivo, dónde está cada cosa en el código y qué responder si preguntan.

- **Video:** `video/out/trazo-exposicion.mp4` (1920x1080, unos 4 minutos, música suave sin voz).
- **Repositorio:** https://github.com/MrxHuaang/trazo (rama `master`).
- **Documento maestro:** `entregables/Trazo_Documento_Maestro_v1.0.pdf`.

---

## 1. La idea en 30 segundos

Trazo es una app móvil para una psicóloga independiente de Pereira. Tiene dos pilares:

1. **Consultorio:** agenda, pacientes, recordatorios por WhatsApp, pagos y notas privadas.
2. **Programa solidario post-sismo:** cupos gratuitos o de tarifa social por semana, jornadas comunitarias, seguimientos a personas afectadas y líneas de ayuda.

Decisiones que conviene decir en voz alta:

- **Local-first:** todo se guarda en el teléfono con SQLite. No hay servidor ni cuentas: los datos de salud no salen del celular.
- **Expo Go, $0:** corre en Expo Go en iPhone y Android sin Mac y sin pagar nada.
- **Stack del curso (90 %):** Expo Router, NativeWind + Tailwind, TanStack Query + axios, Zustand, Reanimated + Gesture Handler, Leaflet + expo-location y el carrusel de Reanimated. El 10 % extra: SQLite, acelerómetro, biometría, notificaciones locales y PDF.
- **El Trazo:** la línea de sismógrafo que empieza agitada y se calma es la firma visual. Aparece en la bienvenida, en Hoy y en la historia de cada paciente.

---

## 2. Guion para hablar sobre el video

El video tiene 15 partes. Cada sección muestra primero un título grande (unos 2,5 s) y luego la grabación real del emulador. Usa estos textos como apoyo; no hace falta leerlos al pie de la letra.

| # | En pantalla | Qué decir |
|---|---|---|
| 00 | Portada "Trazo" | "Trazo es una agenda de consulta con un programa solidario para atender a personas afectadas por el sismo de Pereira. La hicimos con React Native y Expo, el stack del curso." |
| 01 | Bienvenida | "Al abrir, la línea reacciona al movimiento real del teléfono: es el acelerómetro de expo-sensors. El carrusel es react-native-reanimated-carousel. Para la demo cargamos datos ficticios con un toque; ningún dato es real." |
| 02 | Hoy | "Hoy es la bandeja del día. La línea de arriba es el día: cada punto es una cita, y la próxima pulsa en azul. Se puede recorrer con el dedo. El bloque grande cuenta los minutos que faltan y se vuelve azul a los 10. Cada color es un tipo de información: lavanda consulta, menta por confirmar, durazno solidario con textura, amarillo pagos." |
| 03 | Tu semana | "El resumen semanal está en formato de historias, con el carrusel. Las cifras cuentan hasta su valor y se cierra deslizando hacia abajo." |
| 04 | Agenda | "La agenda muestra la semana y el día. Para reprogramar se mantiene presionada una cita y se arrastra: avanza de 15 en 15 minutos con vibración, y al soltar se valida que no choque con otra cita (regla RN-01). Si algo sale mal, se deshace. El botón del calendario busca el próximo hueco libre." |
| 05 | Nueva cita | "Para agendar se toca un hueco. Se busca el paciente, y la hoja muestra solo las horas libres según la disponibilidad. Si la cita es solidaria y la semana ya no tiene cupos, la app avisa (RN-03)." |
| 06 | Pacientes | "La lista se filtra por todos, afectados por el sismo y archivados. El estado de búsqueda vive en Zustand. Las filas se deslizan: a un lado WhatsApp, al otro agendar. Si el nombre no existe, se crea ahí mismo." |
| 07 | Ficha | "La ficha muestra la asistencia de un vistazo, con formas distintas por estado para no depender solo del color, arriba las próximas citas, de la más cercana a la más lejana, y debajo la historia: lo que ya pasó, de lo más reciente a lo más antiguo, con citas, pagos, la autorización de datos y las jornadas. El Trazo de la historia está agitado abajo, al inicio del proceso, y se calma hacia hoy." |
| 08 | Solidario | "El módulo solidario tiene el medidor de cupos de la semana, las jornadas, los seguimientos con llamar, hecho y posponer, los sismos recientes y las líneas de ayuda con llamada en un toque." |
| 09 | Mapa y sismos | "El mapa es Leaflet dentro de un WebView con expo-location, como en el proyecto de mapas del curso. Los sismos vienen del servicio público del USGS con axios y TanStack Query. A ese servicio nunca se envían datos de la app." |
| 10 | Pagos | "Pagos muestra lo cobrado, lo pendiente y lo donado del mes. Al registrar un pago la fila sale y los totales se actualizan. El mes se exporta a PDF." |
| 11 | Ajustes | "En ajustes están los datos del consultorio, las tarifas, la duración de cita y la seguridad: bloqueo con huella o código del teléfono. Todo vive en SQLite local." |
| 12 | Cómo está hecho | "Resumen técnico: cinco módulos, cero servidores y cero pesos. Todo lo que se ve es el stack del curso, más los extras justificados." |
| 13 | Gracias | Cierre y preguntas. |

---

## 3. Demo en vivo (si te piden mostrarla)

Antes de clase:

1. Abre el emulador Pixel 8 (Android Studio, Device Manager, `Pixel_8`).
2. En la carpeta del proyecto:
   ```bash
   npx expo start
   ```
   Presiona `a` para abrirla en el emulador.
3. Si Expo Go dice "incompatible", reinstala Expo Go 58. Si se queda en "Downloading 100 %":
   ```bash
   adb reverse tcp:8081 tcp:8081
   ```
   y abre `exp://127.0.0.1:8081` en Expo Go.
4. **Carga la demo unos 5 minutos antes de presentar** (Ajustes, Cargar demostración, o desde la bienvenida). Así la próxima cita queda a unos 10 minutos y se ve la cuenta regresiva en azul.

Recorrido sugerido de 2 minutos: Hoy (arrastrar el dedo por la línea), Agenda (arrastrar una cita y deshacer), una ficha de paciente, Solidario y el mapa. El mapa y los sismos necesitan internet; si no hay, muestran un estado "sin conexión" y la app sigue funcionando.

Plan B: si algo falla en vivo, reproduce el video.

---

## 4. Mapa del código

```
trazo/
├─ src/
│  ├─ app/            Rutas (Expo Router). Solo componen: importan la pantalla del módulo.
│  │  ├─ _layout.tsx  Raíz: fuentes, TanStack Query, base de datos, bloqueo y el Stack con las hojas.
│  │  ├─ (tabs)/      Las 4 pestañas: index (Hoy), agenda, pacientes, solidario.
│  │  ├─ cita/, paciente/, nota/, jornada/, ajustes/   Rutas de detalle y hojas.
│  │  └─ mapa.tsx, resumen.tsx, pagos.tsx, informe.tsx, seguimientos.tsx, onboarding.tsx
│  ├─ features/       Un módulo por carpeta: pantallas, reglas puras, repositorios propios.
│  │  ├─ acceso/      Bienvenida, bloqueo, ajustes, sismógrafo (acelerómetro).
│  │  ├─ hoy/         Hoy, resumen semanal, por confirmar, plantillas de WhatsApp.
│  │  ├─ pagos/       Pagos del mes y PDF.
│  │  ├─ agenda/      Línea de tiempo, arrastrar citas, nueva cita, disponibilidad, avisos.
│  │  ├─ pacientes/   Lista, ficha, historia, notas privadas, PDF del paciente.
│  │  └─ solidario/   Cupos, jornadas, seguimientos, informe, mapa (mapa/), sismos (api/).
│  ├─ data/           Base de datos compartida.
│  │  ├─ schema.ts    Tablas SQLite y migraciones (v1, v2 coordenadas, v3 fechas en UTC).
│  │  ├─ db.ts        Conexión y funciones consultar / ejecutar.
│  │  ├─ repos/       Repositorios: citas, pacientes, pagos, consultorio, seguimientos.
│  │  ├─ hooks.ts     Hooks de TanStack Query que usan las pantallas.
│  │  ├─ keys.ts      Llaves de caché (qk).
│  │  └─ seed.ts      Datos ficticios de demostración.
│  ├─ domain/types.ts Tipos del dominio (Paciente, Cita, Pago, Jornada...).
│  ├─ ui/             Componentes reutilizables (Tile, Button, TraceLine, Presionable, Aparecer...).
│  ├─ lib/            Fechas (hora de Colombia), formato de moneda, WhatsApp, ids.
│  └─ theme/          Paleta (palette.js) y tokens para SVG y animaciones.
├─ tailwind.config.js Colores, fuentes y tamaños de NativeWind.
├─ docs/              Documento maestro (fuentes HTML) e informe de avances.
└─ video/             Proyecto Remotion de este video.
```

**Cómo fluye un dato (ejemplo: crear una cita)**

Pantalla `features/agenda/nueva-cita-sheet.tsx` → hook `useCrearCita` en `data/hooks.ts` (TanStack Query) → repositorio `data/repos/citas.ts` (`crearCita`) → SQLite. Al terminar, el hook invalida la llave `qk.citas` y todas las pantallas que muestran citas se refrescan solas.

---

## 5. Las partes del código que conviene mostrar

| Qué | Archivo | Por qué importa |
|---|---|---|
| Regla anti-choques (RN-01) | `src/data/repos/citas.ts`, funciones `haySolape` y `crearCita` | Una consulta SQL cuenta las citas activas que se cruzan. Si hay alguna, lanza `ErrorSolape`. |
| Pago al marcar asistencia (RN-05) | `src/data/repos/citas.ts`, `cambiarEstadoCita` | Al marcar "asistió" crea el pago según la tarifa: normal, social o donado. |
| Cupos solidarios (RN-03) | `src/features/solidario/cupos.ts`, `confirmarCupoSolidario` | Cuenta los cupos de la semana (lunes a domingo) y pide confirmación si se pasan. |
| Esquema y migraciones | `src/data/schema.ts` y `migrar()` en `src/data/db.ts` | Cada migración sube `PRAGMA user_version`: la base se actualiza sola sin perder datos. |
| Datos remotos como en clase | `src/features/solidario/api/` (`usgs-api.ts`, `sismos.api.ts`, `sismo.mapper.ts`, `use-sismos.ts`) | Instancia de axios, llamada, mapper y hook de TanStack Query con caché de 15 minutos: el mismo patrón del proyecto de películas. |
| Estado de interfaz con Zustand | `src/features/agenda/store.ts` (`useAgendaStore`) | Guarda el día que muestra la agenda para que otras pantallas puedan abrirla en un día concreto. |
| Arrastrar para reprogramar | `src/features/agenda/cita-arrastrable.tsx` | Gesture Handler + Reanimated: mantener presionado, pasos de 15 minutos, validación y deshacer. |
| Mapa | `src/features/solidario/mapa/` (`mapa-leaflet.tsx`, `leaflet-html.ts`) | Leaflet dentro de `react-native-webview`, con mensajes entre la web y la app. |
| Sismógrafo vivo | `src/features/acceso/use-sismografo.ts` | Lee el acelerómetro, separa la gravedad del movimiento y lo convierte en energía de 0 a 1. |
| El Trazo | `src/ui/trace-line.tsx` | La línea de sismógrafo con una función seno amortiguada; los nodos son las citas del día. |
| Bloqueo y privacidad | `src/features/acceso/access-gate.tsx` | Bienvenida o bloqueo según el estado; biometría con `expo-local-authentication`. |
| Hojas y navegación | `src/app/_layout.tsx` | El Stack raíz declara las hojas: nativas en iPhone y pantallas que suben desde abajo en Android. |
| Sistema de diseño | `tailwind.config.js` y `src/theme/palette.js` | Una sola paleta alimenta las clases de NativeWind y los colores de SVG y animaciones. |

---

## 6. Preguntas probables y respuestas cortas

- **¿Dónde se guardan los datos?** En el teléfono, en SQLite. No hay servidor. Supabase quedó como opción futura si se quisiera respaldo o varios dispositivos.
- **¿Por qué no Flutter?** El curso es React Native con Expo, y Expo Go permite probar en iPhone sin Mac y sin costo.
- **¿Funciona en iPhone?** Está pensada para iPhone y se probó en el emulador Pixel 8. En Expo Go para iPhone, Face ID cae al código del teléfono; con una compilación propia funcionaría Face ID.
- **¿Funciona sin internet?** Sí. Solo el mapa y los sismos necesitan red, y muestran un aviso si no hay.
- **¿Cómo evitan dos citas a la misma hora?** Con la regla RN-01 en `haySolape`, antes de guardar o mover una cita.
- **¿Qué es lo solidario?** Un número de cupos por semana (3 por defecto) con tarifa social o gratuita para personas afectadas por el sismo, más jornadas y seguimientos.
- **¿Qué tiene de accesible?** Botones de al menos 44 pt, contraste mínimo 4,5:1, el color nunca es la única señal (textura, borde punteado, rombo), etiquetas para lector de pantalla y respeto de "Reducir movimiento".
- **¿Hay pruebas automáticas?** No; se usaron TypeScript estricto, lint y revisión pantalla por pantalla en el emulador. Las reglas puras en `rules.ts` son el punto de partida para agregarlas.
- **¿Datos reales?** No. Todos los pacientes y teléfonos son ficticios.

---

## 7. Cómo volver a generar el video

```bash
cd video
npm install
npx remotion studio
npx remotion render Trazo out/trazo-exposicion.mp4
```

`npx remotion studio` abre la vista previa. Los textos están en `video/src/secciones.ts`, los tiempos en `video/src/tema.ts` y las grabaciones en `video/public/clips/`.
