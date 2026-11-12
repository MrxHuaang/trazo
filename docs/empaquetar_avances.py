"""
Arma el paquete de avances para entregar: informe, documentación, repositorio y código por día.

Uso:  python docs/empaquetar_avances.py
Salida: entregables/avances/Juan Pantoja/   (no se versiona)

El código de cada día se toma del commit correspondiente con `git show`, así refleja
lo que existía ese día. Los nombres usan "__" en lugar de "/" porque las carpetas se
suben planas.
"""
from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "entregables" / "avances" / "Juan Pantoja"
REPO = "https://github.com/MrxHuaang/trazo"
WT = ROOT / ".claude" / "worktrees"


def git(*args: str) -> bytes:
    return subprocess.run(["git", *args], cwd=ROOT, check=True, capture_output=True).stdout


def plano(ruta: str) -> str:
    return ruta.removeprefix("src/").replace("/", "__")


def carpeta(nombre: str, titulo: str, resumen: str, commit: str | None, archivos: list[tuple[str, str]], origen: Path | None = None):
    """Copia `archivos` (ruta, descripción) desde `commit` (o desde `origen` en disco) y escribe LEEME.md."""
    destino = OUT / nombre
    destino.mkdir(parents=True, exist_ok=True)
    filas = []
    for ruta, descripcion in archivos:
        try:
            contenido = git("show", f"{commit}:{ruta}") if commit else (origen or ROOT).joinpath(ruta).read_bytes()
        except (subprocess.CalledProcessError, FileNotFoundError):
            print(f"  (omitido, no existe) {ruta}")
            continue
        (destino / plano(ruta)).write_bytes(contenido)
        filas.append(f"| `{plano(ruta)}` | `{ruta}` | {descripcion} |")
    procedencia = f"Commit `{commit}` del repositorio {REPO}" if commit else "Corte del trabajo en curso (aún sin integrar)"
    (destino / "LEEME.md").write_text(
        f"# {titulo}\n\n{resumen}\n\n**Procedencia:** {procedencia}.\n\n"
        "| Archivo en esta carpeta | Ruta en el repositorio | Qué hace |\n|---|---|---|\n" + "\n".join(filas) + "\n",
        encoding="utf-8",
    )
    print(f"OK  {nombre}  ({len(filas)} archivos)")


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    # 00 Informe
    shutil.copy(ROOT / "entregables" / "Trazo_Informe_de_avances_2026-11-10.pdf", OUT / "00_Informe_de_avances_Trazo.pdf")

    # 01 Documentación y repositorio
    doc = OUT / "01_Documentacion_y_repositorio"
    doc.mkdir()
    shutil.copy(ROOT / "entregables" / "Trazo_Documento_Maestro_v1.0.pdf", doc / "Trazo_Documento_Maestro_v1.0.pdf")
    (doc / "Repositorio_GitHub.url").write_text(f"[InternetShortcut]\nURL={REPO}\n", encoding="utf-8")
    ramas = git("log", "--format=%h  %ad  %s", "--date=format:%Y-%m-%d %H:%M", "feat/mvp-sprints").decode("utf-8")
    (doc / "LEEME_Repositorio.md").write_text(
        f"# Repositorio de Trazo\n\n- **URL (público):** {REPO}\n- **Pull request del MVP:** {REPO}/pull/2\n- **Pull request de la base:** {REPO}/pull/1\n"
        "- **Rama con el trabajo más reciente:** `feat/mvp-sprints`\n"
        "- **Copia del código:** `trazo_codigo_fuente.zip` (rama `feat/mvp-sprints`, sin `node_modules`)\n\n"
        "## Cómo ejecutar\n\n```bash\ngit clone https://github.com/MrxHuaang/trazo.git\ncd trazo\ngit switch feat/mvp-sprints\n"
        "npm install\nnpx expo start   # tecla \"a\": emulador Android con Expo Go 58\n```\n\n"
        "## Historial de commits (rama feat/mvp-sprints)\n\n```\n" + ramas + "```\n",
        encoding="utf-8",
    )
    git("archive", "--format=zip", "-o", str(doc / "trazo_codigo_fuente.zip"), "feat/mvp-sprints", "--", ".", ":(exclude)entregables")
    print("OK  01_Documentacion_y_repositorio")

    carpeta(
        "02_Dia1_2026-11-08_Planeacion_y_diseno",
        "Día 1 · 8 de noviembre de 2026 · Planeación y diseño",
        "Definición del producto, requerimientos, diseño visual, arquitectura y plan. El resultado es el documento maestro v0.2 "
        "(en `01_Documentacion_y_repositorio`). Aquí están las fuentes con las que se genera ese PDF.",
        "b26481e",
        [
            ("docs/build.py", "Script que ensambla el HTML y lo convierte a PDF con Edge sin interfaz."),
            ("docs/src/estilos.css", "Hoja de estilos de impresión del documento (sistema visual Trazo suave)."),
            ("docs/src/maestro/02-producto.html", "Capítulos 4 a 6: propuesta, alcance del MVP, historias de usuario y reglas de negocio."),
            ("docs/src/maestro/03-diseno.html", "Capítulo 7: sistema visual, wireframes de las cuatro pantallas y tokens."),
            ("docs/src/maestro/04-tecnica.html", "Capítulos 8 y 9: arquitectura, stack, modelo de datos y seguridad."),
            ("docs/src/maestro/05-entrega.html", "Capítulos 10 a 15: iPhone sin Mac, pruebas, plan de trabajo, riesgos, ética y costos."),
        ],
    )

    carpeta(
        "03_Dia2_2026-11-09_Base_y_sistema_visual",
        "Día 2 · 9 de noviembre de 2026 · Base del proyecto y sistema visual",
        "Proyecto Expo SDK 58, tokens de diseño, componentes reutilizables, pestañas nativas y primera versión de la pantalla Hoy. "
        "Incluye las correcciones hechas al probar en el emulador Pixel 8 y el cambio de nombre a Trazo.",
        "8242443",
        [
            ("app.json", "Configuración de la app: nombre, ícono, pantalla de carga, solo modo claro."),
            ("src/theme/tokens.ts", "Única fuente de color, tipografía, radios y espacios."),
            ("src/theme/fonts.ts", "Fuentes Bricolage Grotesque, Geist y Geist Mono."),
            ("src/ui/trace-line.tsx", "El Trazo: línea de sismógrafo animada que se calma, con las citas como puntos."),
            ("src/ui/tile.tsx", "Bloque de color del mosaico, con respuesta al toque."),
            ("src/ui/hatch.tsx", "Textura rayada de lo solidario (corregida para Android)."),
            ("src/ui/fab.tsx", "Botón flotante principal Agendar."),
            ("src/ui/list-row.tsx", "Fila de lista con hora en fuente monoespaciada."),
            ("src/ui/screen.tsx", "Contenedor de pantalla con márgenes seguros."),
            ("src/navigation/app-tabs.tsx", "Pestañas nativas: SF Symbols en iPhone, Material en Android."),
            ("src/navigation/app-tabs.web.tsx", "Barra de pestañas propia para la versión web."),
            ("src/features/hoy/hoy-screen.tsx", "Primera versión de la pantalla Hoy (datos fijos de demostración)."),
            ("src/features/hoy/rules.ts", "Reglas puras: próxima cita, nodos del Trazo, formatos."),
            ("src/app/_layout.tsx", "Layout raíz: carga de fuentes y navegación."),
            ("AGENTS.md", "Reglas del proyecto."),
        ],
    )

    carpeta(
        "04_Dia2_2026-11-09_Capa_de_datos",
        "Día 2 · 9 de noviembre de 2026 · Capa de datos, dominio y base compartida",
        "Base de datos local SQLite con migraciones, tipos de dominio, repositorios con las reglas de negocio, hooks de datos, "
        "datos ficticios de demostración, utilidades y componentes de formulario.",
        "9ec7ccd",
        [
            ("src/domain/types.ts", "Entidades y enumeraciones del dominio."),
            ("src/data/schema.ts", "Esquema SQL: 12 tablas, migraciones por PRAGMA user_version."),
            ("src/data/db.ts", "Conexión, migraciones y funciones de consulta."),
            ("src/data/repos/citas.ts", "Citas: regla anti-solapes (RN-01), pago al marcar asistencia (RN-05), cupos por semana (RN-03)."),
            ("src/data/repos/pacientes.ts", "Pacientes: búsqueda, creación con autorización de datos, archivado (RN-09)."),
            ("src/data/repos/pagos.ts", "Pagos y resumen mensual."),
            ("src/data/repos/seguimientos.ts", "Seguimientos del programa solidario."),
            ("src/data/repos/consultorio.ts", "Consultorio, tarifas y plantillas de mensajes."),
            ("src/data/hooks.ts", "Hooks de TanStack Query compartidos por los módulos."),
            ("src/data/keys.ts", "Llaves de caché por entidad."),
            ("src/data/seed.ts", "Datos ficticios de demostración relativos a la fecha actual."),
            ("src/lib/dates.ts", "Fechas en la zona America/Bogota (RN-02)."),
            ("src/lib/whatsapp.ts", "Enlace wa.me con mensaje listo y plantillas."),
            ("src/ui/button.tsx", "Botón con variantes."),
            ("src/ui/field.tsx", "Campo de texto con etiqueta, ayuda y error."),
            ("src/ui/sheet.tsx", "Contenedor de hojas inferiores con manejo de teclado."),
            ("src/ui/segmented.tsx", "Selector de opciones excluyentes."),
        ],
    )

    carpeta(
        "05_Dia2-3_2026-11-09_Modulo_Hoy_y_pagos",
        "Días 2 y 3 · 9 y 10 de noviembre de 2026 · Módulo Hoy y pagos",
        "Pantalla Hoy conectada a la base de datos, hoja Por confirmar con recordatorio por WhatsApp, pagos con resumen mensual y PDF, "
        "y plantillas de mensajes. Es la primera versión del módulo, antes del rediseño con NativeWind.",
        "1ec6bb3",
        [
            ("src/features/hoy/hoy-screen.tsx", "Hoy con datos reales: próxima cita, bloques de pendientes y secciones."),
            ("src/features/hoy/rules.ts", "Reglas puras de la pantalla Hoy."),
            ("src/features/hoy/repo.ts", "Consulta de pacientes con dos inasistencias seguidas (RN-06)."),
            ("src/features/hoy/mensajes.ts", "Armado de mensajes de recordatorio y confirmación."),
            ("src/features/hoy/use-recordar.ts", "Abre WhatsApp y marca la cita como recordada (HU-06)."),
            ("src/features/hoy/por-confirmar-screen.tsx", "Hoja con las citas de las próximas 24 horas sin recordar (RN-04)."),
            ("src/features/hoy/plantillas-screen.tsx", "Edición de plantillas con variables y vista previa."),
            ("src/features/hoy/segmentos.tsx", "Contador por segmentos de los cupos solidarios."),
            ("src/features/pagos/pagos-screen.tsx", "Pagos: resumen del mes, pendientes y registro por método (HU-10, HU-16)."),
            ("src/features/pagos/rules.ts", "Agrupación por día y totales."),
            ("src/features/pagos/pdf.ts", "Exportación del mes a PDF (HU-24)."),
            ("src/features/pagos/fila-pendiente.tsx", "Fila de pago pendiente con selector de método."),
        ],
    )

    primera = "5a9d169"
    carpeta(
        "06_Dia3_2026-11-10_Modulos_primera_version",
        "Día 3 · 10 de noviembre de 2026 (mañana) · Primera versión de los módulos",
        "Agenda, pacientes, solidario y acceso tal como quedaron al integrarlos por primera vez en `feat/mvp-sprints`, "
        "antes del rediseño con NativeWind.",
        primera,
        [
            ("src/features/agenda/agenda-screen.tsx", "Agenda: semana, cupos y línea de tiempo del día."),
            ("src/features/agenda/linea-tiempo.tsx", "Línea de tiempo con citas, huecos libres y hora actual."),
            ("src/features/agenda/nueva-cita-sheet.tsx", "Hoja para crear una cita tocando un hueco."),
            ("src/features/agenda/cita-detalle-sheet.tsx", "Detalle de la cita con cambio de estado y pago."),
            ("src/features/agenda/notifications.ts", "Avisos locales antes de cada cita."),
            ("src/features/agenda/disponibilidad-screen.tsx", "Disponibilidad semanal y bloqueos."),
            ("src/features/agenda/rules.ts", "Reglas puras de la agenda."),
            ("src/features/pacientes/pacientes-screen.tsx", "Lista de pacientes con búsqueda y creación en contexto."),
            ("src/features/pacientes/ficha-screen.tsx", "Ficha del paciente con su historia."),
            ("src/features/pacientes/nota-screen.tsx", "Nota de sesión privada bajo bloqueo."),
            ("src/features/pacientes/resumen-pdf.ts", "Resumen del paciente en PDF."),
            ("src/features/solidario/solidario-screen.tsx", "Pestaña Solidario: cupos, jornadas, seguimientos y líneas de ayuda."),
            ("src/features/solidario/cupos.ts", "Regla de cupos solidarios por semana (RN-03)."),
            ("src/features/solidario/jornada-screen.tsx", "Jornada con sus asistentes."),
            ("src/features/solidario/informe.ts", "Informe de impacto del mes."),
            ("src/features/acceso/access-gate.tsx", "Puerta de acceso: bienvenida o bloqueo según el estado."),
            ("src/features/acceso/onboarding-screen.tsx", "Bienvenida: crear consultorio o cargar demostración."),
            ("src/features/acceso/pantalla-bloqueo.tsx", "Bloqueo con biometría o código del teléfono."),
        ],
    )

    carpeta(
        "07_Dia3_2026-11-10_NativeWind_y_diseno_v2",
        "Día 3 · 10 de noviembre de 2026 (tarde) · NativeWind, Tailwind y base del diseño v2",
        "Configuración de NativeWind 4 y Tailwind 3 igual a la vista en clase, paleta única de colores y componentes base "
        "pasados a clases, con piezas de movimiento nuevas.",
        "4d27832",
        [
            ("tailwind.config.js", "Colores, fuentes, radios y escala tipográfica de Trazo como tema de Tailwind."),
            ("babel.config.js", "Preset de Babel con NativeWind (igual a los proyectos de clase)."),
            ("metro.config.js", "Metro con NativeWind y la hoja global."),
            ("src/global.css", "Directivas de Tailwind."),
            ("src/theme/palette.js", "Única fuente de color, compartida por Tailwind y los tokens."),
            ("src/lib/cn.ts", "Une clases de Tailwind resolviendo conflictos."),
            ("src/ui/presionable.tsx", "Base táctil: se hunde con resorte y da un toque háptico."),
            ("src/ui/aparecer.tsx", "Entrada en cascada de los bloques de cada pantalla."),
            ("src/ui/numero-animado.tsx", "Número que cuenta hasta su valor."),
            ("src/ui/tile.tsx", "Bloque de color con clases de NativeWind."),
            ("src/ui/button.tsx", "Botón con variantes y área táctil cómoda."),
            ("src/ui/trace-line.tsx", "El Trazo con energía en vivo y pulso de la próxima cita."),
            ("AGENTS.md", "Reglas del proyecto: NativeWind, movimiento, claridad y accesibilidad."),
        ],
    )

    carpeta(
        "08_Dia3_2026-11-10_Funciones_v2",
        "Día 3 · 10 de noviembre de 2026 (noche) · Funciones nuevas de cada módulo",
        "Segunda versión de los módulos con el stack del curso: Zustand, axios con TanStack Query, mapas con Leaflet, "
        "carrusel y gestos. Es el estado integrado y probado en el emulador Pixel 8.",
        "a3f1f85",
        [
            ("src/features/agenda/cita-arrastrable.tsx", "Arrastrar una cita para reprogramarla en pasos de 15 minutos."),
            ("src/features/agenda/store.ts", "Zustand: día mostrado en la agenda y navegación entre semanas."),
            ("src/features/hoy/hoy-screen.tsx", "Hoy con encabezado colapsable y filas deslizables."),
            ("src/features/hoy/trazo-interactivo.tsx", "Línea del día que se recorre con el dedo."),
            ("src/features/hoy/bloque-proxima.tsx", "Próxima cita con anillo de cuenta regresiva."),
            ("src/features/hoy/resumen-screen.tsx", "Resumen de la semana en historias."),
            ("src/features/hoy/historias.tsx", "Carrusel de historias con react-native-reanimated-carousel."),
            ("src/features/pagos/store.ts", "Zustand: mes mostrado en pagos."),
            ("src/features/pacientes/store.ts", "Zustand: búsqueda y filtro de pacientes."),
            ("src/features/pacientes/fila-paciente.tsx", "Fila deslizable: WhatsApp o agendar."),
            ("src/features/pacientes/asistencia-tira.tsx", "Asistencia de un vistazo con formas por estado."),
            ("src/features/solidario/api/usgs-api.ts", "Instancia de axios para el servicio público del USGS."),
            ("src/features/solidario/api/sismos.api.ts", "Consulta de sismos recientes cerca de Pereira."),
            ("src/features/solidario/api/sismo.mapper.ts", "Convierte la respuesta del USGS al modelo de la app."),
            ("src/features/solidario/api/use-sismos.ts", "Hook de TanStack Query con caché de 15 minutos."),
            ("src/features/solidario/mapa/mapa-screen.tsx", "Mapa de jornadas con ubicación y sismos."),
            ("src/features/solidario/mapa/mapa-leaflet.tsx", "Leaflet dentro de react-native-webview."),
            ("src/features/solidario/store/use-ubicacion-store.ts", "Zustand: ubicación actual."),
            ("src/features/solidario/store/use-permisos-store.ts", "Zustand: permiso de ubicación."),
            ("src/features/acceso/use-sismografo.ts", "Sismógrafo vivo con el acelerómetro."),
            ("src/features/acceso/sesion.ts", "Zustand: sesión y bloqueo."),
            ("src/features/acceso/laminas-bienvenida.tsx", "Carrusel de la bienvenida."),
        ],
    )

    # 09 Capturas
    cap = OUT / "09_Capturas"
    cap.mkdir()
    capturas = [
        ("v2-hoy", "01_Hoy"), ("v2-agenda", "02_Agenda"), ("v2-pacientes", "03_Pacientes"), ("v2-ficha", "04_Ficha_paciente"),
        ("v2-solidario", "05_Solidario"), ("v2-mapa", "06_Mapa_jornadas"), ("v2-resumen", "07_Resumen_semana"),
        ("v2-lineas", "08_Lineas_de_ayuda"), ("v2-ajustes", "09_Ajustes"),
    ]
    for origen, nombre in capturas:
        shutil.copy(ROOT / "docs" / "img" / f"{origen}.png", cap / f"{nombre}_Pixel8_2026-11-10.png")
    shutil.copy(ROOT / "assets" / "images" / "icon.png", cap / "10_Icono_de_la_app.png")
    print("OK  09_Capturas")

    total = sum(f.stat().st_size for f in OUT.rglob("*") if f.is_file())
    print(f"Paquete: {OUT}  ({sum(1 for f in OUT.rglob('*') if f.is_file())} archivos, {total/1e6:.1f} MB)")


if __name__ == "__main__":
    main()
