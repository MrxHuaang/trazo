"""
Compila los documentos de Trazo (HTML -> PDF) con Microsoft Edge o Chrome en modo headless.

Uso:
    python docs/build.py            # compila todos
    python docs/build.py maestro    # compila solo el documento maestro

Salida: entregables/*.pdf  (y docs/out/*.html con el HTML ensamblado)
"""
from __future__ import annotations

import math
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
        "title": "Trazo — Documento maestro del proyecto",
        "footer": "Trazo · Documento maestro del proyecto · v0.2",
        "parts": sorted((SRC / "maestro").glob("*.html")),
        "pdf": "Trazo_Documento_Maestro_v0.2.pdf",
    },
}


def wave_svg() -> str:
    """Onda sísmica que se calma de izquierda a derecha (portada)."""
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


def assemble(key: str) -> Path:
    cfg = DOCS[key]
    css = (SRC / "estilos.css").read_text(encoding="utf-8")
    body = "\n".join(p.read_text(encoding="utf-8") for p in cfg["parts"])
    body = body.replace("{{WAVE}}", wave_svg())
    footer_css = (
        "@page { @bottom-left { content: \"" + cfg["footer"] + "\"; } }"
    )
    html = (
        "<!doctype html><html lang=\"es-CO\"><head><meta charset=\"utf-8\">"
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
