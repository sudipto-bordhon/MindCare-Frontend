const configuredApiBaseUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '')
  || (import.meta.env.DEV ? 'http://localhost:3000' : '');

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const apiPath = path.startsWith('/') ? path : `/${path}`;
  return `${configuredApiBaseUrl}${apiPath}`;
}
