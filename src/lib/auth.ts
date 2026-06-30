import { reactive, computed } from 'vue';
import { apiFetch, setToken, clearToken, getToken, ApiError } from './api';

type LoginResponse = {
  access_token: string;
  token_type: string;
};

type RegisterResponse = {
  id: number;
  email: string;
  plan: string;
  tokens_used: number;
};

export type User = {
  id: number;
  username: string;
  email: string;
  plan: string;
  tokens_used: number;
  avatar_url: string | null;
};

type AuthState = {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
};

const state = reactive<AuthState>({
  token: typeof window !== 'undefined' ? getToken() : null,
  user: null,
  loading: false,
  error: null,
});

export const isAuthenticated = computed(() => !!state.token);

export const authState = state;

export async function fetchMe(): Promise<void> {
  if (!state.token) return;
  try {
    state.user = await apiFetch<User>('/users/me');
  } catch (e) {
    // Only drop the session on a real auth failure; keep it on transient 5xx/network errors
    if (e instanceof ApiError && e.status === 401) logout();
  }
}

// Load user info on startup if already authenticated
if (typeof window !== 'undefined' && state.token) {
  void fetchMe();
}

export async function login(email: string, password: string): Promise<void> {
  state.loading = true;
  state.error = null;
  try {
    const res = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(res.access_token);
    state.token = res.access_token;
    await fetchMe();
  } catch (e) {
    state.error = e instanceof Error ? e.message : 'Erreur de connexion';
    throw e;
  } finally {
    state.loading = false;
  }
}

export async function register(username: string, email: string, password: string): Promise<void> {
  state.error = null;
  try {
    await apiFetch<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    await login(email, password);
  } catch (e) {
    state.error = e instanceof Error ? e.message : "Erreur d'inscription";
    throw e;
  }
}

export function logout(): void {
  clearToken();
  state.token = null;
  state.user = null;
}
