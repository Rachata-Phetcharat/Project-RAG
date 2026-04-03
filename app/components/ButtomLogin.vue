<script setup lang="ts">
const isDev = import.meta.dev // true เฉพาะตอน nuxt dev

const loginWithSSO = () => {
    const config = {
        baseURL: 'https://sso.kmutnb.ac.th/auth/authorize',
        client_id: 'onlrLf2z7jJ4dtKyFAX5F4GeFJrrX2gS',
        redirect_uri: 'http://localhost:3000/callback',
        scope: 'profile',
        state: Math.random().toString(36).substring(7)
    }

    const queryString = new URLSearchParams({
        response_type: 'code',
        client_id: config.client_id,
        redirect_uri: config.redirect_uri,
        scope: config.scope,
        state: config.state
    }).toString()

    window.location.href = `${config.baseURL}?${queryString}`
}
</script>

<template>
    <div class="flex lg:flex-row gap-4 p-4">
        <UColorModeButton class="cursor-pointer" />

        <!-- ปุ่ม Mock Login — แสดงเฉพาะ Development mode -->
        <ButtomMockLogin v-if="isDev" />

        <!-- ปุ่ม Token Login (Username/Password) -->
        <ButtomTokenLogin />

        <UButton label="เข้าสู่ระบบ" icon="i-lucide-log-in" color="primary" size="lg" block @click="loginWithSSO" />
    </div>
</template>