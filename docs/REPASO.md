# Repaso de Trazo: el stack y cada archivo

Para leer antes de exponer. Va de lo general a lo particular: primero qué pasa cuando arrancas el proyecto, luego cada tecnología explicada en simple, y al final qué hace cada archivo.

## 1. Qué pasa cuando arrancas el proyecto

Escribes `npx expo start` y ocurren cuatro cosas, en este orden:

1. **Expo CLI** lee `app.json` y `package.json` para saber qué app es y con qué versión del SDK trabaja (58).
2. **Metro** se levanta en tu computador, en el puerto 8081. Metro es el "empaquetador": toma los 3.000 y pico archivos (los tuyos más las librerías) y los convierte en un solo archivo de JavaScript que el teléfono puede ejecutar.
3. En el emulador, **Expo Go** se conecta a Metro (`exp://127.0.0.1:8081`), descarga ese paquete y lo ejecuta. Expo Go es una app ya compilada que trae adentro todo el código nativo (cámara, SQLite, sensores). Tú solo le mandas JavaScript.
4. Cuando guardas un archivo, Metro manda solo el pedazo que cambió y la pantalla se actualiza sin reiniciar la app. Eso se llama **Fast Refresh**.

Frase para la exposición: "Mi computador no compila una app Android; solo sirve el JavaScript. La parte nativa ya viene dentro de Expo Go."

## 2. El stack, pieza por pieza

### La base

| Pieza | Qué es, en simple | Dónde se ve en Trazo |
|---|---|---|
| **React** | Librería para armar la interfaz con componentes: funciones que devuelven lo que se pinta. Cuando cambia un dato, React repinta solo lo necesario. | Todo archivo `.tsx`. |
| **React Native** | React, pero en vez de pintar HTML pinta vistas nativas de Android y iOS (`View`, `Text`, `Pressable`). | `import { View } from 'react-native'`. |
| **Expo** | Conjunto de herramientas y módulos encima de React Native. Evita tocar Android Studio o Xcode. | `expo-sqlite`, `expo-location`, `expo-print`, etc. |
| **Expo Go** | App de la tienda que ejecuta tu proyecto sin compilarlo. Limitación: solo sirve con las librerías nativas que ya trae. | Por eso cada librería se revisó antes de instalarla. |
| **Metro** | El empaquetador de React Native. Une todos los archivos en uno, traduce TypeScript y sirve los cambios en vivo. | `metro.config.js`. |
| **Babel** | El traductor. Convierte TypeScript y JSX moderno en JavaScript que el motor del teléfono entiende. Metro lo usa por dentro. | `babel.config.js`. |
| **TypeScript** | JavaScript con tipos. Avisa de errores antes de ejecutar: por ejemplo, si le pasas un texto a algo que espera un número. | `tsconfig.json`, modo `strict`. |
| **React Compiler** | Optimiza los componentes automáticamente para que no se repinten de más. Evita escribir `useMemo` a mano. | Activado en `app.json`. |

### Lo visto en el curso (el 90 %)

| Pieza | Qué es, en simple | Dónde se ve en Trazo |
|---|---|---|
| **Expo Router** | Navegación por archivos: cada archivo dentro de `src/app/` es una pantalla y su ruta es su nombre. `paciente/[id].tsx` es una ruta dinámica (el `id` cambia). | Toda la carpeta `src/app/`. |
| **NativeWind + Tailwind** | Estilos con clases cortas en `className`, como en la web: `bg-lavanda rounded-tile p-4`. Tailwind define las clases; NativeWind las traduce a estilos nativos. | `tailwind.config.js`, `src/global.css`. |
| **TanStack Query** | Maneja los **datos**: pedirlos, guardarlos en caché, saber si están cargando y volver a pedirlos cuando cambian. Dos conceptos: `useQuery` (leer) y `useMutation` (escribir). | `src/data/hooks.ts` y cada `hooks.ts`. |
| **axios** | Cliente HTTP: hace peticiones a un servidor. Solo se usa para la API pública de sismos del USGS. | `src/features/solidario/api/`. |
| **Zustand** | Maneja el **estado de la interfaz**: cosas que no son datos guardados, como "qué día estoy viendo" o "qué escribí en el buscador". Es un store global sin Provider. | `store.ts` de agenda, pacientes, pagos; `sesion.ts`. |
| **Leaflet + WebView** | Leaflet es una librería de mapas web. Como es web, se mete dentro de un `WebView` (un navegador embebido en la app). | `src/features/solidario/mapa/`. |
| **expo-location** | Pide permiso y lee la ubicación del teléfono. | `mapa/ubicacion.ts`. |
| **Reanimated** | Animaciones que corren en el hilo nativo, por eso no se traban aunque JavaScript esté ocupado. | `src/ui/aparecer.tsx`, `presionable.tsx`. |
| **Gesture Handler** | Detecta gestos: arrastrar, deslizar, mantener presionado. | Arrastrar citas, deslizar filas. |
| **Carrusel** | `react-native-reanimated-carousel`: pasar tarjetas deslizando. | Bienvenida y "Tu semana". |

