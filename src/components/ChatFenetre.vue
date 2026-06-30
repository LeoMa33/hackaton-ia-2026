<script lang="ts">
import { defineComponent, computed } from 'vue'
import ChatInput from './ChatInput.vue'
import { chatState } from '../lib/chat'

export default defineComponent({
  name: "ChatFenetre",
  components: { ChatInput },
  setup() {
    const current = computed(() => chatState.current)
    const loading = computed(() => chatState.loading)
    const error = computed(() => chatState.error)
    return { current, loading, error }
  }
})
</script>

<template>
  <div class="chat">
    <div class="content">
      <p v-if="loading" class="state">Chargement...</p>
      <p v-else-if="error" class="state error">{{ error }}</p>

      <template v-else-if="current">
        <h2 class="chat-title">{{ current.title }}</h2>
        <div class="messages">
          <div
              v-for="(msg, i) in current.messages"
              :key="i"
              :class="['message', msg.role]"
          >
            <div class="bubble">{{ msg.content }}</div>
          </div>
        </div>
      </template>

      <p v-else class="state">Bonjour, comment puis-je vous aider ?</p>
    </div>
    <ChatInput />
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
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
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
