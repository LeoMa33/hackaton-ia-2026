<script lang="ts">
import { defineComponent, computed, ref, watch, nextTick } from 'vue'
import ChatInput from './ChatInput.vue'
import { chatState } from '../lib/chat'
import { authState } from '../lib/auth'

const MASCOTTE = '/mascotte.png'

export default defineComponent({
  name: "ChatFenetre",
  components: { ChatInput },
  setup() {
    const current = computed(() => chatState.current)
    const loading = computed(() => chatState.loading)
    const error = computed(() => chatState.error)
    // Accueil type Claude/GPT : aucun chat ouvert ou chat vide.
    const isWelcome = computed(() => !current.value || current.value.messages.length === 0)

    const userAvatar = computed(() => {
      const u = authState.user
      if (u?.avatar_url) return u.avatar_url
      const seed = u?.email ?? 'guest'
      return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`
    })

    const contentRef = ref<HTMLElement | null>(null)
    const scrollToBottom = () => {
      const el = contentRef.value
      if (el) el.scrollTop = el.scrollHeight
    }

    // Suivre le bas : nouveau chat, nouveau message, et chaque chunk du stream.
    watch(
      () => [
        chatState.current?.id,
        chatState.current?.messages.length,
        chatState.current?.messages.at(-1)?.content.length,
      ],
      () => nextTick(scrollToBottom)
    )

    return { current, loading, error, isWelcome, contentRef, userAvatar, MASCOTTE }
  }
})
</script>

<template>
  <div class="chat">
    <p v-if="loading" class="state">Chargement...</p>
    <p v-else-if="error" class="state error">{{ error }}</p>

    <!-- Accueil centré : mascotte + titre + input -->
    <div v-else-if="isWelcome" class="welcome">
      <img src="/mascotte.png" alt="Aura" class="welcome-mascotte" />
      <h1 class="welcome-title">Comment puis-je vous aider&nbsp;?</h1>
      <ChatInput />
    </div>

    <!-- Conversation : messages en haut, input en bas -->
    <template v-else>
      <div class="content" ref="contentRef">
        <h2 class="chat-title">{{ current.title }}</h2>
        <div class="messages">
          <div
              v-for="(msg, i) in current.messages"
              :key="i"
              :class="['message', msg.role]"
          >
            <img
                v-if="msg.role === 'assistant'"
                class="avatar"
                :src="MASCOTTE"
                alt="Aura"
            />
            <div class="bubble">{{ msg.content }}</div>
            <img
                v-if="msg.role === 'user'"
                class="avatar"
                :src="userAvatar"
                alt="Vous"
            />
          </div>
        </div>
      </div>
      <ChatInput />
    </template>
  </div>
</template>

<style scoped>
.chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: 50px 25px;
  overflow: hidden;
}

.content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.welcome-mascotte {
  width: 90px;
  height: 90px;
}

.welcome-title {
  font-size: 1.6rem;
  font-weight: 600;
  color: #207A70;
  margin: 0 0 8px;
  text-align: center;
}

.welcome :deep(.input-container) {
  width: 100%;
  max-width: 640px;
}

.chat-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #207A70;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;
  background: #eee;
}

.bubble {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 12px;
  white-space: pre-wrap;
  line-height: 1.45;
  font-size: 0.95rem;
}

.message.user .bubble {
  background: #207A70;
  color: white;
  border-bottom-right-radius: 4px;
}

.message.assistant .bubble {
  background: #f3f4f6;
  color: #1f2937;
  border-bottom-left-radius: 4px;
}

.state {
  color: #888;
  text-align: center;
  margin-top: 2rem;
}

.state.error {
  color: #c0392b;
}
</style>
