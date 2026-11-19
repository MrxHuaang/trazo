"""Sintetiza public/musica.wav desde cero, sin muestras externas, para no depender de licencias.

Progresion Cmaj7, Am9, Fmaj7, G6 a 92 BPM, dos compases por acorde.
Uso: python scripts/musica.py [segundos]
"""
import sys
import wave
from pathlib import Path

import numpy as np

SR = 44100
DURACION = float(sys.argv[1]) if len(sys.argv) > 1 else 330.0
BPM = 92
PULSO = 60.0 / BPM
COMPAS = 4 * PULSO
RMS_DBFS = -18.0
TECHO_DBFS = -1.0

# (bajo, voces del pad, notas del arpegio)
ACORDES = [
    (48, [48, 55, 59, 64], [60, 64, 67, 71, 72, 76]),  # Cmaj7
    (45, [45, 52, 55, 60, 71], [57, 60, 64, 67, 71, 72]),  # Am9
    (41, [41, 53, 57, 60, 64], [57, 60, 64, 65, 69, 72]),  # Fmaj7
    (43, [43, 55, 59, 62, 64], [59, 62, 64, 67, 71, 74]),  # G6
]
# 16 corcheas por acorde (2 compases), indices sobre las notas del arpegio
PATRON = [0, 2, 4, 2, 1, 3, 5, 3, 0, 2, 4, 5, 3, 2, 1, 2]
SWING = 0.045 * PULSO

rng = np.random.default_rng(11)


def hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def sumar(destino: np.ndarray, señal: np.ndarray, inicio_s: float, pan: float = 0.5) -> None:
    """Paneo de potencia constante, para que el volumen no baje al centro."""
    i = int(inicio_s * SR)
    if i >= len(destino) or i < 0:
        return
    fin = min(i + len(señal), len(destino))
    s = señal[: fin - i]
    destino[i:fin, 0] += s * np.cos(pan * np.pi / 2)
    destino[i:fin, 1] += s * np.sin(pan * np.pi / 2)


def un_polo(x: np.ndarray, corte_hz: float) -> np.ndarray:
    """Pasa bajos de un polo. Es un loop en Python, asi que solo para plantillas cortas."""
    a = np.exp(-2 * np.pi * corte_hz / SR)
    y = np.empty_like(x)
    acc = 0.0
    for k, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[k] = acc
    return y


# Las notas se sintetizan una vez y se reusan.
_cache_pulsado: dict[int, np.ndarray] = {}


def pulsado(midi: int) -> np.ndarray:
    """Piano electrico: cada armonico cae a distinta velocidad, por eso suena menos a seno puro."""
    if midi not in _cache_pulsado:
        n = int(1.8 * SR)
        t = np.arange(n) / SR
        f = hz(midi)
        x = (
            1.00 * np.sin(2 * np.pi * f * t) * np.exp(-2.6 * t)
            + 0.30 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-5.5 * t)
            + 0.10 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-9.0 * t)
            + 0.04 * np.sin(2 * np.pi * 4.02 * f * t) * np.exp(-14.0 * t)
        )
        ataque = np.clip(t / 0.006, 0, 1)
        cola = np.clip((t[-1] - t) / 0.2, 0, 1)
        _cache_pulsado[midi] = x * ataque * cola
    return _cache_pulsado[midi]


def bajo(midi: int, pulsos: float) -> np.ndarray:
    n = int((pulsos * PULSO + 0.12) * SR)
    t = np.arange(n) / SR
    f = hz(midi)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.08 * np.sin(2 * np.pi * 3 * f * t)
    env = np.clip(t / 0.012, 0, 1) * (0.55 + 0.45 * np.exp(-3.0 * t))
    suelta = np.clip((t[-1] - t) / 0.1, 0, 1)
    return x * env * suelta


def bombo() -> np.ndarray:
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 48 + 70 * np.exp(-28 * t)
    fase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(fase) * np.exp(-9 * t) * np.clip(t / 0.002, 0, 1)


def shaker() -> np.ndarray:
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    ruido = rng.standard_normal(n)
    agudo = ruido - un_polo(ruido, 5000)  # pasa altos
    return agudo * np.clip(t / 0.008, 0, 1) * np.exp(-45 * t)


def chasquido() -> np.ndarray:
    n = int(0.16 * SR)
    t = np.arange(n) / SR
    ruido = rng.standard_normal(n)
    banda = un_polo(ruido, 3200) - un_polo(ruido, 900)
    tono = 0.3 * np.sin(2 * np.pi * 330 * t) * np.exp(-40 * t)
    return (banda * 1.6 + tono) * np.exp(-26 * t)


