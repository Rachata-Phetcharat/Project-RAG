<script setup lang="ts">
const props = defineProps<{
    title: string
}>()

const open = defineModel<boolean>('open')
const route = useRoute()
const authStore = useAuthStore()

const isLogoutOpen = ref(false)

const menuItems = computed(() => [
    { label: 'หน้าหลัก', icon: 'i-lucide-house', to: '/' },
    { label: 'สร้างแชนแนลใหม่', icon: 'i-lucide-book-plus', to: '/channel' },
    { label: 'สร้าง Key API', icon: 'i-lucide-key-round', to: '/createapi' },
    { label: 'ภาพรวม', icon: 'i-lucide-layout-list', to: '/overview' },
    ...(authStore.role === 'admin'
        ? [
            { label: 'แดชบอร์ด', icon: 'i-lucide-bar-chart-3', to: '/admin/dashboard/home' },
            { label: 'จัดการผู้ใช้งาน', icon: 'i-lucide-users', to: '/admin/dashboard/manage_users' },
            { label: 'คำขอแชนแนล', icon: 'i-lucide-clipboard-list', to: '/admin/dashboard/pending' },
            { label: 'แชนแนลทั้งหมด', icon: 'i-lucide-tv-2', to: '/admin/dashboard/all_channel' },
        ]
        : [])
])

const isActive = (to: string) =>
    to.startsWith('/admin')
        ? route.path.startsWith(to)
        : route.path === to

const openLogoutModal = () => {
    open.value = false
    isLogoutOpen.value = true
}

const handleLogout = async () => {
    await authStore.logout()
}

watch(() => route.path, () => { open.value = false })
</script>

<template>
    <USlideover v-model:open="open" side="right" :ui="{ content: 'max-w-[270px] w-full' }">
        <template #content>
            <div class="flex flex-col h-full bg-white dark:bg-neutral-800">

                <!-- Header -->
                <div
                    class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-neutral-700">
                    <span class="font-bold text-gray-800 dark:text-gray-100">{{ title }}</span>
                    <div class="flex items-center gap-2">
                        <!-- Notification -->
                        <Notifications v-if="authStore.isLoggedIn" />

                        <UColorModeButton class="cursor-pointer" />
                        <UButton icon="i-heroicons-x-mark" color="neutral" variant="ghost" size="sm"
                            @click="open = false" />
                    </div>
                </div>

                <!-- User Section -->
                <div class="border-b border-gray-100 dark:border-neutral-700">
                    <div v-if="authStore.isLoggedIn" class="flex items-center gap-3 px-4 py-4">
                        <UAvatar :src="`https://ui-avatars.com/api/?name=${authStore.displayName}&background=random`"
                            :alt="authStore.displayName" size="md" />
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {{ authStore.displayName }}
                            </p>
                            <p class="text-xs text-gray-400 truncate">
                                {{ authStore.role === 'admin'
                                    ? `${authStore.accountType} (${authStore.role})`
                                    : authStore.accountType }}
                            </p>
                        </div>
                    </div>
                    <div v-else class="px-4 py-4">
                        <ButtomLogin />
                    </div>
                </div>

                <!-- Nav Menu -->
                <nav class="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                    <NuxtLink v-for="item in menuItems" :key="item.to" :to="item.to" :class="[
                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                        isActive(item.to)
                            ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    ]">
                        <UIcon :name="item.icon"
                            :class="['w-5 h-5 shrink-0',
                                isActive(item.to)
                                    ? 'text-gray-900 dark:text-white'
                                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200']" />
                        <span class="font-medium text-sm">{{ item.label }}</span>
                    </NuxtLink>
                </nav>

                <!-- Logout -->
                <div v-if="authStore.isLoggedIn"
                    class="px-3 pb-6 pt-2 border-t border-gray-100 dark:border-neutral-700">
                    <button
                        class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        @click="openLogoutModal">
                        <UIcon name="i-lucide-log-out" class="w-5 h-5 shrink-0" />
                        <span class="font-medium text-sm">ออกจากระบบ</span>
                    </button>
                </div>

            </div>
        </template>
    </USlideover>

    <!-- Logout Modal -->
    <ModalLogout v-model:open="isLogoutOpen" @confirmed="handleLogout" />
</template>