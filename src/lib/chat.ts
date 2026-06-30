import { reactive } from 'vue';
import { apiFetch, API_BASE, getToken } from './api';

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

export type Quota = {
  plan: string;
  limit: number;
  tokens_used: number;
  tokens_remaining: number;
};

export const quotaState = reactive<{ data: Quota | null }>({ data: null });

let abortController: AbortController | null = null;

export async function refreshQuota(): Promise<void> {
  try {
    quotaState.data = await apiFetch<Quota>('/chats/quota');
  } catch {
    // non-blocking — leave previous value on failure
  }
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

  // Reactive placeholder we append stream chunks into as they arrive.
  const reply = reactive({ role: 'assistant' as const, content: '' });
  chat.messages.push(reply);

  abortController = new AbortController();
  try {
    const path = isDraft ? '/chats/stream' : `/chats/${chat.id}/stream`;
    const token = getToken();
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message: trimmed }),
      signal: abortController.signal,
    });

    if (!res.ok || !res.body) {
      const detail = await res.json().catch(() => null);
      throw new Error(detail?.detail ?? `Erreur ${res.status}`);
    }

    const chatId = res.headers.get('X-Chat-Id');
    if (chatId) chat.id = Number(chatId);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      reply.content += decoder.decode(value, { stream: true });
    }
    return { persisted: isDraft };
  } catch (e) {
    // Interruption volontaire : on garde le texte déjà reçu.
    if (e instanceof DOMException && e.name === 'AbortError') {
      return { persisted: isDraft };
    }
    chatState.error = e instanceof Error ? e.message : "Erreur d'envoi";
    chat.messages.pop(); // remove assistant placeholder
    chat.messages.pop(); // remove the user message
    return null;
  } finally {
    abortController = null;
    chatState.sending = false;
    void refreshQuota();
  }
}

export function stopStreaming(): void {
  abortController?.abort();
}
