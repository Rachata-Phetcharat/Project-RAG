<script setup lang="ts">

definePageMeta({
    middleware: 'guest' // คนล็อกอินแล้วห้ามเข้า (ดีดไปหน้าแรก)
})

import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import { useAuthStore } from '~/stores/auth'

const toast = useToast()
const authStore = useAuthStore()
const router = useRouter() // เรียกใช้ router เพื่อเช็ค query param
const isLoading = ref(false)

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

    // เรียกใช้ function login จาก Store
    // ** แก้ไข: ส่งแยก parameter (username, password) ตามที่เราแก้ Store ล่าสุด **
    const result = await authStore.login(event.data.username, event.data.password)

    if (result.success) {
        toast.add({
            title: 'Login Successful!',
            description: `Welcome back, ${event.data.username}`,
            icon: 'i-lucide-check-circle',
            color: 'success'
        })

        // เช็คว่ามีหน้าปลายทางที่ต้องการไปไหม (เช่น ?redirect=/dashboard) ถ้าไม่มีไปหน้าแรก
        const redirectPath = (router.currentRoute.value.query.redirect as string) || '/'
        await navigateTo(redirectPath, { replace: true })

    } else {
        toast.add({
            title: 'Login Failed',
            description: result.error, // แสดง error ที่ได้จาก Store
            icon: 'i-lucide-x-circle',
            color: 'error'
        })
    }

    isLoading.value = false
}
</script>

<template>
    <div class="flex flex-col items-center justify-center gap-4 p-4 min-h-screen">
        <UPageCard class="w-full max-w-md">
            <UAuthForm :schema="schema" :fields="fields" title="เข้าสู่ระบบ" icon="i-lucide-graduation-cap"
                :loading="isLoading" :submit="{
                    label: 'เข้าสู่ระบบ',
                    loading: isLoading,
                    color: 'primary',
                }" @submit="onSubmit">
            </UAuthForm>
        </UPageCard>
    </div>
</template>