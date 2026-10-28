<template>
  <GuestHome v-if="!userStore.getUser" />
  <UserHome v-else />
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import GuestHome from './GuestHome.vue'
import UserHome from './UserHome.vue'

const userStore = useUserStore()
</script>
