import { env } from '../../infrastructure/config/env';

export const formatFileUrl = (pathStr?: string | null): string | null => {
  if (!pathStr) return null;
  if (pathStr.startsWith('http://') || pathStr.startsWith('https://') || pathStr.startsWith('data:')) {
    return pathStr;
  }
  const clean = pathStr.replace(/^\/+/, '');
  const baseUrl = process.env.APP_URL || process.env.SERVER_URL || `http://localhost:${env.PORT || 3001}`;
  const cleanBase = baseUrl.replace(/\/+$/, '').replace(/\/api(\/v1)?\/?$/, '');

  if (clean.startsWith('uploads/')) {
    return `${cleanBase}/${clean}`;
  }
  return `${cleanBase}/uploads/${clean}`;
};

export const cleanFilePath = (pathStr?: string | null): string | null => {
  if (!pathStr) return null;
  let clean = pathStr;
  if (clean.includes('/uploads/')) {
    clean = clean.substring(clean.indexOf('uploads/'));
  } else if (clean.startsWith('uploads/')) {
    // Ya es ruta limpia
  } else if (clean.startsWith('/')) {
    clean = clean.substring(1);
  }
  return clean;
};