### Lo propio (el 10 %)

| Pieza | Qué es, en simple | Dónde se ve en Trazo |
|---|---|---|
| **SQLite** (`expo-sqlite`) | Base de datos que vive en un archivo dentro del teléfono. No hay servidor. | `src/data/db.ts`, `schema.ts`. |
| **Biometría** (`expo-local-authentication`) | Pide huella, rostro o el código del teléfono. | Bloqueo al abrir y notas privadas. |
| **Notificaciones locales** (`expo-notifications`) | Avisos que programa el propio teléfono, sin servidor. | Aviso antes de cada cita. |
| **PDF** (`expo-print` + `expo-sharing`) | Convierte HTML en PDF y abre el menú de compartir. | Pagos del mes, resumen del paciente, informe solidario. |
| **Acelerómetro** (`expo-sensors`) | Lee el movimiento del teléfono. | El Trazo de la bienvenida reacciona al moverlo. |

### Ayudantes pequeños

- **zod**: valida formularios con un esquema ("el nombre es obligatorio, la tarifa es un número").
- **react-hook-form**: maneja el estado de un formulario largo (el del paciente).
- **date-fns** y **@date-fns/tz**: fechas y zona horaria de Colombia.
- **phosphor-react-native**: los íconos.
- **react-native-svg**: dibujar con vectores (el Trazo, el anillo, el rayado).
- **expo-haptics**: la vibración corta al tocar.
- **clsx** y **tailwind-merge**: unir clases de Tailwind sin que choquen.
- **expo-crypto**: generar identificadores únicos (UUID).

### La diferencia que más preguntan: TanStack Query vs Zustand

- **TanStack Query** = lo que está guardado. Citas, pacientes, pagos. Si cierras la app, sigue ahí porque está en SQLite.
- **Zustand** = lo que la pantalla está mostrando ahora. El día seleccionado, el filtro, el texto del buscador. Si cierras la app, se pierde y no importa.

## 3. Archivos de la raíz

| Archivo | Para qué sirve |
|---|---|
| `package.json` | La lista de librerías y los comandos (`start`, `lint`, `typecheck`). |
| `package-lock.json` | Las versiones exactas instaladas, para que a todos les quede igual. |
| `app.json` | La ficha de la app: nombre, ícono, color de fondo, solo vertical, solo modo claro, plugins de Expo. |
| `babel.config.js` | Le dice a Babel que use el preset de Expo y el de NativeWind. Sin esto, `className` no funciona. |
| `metro.config.js` | Configura Metro: activa NativeWind con `global.css` y le dice que ignore la carpeta `video/`. |
| `tailwind.config.js` | Define las clases propias: colores (`lavanda`, `menta`, `durazno`), fuentes, radios y tamaños de letra. |
| `tsconfig.json` | Reglas de TypeScript y el atajo `@/` que apunta a `src/`. |
| `eslint.config.js` | Reglas del linter (revisa estilo y errores comunes). |
| `nativewind-env.d.ts`, `expo-env.d.ts` | Tipos para que TypeScript entienda `className` y las rutas. |
| `assets/` | Ícono y pantalla de carga. |
| `docs/` | Documento maestro, informe y guía de exposición. |
| `video/` | Proyecto aparte (Remotion) con el video de la exposición. |

