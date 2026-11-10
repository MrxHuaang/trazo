/**
 * Datos ficticios de demostración (HU-27). Fechas relativas a hoy para que la demo siempre esté viva.
 * Ningún dato corresponde a personas reales; los teléfonos son números de prueba.
 */
import type { Afectacion, EstadoCita, Tarifa } from '@/domain/types';
import { diaSemana, hoyClave, inicioSemana, isoDesde, sumarDias } from '@/lib/dates';
import { nuevoId } from '@/lib/id';

import { ahoraIso, borrarTodo, db } from './db';
import { crearConsultorio } from './repos/consultorio';

type P = { nombre: string; tarifa: Tarifa; afectaciones: Afectacion[]; tel: string };

const PACIENTES: P[] = [
  { nombre: 'Laura Muñoz', tarifa: 'normal', afectaciones: [], tel: '3000000101' },
  { nombre: 'Carlos Restrepo', tarifa: 'normal', afectaciones: [], tel: '3000000102' },
  { nombre: 'Rosa Patiño', tarifa: 'gratuita', afectaciones: ['vivienda'], tel: '3000000103' },
  { nombre: 'Jairo Loaiza', tarifa: 'social', afectaciones: ['negocio', 'empleo'], tel: '3000000104' },
  { nombre: 'Andrés Tobón', tarifa: 'normal', afectaciones: [], tel: '3000000105' },
  { nombre: 'Marta Giraldo', tarifa: 'social', afectaciones: ['familiar'], tel: '3000000106' },
  { nombre: 'Valentina Ospina', tarifa: 'normal', afectaciones: [], tel: '3000000107' },
  { nombre: 'Héctor Cardona', tarifa: 'gratuita', afectaciones: ['vivienda', 'salud'], tel: '3000000108' },
  { nombre: 'Paula Arango', tarifa: 'normal', afectaciones: [], tel: '3000000109' },
  { nombre: 'Diego Henao', tarifa: 'social', afectaciones: ['empleo'], tel: '3000000110' },
  { nombre: 'Natalia Valencia', tarifa: 'normal', afectaciones: [], tel: '3000000111' },
  { nombre: 'Gloria Bedoya', tarifa: 'gratuita', afectaciones: ['vivienda', 'familiar'], tel: '3000000112' },
];

const HORAS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

