<script setup lang="ts">
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

onMounted(async () => {
    const code = route.query.code as string

    if (code) {
        try {
            // ส่ง code ไปแลก Token ที่ FastAPI ผ่าน Pinia Store
            const result = await authStore.loginWithSSO(code, "local")

            if (result.success) {
                toast.add({
                    title: 'เข้าสู่ระบบสำเร็จ',
                    icon: 'i-lucide-check-circle',
                    color: 'success'
                })

                return navigateTo('/')
            } else {
                throw new Error(result.error)
            }
        } catch (err: any) {
            toast.add({
                title: 'SSO Error',
                description: err.message || 'การยืนยันตัวตนล้มเหลว',
                color: 'error'
            })
            navigateTo('/')
        }
    } else {
        navigateTo('/')
    }
})
</script>

<template>
    <div class="flex items-center justify-center">
        <div
            class="text-center p-10 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
            <UIcon name="i-lucide-loader-2" class="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">กำลังพาคุณกลับไป...</h2>
            <p class="text-gray-500 mt-2">กำลังยืนยันตัวตนกับ KMUTNB SSO</p>
        </div>
    </div>
</template>