/* const env = (import.meta as ImportMeta & {
  env: { VITE_API_URL?: string; DEV: boolean };
}).env; */

const env = (import.meta as ImportMeta & {
  env: { API_URL?: string; DEV: boolean };
}).env;

/* const configuredApiBaseUrl = env.VITE_API_URL?.trim().replace(/\/+$/, '')
  || (env.DEV ? 'http://localhost:3000' : '');
 */
 const configuredApiBaseUrl = env.API_URL?.trim().replace(/\/+$/, '')
  || (env.DEV ? 'http://localhost:3000' : '');
 
export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const apiPath = path.startsWith('/') ? path : `/${path}`;
  return `${configuredApiBaseUrl}${apiPath}`;
}
