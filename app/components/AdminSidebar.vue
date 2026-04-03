<script setup lang="ts">
const route = useRoute()

// Mobile slideover state
const isMobileOpen = ref(false)

// Admin Navigation Menu Items
const menuItems = computed(() => [
    {
        label: 'สถิติการใช้งาน',
        icon: 'i-lucide-bar-chart-3',
        to: '/admin/dashboard/home',
        color: 'bg-gray-200 dark:bg-gray-600'
    },
    {
        label: 'จัดการผู้ใช้งาน',
        icon: 'i-lucide-users',
        to: '/admin/dashboard/manage_users',
        color: 'bg-gray-200 dark:bg-gray-600'
    },
    {
        label: 'คำขอแชนแนล',
        icon: 'i-lucide-clipboard-list',
        to: '/admin/dashboard/pending',
        color: 'bg-gray-200 dark:bg-gray-600'
    },
    {
        label: 'แชนแนลทั้งหมด',
        icon: 'i-lucide-tv-2',
        to: '/admin/dashboard/all_channel',
        color: 'bg-gray-200 dark:bg-gray-600'
    },
])

// Check if menu item is active
const isActive = (to: string) => route.path.includes(to)

// ปิด slideover เมื่อเปลี่ยนหน้า
watch(() => route.path, () => {
    isMobileOpen.value = false
})
</script>

<template>
    <!-- ══════════════════════════════════
         Desktop: Spacer + Fixed Aside
    ══════════════════════════════════ -->
    <div class="hidden lg:block w-64 shrink-0"></div>

    <aside
        class="hidden lg:flex fixed top-[80px] left-0 w-64 bg-white dark:bg-neutral-800 border-r border-gray-200 dark:border-neutral-700 flex-col z-40"
        style="height: calc(100vh - 80px)">
        <nav class="flex-1 px-4 py-6 space-y-2">
            <div class="flex items-center gap-3 px-4 py-2">
                <div class="text-3xl font-semibold text-gray-900 dark:text-white">Dashboard</div>
            </div>
            <NuxtLink v-for="item in menuItems" :key="item.to" :to="item.to" :class="[
                'flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden',
                isActive(item.to)
                    ? 'bg-linear-to-r ' + item.color + ' text-gray-900 dark:text-white'
                    : 'text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
            ]">
                <div v-if="isActive(item.to)"
                    :class="['absolute inset-0 bg-linear-to-r opacity-0 group-hover:opacity-10', item.color]" />
                <div class="flex items-center gap-3 relative z-10">
                    <UIcon :name="item.icon"
                        :class="['w-5 h-5', isActive(item.to) ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-current']" />
                    <span class="font-medium text-sm">{{ item.label }}</span>
                </div>
            </NuxtLink>
        </nav>
    </aside>
</template>