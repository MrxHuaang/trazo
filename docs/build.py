"""
Arma el HTML de cada documento y lo imprime a PDF con Edge (o Chrome) headless.
Se usa el navegador porque respeta @page y las fuentes web sin instalar nada extra.

Uso: python docs/build.py [maestro|avances]
Los PDF quedan en entregables/ y el HTML ensamblado en docs/out/.
"""
from __future__ import annotations

import math
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
OUT_HTML = ROOT / "out"
OUT_PDF = ROOT.parent / "entregables"

BROWSERS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
]

FONTS = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    '<link href="https://fonts.googleapis.com/css2?'
    "family=Bricolage+Grotesque:opsz,wght@12..96,500..800&"
    "family=Geist:wght@400;500;600;700&"
    'family=Geist+Mono:wght@400;500&display=block" rel="stylesheet">'
)

DOCS = {
    "maestro": {
        "title": "Trazo · Documento maestro del proyecto",
        "footer": "Trazo · Documento maestro del proyecto · v1.0",
        "parts": sorted((SRC / "maestro").glob("*.html")),
        "pdf": "Trazo_Documento_Maestro_v1.0.pdf",
    },
    "avances": {
        "title": "Trazo · Informe de avances",
        "footer": "Trazo · Informe de avances · 10 de noviembre de 2026",
        "parts": sorted((SRC / "avances").glob("*.html")),
        "pdf": "Trazo_Informe_de_avances_2026-11-10.pdf",
    },
}


def wave_svg() -> str:
    """Onda de la portada; reemplaza {{WAVE}} en el HTML."""
    lines = []
    specs = [  # (amplitud inicial, desfase, opacidad, grosor, color)
        (26, 0.0, 0.95, 1.6, "#17171C"),
        (19, 1.3, 0.75, 1.1, "#2340E0"),
        (13, 2.4, 0.9, 0.9, "#F2A27E"),
    ]
    for amp0, phase, op, sw, color in specs:
        pts = []
        x = 0.0
        while x <= 210.0:
            t = x / 210.0
            decay = math.exp(-4.2 * t)
            freq = 0.55 + 0.25 * (1 - t)
            noise = math.sin(x * 1.7 + phase * 3) * 0.35 + math.sin(x * 0.53 + phase) * 0.65
            y = 40 + amp0 * decay * math.sin(x * freq + phase) * (0.75 + 0.25 * noise) + 1.2 * math.sin(x * 0.06 + phase)
            pts.append(f"{x:.1f},{y:.2f}")
            x += 0.7
        lines.append(
            f'<polyline points="{" ".join(pts)}" fill="none" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round" opacity="{op}"/>'
        )
    return (
        '<svg class="wave" viewBox="0 0 210 80" xmlns="http://www.w3.org/2000/svg" '
        'preserveAspectRatio="none" style="height:56mm">' + "".join(lines) + "</svg>"
    )


NAV_JS = (
    "<script>(function(){var l=[].slice.call(document.querySelectorAll('.nav a'));"
    "if(!l.length||!('IntersectionObserver' in window))return;var m={};"
    "l.forEach(function(a){m[a.getAttribute('href').slice(1)]=a;});"
    "var o=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;"
    "l.forEach(function(a){a.classList.remove('on');});var a=m[e.target.id];"
    "if(a){a.classList.add('on');a.scrollIntoView({block:'nearest'});}});},{rootMargin:'-10% 0px -80% 0px'});"
    "Object.keys(m).forEach(function(id){var t=document.getElementById(id);if(t)o.observe(t);});})();</script>"
)


def con_navegacion(body: str, cfg: dict) -> str:
    """Índice lateral para leer el HTML en pantalla. El CSS de impresión lo oculta en el PDF."""
    enlaces: list[str] = []
    numero = 0

    def marcar(m: re.Match) -> str:
        nonlocal numero
        clases, attrs, titulo = m.group(1), m.group(2), m.group(3)
        texto = re.sub(r"<[^>]+>", "", titulo).strip()
        etiqueta = re.search(r'data-nav="([^"]+)"', attrs)
        if "nonum" in clases:
            ident, num = f"sec-{len(enlaces) + 1}", ""
        else:
            numero += 1
            ident, num = f"cap-{numero:02d}", f"{numero}"
        if num == "1":
            enlaces.append('<div class="nav-label">Capítulos</div>')
        enlaces.append(f'<a href="#{ident}"><i>{num}</i>{etiqueta.group(1) if etiqueta else texto}</a>')
        return f'<h2 class="{clases}" id="{ident}"{attrs}>{titulo}</h2>'

    body = re.sub(r'<h2 class="(chapter[^"]*)"([^>]*)>(.*?)</h2>', marcar, body, flags=re.S)
    marca, _, resto = cfg["footer"].partition(" · ")
    nav = (
        f'<nav class="nav" aria-label="Contenido"><div class="nav-brand">{marca}<span>{resto}</span></div>'
        '<div class="nav-label">Empezar aquí</div>' + "".join(enlaces) +
        f'<div class="pdf">Versión para imprimir: {cfg["pdf"]}</div></nav>'
    )
    return f"{nav}<main>{body}</main>{NAV_JS}"


def assemble(key: str) -> Path:
    cfg = DOCS[key]
    css = (SRC / "estilos.css").read_text(encoding="utf-8")
    body = "\n".join(p.read_text(encoding="utf-8") for p in cfg["parts"])
    body = con_navegacion(body.replace("{{WAVE}}", wave_svg()), cfg)
    footer_css = (
        "@page { @bottom-left { content: \"" + cfg["footer"] + "\"; } }"
    )
    html = (
        "<!doctype html><html lang=\"es-CO\"><head><meta charset=\"utf-8\">"
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        f"<title>{cfg['title']}</title>{FONTS}<style>{css}\n{footer_css}</style></head>"
        f"<body>{body}</body></html>"
    )
    OUT_HTML.mkdir(exist_ok=True)
    out = OUT_HTML / f"{key}.html"
    out.write_text(html, encoding="utf-8")
    return out


def render(html: Path, pdf: Path) -> None:
    browser = next((b for b in BROWSERS if Path(b).exists()), None)
    if not browser:
        sys.exit("No se encontró Edge ni Chrome.")
    OUT_PDF.mkdir(exist_ok=True)
    profile = tempfile.mkdtemp(prefix="trazo-pdf-")
    try:
        cmd = [
            browser,
            "--headless=new",
            "--disable-gpu",
            "--no-first-run",
            "--no-default-browser-check",
            f"--user-data-dir={profile}",
            "--no-pdf-header-footer",
            # Tiempo para que carguen las fuentes de Google antes de imprimir.
            "--virtual-time-budget=20000",
            "--run-all-compositor-stages-before-draw",
            f"--print-to-pdf={pdf}",
            html.resolve().as_uri(),
        ]
        subprocess.run(cmd, check=True, timeout=180, capture_output=True)
    finally:
        shutil.rmtree(profile, ignore_errors=True)
    print(f"OK  {pdf}  ({pdf.stat().st_size/1024:.0f} KB)")


def main() -> None:
    keys = sys.argv[1:] or list(DOCS)
    for key in keys:
        if not DOCS[key]["parts"]:
            print(f"--  {key}: sin partes todavía")
            continue
        html = assemble(key)
        render(html, OUT_PDF / DOCS[key]["pdf"])


if __name__ == "__main__":
    main()
