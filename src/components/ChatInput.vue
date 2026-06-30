<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import { chatState, sendMessage, newDraftChat, stopStreaming } from '../lib/chat'

export default defineComponent({
  name: "ChatInput",
  setup() {
    const textValue = ref('')
    const textareaRef = ref<HTMLTextAreaElement | null>(null)

    const hasChat = computed(() => !!chatState.current)
    const sending = computed(() => chatState.sending)
    const disabled = computed(() => sending.value)
    const canSend = computed(() => !disabled.value && textValue.value.trim().length > 0)

    const autoGrow = () => {
      const textarea = textareaRef.value
      if (textarea) {
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
      }
    }

    const submit = async () => {
      if (!canSend.value) return
      const content = textValue.value
      textValue.value = ''
      if (textareaRef.value) textareaRef.value.style.height = 'auto'
      if (!chatState.current) newDraftChat() // démarre un chat depuis l'accueil
      await sendMessage(content)
    }

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        submit()
      }
    }

    // Bouton : envoie, ou interrompt si l'IA répond.
    const onAction = () => (sending.value ? stopStreaming() : submit())

    return {
      textValue,
      textareaRef,
      hasChat,
      sending,
      disabled,
      canSend,
      autoGrow,
      submit,
      onAction,
      onKeydown,
    }
  }
})
</script>

<template>
  <div class="input-container">
    <div class="icon-container">
      <i class="fa-solid fa-wand-magic-sparkles icon-color" />
    </div>

    <textarea
        ref="textareaRef"
        v-model="textValue"
        @input="autoGrow"
        @keydown="onKeydown"
        :disabled="disabled"
        rows="1"
        placeholder="Entrez votre message..."
    ></textarea>

    <div
        :class="['send', { disabled: !sending && !canSend }]"
        :title="sending ? 'Interrompre' : 'Envoyer'"
        @click="onAction"
    >
      <i v-if="sending" class="fa-solid fa-stop icon-color-secondary" />
      <i v-else class="fa-solid fa-paper-plane icon-color-secondary" />
    </div>
  </div>
</template>

<style scoped>
.icon-color {
  color: #207A70;
  font-size: 18px;
}

.icon-color-secondary {
  color: #FFF;
  font-size: 18px;
}

.input-container {
  display: flex;
  gap: 10px;
  padding: 10px;
  align-self: center;
  align-items: flex-end;
  width: 75%;
  background-color: white;
  box-shadow: 0 0 6px 5px rgba(32,122,112,0.02);
  border-radius: 10px;
  box-sizing: border-box;

  & textarea {
    flex: 1;
    border: none;
    outline: none;
    background-color: transparent;
    font-family: inherit;
    font-size: 14px;
    resize: none;
    line-height: 1.4;
    height: 20px;
    max-height: 150px;
    overflow-y: auto;
    padding: 0;
    margin-bottom: 10px;
  }

  & textarea:disabled {
    color: #aaa;
    cursor: not-allowed;
  }
}

.icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 5px;
  flex-shrink: 0;
}

.send {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 5px;
  background-color: #207A70;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.15s, opacity 0.15s;
}

.send.disabled {
  background-color: #b8d3d0;
  cursor: not-allowed;
}
</style>
