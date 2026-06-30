<script lang="ts">
import { defineComponent, computed } from 'vue';
import { authState, isAuthenticated, logout } from '../lib/auth';

function parseEmailFromJwt(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded.email ?? decoded.sub ?? null;
  } catch {
    return null;
  }
}

export default defineComponent({
  name: 'UserBadge',
  setup() {
    const connected = isAuthenticated;
    const email = computed(() => parseEmailFromJwt(authState.token));
    const avatar = computed(() => {
      const seed = email.value ?? 'guest';
      return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
    });
    return { connected, email, avatar, logout };
  },
});
</script>

<template>
  <div v-if="connected" class="user-info">
    <span>{{ email ?? 'Utilisateur' }}</span>
    <img :src="avatar" alt="Avatar" />
    <button class="logout" @click="logout" title="Se déconnecter" type="button">
      <i class="fa-solid fa-right-from-bracket" />
    </button>
  </div>
</template>

<style scoped>
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-info img {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: #444;
}

.logout {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 16px;
  transition: color 0.15s, background 0.15s;
}

.logout:hover {
  color: #207A70;
  background: rgba(32, 122, 112, 0.08);
}
</style>
