"""Genera public/musica.wav: pad ambiental suave sintetizado (sin muestras externas).

Acordes lentos Cmaj7 -> Am9 -> Fmaj7 -> G6, 8 s cada uno, senoidales con
armonicos leves, ataque y caida largos, reverb simple por retardos con feedback.
Pico cerca de -18 dBFS. Uso: python scripts/musica.py [segundos]
"""
import sys
import wave
from pathlib import Path

import numpy as np

SR = 44100
DURACION = float(sys.argv[1]) if len(sys.argv) > 1 else 330.0
ACORDE_S = 8.0
ATAQUE_S = 3.2
CAIDA_S = 4.5
PICO_DBFS = -18.0

ACORDES = [
    [36, 48, 55, 59, 64],  # Cmaj7
    [33, 45, 52, 55, 60, 71],  # Am9
    [29, 41, 53, 57, 60, 64],  # Fmaj7
    [31, 43, 55, 59, 62, 64],  # G6
]


def hz(midi: int) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def envolvente(n: int) -> np.ndarray:
    t = np.arange(n) / SR
    total = n / SR
    ataque = 0.5 - 0.5 * np.cos(np.pi * np.clip(t / ATAQUE_S, 0, 1))
    caida = 0.5 - 0.5 * np.cos(np.pi * np.clip((total - t) / CAIDA_S, 0, 1))
    return ataque * caida


def voz(f: float, n: int, fase: float, desafino: float) -> np.ndarray:
    t = np.arange(n) / SR
    vib = 0.0025 * np.sin(2 * np.pi * 0.11 * t + fase)  # deriva lenta de afinacion
    w = 2 * np.pi * f * (1 + vib + desafino)
    return (
        np.sin(w * t + fase)
        + 0.18 * np.sin(2 * w * t + fase * 1.3)
        + 0.05 * np.sin(3 * w * t + fase * 0.7)
    )


def comb(x: np.ndarray, retardo: int, g: float) -> np.ndarray:
    """y[n] = x[n] + g * y[n - retardo], vectorizado por bloques."""
    y = np.zeros_like(x)
    for i in range(0, len(x), retardo):
        fin = min(i + retardo, len(x))
        y[i:fin] = x[i:fin]
        if i >= retardo:
            y[i:fin] += g * y[i - retardo : i - retardo + (fin - i)]
    return y


def main() -> None:
    total = int(DURACION * SR)
    izq = np.zeros(total)
    der = np.zeros(total)
    rng = np.random.default_rng(7)

    n_acordes = int(np.ceil(DURACION / ACORDE_S))
    for k in range(n_acordes):
        notas = ACORDES[k % len(ACORDES)]
        ini = int(k * ACORDE_S * SR)
        n = int((ACORDE_S + CAIDA_S) * SR)
        fin = min(ini + n, total)
        n = fin - ini
        if n <= 0:
            continue
        env = envolvente(n)
        for j, m in enumerate(notas):
            f = hz(m)
            bajo = j == 0
            amp = 0.55 if bajo else 0.32 / (1 + 0.15 * j)
            pan = 0.5 if bajo else 0.25 + 0.5 * ((j * 0.37) % 1)
            fase = rng.uniform(0, 2 * np.pi)
            l = voz(f, n, fase, -0.0006) * env * amp
            r = voz(f, n, fase + 0.4, 0.0006) * env * amp
            izq[ini:fin] += l * (1 - pan) * 2 * 0.5
            der[ini:fin] += r * pan * 2 * 0.5

    # Respiracion lenta del volumen general
    t = np.arange(total) / SR
    respiracion = 0.88 + 0.12 * np.sin(2 * np.pi * t / 23.0)
    izq *= respiracion
    der *= respiracion

    # Reverb simple: combs paralelos con feedback, distintos por canal
    def reverb(x: np.ndarray, retardos: list[float]) -> np.ndarray:
        w = sum(comb(x, int(d * SR), 0.78) for d in retardos) / len(retardos)
        return w

    izq_w = reverb(izq, [0.0297, 0.0371, 0.0411, 0.0437, 0.113, 0.251])
    der_w = reverb(der, [0.0311, 0.0353, 0.0423, 0.0449, 0.127, 0.263])
    izq = 0.62 * izq + 0.38 * izq_w
    der = 0.62 * der + 0.38 * der_w

    # Fundidos del archivo
    fade_in = np.clip(t / 4.0, 0, 1)
    fade_out = np.clip((DURACION - t) / 6.0, 0, 1)
    izq *= fade_in * fade_out
    der *= fade_in * fade_out

    estereo = np.stack([izq, der], axis=1)
    pico = np.max(np.abs(estereo))
    estereo *= (10 ** (PICO_DBFS / 20)) / pico

    salida = Path(__file__).resolve().parent.parent / "public" / "musica.wav"
    salida.parent.mkdir(parents=True, exist_ok=True)
    datos = (estereo * 32767).astype("<i2")
    with wave.open(str(salida), "wb") as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(datos.tobytes())
    print(f"{salida} · {DURACION:.0f} s · pico {PICO_DBFS} dBFS")


if __name__ == "__main__":
    main()
