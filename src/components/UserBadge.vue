<script lang="ts">
import { defineComponent, computed } from 'vue';
import { authState, isAuthenticated, logout } from '../lib/auth';

export default defineComponent({
  name: 'UserBadge',
  setup() {
    const connected = isAuthenticated;
    const email = computed(() => authState.user?.username ?? authState.user?.email ?? null);
    const avatar = computed(() => {
      if (authState.user?.avatar_url) return authState.user.avatar_url;
      const seed = authState.user?.email ?? 'guest';
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