## 4. La carpeta `src/`, la arquitectura en una frase

**Las rutas componen, las features hacen el trabajo, lo compartido vive aparte.**

```
src/
├─ app/        Rutas. Cada archivo es una pantalla; casi todos tienen 3 líneas.
├─ features/   Un módulo por carpeta: pantallas, reglas, datos propios.
├─ data/       Base de datos, repositorios y hooks compartidos.
├─ domain/     Los tipos del negocio (Paciente, Cita, Pago...).
├─ lib/        Utilidades: fechas, moneda, WhatsApp, ids.
├─ ui/         Componentes reutilizables sin lógica de negocio.
├─ theme/      Colores, fuentes y tokens.
└─ navigation/ La barra de pestañas.
```

### `src/app/` (rutas)

Casi todos los archivos solo importan la pantalla de su módulo y la exportan. Ejemplo real, `app/pagos.tsx`:

```tsx
import { PagosScreen } from '@/features/pagos/pagos-screen';
export default PagosScreen;
```

| Archivo | Qué es |
|---|---|
| `_layout.tsx` | **El más importante.** Carga las fuentes, crea el cliente de TanStack Query y envuelve la app en dos "puertas": `DatabaseGate` (prepara la base de datos) y `AccessGate` (bienvenida y bloqueo). También declara qué rutas se abren como hoja. |
| `(tabs)/_layout.tsx` | Monta la barra de pestañas. |
| `(tabs)/index.tsx` | Pestaña Hoy. |
| `(tabs)/agenda.tsx`, `pacientes.tsx`, `solidario.tsx` | Las otras tres pestañas. |
| `onboarding.tsx` | Bienvenida. |
| `cita/nueva.tsx`, `cita/[id].tsx` | Hoja de nueva cita y detalle de una cita. |
| `paciente/nuevo.tsx`, `paciente/[id].tsx` | Formulario y ficha del paciente. |
| `nota/[id].tsx` | Nota privada de una sesión. |
| `jornada/nueva.tsx`, `jornada/[id].tsx` | Programar y ver una jornada. |
| `ajustes/index.tsx`, `disponibilidad.tsx`, `plantillas.tsx`, `cupos.tsx` | Ajustes y sus subpantallas. |
| `pagos.tsx`, `por-confirmar.tsx`, `resumen.tsx`, `seguimientos.tsx`, `informe.tsx`, `mapa.tsx` | Pantallas sueltas a las que se entra desde las pestañas. |

Los paréntesis de `(tabs)` agrupan rutas sin aparecer en la dirección. Los corchetes de `[id]` marcan una parte variable.

### `src/data/` (la capa de datos)

| Archivo | Qué hace |
|---|---|
| `db.ts` | Abre la base de datos una sola vez y ofrece tres funciones: `consultar` (varias filas), `consultarUno` (una fila) y `ejecutar` (insertar, actualizar, borrar). También `migrar` y `borrarTodo`. |
| `schema.ts` | La lista de **migraciones**: el SQL que crea las tablas (v1), agrega la ubicación de las jornadas (v2) y normaliza fechas a UTC (v3). Solo se agregan al final; nunca se editan las viejas. |
| `database-gate.tsx` | Componente que corre las migraciones antes de mostrar la app. |
| `keys.ts` | Las llaves de caché (`qk.citas`, `qk.pacientes`...). Toda consulta empieza con una de ellas, así al guardar una cita se invalida todo lo que dependa de citas. |
| `hooks.ts` | Hooks de TanStack Query que usan varios módulos: `usePacientes`, `useCitasEntre`, `useCrearCita`, etc. |
| `seed.ts` | `cargarDemo()`: llena la base con datos ficticios. Las citas de hoy se calculan según la hora en que cargas, para que siempre haya una próxima. |
| `repos/citas.ts` | SQL de citas. Aquí está `haySolape` y `crearCita` (regla RN-01, no dejar chocar dos citas) y `cambiarEstadoCita` (RN-05, al marcar "asistió" se crea el pago). |
| `repos/pacientes.ts` | SQL de pacientes. Al crear, registra la autorización de datos (Ley 1581). |
| `repos/pagos.ts` | Pagos del mes, pendientes, resumen y `registrarPago`. |
| `repos/seguimientos.ts` | Seguimientos pendientes, hechos y descartados. |
| `repos/consultorio.ts` | Datos del consultorio, tarifas y plantillas de mensajes. |

