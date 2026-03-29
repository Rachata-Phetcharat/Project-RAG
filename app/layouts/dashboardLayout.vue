<script setup lang="ts">
const route = useRoute()
const isMobileOpen = ref(false)

const menuItems = [
    { label: 'แดชบอร์ด', icon: 'i-lucide-bar-chart-3', to: '/admin/dashboard/home' },
    { label: 'จัดการผู้ใช้', icon: 'i-lucide-users', to: '/admin/dashboard/manage_users' },
    { label: 'คำขอ', icon: 'i-lucide-clipboard-list', to: '/admin/dashboard/pending' },
    { label: 'แชนแนลทั้งหมด', icon: 'i-lucide-tv-2', to: '/admin/dashboard/all_channel' },
]

const isActive = (to: string) => route.path.includes(to)

watch(() => route.path, () => { isMobileOpen.value = false })
</script>

<template>
    <div class="flex flex-col h-screen overflow-hidden bg-white dark:bg-neutral-900">
        <UToaster />

        <!-- ── Navbar ── -->
        <nav
            class="sticky top-0 z-50 shrink-0 bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
            <div class="mx-auto px-4 sm:px-6 lg:px-10">
                <div class="flex items-center justify-between py-3 sm:py-4">

                    <!-- Logo -->
                    <NuxtLink to="/"
                        class="flex items-center gap-2 sm:gap-3 transition-opacity duration-200 hover:opacity-70 min-w-0">
                        <img src="/logo.png" alt="Logo" class="h-8 w-8 sm:h-10 sm:w-10 object-scale-down shrink-0" />
                        <span class="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                            KMUTNB ThinkHub
                        </span>
                    </NuxtLink>

                    <!-- Right: desktop → UserMenu เต็ม, mobile → hamburger -->
                    <div class="flex items-center gap-2 sm:gap-3 shrink-0">
                        <UserMenu compact="Default" class="hidden lg:flex" />
                        <UButton icon="i-lucide-menu" color="neutral" variant="ghost" size="md" class="lg:hidden"
                            aria-label="เปิดเมนู" @click="isMobileOpen = true" />
                    </div>
                </div>
            </div>
        </nav>

        <!-- ── Main ── -->
        <main class="flex-1 overflow-y-auto bg-white dark:bg-neutral-900 transition-colors duration-300">
            <slot />
        </main>

        <!-- ── Mobile Slideover ── -->
        <USlideover v-model:open="isMobileOpen" side="right" :ui="{ content: 'max-w-[270px] w-full' }">
            <template #content>
                <div class="flex flex-col h-full bg-white dark:bg-neutral-800">

                    <!-- Slideover Header -->
                    <div
                        class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-neutral-700">
                        <div class="flex items-center gap-2.5">
                            <span class="text-base font-bold text-gray-900 dark:text-white">Admin Panel</span>
                        </div>
                        <!-- Theme Switcher -->
                        <div class="flex items-center gap-2">
                            <UColorModeButton class="cursor-pointer" />
                            <UButton icon="i-heroicons-x-mark" color="neutral" variant="ghost" size="sm"
                                @click="isMobileOpen = false" />
                        </div>
                    </div>

                    <!-- UserMenu compact -->
                    <div class="border-b border-gray-100 dark:border-neutral-700">
                        <UserMenu compact="Mobile" />
                    </div>

                    <!-- Admin Nav Menu -->
                    <nav class="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                        <NuxtLink v-for="item in menuItems" :key="item.to" :to="item.to" :class="[
                            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                            isActive(item.to)
                                ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        ]">
                            <UIcon :name="item.icon"
                                :class="['w-5 h-5 shrink-0', isActive(item.to)
                                    ? 'text-gray-900 dark:text-white'
                                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200']" />
                            <span class="font-medium text-sm">{{ item.label }}</span>
                        </NuxtLink>
                    </nav>

                </div>
            </template>
        </USlideover>
    </div>
</template>