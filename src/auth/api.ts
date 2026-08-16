export type UserRole = 'admin' | 'agent';
export type UserStatus = 'active' | 'blocked';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string>;
  detail?: string;

  constructor(status: number, payload: { message?: string; errors?: Record<string, string>; detail?: string }) {
    super(payload.message || 'Não foi possível concluir a solicitação.');
    this.status = status;
    this.errors = payload.errors;
    this.detail = payload.detail;
  }
}

let csrfToken = '';
let csrfRequest: Promise<string> | null = null;

const loadCsrfToken = async () => {
  if (csrfToken) return csrfToken;
  if (!csrfRequest) {
    csrfRequest = fetch('/api/auth/csrf', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Falha ao iniciar a sessão segura.');
        const payload = (await response.json()) as { csrfToken: string };
        csrfToken = payload.csrfToken;
        return csrfToken;
      })
      .finally(() => {
        csrfRequest = null;
      });
  }
  return csrfRequest;
};

export const api = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) headers.set('X-CSRF-Token', await loadCsrfToken());

  const response = await fetch(path, { ...options, headers, credentials: 'include' });
  const payload = (await response.json().catch(() => ({}))) as T & {
    message?: string;
    errors?: Record<string, string>;
    detail?: string;
  };
  if (!response.ok) {
    if (response.status === 403 && payload.message?.includes('validar esta solicitação')) csrfToken = '';
    throw new ApiError(response.status, payload);
  }
  return payload;
};
