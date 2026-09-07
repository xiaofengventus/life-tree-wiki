<script setup>
import navBar from "@/components/navBar.vue";
import user_show from "@/components/user_show.vue";
import view_post from "@/components/view_post.vue";
</script>

<template>
  <navBar />
  <user_show :show-write-button="true" />
  <view_post />
</template>