Un **repositorio** es un archivo que concentra el SQL de una tabla. Las pantallas nunca escriben SQL.

### `src/domain/types.ts`

Los tipos del negocio: `Paciente`, `Cita`, `Pago`, `Jornada`, `Seguimiento`, y los valores permitidos (`EstadoCita`: solicitada, confirmada, asistió, no asistió, cancelada). Es el vocabulario común de toda la app.

### `src/lib/` (utilidades)

| Archivo | Qué hace |
|---|---|
| `dates.ts` | Todo lo de fechas. Regla RN-02: se guarda en UTC y se muestra en hora de Colombia. Funciones como `hoyClave()`, `isoDesde()`, `horaTexto()`. |
| `format.ts` | `formatoCOP` (pesos con puntos), teléfono, iniciales. |
| `whatsapp.ts` | Arma el enlace `wa.me` con el mensaje y lo abre. Antepone el 57. |
| `id.ts` | `nuevoId()`: genera un UUID. |
| `cn.ts` | Une clases de Tailwind; si dos chocan, gana la última. |

### `src/theme/`

| Archivo | Qué hace |
|---|---|
| `palette.js` | **Única fuente de color.** Es JavaScript plano porque también lo lee `tailwind.config.js`. |
| `tokens.ts` | Los mismos valores para lo que no acepta clases: SVG, Reanimated y APIs nativas. |
| `fonts.ts` | Las fuentes que se cargan al abrir (Bricolage Grotesque, Geist, Geist Mono). |
| `index.ts` | Reexporta todo. |

### `src/ui/` (componentes reutilizables)

No saben nada del negocio: reciben props y pintan.

| Archivo | Qué es |
|---|---|
| `text.tsx` | Texto con variantes (`title`, `body`, `caption`...). |
| `button.tsx` | Botón. `primary` es la acción principal de la pantalla. |
| `presionable.tsx` | Base de todo lo tocable: se hunde un poco y vibra. |
| `aparecer.tsx` | Entrada en cascada: cada bloque entra 45 ms después del anterior. |
| `numero-animado.tsx` | Número que cuenta hasta su valor. |
| `tile.tsx` | Los bloques de color (lavanda, menta, durazno, mantequilla). |
| `trace-line.tsx` | **El Trazo**: la línea de sismógrafo que arranca agitada y se calma. Es la firma visual. |
| `hatch.tsx`, `solidario-mark.tsx` | El rayado de lo solidario, para no depender solo del color. |
| `sheet.tsx`, `sheet-header.tsx` | Contenedor de las hojas: encabezado, contenido con scroll, pie fijo y teclado. |
| `field.tsx`, `segmented.tsx`, `toggle-row.tsx`, `chip.tsx` | Controles de formulario. |
| `list-row.tsx`, `empty-state.tsx`, `fab.tsx`, `screen.tsx` | Fila de lista, estado vacío, botón flotante y contenedor de pantalla. |
| `index.ts` | Reexporta todo para importar desde `@/ui`. |

### `src/navigation/`

- `app-tabs.tsx`: la barra de pestañas nativa (Hoy, Agenda, Pacientes, Solidario).
- `app-tabs.web.tsx`: la misma barra para la versión web. Expo elige el archivo según la plataforma por el sufijo `.web`.

## 5. `src/features/`: módulo por módulo

Cada módulo repite el mismo patrón de archivos:

- `*-screen.tsx` o `*-sheet.tsx`: la pantalla.
- `rules.ts`: **reglas puras**. Funciones sin React ni base de datos; reciben datos y devuelven un resultado.
- `repo.ts`: el SQL de las tablas que solo usa ese módulo.
- `hooks.ts`: los hooks de TanStack Query de ese módulo.
- `store.ts`: el estado de interfaz con Zustand.
- El resto: componentes que solo usa ese módulo.

### `features/acceso/` (bienvenida, bloqueo y ajustes)

