<script lang="ts">
import { defineComponent, computed, onMounted, watch, ref } from 'vue'
import { quotaState, refreshQuota } from '../lib/chat'
import { isAuthenticated } from '../lib/auth'
import PaymentModal from './PaymentModal.vue'

const fmt = (n: number) => n.toLocaleString('fr-FR')

export default defineComponent({
  name: 'TokenRate',
  components: { PaymentModal },
  setup() {
    const showPayment = ref(false)
    const quota = computed(() => quotaState.data)
    const isPro = computed(() => quota.value?.plan === 'pro')
    const percent = computed(() => {
      const q = quota.value
      if (!q || q.limit <= 0) return 0
      return Math.min(100, Math.round((q.tokens_used / q.limit) * 100))
    })
    const usageLabel = computed(() => {
      const q = quota.value
      if (!q) return ''
      return `${fmt(q.tokens_used)} / ${fmt(q.limit)} tokens`
    })

    onMounted(() => { if (isAuthenticated.value) refreshQuota() })
    watch(isAuthenticated, (v) => { if (v) refreshQuota() })

    return { quota, isPro, percent, usageLabel, fmt, showPayment }
  },
})
</script>

<template>
  <div v-if="quota" class="token-rate">
    <div class="icon"><i class="fa-solid fa-gem" /></div>
    <template v-if="isPro">
      <h1>Vous êtes en Pro <i class="fa-solid fa-circle-check pro-check" /></h1>
      <p class="subtitle">Merci ! Vous profitez d'une limite de tokens étendue et de réponses prioritaires.</p>
    </template>
    <template v-else>
      <h1>Passer à la version Premium</h1>
      <p class="subtitle">Débloquez des réponses plus rapides et une limite de tokens étendue.</p>
    </template>

    <div class="plan-row">
      <span class="plan-label">Plan actuel</span>
      <span class="plan-badge">{{ isPro ? 'Pro' : 'Free Tier' }}</span>
      <span class="usage">{{ usageLabel }}</span>
    </div>

    <div class="bar">
      <div class="bar-fill" :style="{ width: percent + '%' }" />
    </div>

    <button v-if="!isPro" type="button" class="cta" @click="showPayment = true">
      Passer au modèle supérieur
    </button>

    <PaymentModal v-if="showPayment" @close="showPayment = false" />
  </div>
</template>

<style scoped>
.token-rate {
  background: linear-gradient(160deg, #f0f7f6 0%, #e1efed 100%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 4px 14px rgba(32, 122, 112, 0.12);
}

.icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(160deg, #ffffff 0%, #e1efed 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(32, 122, 112, 0.15);
}

.icon i {
  font-size: 18px;
  color: #207A70;
}

.pro-check {
  color: #207A70;
  font-size: 14px;
}

.token-rate h1 {
  font-size: 16px;
  font-weight: 700;
  margin: 4px 0 0;
  color: #1f2d2b;
}

.subtitle {
  font-size: 12px;
  color: #5d706d;
  margin: 0;
  line-height: 1.4;
}

.plan-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
  color: #5d706d;
}

.plan-badge {
  border: 1px solid #bcd8d4;
  color: #207A70;
  border-radius: 6px;
  padding: 2px 8px;
  font-weight: 600;
}

.usage {
  margin-left: auto;
  white-space: nowrap;
}

.bar {
  height: 8px;
  border-radius: 999px;
  background: #d3e6e3;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #4ba99d 0%, #207A70 100%);
  transition: width 0.3s ease;
}

.cta {
  margin-top: 6px;
  border: none;
  border-radius: 10px;
  padding: 10px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  background: linear-gradient(90deg, #2a958a 0%, #207A70 100%);
  cursor: pointer;
  transition: opacity 0.15s;
}

.cta:hover {
  opacity: 0.92;
}
</style>