export async function cargarDemo() {
  await borrarTodo();
  const base = db();
  const t = ahoraIso();
  const cons = await crearConsultorio({
    nombre: 'Consultorio Angela Córdoba',
    profesional: 'Angela Sophia Córdoba',
    tarifaBase: 70000,
    tarifaSocial: 35000,
    cuposSolidariosSemana: 3,
    bloqueoActivo: false,
  });

  const ids: string[] = [];
  for (const p of PACIENTES) {
    const id = nuevoId();
    ids.push(id);
    await base.runAsync(
      `INSERT INTO pacientes (id, nombre, telefono, correo, fecha_nacimiento, tarifa, afectado_sismo, afectaciones,
        notas_generales, archivado_en, creado_en, actualizado_en) VALUES (?,?,?,NULL,NULL,?,?,?,NULL,NULL,?,?)`,
      [id, p.nombre, p.tel, p.tarifa, p.afectaciones.length ? 1 : 0, JSON.stringify(p.afectaciones), t, t],
    );
    await base.runAsync(
      'INSERT INTO consentimientos (id, paciente_id, tipo, version_texto, aceptado_en) VALUES (?,?,?,?,?)',
      [nuevoId(), id, 'datos_personales', 'v0.1', t],
    );
  }

  const hoy = hoyClave();
  const ahora = Date.now();
  let n = 0;
  const solidariasPorSemana = new Map<string, number>();
  // Citas de 14 días atrás a 14 días adelante, entre semana, 3 por día.
  for (let d = -14; d <= 14; d++) {
    const dia = sumarDias(hoy, d);
    if (diaSemana(dia) > 5) continue;
    const horasDelDia = d === 0 ? ['09:00', '10:00', '11:00', '14:30', '16:00'] : [HORAS[(n + d + 14) % 8]!, HORAS[(n + d + 17) % 8]!, HORAS[(n + d + 20) % 8]!];
    for (const hora of [...new Set(horasDelDia)]) {
      const idx = n % PACIENTES.length;
      const p = PACIENTES[idx]!;
      const inicio = isoDesde(dia, hora);
      const fin = new Date(new Date(inicio).getTime() + 50 * 60000).toISOString();
      const pasada = new Date(fin).getTime() < ahora;
      let estado: EstadoCita = pasada ? 'asistio' : 'confirmada';
      if (pasada && n % 9 === 4) estado = 'no_asistio';
      if (pasada && n % 13 === 6) estado = 'cancelada';
      if (!pasada && (n % 7 === 3 || (d === 0 && hora === '16:00'))) estado = 'solicitada';
      // Cupos solidarios (RN-03): máximo 3 por semana; en la semana actual quedan 2 usados y 1 libre.
      const semana = inicioSemana(dia);
      const tope = semana === inicioSemana(hoy) ? 2 : 3;
      const usados = solidariasPorSemana.get(semana) ?? 0;
      const solidaria = p.tarifa !== 'normal' && estado !== 'cancelada' && estado !== 'no_asistio' && usados < tope;
      if (solidaria) solidariasPorSemana.set(semana, usados + 1);
      const citaId = nuevoId();
      await base.runAsync(
        `INSERT INTO citas (id, paciente_id, inicio, fin, estado, modalidad, enlace, motivo, es_solidaria, origen,
          recordada_en, creado_en, actualizado_en) VALUES (?,?,?,?,?,?,?,NULL,?,?,?,?,?)`,
        [citaId, ids[idx]!, inicio, fin, estado, n % 3 === 0 ? 'virtual' : 'presencial',
          n % 3 === 0 ? 'https://meet.google.com/abc-defg-hij' : null, solidaria ? 1 : 0,
          estado === 'solicitada' && n % 2 === 0 ? 'web' : 'app', pasada ? inicio : null, t, t],
      );
      if (estado === 'asistio') {
        const monto = p.tarifa === 'gratuita' ? 0 : p.tarifa === 'social' ? cons.tarifaSocial : cons.tarifaBase;
        const pagoEstado = monto === 0 ? 'donado' : n % 5 === 1 ? 'pendiente' : 'pagado';
        await base.runAsync(
          `INSERT INTO pagos (id, cita_id, paciente_id, monto, metodo, estado, pagado_en, creado_en) VALUES (?,?,?,?,?,?,?,?)`,
          [nuevoId(), citaId, ids[idx]!, monto, pagoEstado === 'pagado' ? (n % 2 ? 'nequi' : 'efectivo') : null,
            pagoEstado, pagoEstado === 'pagado' ? fin : null, t],
        );
        if (n % 4 === 0) {
          await base.runAsync(
            `INSERT INTO notas_sesion (id, paciente_id, cita_id, contenido, creado_en, actualizado_en) VALUES (?,?,?,?,?,?)`,
            [nuevoId(), ids[idx]!, citaId, 'Nota de ejemplo: se trabajó respiración y rutina de sueño. Tarea: registro diario.', t, t],
          );
        }
      }
      n++;
    }
  }

  // Disponibilidad: lunes a viernes mañana y tarde presencial; sábado mañana virtual.
  for (let dia = 1; dia <= 5; dia++) {
    for (const [ini, finH] of [['08:00', '12:00'], ['14:00', '18:00']] as const) {
      await base.runAsync('INSERT INTO disponibilidad (id, dia_semana, hora_inicio, hora_fin, modalidad) VALUES (?,?,?,?,?)', [
        nuevoId(), dia, ini, finH, 'presencial',
      ]);
    }
  }
  await base.runAsync('INSERT INTO disponibilidad (id, dia_semana, hora_inicio, hora_fin, modalidad) VALUES (?,?,?,?,?)', [
    nuevoId(), 6, '09:00', '12:00', 'virtual',
  ]);

  // Jornadas: una pasada con asistentes y una próxima.
  const pasada = nuevoId();
  const jPasadaDia = sumarDias(hoy, -9);
  await base.runAsync(
    `INSERT INTO jornadas (id, titulo, tipo, lugar, barrio, inicio, fin, cupos, descripcion, creado_en, latitud, longitud)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [pasada, 'Primeros auxilios emocionales', 'charla', 'Parque Olaya Herrera', 'Centro', isoDesde(jPasadaDia, '14:00'),
      isoDesde(jPasadaDia, '16:00'), 30, 'Charla abierta para familias afectadas por el sismo.', t, 4.8166, -75.6898],
  );
  const asistentes = [
    { nombre: 'Marta Giraldo', tel: '3000000106', seg: true, pacienteId: ids[5]! },
    { nombre: 'Luis Ángel Ríos', tel: '3000000201', seg: true, pacienteId: null },
    { nombre: 'Sandra Mejía', tel: '3000000202', seg: false, pacienteId: null },
    { nombre: 'Jorge Iván Duque', tel: '3000000203', seg: false, pacienteId: null },
    { nombre: 'Camila Zapata', tel: '3000000204', seg: true, pacienteId: null },
  ];
  for (const [i, a] of asistentes.entries()) {
    const aid = nuevoId();
    await base.runAsync(
      `INSERT INTO asistentes (id, jornada_id, paciente_id, nombre, telefono, requiere_seguimiento, consentimiento_datos, creado_en)
       VALUES (?,?,?,?,?,?,1,?)`,
      [aid, pasada, a.pacienteId, a.nombre, a.tel, a.seg ? 1 : 0, t],
    );
    if (a.seg) {
      await base.runAsync(
        `INSERT INTO seguimientos (id, paciente_id, asistente_id, nombre, telefono, fecha_objetivo, motivo, estado, nota, creado_en)
         VALUES (?,?,?,?,?,?,?, 'pendiente', NULL, ?)`,
        [nuevoId(), a.pacienteId, aid, a.nombre, a.tel, sumarDias(hoy, i - 2), 'Llamar después de la jornada', t],
      );
    }
  }
  await base.runAsync(
    `INSERT INTO jornadas (id, titulo, tipo, lugar, barrio, inicio, fin, cupos, descripcion, creado_en, latitud, longitud)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [nuevoId(), 'Manejo de la ansiedad tras el sismo', 'taller', 'Salón comunal', 'Cuba', isoDesde(sumarDias(hoy, 5), '09:00'),
      isoDesde(sumarDias(hoy, 5), '11:00'), 25, 'Taller práctico de respiración y regulación emocional.', t, 4.7936, -75.7352],
  );

  // Líneas de ayuda (verificar vigencia antes de publicar).
  const recursos = [
    ['Línea Amiga Risaralda', 'Orientación en salud mental, 24 horas.', '6063339610', '3155608849', null],
    ['Línea 106', 'Línea nacional de teleorientación en salud mental.', '106', null, null],
    ['Emergencias', 'Número único de emergencias.', '123', null, null],
  ] as const;
  for (const [i, r] of recursos.entries()) {
    await base.runAsync('INSERT INTO recursos (id, titulo, descripcion, telefono, whatsapp, url, orden) VALUES (?,?,?,?,?,?,?)', [
      nuevoId(), r[0], r[1], r[2], r[3], r[4], i,
    ]);
  }
}