| Archivo | Qué hace |
|---|---|
| `access-gate.tsx` | Decide qué se ve al abrir: bienvenida si no hay consultorio, pantalla de bloqueo si está activado, o la app. |
| `onboarding-screen.tsx` | La bienvenida: crear el consultorio o entrar con la demo. |
| `laminas-bienvenida.tsx` | El carrusel de tres láminas de la bienvenida. |
| `formulario-consultorio.tsx` | Formulario para crear el consultorio. |
| `validacion.ts` | El esquema de zod de ese formulario y el formato de pesos mientras se escribe. |
| `pantalla-bloqueo.tsx` | Pantalla que pide huella o código. A propósito no muestra datos. |
| `verificacion.ts` | La llamada a la biometría. |
| `sesion.ts` | Store de Zustand: si la sesión está abierta y a los cuántos minutos se vuelve a bloquear. |
| `use-estado-app.ts` | Detecta si la app pasó a segundo plano. |
| `use-telefono-protegido.ts` | Revisa si el teléfono tiene algún bloqueo configurado. |
| `cortina.tsx`, `capa-superior.tsx` | La capa que tapa el contenido al salir de la app, para que no se vea en el selector de apps. |
| `use-sismografo.ts` | Lee el acelerómetro y lo convierte en "energía" para el Trazo. |
| `hooks.ts` | Mutaciones grandes: crear consultorio, cargar demo, borrar todo. |
| `ajustes/ajustes-screen.tsx` | Pantalla de Ajustes: cada dato se edita en su sitio. |
| `ajustes/piezas.tsx` | Componentes que solo usa Ajustes. |

### `features/hoy/` (la pestaña principal)

| Archivo | Qué hace |
|---|---|
| `hoy-screen.tsx` | La pantalla Hoy. |
| `rules.ts` | Reglas puras: cuál es la próxima cita, los puntos del día sobre el Trazo, el texto "en 12 min". |
| `trazo-interactivo.tsx` | El Trazo del día con sus puntos; se encoge al hacer scroll. |
| `bloque-proxima.tsx` | El bloque de la próxima cita. Se pone azul cuando faltan 10 minutos o menos. |
| `anillo-cuenta.tsx` | El anillo de la cuenta regresiva (SVG). |
| `use-ahora.ts` | Da la hora actual y se refresca cada minuto. |
| `filas.tsx`, `fila-deslizable.tsx`, `accion.tsx` | Las filas de citas y solicitudes, y el gesto de deslizar. |
| `segmentos.tsx`, `cabecera.tsx`, `boton-icono.tsx` | Piezas visuales. |
| `por-confirmar-screen.tsx` | Citas de las próximas 24 horas sin recordar (RN-04). |
| `use-recordar.ts` | Marca una cita como recordada y abre WhatsApp. |
| `mensajes.ts` | Rellena las plantillas con nombre, fecha y hora. |
| `plantillas-screen.tsx` | Editor de las plantillas de WhatsApp. |
| `resumen-screen.tsx` | "Tu semana": el resumen en historias. |
| `historias.tsx`, `progreso-historias.tsx` | Cada tarjeta de ese resumen y la barra de avance. |
| `repo.ts`, `hooks.ts` | Consultas propias de Hoy: a quién contactar, cifras de la semana. |

### `features/agenda/`

