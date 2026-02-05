<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import { useAuthStore } from '~/stores/auth'

const toast = useToast()
const authStore = useAuthStore()
const router = useRouter()
const isLoading = ref(false)
const isOpen = ref(false)

const fields: AuthFormField[] = [{
    name: 'username',
    type: 'text',
    label: 'ICIT Account',
    placeholder: 'Enter your ICIT Account',
    required: true
}, {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    required: true
}, {
    name: 'remember',
    label: 'Remember me',
    type: 'checkbox'
}]

const schema = z.object({
    username: z.string().min(1, 'Required'),
    password: z.string().min(4, 'Min 4 chars'),
    remember: z.boolean().optional()
})

type Schema = z.output<typeof schema>

async function onSubmit(event: FormSubmitEvent<Schema>) {
    isLoading.value = true

    const result = await authStore.login(event.data.username, event.data.password)

    if (result.success) {
        toast.add({
            title: 'Login Successful!',
            description: `Welcome back, ${event.data.username}`,
            icon: 'i-lucide-check-circle',
            color: 'success'
        })

        isOpen.value = false

        const redirectPath = (router.currentRoute.value.query.redirect as string) || '/'
        await navigateTo(redirectPath, { replace: true })

    } else {
        toast.add({
            title: 'Login Failed',
            description: result.error,
            icon: 'i-lucide-x-circle',
            color: 'error'
        })
    }

    isLoading.value = false
}

function onModalClose() {
    navigateTo('/', { replace: true })
}
</script>

<template>
    <UModal title="เข้าสู่ระบบ" description="ยินดีต้อนรับกลับมา กรุณาเข้าสู่ระบบด้วย ICIT Account" :open="isOpen"
        @update:open="isOpen = $event" prevent-close @close="onModalClose" :ui="{
            content: 'sm:max-w-lg',
            overlay: 'backdrop-blur-sm'
        }">
        <UButton label="เข้าสู่ระบบ" color="primary" variant="solid" icon="i-lucide-log-in" />

        <template #body>
            <div class="space-y-6">
                <!-- <div class="flex items-center gap-3">
                    <div
                        class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                        <UIcon name="i-lucide-graduation-cap" class="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white">เข้าสู่ระบบ</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            ยินดีต้อนรับกลับมา กรุณาเข้าสู่ระบบด้วย ICIT Account
                        </p>
                    </div>
                </div> -->

                <UAuthForm :schema="schema" :fields="fields" :loading="isLoading" :submit="{
                    label: 'เข้าสู่ระบบ',
                    loading: isLoading,
                    color: 'primary',
                    block: true,
                    size: 'lg'
                }" @submit="onSubmit" />
            </div>
        </template>
    </UModal>
</template>