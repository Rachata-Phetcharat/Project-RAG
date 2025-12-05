<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

const toast = useToast()
const isLoading = ref(false)

const fields: AuthFormField[] = [{
    // *** เปลี่ยนจาก name: 'email', type: 'email' ***
    name: 'username',
    type: 'text', // ใช้ 'text' สำหรับรหัสนักศึกษา/Username
    label: 'ICIT Account', // เปลี่ยน Label ให้สื่อสารชัดเจน
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

// *** ปรับปรุง Zod Schema ให้ใช้ 'username' แทน 'email' ***
const schema = z.object({
    username: z.string().min(1, 'ICIT Account is required').max(20, 'Too long!'), // กำหนด Validation สำหรับ Username
    password: z.string().min(8, 'Password must be at least 8 characters'),
    remember: z.boolean().optional()
})

type Schema = z.output<typeof schema>

async function onSubmit(event: FormSubmitEvent<Schema>) {
    isLoading.value = true

    // Payload ตอนนี้จะมี event.data.username แทน event.data.email
    console.log('Submitted Payload:', event.data)

    await new Promise(resolve => setTimeout(resolve, 2000)) // จำลองการส่งข้อมูล (2 วินาที)

    try {
        // *** ใช้ event.data.username ใน Logic การเข้าระบบจริง ***
        // เช่น: const response = await loginAPI(event.data.username, event.data.password)

        toast.add({
            title: 'Login Successful!',
            description: `Welcome back, ${event.data.username}`,
            icon: 'i-lucide-check-circle',
            color: 'success'
        })
        await navigateTo('/', { replace: true })
    } catch (error) {
        toast.add({
            title: 'Login Failed',
            description: 'Invalid Student ID or password.',
            icon: 'i-lucide-x-circle',
            color: 'error'
        })
    } finally {
        isLoading.value = false
    }
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
                <template #password-hint>
                    <ULink to="#" class="text-primary font-medium" tabindex="-1">Forgot password?</ULink>
                </template>
            </UAuthForm>
        </UPageCard>
    </div>
</template>