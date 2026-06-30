<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { authState, isAuthenticated, login, register } from '../lib/auth';

export default defineComponent({
  name: 'AuthModal',
  setup() {
    const mode = ref<'login' | 'register'>('login');
    const email = ref('');
    const password = ref('');
    const passwordConfirm = ref('');
    const localError = ref<string | null>(null);

    const open = computed(() => !isAuthenticated.value);
    const loading = computed(() => authState.loading);
    const serverError = computed(() => authState.error);

    const switchMode = (next: 'login' | 'register') => {
      mode.value = next;
      localError.value = null;
      authState.error = null;
    };

    const submit = async () => {
      localError.value = null;
      if (!email.value || !password.value) {
        localError.value = 'Email et mot de passe requis';
        return;
      }
      if (mode.value === 'register' && password.value !== passwordConfirm.value) {
        localError.value = 'Les mots de passe ne correspondent pas';
        return;
      }
      try {
        if (mode.value === 'login') {
          await login(email.value, password.value);
        } else {
          await register(email.value, password.value);
        }
        email.value = '';
        password.value = '';
        passwordConfirm.value = '';
      } catch {
        // l'erreur est dans authState.error
      }
    };

    return {
      mode,
      email,
      password,
      passwordConfirm,
      open,
      loading,
      serverError,
      localError,
      switchMode,
      submit,
    };
  },
});
</script>

<template>
  <div v-if="open" class="auth-overlay">
    <div class="auth-modal">
      <div class="tabs">
        <button
          :class="['tab', { active: mode === 'login' }]"
          @click="switchMode('login')"
          type="button"
        >
          Connexion
        </button>
        <button
          :class="['tab', { active: mode === 'register' }]"
          @click="switchMode('register')"
          type="button"
        >
          Inscription
        </button>
      </div>

      <form @submit.prevent="submit" class="form">
        <label>
          <span>Email</span>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            required
            :disabled="loading"
          />
        </label>

        <label>
          <span>Mot de passe</span>
          <input
            v-model="password"
            type="password"
            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            required
            :disabled="loading"
          />
        </label>

        <label v-if="mode === 'register'">
          <span>Confirmer le mot de passe</span>
          <input
            v-model="passwordConfirm"
            type="password"
            autocomplete="new-password"
            required
            :disabled="loading"
          />
        </label>

        <p v-if="localError || serverError" class="error">
          {{ localError || serverError }}
        </p>

        <button type="submit" class="submit" :disabled="loading">
          {{ loading ? '...' : mode === 'login' ? 'Se connecter' : "S'inscrire" }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.auth-modal {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.tab {
  flex: 1;
  background: none;
  border: none;
  padding: 0.75rem;
  font-size: 1rem;
  cursor: pointer;
  color: #888;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}

.tab.active {
  color: #207A70;
  border-bottom-color: #207A70;
  font-weight: 600;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: #555;
}

.form input {
  padding: 0.6rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.15s;
}

.form input:focus {
  border-color: #207A70;
}

.error {
  color: #c0392b;
  font-size: 0.85rem;
  margin: 0;
}

.submit {
  padding: 0.75rem;
  background: #207A70;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 0.5rem;
}

.submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
