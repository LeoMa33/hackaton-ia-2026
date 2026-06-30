<script lang="ts">
import { defineComponent, ref, watch, onMounted, computed } from 'vue'
import HistoryItem from './HistoryItem.vue'
import { apiFetch } from '../lib/api'
import { isAuthenticated } from '../lib/auth'
import { chatState, selectChat, clearChat, newDraftChat } from '../lib/chat'

type Chat = { id: number; title: string }

export default defineComponent({
  name: "ChatListe",
  components: {
    HistoryItem
  },
  setup() {
    const chats = ref<Chat[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)
    const currentId = computed(() => chatState.current?.id ?? null)
    const draft = computed(() =>
      chatState.current && chatState.current.id === null ? chatState.current : null
    )

    const fetchChats = async () => {
      if (!isAuthenticated.value) {
        chats.value = []
        clearChat()
        return
      }
      loading.value = true
      error.value = null
      try {
        chats.value = await apiFetch<Chat[]>('/chats')
      } catch (e) {
        error.value = e instanceof Error ? e.message : 'Erreur de chargement'
        chats.value = []
      } finally {
        loading.value = false
      }
    }

    const deleteChat = async (id: number) => {
      try {
        await apiFetch(`/chats/${id}`, { method: 'DELETE' })
        chats.value = chats.value.filter(c => c.id !== id)
        if (chatState.current?.id === id) clearChat()
      } catch (e) {
        error.value = e instanceof Error ? e.message : 'Erreur de suppression'
      }
    }

    onMounted(fetchChats)
    watch(isAuthenticated, fetchChats)

    // Quand un draft passe en persisté (id null → number), recharger la liste
    watch(
      () => chatState.current?.id,
      (newId, oldId) => {
        if (oldId === null && typeof newId === 'number') fetchChats()
      }
    )

    return { chats, loading, error, currentId, draft, selectChat, deleteChat, newDraftChat, clearChat }
  }
})
</script>

<template>
  <div class="content">
    <div class="new-chat" @click="newDraftChat">
      <i class="fa-regular fa-plus"/>
      <p>Nouveau chat</p>
    </div>

    <div class="spacer"/>

    <div class="history">
      <p class="history-title">Historique</p>

      <HistoryItem
          v-if="draft"
          :titre="draft.title"
          :active="true"
          @select="() => {}"
          @delete="clearChat()"
      />

      <p v-if="loading" class="history-empty">Chargement...</p>
      <p v-else-if="error" class="history-empty">{{ error }}</p>
      <p v-else-if="chats.length === 0 && !draft" class="history-empty">Aucun chat</p>

      <HistoryItem
          v-for="item in chats"
          :key="item.id"
          :titre="item.title"
          :active="currentId === item.id"
          @select="selectChat(item.id)"
          @delete="deleteChat(item.id)"
      />
    </div>
    <div class="token-rate">
      <h1>Changer de plan d'abonnement</h1>
      <p>Votre abonnement actuel est limité en token. (100 000/j)</p>
      <div class="upgrade-plan">
        <p>Passer au niveau supérieur</p>
      </div>
    </div>
  </div>
</template>

<style scoped>

.token-rate {
  background-color: rgb(255 255 255 / 0.6);
  display: flex;
  flex-direction: column;
  gap: 5px;
  border-radius: 5px;
  padding: 5px;
  box-shadow: 0 0 6px 5px rgba(32,122,112,0.02);

  & h1 {
    font-size: 16px;
    margin: 0;
  }
  & p {
    font-size: 12px;
    margin: 0;
  }
}

.spacer {
  align-self: center;
  background-color: rgb(55 55 55 / 0.2);
  height: 1px;
  width: 80%;
  margin: 10px 0;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
}

.new-chat {
  border-radius: 5px;
  background-color: #373737;
  color: white;
  height: 40px;
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  & i {
    font-size: 18px;
  }
}

.upgrade-plan {
  border-radius: 5px;
  background-color: #207A70;
  color: white;
  height: 40px;
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.history {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;
}

.history-title {
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 5px;
  padding-left: 10px;
}

.history-empty {
  font-size: 13px;
  color: #aaa;
  padding-left: 10px;
  margin: 0;
}
</style>