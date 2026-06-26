<script setup lang="ts">
defineProps<{
  visible: boolean
}>()
</script>

<template>
  <Transition name="tagline-fade">
    <p v-if="visible" class="hello-tagline window-no-drag">Hello Quick Launch</p>
  </Transition>
</template>

<style scoped>
.hello-tagline {
  margin: 0;
  text-align: center;
  font-family: 'SF Pro Rounded', 'Nunito', 'Varela Round', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: 0.03em;
  color: var(--text-secondary);
  opacity: 0.82;
  -webkit-font-smoothing: antialiased;
}

.tagline-fade-enter-active,
.tagline-fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.tagline-fade-enter-from,
.tagline-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
