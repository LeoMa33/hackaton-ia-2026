import { reactive } from 'vue';
import { apiFetch } from './api';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ChatDetail = {
  id: number | null;
  title: string;
  messages: ChatMessage[];
};

type ChatState = {
  current: ChatDetail | null;
  loading: boolean;
  sending: boolean;
  error: string | null;
};

export const chatState = reactive<ChatState>({
  current: null,
  loading: false,
  sending: false,
  error: null,
});

export function truncateTitle(text: string, max = 100): string {
  return text.length > max ? text.slice(0, max) + '...' : text;
}

export async function selectChat(id: number): Promise<void> {
  chatState.loading = true;
  chatState.error = null;
  try {
    chatState.current = await apiFetch<ChatDetail>(`/chats/${id}`);
  } catch (e) {
    chatState.error = e instanceof Error ? e.message : 'Erreur de chargement';
    chatState.current = null;
  } finally {
    chatState.loading = false;
  }
}

export function newDraftChat(): void {
  chatState.error = null;
  chatState.current = {
    id: null,
    title: 'Nouveau chat',
    messages: [],
  };
}

export function clearChat(): void {
  chatState.current = null;
  chatState.error = null;
}

type SendResponse = {
  chat_id: number;
  response: string;
  tokens_used: number;
  tokens_remaining: number;
};

export async function sendMessage(content: string): Promise<{ persisted: boolean } | null> {
  const chat = chatState.current;
  if (!chat || chatState.sending) return null;

  const trimmed = content.trim();
  if (!trimmed) return null;

  const isDraft = chat.id === null;

  chat.messages.push({ role: 'user', content: trimmed });
  if (isDraft && chat.messages.length === 1) {
    chat.title = truncateTitle(trimmed);
  }

  chatState.sending = true;
  chatState.error = null;

  try {
    const path = isDraft ? '/chats' : `/chats/${chat.id}`;
    const res = await apiFetch<SendResponse>(path, {
      method: 'POST',
      body: JSON.stringify({ message: trimmed }),
    });
    chat.id = res.chat_id;
    chat.messages.push({ role: 'assistant', content: res.response });
    return { persisted: isDraft };
  } catch (e) {
    chatState.error = e instanceof Error ? e.message : "Erreur d'envoi";
    chat.messages.pop();
    return null;
  } finally {
    chatState.sending = false;
  }
}
