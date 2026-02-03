<script setup>
import { useAuthStore } from '~/stores/auth'
const auth = useAuthStore()

// เช็ค Session เมื่อโหลดแอพ
await callOnce(async () => {
  await auth.checkSession()
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
