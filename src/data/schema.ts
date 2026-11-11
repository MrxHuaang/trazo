/**
 * Esquema local (SQLite). Cada migración sube PRAGMA user_version en 1.
 * Nunca editar una migración ya publicada: agregar una nueva al final.
 */
export const MIGRACIONES: string[] = [
  /* v1 */ `
  CREATE TABLE consultorio (
    id TEXT PRIMARY KEY NOT NULL,
    nombre TEXT NOT NULL,
    profesional TEXT NOT NULL,
    correo TEXT,
    tarifa_base INTEGER NOT NULL DEFAULT 70000,
    tarifa_social INTEGER NOT NULL DEFAULT 35000,
    duracion_cita INTEGER NOT NULL DEFAULT 50,
    cupos_solidarios_semana INTEGER NOT NULL DEFAULT 3,
    plantilla_recordatorio TEXT NOT NULL,
    plantilla_confirmacion TEXT NOT NULL,
    bloqueo_activo INTEGER NOT NULL DEFAULT 1,
    creado_en TEXT NOT NULL
  );

  CREATE TABLE pacientes (
    id TEXT PRIMARY KEY NOT NULL,
    nombre TEXT NOT NULL,
    telefono TEXT,
    correo TEXT,
    fecha_nacimiento TEXT,
    tarifa TEXT NOT NULL DEFAULT 'normal' CHECK (tarifa IN ('normal','social','gratuita')),
    afectado_sismo INTEGER NOT NULL DEFAULT 0,
    afectaciones TEXT NOT NULL DEFAULT '[]',
    notas_generales TEXT,
    archivado_en TEXT,
    creado_en TEXT NOT NULL,
    actualizado_en TEXT NOT NULL
  );
  CREATE INDEX pacientes_nombre_idx ON pacientes (nombre);

  CREATE TABLE consentimientos (
    id TEXT PRIMARY KEY NOT NULL,
    paciente_id TEXT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    version_texto TEXT NOT NULL,
    aceptado_en TEXT NOT NULL,
    revocado_en TEXT
  );

  CREATE TABLE citas (
    id TEXT PRIMARY KEY NOT NULL,
    paciente_id TEXT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    inicio TEXT NOT NULL,
    fin TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'confirmada' CHECK (estado IN ('solicitada','confirmada','asistio','no_asistio','cancelada')),
    modalidad TEXT NOT NULL DEFAULT 'presencial' CHECK (modalidad IN ('presencial','virtual')),
    enlace TEXT,
    motivo TEXT,
    es_solidaria INTEGER NOT NULL DEFAULT 0,
    origen TEXT NOT NULL DEFAULT 'app',
    recordada_en TEXT,
    creado_en TEXT NOT NULL,
    actualizado_en TEXT NOT NULL,
    CHECK (fin > inicio)
  );
  CREATE INDEX citas_inicio_idx ON citas (inicio);
  CREATE INDEX citas_paciente_idx ON citas (paciente_id);

  CREATE TABLE pagos (
    id TEXT PRIMARY KEY NOT NULL,
    cita_id TEXT NOT NULL UNIQUE REFERENCES citas(id) ON DELETE CASCADE,
    paciente_id TEXT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    monto INTEGER NOT NULL,
    metodo TEXT,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagado','donado')),
    pagado_en TEXT,
    creado_en TEXT NOT NULL
  );

  CREATE TABLE notas_sesion (
    id TEXT PRIMARY KEY NOT NULL,
    paciente_id TEXT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    cita_id TEXT REFERENCES citas(id) ON DELETE SET NULL,
    contenido TEXT NOT NULL,
    creado_en TEXT NOT NULL,
    actualizado_en TEXT NOT NULL
  );

  CREATE TABLE disponibilidad (
    id TEXT PRIMARY KEY NOT NULL,
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
    hora_inicio TEXT NOT NULL,
    hora_fin TEXT NOT NULL,
    modalidad TEXT NOT NULL DEFAULT 'presencial'
  );

  CREATE TABLE bloqueos (
    id TEXT PRIMARY KEY NOT NULL,
    inicio TEXT NOT NULL,
    fin TEXT NOT NULL,
    motivo TEXT
  );

  CREATE TABLE jornadas (
    id TEXT PRIMARY KEY NOT NULL,
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'taller',
    lugar TEXT NOT NULL,
    barrio TEXT,
    inicio TEXT NOT NULL,
    fin TEXT NOT NULL,
    cupos INTEGER NOT NULL DEFAULT 20,
    descripcion TEXT,
    creado_en TEXT NOT NULL
  );

  CREATE TABLE asistentes (
    id TEXT PRIMARY KEY NOT NULL,
    jornada_id TEXT NOT NULL REFERENCES jornadas(id) ON DELETE CASCADE,
    paciente_id TEXT REFERENCES pacientes(id) ON DELETE SET NULL,
    nombre TEXT NOT NULL,
    telefono TEXT,
    requiere_seguimiento INTEGER NOT NULL DEFAULT 0,
    consentimiento_datos INTEGER NOT NULL DEFAULT 0,
    creado_en TEXT NOT NULL
  );

  CREATE TABLE seguimientos (
    id TEXT PRIMARY KEY NOT NULL,
    paciente_id TEXT REFERENCES pacientes(id) ON DELETE CASCADE,
    asistente_id TEXT REFERENCES asistentes(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    telefono TEXT,
    fecha_objetivo TEXT NOT NULL,
    motivo TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','hecho','descartado')),
    nota TEXT,
    creado_en TEXT NOT NULL
  );

  CREATE TABLE recursos (
    id TEXT PRIMARY KEY NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    telefono TEXT,
    whatsapp TEXT,
    url TEXT,
    orden INTEGER NOT NULL DEFAULT 0
  );
  `,
  /* v2: coordenadas de la jornada para el mapa solidario */ `
  ALTER TABLE jornadas ADD COLUMN latitud REAL;
  ALTER TABLE jornadas ADD COLUMN longitud REAL;
  `,
];
