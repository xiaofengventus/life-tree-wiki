<script setup>
import AuthForm from "@/components/AuthForm.vue";
import NavBar from "@/components/navBar.vue";
</script>

<template>
  <div class="login-page">
    <NavBar />
    <AuthForm />
  </div>
</template>

<style scoped>
.login-page { min-height: 100dvh; display: flex; flex-direction: column; }
.login-page :deep(.login-container) { flex: 1; }
</style>