| Archivo | Qué hace |
|---|---|
| `agenda-screen.tsx` | La pantalla: tira semanal arriba, línea de tiempo del día abajo. |
| `store.ts` | Zustand: qué día se está viendo. |
| `rules.ts` | Reglas puras: huecos libres, pasos de 15 minutos, si dos rangos se cruzan. |
| `semana-tira.tsx` | La tira de días, con gesto para cambiar de semana. |
| `linea-tiempo.tsx` | La línea de horas con las citas y los huecos. |
| `cita-bloque.tsx` | El bloque de una cita. |
| `cita-arrastrable.tsx` | Envuelve el bloque con el gesto de mantener y arrastrar para reprogramar. |
| `nueva-cita-sheet.tsx` | La hoja de nueva cita. |
| `paciente-selector.tsx`, `selector-horario.tsx`, `selectores.tsx` | Elegir paciente, fecha y hora. Son propios porque el selector nativo no viene en Expo Go. |
| `cita-detalle-sheet.tsx` | Detalle de la cita: cambiar estado, reprogramar, cobrar. |
| `reprogramar-panel.tsx`, `pago-seccion.tsx` | Partes de ese detalle. |
| `cupos-semana.tsx` | El medidor de cupos solidarios de la semana. |
| `aviso-flotante.tsx` | El aviso con "Deshacer" después de mover una cita. |
| `confirmar.ts` | Diálogo de confirmación. |
| `notifications.ts` | Programa y cancela los avisos locales antes de cada cita. |
| `disponibilidad-screen.tsx`, `editor-franja.tsx`, `editor-bloqueo.tsx` | Horario de atención y bloqueos. |
| `repo.ts`, `hooks.ts` | SQL y hooks de disponibilidad y bloqueos. |
| `use-ahora-ms.ts` | La hora actual para mover la línea de "ahora". |

### `features/pacientes/`

| Archivo | Qué hace |
|---|---|
| `pacientes-screen.tsx` | La lista con buscador y filtros. Si no encuentra a nadie, ofrece crearlo. |
| `store.ts` | Zustand: texto de búsqueda y filtro. |
| `fila-paciente.tsx` | La fila que se desliza para llamar o escribir. |
| `ficha-screen.tsx` | La ficha: acciones, asistencia, Próximas e Historia. |
| `historia.ts` | Regla pura que arma la línea de tiempo y la separa en lo que viene y lo que pasó. |
| `historia-linea.tsx`, `trazo-vertical.tsx` | Cómo se dibuja esa línea. |
| `asistencia-tira.tsx` | Los puntos de asistencia. Cada estado tiene forma distinta. |
| `agregar-historia.tsx`, `menu-acciones.tsx` | Acciones dentro de la ficha. |
| `paciente-form-screen.tsx` | Formulario de crear o editar (react-hook-form + zod). |
| `nota-screen.tsx` | La nota privada de una sesión. |
| `use-candado.ts` | Pide huella antes de abrir una nota. |
| `resumen-pdf.ts` | El PDF del paciente. No incluye notas. |
| `rules.ts`, `repo.ts`, `hooks.ts` | Reglas, SQL de notas y consentimientos, y hooks. |

### `features/pagos/`

| Archivo | Qué hace |
|---|---|
| `pagos-screen.tsx` | Por cobrar arriba, resumen del mes abajo. |
| `fila-pendiente.tsx` | La fila que se despliega para registrar el pago. |
| `store.ts` | Zustand: qué mes se está viendo. |
| `rules.ts` | Reglas puras: nombre del mes, la frase del resumen. |
| `pdf.ts` | El PDF del mes. |

### `features/solidario/`

| Archivo | Qué hace |
|---|---|
| `solidario-screen.tsx` | La pestaña: cupos, jornadas y seguimientos. |
| `rules.ts` | Reglas puras del programa. |
| `cupos.ts` | `confirmarCupoSolidario` (RN-03): si ya no hay cupos esa semana, pregunta antes de seguir. |
| `cupos-sheet.tsx` | Ajustar cupos por semana y tarifa social. |
| `jornada-form-sheet.tsx`, `jornada-screen.tsx` | Programar una jornada y registrar asistentes. |
| `seguimientos-screen.tsx` | Seguimientos agrupados por urgencia. |
| `informe.ts`, `informe-screen.tsx`, `informe-pdf.ts` | El informe de impacto. Solo cifras, nunca nombres. |
| `dispositivo.ts` | Llamar, escribir por WhatsApp, compartir, "cómo llegar". |
| `repo.ts`, `hooks.ts` | SQL y hooks de jornadas, asistentes y recursos. |
| `components/` | Piezas del módulo: medidor de cupos, tarjeta de jornada, ítem de seguimiento, stepper, sismos recientes. |
| `store/` | Dos stores de Zustand: estado del permiso de ubicación y la ubicación en memoria. |

**`solidario/api/`** (el ejemplo de axios + TanStack Query, igual que en clase):

