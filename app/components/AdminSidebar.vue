<script setup lang="ts">
const route = useRoute()

// Admin Navigation Menu Items
const menuItems = computed(() => [
    {
        label: 'แดชบอร์ด',
        icon: 'i-lucide-bar-chart-3',
        to: '/admin/dashboard/home',
        color: 'from-indigo-500 to-purple-500'
    },
    {
        label: 'จัดการผู้ใช้',
        icon: 'i-lucide-users',
        to: '/admin/dashboard/users',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        label: 'คำขอ',
        icon: 'i-lucide-clipboard-list',
        to: '/admin/dashboard/pending',
        color: 'from-blue-500 to-cyan-500'
    },
])

// Check if menu item is active
const isActive = (to: string) => {
    return route.path.includes(to)
}
</script>

<template>
    <aside
        class="hidden lg:flex w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-col h-screen sticky top-0">
        <!-- Logo / Branding -->
        <!-- <div class="p-6 border-b border-gray-200 dark:border-gray-800">
            <div class="flex items-center gap-3">
                <div class="relative">
                    <div
                        class="absolute inset-0 bg-linear-to-r from-indigo-500 to-purple-500 rounded-xl blur-lg opacity-75">
                    </div>
                    <div class="relative p-2 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg">
                        <UIcon name="i-lucide-shield-admin" class="w-6 h-6 text-white" />
                    </div>
                </div>
                <div>
                    <h1 class="text-lg font-bold text-gray-900 dark:text-white">Admin Panel</h1>
                    <p class="text-xs text-gray-500 dark:text-gray-400">ศูนย์จัดการระบบ</p>
                </div>
            </div>
        </div> -->

        <!-- Navigation Menu -->
        <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <NuxtLink v-for="item in menuItems" :key="item.to" :to="item.to" :class="[
                'flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden',
                isActive(item.to)
                    ? 'bg-linear-to-r ' + item.color + ' text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            ]">
                <!-- Animated background for active state -->
                <div v-if="isActive(item.to)"
                    :class="['absolute inset-0 bg-linear-to-r opacity-0 group-hover:opacity-10', item.color]"></div>

                <!-- Content -->
                <div class="flex items-center gap-3 relative z-10">
                    <UIcon :name="item.icon"
                        :class="['w-5 h-5', isActive(item.to) ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-current']" />
                    <span class="font-medium text-sm">{{ item.label }}</span>
                </div>

            </NuxtLink>
        </nav>
    </aside>
</template>

<style scoped>
nav::-webkit-scrollbar {
    width: 6px;
}

nav::-webkit-scrollbar-track {
    background: transparent;
}

nav::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.3);
    border-radius: 99px;
}

nav::-webkit-scrollbar-thumb:hover {
    background: rgba(156, 163, 175, 0.5);
}
</style>
