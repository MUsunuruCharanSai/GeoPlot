export const STORAGE_KEY = 'geoplot.measurement.v1';

export function isLocalPersistenceEnabled() {
  const flag = import.meta.env.VITE_ENABLE_LOCAL_PERSISTENCE;
  if (flag === undefined || flag === '') return true;
  return String(flag).toLowerCase() !== 'false';
}