def pad(voces: list[int], dur_s: float) -> np.ndarray:
    n = int((dur_s + 2.5) * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for j, m in enumerate(voces):
        f = hz(m)
        fase = rng.uniform(0, 2 * np.pi)
        vib = 0.002 * np.sin(2 * np.pi * 0.13 * t + fase)
        w = 2 * np.pi * f * (1 + vib)
        amp = 0.5 if j == 0 else 0.3 / (1 + 0.15 * j)
        x += amp * (np.sin(w * t + fase) + 0.15 * np.sin(2 * w * t + fase))
    ataque = 0.5 - 0.5 * np.cos(np.pi * np.clip(t / 1.4, 0, 1))
    caida = 0.5 - 0.5 * np.cos(np.pi * np.clip((t[-1] - t) / 2.5, 0, 1))
    return x * ataque * caida


def comb(x: np.ndarray, retardo: int, g: float) -> np.ndarray:
    y = np.zeros_like(x)
    for i in range(0, len(x), retardo):
        fin = min(i + retardo, len(x))
        y[i:fin] = x[i:fin]
        if i >= retardo:
            y[i:fin] += g * y[i - retardo : i - retardo + (fin - i)]
    return y


def reverb(x: np.ndarray, retardos: list[float]) -> np.ndarray:
    return sum(comb(x, int(d * SR), 0.76) for d in retardos) / len(retardos)


def main() -> None:
    total = int(DURACION * SR)
    seco = np.zeros((total, 2))  # bajo y percusion
    humedo = np.zeros((total, 2))  # pad y arpegio, pasan por reverb

    KICK, SHAKER, SNAP = bombo(), shaker(), chasquido()
    compases = int(np.ceil(DURACION / COMPAS))
    ultimo = compases - 4

    for c in range(compases):
        t0 = c * COMPAS
        acorde = ACORDES[(c // 2) % len(ACORDES)]
        raiz, voces, arpegio = acorde
        respiro = c % 32 >= 28  # cada 32 compases se quita la percusion 4, para que no canse
        cierre = c >= ultimo
        con_bajo = c >= 4 and not cierre
        con_shaker = c >= 4 and not respiro and not cierre
        con_bombo = c >= 8 and not respiro and not cierre

        if c % 2 == 0:
            sumar(humedo, pad(voces, 2 * COMPAS) * 0.32, t0)

        # arpegio: 8 corcheas por compas
        for k in range(8):
            paso = PATRON[(c % 2) * 8 + k]
            t = t0 + k * PULSO / 2 + (SWING if k % 2 else 0) + rng.normal(0, 0.004)
            vel = (1.0 if k % 4 == 0 else 0.68) * rng.uniform(0.9, 1.05)
            nota = arpegio[paso]
            pan = 0.3 + 0.4 * (paso / (len(arpegio) - 1))
            sumar(humedo, pulsado(nota) * 0.30 * vel, max(t, 0), pan)

        if con_bajo:
            sumar(seco, bajo(raiz, 1.5) * 0.42, t0)
            sumar(seco, bajo(raiz, 1.0) * 0.36, t0 + 2 * PULSO)
            if c % 2 == 1:
                sumar(seco, bajo(raiz + 7, 0.5) * 0.30, t0 + 3.5 * PULSO)

        if con_bombo:
            sumar(seco, KICK * 0.55, t0)
            sumar(seco, KICK * 0.40, t0 + 2 * PULSO)
            sumar(seco, SNAP * 0.10, t0 + 1 * PULSO, 0.55)
            sumar(seco, SNAP * 0.10, t0 + 3 * PULSO, 0.55)

        if con_shaker:
            for k in range(8):
                t = t0 + k * PULSO / 2 + (SWING if k % 2 else 0)
                vel = 0.11 if k % 2 else 0.06
                sumar(seco, SHAKER * vel * rng.uniform(0.85, 1.1), t, 0.62)

    # reverb solo a pad y arpegio
    izq_w = reverb(humedo[:, 0], [0.0297, 0.0371, 0.0411, 0.0437, 0.113, 0.251])
    der_w = reverb(humedo[:, 1], [0.0311, 0.0353, 0.0423, 0.0449, 0.127, 0.263])
    humedo[:, 0] = 0.65 * humedo[:, 0] + 0.35 * izq_w
    humedo[:, 1] = 0.65 * humedo[:, 1] + 0.35 * der_w
    mezcla = humedo + seco

    t = np.arange(total) / SR
    fundido = np.clip(t / 3.0, 0, 1) * np.clip((DURACION - t) / 6.0, 0, 1)
    mezcla *= fundido[:, None]

    # Se normaliza por RMS sin los 10 s de los extremos (los fundidos bajarian el promedio).
    # tanh limita los picos sin el corte seco de un clip.
    rms = np.sqrt(np.mean(mezcla[int(10 * SR) : int(-10 * SR)] ** 2))
    mezcla *= (10 ** (RMS_DBFS / 20)) / rms
    techo = 10 ** (TECHO_DBFS / 20)
    mezcla = techo * np.tanh(mezcla / techo)

    salida = Path(__file__).resolve().parent.parent / "public" / "musica.wav"
    salida.parent.mkdir(parents=True, exist_ok=True)
    datos = (mezcla * 32767).astype("<i2")
    with wave.open(str(salida), "wb") as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(datos.tobytes())
    pico = 20 * np.log10(np.max(np.abs(mezcla)))
    print(f"{salida} | {DURACION:.0f} s | {BPM} BPM | RMS {RMS_DBFS} dBFS | pico {pico:.1f} dBFS")


if __name__ == "__main__":
    main()
