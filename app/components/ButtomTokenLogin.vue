<script setup lang="ts">
const authStore = useAuthStore()
const toast = useToast()

const isOpen = ref(false)
const isLoading = ref(false)

const form = reactive({
    username: '',
    password: '',
})

const error = ref<string | null>(null)

const config = useRuntimeConfig()
const apiBase = config.public.apiBase

const openModal = () => {
    form.username = ''
    form.password = ''
    error.value = null
    isOpen.value = true
}

const loginWithToken = async () => {
    if (!form.username || !form.password) {
        error.value = 'กรุณากรอก Username และ Password'
        return
    }

    isLoading.value = true
    error.value = null

    try {
        /* POST /auth/token — application/x-www-form-urlencoded */
        const body = new URLSearchParams({
            grant_type: 'password',
            username: form.username,
            password: form.password,
        })

        const raw = await $fetch<string>(`${apiBase}/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        })

        /* Backend ส่งคืน access token เป็น string หรือ JSON string */
        let accessToken: string | undefined
        if (typeof raw === 'string') {
            accessToken = raw.trim().replace(/^"|"$/g, '')
        } else if (typeof raw === 'object' && raw !== null) {
            accessToken =
                (raw as any)?.access_token ||
                (raw as any)?.local_access_token ||
                (raw as any)?.token
        }

        if (!accessToken) throw new Error('ไม่ได้รับ Access Token')

        authStore.token = accessToken
        await authStore.fetchUser()

        toast.add({
            title: 'เข้าสู่ระบบสำเร็จ',
            description: `ยินดีต้อนรับ ${authStore.displayName}`,
            icon: 'i-lucide-circle-check',
            color: 'success',
        })

        isOpen.value = false
        await navigateTo('/')
    } catch (err: any) {
        const detail = err?.data?.detail
        error.value =
            typeof detail === 'string'
                ? detail
                : Array.isArray(detail)
                    ? detail.map((d: any) => d.msg).join(', ')
                    : err?.message || 'เข้าสู่ระบบไม่สำเร็จ'
    } finally {
        isLoading.value = false
    }
}

const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') loginWithToken()
}
</script>

<template>
    <!-- Trigger button -->
    <UButton label="เข้าสู่ระบบด้วย Password" icon="i-lucide-key-round" color="neutral" variant="soft" size="lg"
        @click="openModal" />

    <!-- Modal -->
    <UModal v-model:open="isOpen" title="เข้าสู่ระบบด้วย Username / Password">
        <template #body>
            <div class="flex flex-col gap-4 p-1">
                <!-- Error alert -->
                <UAlert v-if="error" color="error" variant="soft" :description="error" icon="i-lucide-triangle-alert" />

                <!-- Username -->
                <UFormField label="Username" required>
                    <UInput v-model="form.username" placeholder="กรอก username" icon="i-lucide-user" size="lg"
                        :disabled="isLoading" autocomplete="username" class="w-full" @keydown="handleKeydown" />
                </UFormField>

                <!-- Password -->
                <UFormField label="Password" required>
                    <UInput v-model="form.password" type="password" placeholder="กรอก password" icon="i-lucide-lock"
                        size="lg" :disabled="isLoading" autocomplete="current-password" class="w-full"
                        @keydown="handleKeydown" />
                </UFormField>
            </div>
        </template>

        <template #footer>
            <div class="flex justify-end gap-3 w-full">
                <UButton label="ยกเลิก" color="neutral" variant="ghost" :disabled="isLoading" @click="isOpen = false" />
                <UButton label="เข้าสู่ระบบ" icon="i-lucide-log-in" color="primary" :loading="isLoading"
                    @click="loginWithToken" />
            </div>
        </template>
    </UModal>
</template>
