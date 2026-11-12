import { openDatabaseSync, type SQLiteBindValue, type SQLiteDatabase } from 'expo-sqlite';

import { MIGRACIONES } from './schema';

let instancia: SQLiteDatabase | null = null;

/** Base de datos local única de la app. */
export function db(): SQLiteDatabase {
  if (!instancia) {
    instancia = openDatabaseSync('trazo.db');
    instancia.execSync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  }
  return instancia;
}

/** Aplica las migraciones pendientes según PRAGMA user_version. */
export async function migrar() {
  const base = db();
  const fila = await base.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const actual = fila?.user_version ?? 0;
  for (let v = actual; v < MIGRACIONES.length; v++) {
    const sql = MIGRACIONES[v];
    if (!sql) continue;
    await base.withTransactionAsync(async () => {
      await base.execAsync(sql);
      await base.execAsync(`PRAGMA user_version = ${v + 1}`);
    });
  }
}

/** Borra todos los datos (conserva el esquema). */
export async function borrarTodo() {
  const base = db();
  await base.withTransactionAsync(async () => {
    for (const tabla of [
      'seguimientos', 'asistentes', 'jornadas', 'notas_sesion', 'pagos', 'citas',
      'consentimientos', 'pacientes', 'disponibilidad', 'bloqueos', 'recursos', 'consultorio',
    ]) {
      await base.execAsync(`DELETE FROM ${tabla}`);
    }
  });
}

export type Params = SQLiteBindValue[];

export const consultar = <T>(sql: string, params: Params = []) => db().getAllAsync<T>(sql, params);
export const consultarUno = <T>(sql: string, params: Params = []) => db().getFirstAsync<T>(sql, params);
export const ejecutar = (sql: string, params: Params = []) => db().runAsync(sql, params);

/** Convierte 0/1 de SQLite a boolean. */
export const bool = (v: unknown) => v === 1 || v === true;
export const bit = (v: boolean) => (v ? 1 : 0);
export const ahoraIso = () => new Date().toISOString();
