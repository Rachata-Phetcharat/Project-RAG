<script setup lang="ts">
const loginWithSSO = () => {
    const config = {
        baseURL: 'https://sso.kmutnb.ac.th/auth/login',
        client_id: 'onlrLf2z7jJ4dtKyFAX5F4GeFJrrX2gS',
        redirect_uri: 'https://project-rag-six.vercel.app/callback',
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

    sessionStorage.setItem('sso_state', config.state)
    window.location.href = `${config.baseURL}?${queryString}`
}
</script>

<template>
    <UButton label="เข้าสู่ระบบด้วย ICIT Account" icon="i-lucide-graduation-cap" color="primary" size="xl" block
        @click="loginWithSSO" />
</template>