export const requiredHeaders = ['nombre','persistente','competente','observador'];

export const validateCSV = (headers: string[]) => {
  const lower = headers.map(h => h.trim().toLowerCase());
  return requiredHeaders.every(r => lower.includes(r));
};

export const parseFullName = (fullname: string) => {
  // espera 4 partes: nombre, nombre2?, paterno, materno
  const parts = fullname.trim().split(/\s+/);
  return parts; // tú decides el matching
};
export const parseBoolean = (value: string) => {
  const val = value.trim().toLowerCase();
  if (val === 'true' || val === '1' || val === 'sí' || val === 'si') return true;
  if (val === 'false' || val === '0' || val === 'no') return false;
  return null; // o lanzar un error
}