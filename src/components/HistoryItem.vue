<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount } from 'vue'

export default defineComponent({
  name: "HistoryItem",
  props: {
    titre: {
      type: String,
      required: true
    },
    active: {
      type: Boolean,
      default: false
    }
  },
  emits: ['select', 'delete'],
  setup(_, { emit }) {
    const menuOpen = ref(false)
    const menuRef = ref<HTMLElement | null>(null)

    const toggleMenu = (e: MouseEvent) => {
      e.stopPropagation()
      menuOpen.value = !menuOpen.value
    }

    const handleDelete = (e: MouseEvent) => {
      e.stopPropagation()
      menuOpen.value = false
      emit('delete')
    }

    const onDocClick = (e: MouseEvent) => {
      if (!menuOpen.value) return
      if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
        menuOpen.value = false
      }
    }

    onMounted(() => document.addEventListener('click', onDocClick))
    onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

    return { menuOpen, menuRef, toggleMenu, handleDelete }
  }
})
</script>

<template>
  <div :class="['chat', { active }]" @click="$emit('select')">
    <p>{{ titre }}</p>
    <div class="menu-wrapper" ref="menuRef">
      <i class="fa-solid fa-ellipsis-vertical menu-trigger" @click="toggleMenu" />
      <div v-if="menuOpen" class="menu">
        <button class="menu-item delete" @click="handleDelete" type="button">
          <i class="fa-solid fa-trash" />
          <span>Supprimer</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat {
  border-radius: 5px;
  justify-content: space-between;
  color: #2a2a2a;
  height: 40px;
  display: flex;
  gap: 10px;
  align-items: center;
  cursor: pointer;
  padding: 0 10px;
  position: relative;
}

.chat p {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0;
  flex: 1;
}

.chat:hover {
  background-color: #f8f8f8;
}

.chat.active {
  background-color: #eaf3f2;
  color: #207A70;
  font-weight: 500;
}

.menu-wrapper {
  position: relative;
}

.menu-trigger {
  display: none;
  padding: 6px 4px;
  border-radius: 4px;
  color: #555;
}

.chat:hover .menu-trigger,
.menu-trigger:has(+ .menu) {
  display: flex;
}

.menu-trigger:hover {
  background: rgba(0, 0, 0, 0.06);
}

.menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #eee;
  border-radius: 6px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  min-width: 140px;
  z-index: 100;
  padding: 4px;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  padding: 8px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #1f2937;
  text-align: left;
}

.menu-item:hover {
  background: #f3f4f6;
}

.menu-item.delete {
  color: #c0392b;
}

.menu-item.delete:hover {
  background: #fde8e6;
}
</style>
