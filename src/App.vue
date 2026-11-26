<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <component :is="Component" :key="route.name === 'notebook' || route.name === 'laup-v2' ? route.name : undefined" />
  </RouterView>
</template>

<style scoped>
</style>