| Archivo | Qué hace |
|---|---|
| `usgs-api.ts` | Crea el cliente de axios con la dirección del USGS. |
| `sismos.api.ts` | La función que hace la petición. |
| `usgs.types.ts` | Los tipos de lo que responde el servidor. |
| `sismo.mapper.ts` | Convierte esa respuesta en un `Sismo` simple y calcula la distancia a Pereira. |
| `use-sismos.ts` | El hook `useQuery` que usa la pantalla. Los datos duran frescos 15 minutos. |

**`solidario/mapa/`**:

| Archivo | Qué hace |
|---|---|
| `mapa-screen.tsx` | La pantalla del mapa. |
| `mapa-leaflet.tsx` | El `WebView` que carga Leaflet y se comunica con la app por mensajes. |
| `leaflet-html.ts` | El HTML con el mapa que se le pasa al WebView. |
| `ubicacion.ts`, `use-mi-ubicacion.ts` | Permiso y lectura de la ubicación. |
| `elegir-punto-screen.tsx` | Tocar el mapa para fijar el lugar de una jornada. |
| `piezas.tsx` | Controles, leyenda y avisos del mapa. |

## 6. El viaje de un dato: agendar una cita

1. **Pantalla.** En `agenda/nueva-cita-sheet.tsx` eliges paciente, fecha y hora, y tocas Agendar.
2. **Hook.** La hoja llama a `useCrearCita()` de `data/hooks.ts`, que es un `useMutation`.
3. **Repositorio.** El hook llama a `crearCita()` en `data/repos/citas.ts`. Antes de insertar, `haySolape()` revisa que no choque con otra cita (RN-01).
4. **Base de datos.** `ejecutar()` de `data/db.ts` corre el `INSERT` en SQLite.
5. **Refresco.** Al terminar, el hook invalida `qk.citas`. Toda pantalla que lea citas (Hoy, Agenda, la ficha) se vuelve a pedir sola.
6. **Cierre.** La hoja se cierra, el teléfono vibra y la cita aparece en su hueco.

## 7. Reglas de negocio y dónde están

| Regla | Qué dice | Archivo |
|---|---|---|
| RN-01 | Dos citas no pueden cruzarse. | `data/repos/citas.ts` (`haySolape`) |
| RN-02 | Se guarda en UTC, se muestra en hora de Colombia. | `lib/dates.ts` |
| RN-03 | Cupos solidarios limitados por semana; pasarse pide confirmación. | `solidario/cupos.ts` |
| RN-04 | Citas de las próximas 24 h sin recordar van a "Por confirmar". | `hoy/por-confirmar-screen.tsx` |
| RN-05 | Al marcar "asistió" se crea el pago según la tarifa. | `data/repos/citas.ts` (`cambiarEstadoCita`) |
| RN-10 | Notificaciones, PDF e informes nunca llevan datos sensibles. | `agenda/notifications.ts`, los `pdf.ts` |

## 8. Respuestas cortas para preguntas probables

- **¿Qué es Metro?** El empaquetador: une todo el código en un archivo y lo sirve al teléfono, con recarga en vivo.
- **¿Qué es Expo Go?** Una app que ya trae el código nativo y ejecuta mi JavaScript sin compilar.
- **¿Por qué no hay backend?** Son datos de salud. Guardarlos solo en el teléfono es más simple y más privado. Supabase queda como adaptador futuro.
- **¿Dónde se guardan los datos?** En SQLite, un archivo dentro del teléfono.
- **¿Zustand o TanStack Query?** Query para los datos guardados; Zustand para lo que la pantalla muestra en el momento.
- **¿Dónde usas axios?** Solo para la API pública de sismos del USGS. Nunca viaja un dato de pacientes.
- **¿Qué es una migración?** Un paso numerado de SQL que lleva la base de una versión a la siguiente. Se agregan, no se editan.
- **¿Por qué `rules.ts`?** Para separar la lógica de la pantalla. Son funciones puras, fáciles de probar.
- **¿Por qué el mapa va en un WebView?** Leaflet es una librería web y funciona en Expo Go sin llaves ni módulos nativos extra.
- **¿Cómo funciona en iPhone sin Mac?** Con Expo Go: el mismo JavaScript corre en iOS y Android.
