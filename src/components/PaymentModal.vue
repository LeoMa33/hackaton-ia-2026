<script lang="ts">
import { defineComponent, ref } from 'vue'
import { apiFetch } from '../lib/api'
import { fetchMe } from '../lib/auth'
import { refreshQuota } from '../lib/chat'

export default defineComponent({
  name: 'PaymentModal',
  emits: ['close'],
  setup(_, { emit }) {
    const card = ref('')
    const expiry = ref('')
    const cvc = ref('')
    const paying = ref(false)
    const done = ref(false)
    const error = ref<string | null>(null)

    const pay = async () => {
      error.value = null
      if (!card.value || !expiry.value || !cvc.value) {
        error.value = 'Renseignez vos informations de paiement'
        return
      }
      paying.value = true
      try {
        // POC: aucun paiement réel, on bascule juste le plan en pro
        await apiFetch('/users/me/upgrade', { method: 'POST' })
        await Promise.all([fetchMe(), refreshQuota()])
        done.value = true
        setTimeout(() => emit('close'), 1200)
      } catch (e) {
        error.value = e instanceof Error ? e.message : 'Erreur de paiement'
      } finally {
        paying.value = false
      }
    }

    return { card, expiry, cvc, paying, done, error, pay }
  },
})
</script>

<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="modal">
      <button class="close" type="button" @click="$emit('close')">
        <i class="fa-solid fa-xmark" />
      </button>

      <div v-if="done" class="success">
        <i class="fa-solid fa-circle-check" />
        <h2>Bienvenue en Pro !</h2>
        <p>Votre plan a été mis à niveau.</p>
      </div>

      <template v-else>
        <h2>Passer à Pro</h2>
        <p class="sub">10 000 000 tokens / mois · réponses prioritaires</p>
        <p class="price">9,99 € <span>/ mois</span></p>

        <label>
          <span>Numéro de carte</span>
          <input v-model="card" inputmode="numeric" placeholder="4242 4242 4242 4242" :disabled="paying" />
        </label>
        <div class="row">
          <label>
            <span>Expiration</span>
            <input v-model="expiry" placeholder="MM/AA" :disabled="paying" />
          </label>
          <label>
            <span>CVC</span>
            <input v-model="cvc" inputmode="numeric" placeholder="123" :disabled="paying" />
          </label>
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <button class="pay" type="button" :disabled="paying" @click="pay">
          {{ paying ? 'Paiement...' : 'Payer 9,99 €' }}
        </button>
        <p class="note">Démo — aucun paiement réel n'est effectué.</p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.modal {
  position: relative;
  background: white;
  border-radius: 10px;
  padding: 2rem;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 18px;
  color: #888;
  cursor: pointer;
}

.modal h2 {
  margin: 0 0 0.25rem;
  color: #207A70;
}

.sub {
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  color: #666;
}

.price {
  margin: 0 0 1.25rem;
  font-size: 1.6rem;
  font-weight: 700;
  color: #207A70;
}

.price span {
  font-size: 0.85rem;
  font-weight: 400;
  color: #888;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: #555;
  margin-bottom: 0.85rem;
}

.row {
  display: flex;
  gap: 0.75rem;
}

.row label {
  flex: 1;
}

input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.6rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.15s;
}

input:focus {
  border-color: #207A70;
}

.error {
  color: #c0392b;
  font-size: 0.85rem;
  margin: 0 0 0.5rem;
}

.pay {
  width: 100%;
  padding: 0.8rem;
  background: #207A70;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.pay:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.note {
  text-align: center;
  font-size: 0.75rem;
  color: #aaa;
  margin: 0.75rem 0 0;
}

.success {
  text-align: center;
  padding: 1rem 0;
}

.success i {
  font-size: 3rem;
  color: #207A70;
}

.success h2 {
  margin: 0.75rem 0 0.25rem;
}

.success p {
  margin: 0;
  color: #666;
}
</style>
