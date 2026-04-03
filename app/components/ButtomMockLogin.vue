<script setup lang="ts">
const authStore = useAuthStore()
const toast = useToast()
const isLoading = ref(false)

const loginWithMock = async () => {
    isLoading.value = true
    try {
        const result = await authStore.loginWithMock()

        if (result.success) {
            toast.add({
                title: 'เข้าสู่ระบบสำเร็จ (Mock)',
                description: `ยินดีต้อนรับ ${authStore.displayName}`,
                icon: 'i-lucide-flask-conical',
                color: 'success'
            })
            await navigateTo('/')
        } else {
            throw new Error(result.error)
        }
    } catch (err: any) {
        toast.add({
            title: 'Mock Login Error',
            description: err.message || 'เกิดข้อผิดพลาด',
            color: 'error'
        })
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <UButton
        label="Mock Login (Dev)"
        icon="i-lucide-flask-conical"
        color="warning"
        variant="soft"
        size="lg"
        :loading="isLoading"
        @click="loginWithMock"
    />
</template>
