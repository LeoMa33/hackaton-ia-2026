import { reactive, computed } from 'vue';
import { apiFetch, setToken, clearToken, getToken } from './api';

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

type AuthState = {
  token: string | null;
  loading: boolean;
  error: string | null;
};

const state = reactive<AuthState>({
  token: typeof window !== 'undefined' ? getToken() : null,
  loading: false,
  error: null,
});

export const isAuthenticated = computed(() => !!state.token);

export const authState = state;

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
  } catch (e) {
    state.error = e instanceof Error ? e.message : 'Erreur de connexion';
    throw e;
  } finally {
    state.loading = false;
  }
}

export async function register(email: string, password: string): Promise<void> {
  state.error = null;
  try {
    await apiFetch<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
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
}
