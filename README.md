# Aura — Front

Interface de chat IA (style Claude/GPT) construite avec **Astro + Vue 3**.
Elle consomme l'API [`ollama-gateway`](../ollama-gateway) : authentification JWT,
conversations en streaming, quotas de tokens et passage en plan Pro.

## Stack

- **Astro 7** — pages statiques + îlots Vue (`client:load`).
- **Vue 3** (Composition API, `defineComponent`) pour toute l'interactivité.
- **Font Awesome 6** (CDN) pour les icônes.
- État partagé via des objets `reactive()` exportés depuis `src/lib/` (pas de Pinia).
- Yarn comme gestionnaire de paquets.

## Prérequis

- Node ≥ 22.12
- L'API `ollama-gateway` qui tourne (par défaut sur `http://localhost:8000`)

## Configuration

Variable d'environnement (fichier `.env`) :

```
PUBLIC_API_BASE=http://localhost:8000
```

`PUBLIC_API_BASE` est l'URL de base de l'API. Le préfixe `PUBLIC_` est requis par
Astro pour exposer la variable au code client.

## Démarrer

```bash
yarn install
yarn dev        # http://localhost:4321
```

| Commande        | Action                                   |
| :-------------- | :--------------------------------------- |
| `yarn dev`      | Serveur de dev sur `localhost:4321`      |
| `yarn build`    | Build de production dans `./dist/`       |
| `yarn preview`  | Prévisualise le build                    |
| `yarn astro …`  | CLI Astro (`astro add`, `astro check`…)  |

## Architecture

```
src/
├── pages/index.astro        # Page unique : sidebar (ChatListe) + zone de chat (ChatFenetre)
├── layouts/MainLayout.astro # En-tête (logo Aura + UserBadge), monte AuthModal
├── lib/
│   ├── api.ts               # fetch wrapper, gestion du token, ApiError
│   ├── auth.ts              # état auth, login/register/logout, fetchMe, plan
│   └── chat.ts              # état chat + quota, envoi en streaming, stop
└── components/
    ├── AuthModal.vue        # Connexion / inscription (bloque tant que non connecté)
    ├── UserBadge.vue        # Avatar + nom dans l'en-tête, déconnexion
    ├── ChatListe.vue        # Liste des conversations + bouton nouveau chat + TokenRate
    ├── HistoryItem.vue      # Une ligne d'historique (sélection / suppression)
    ├── ChatFenetre.vue      # Accueil centré OU conversation (bulles + avatars)
    ├── ChatInput.vue        # Saisie + bouton envoyer / interrompre
    ├── TokenRate.vue        # Carte quota + barre de progression + upgrade Pro
    └── PaymentModal.vue     # Paiement fictif (POC) → bascule en Pro
```

### Modules d'état (`src/lib`)

**`api.ts`** — `apiFetch<T>(path, options)` : ajoute `Authorization: Bearer <jwt>`
(lu dans `localStorage`), gère le JSON et lève une `ApiError {status, message, data}`
sur réponse non-2xx. Le token est stocké sous la clé `auth_token`.

**`auth.ts`** — `authState` réactif (`token`, `user`, `loading`, `error`) :
- `login(email, password)` → POST `/auth/login`, stocke le token, puis `fetchMe()`.
- `register(username, email, password)` → POST `/auth/register` puis auto-login.
- `fetchMe()` → GET `/users/me`, remplit `authState.user`. Déconnecte **uniquement**
  sur un vrai 401 (un 5xx transitoire ne casse pas la session).
- `logout()` → vide token + user.
- Au chargement, `fetchMe()` est appelé si un token est déjà présent.

**`chat.ts`** — `chatState` (conversation courante) + `quotaState` (quota) :
- `sendMessage(content)` → **streaming** via `fetch` (lecture du `ReadableStream`,
  texte ajouté au fur et à mesure dans une bulle réactive). Crée un brouillon si on
  part de l'accueil. `chat_id` lu dans l'en-tête `X-Chat-Id`.
- `stopStreaming()` → `AbortController.abort()` ; le texte déjà reçu est conservé.
- `refreshQuota()` → GET `/chats/quota`, rappelé après **chaque** message.
- `selectChat(id)`, `newDraftChat()`, `clearChat()`.

## Fonctionnalités

- **Auth JWT** : modale bloquante tant qu'on n'est pas connecté ; infos utilisateur
  issues de `/users/me`.
- **Accueil type Claude/GPT** : sans conversation ouverte, mascotte + titre + saisie
  centrés ; le premier message démarre un chat.
- **Streaming** : la réponse de l'IA s'affiche token par token, le scroll suit.
- **Interruption** : pendant la génération, le bouton d'envoi devient un bouton stop.
- **Bulles façon WhatsApp** : avatar utilisateur à droite, mascotte (Aura) à gauche.
- **Quota & plan** (`TokenRate.vue`) : barre de progression `tokens_used / limit`,
  rafraîchie à chaque message. En Free, bouton « Passer Premium » → `PaymentModal`
  (paiement fictif, POC) qui appelle `/users/me/upgrade` et bascule en Pro ; en Pro,
  message de confirmation, plus de CTA.

## API consommée

| Méthode | Route                     | Usage                                    |
| :------ | :------------------------ | :--------------------------------------- |
| POST    | `/auth/register`          | Inscription                              |
| POST    | `/auth/login`             | Connexion → `access_token`               |
| GET     | `/users/me`               | Profil courant                           |
| POST    | `/users/me/upgrade`       | Passage en Pro (POC, sans paiement réel) |
| GET     | `/chats`                  | Liste des conversations                  |
| GET     | `/chats/{id}`             | Historique d'une conversation            |
| DELETE  | `/chats/{id}`             | Suppression                              |
| POST    | `/chats/stream`           | Nouveau chat en streaming                |
| POST    | `/chats/{id}/stream`      | Message dans un chat existant (streaming)|
| GET     | `/chats/quota`            | Quota courant                            |

> Le front utilise les routes **streaming** (`/stream`) pour l'envoi de messages.
> Le `chat_id` d'un nouveau chat est renvoyé dans l'en-tête `X-Chat-Id`
> (exposé côté API via CORS).
