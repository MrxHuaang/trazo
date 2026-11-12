export function formatoCOP(valor: number) {
  return `$${Math.round(valor).toLocaleString('es-CO')}`;
}

/** Celular colombiano legible: 300 123 4567. */
export function formatoTelefono(telefono?: string | null) {
  const d = (telefono ?? '').replace(/\D/g, '');
  if (d.length !== 10) return telefono ?? '';
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

export function iniciales(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** "Laura M." para filas compactas. */
export function nombreCorto(nombre: string) {
  const [primero, segundo] = nombre.split(/\s+/);
  return segundo ? `${primero} ${segundo[0]}.` : (primero ?? nombre);
}
