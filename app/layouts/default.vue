<script setup lang="ts">
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const isMobileOpen = ref(false)

// รายการเมนู (mirror จาก UserMenu)
const menuItems = computed(() => [
    { label: 'หน้าหลัก', icon: 'i-lucide-house', to: '/' },
    { label: 'สร้างแชนแนลใหม่', icon: 'i-lucide-book-plus', to: '/channel' },
    { label: 'สร้าง Key API', icon: 'i-lucide-key-round', to: '/createapi' },
    { label: 'ภาพรวม', icon: 'i-lucide-layout-list', to: '/overview' },
    ...(authStore.role === 'admin'
        ? [{ label: 'Dashboard', icon: 'i-lucide-gauge', to: '/admin/dashboard/home' }]
        : [])
])

const handleLogout = async () => {
    isMobileOpen.value = false
    await authStore.logout()
}

// ปิด slideover เมื่อเปลี่ยนหน้า
watch(() => route.path, () => { isMobileOpen.value = false })
</script>

<template>
    <div class="flex flex-col min-h-screen bg-white dark:bg-neutral-900">
        <UToaster />

        <!-- ── Navbar ── -->
        <nav class="sticky top-0 z-50 bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
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
                    <div v-if="authStore.isLoggedIn" class="flex items-center gap-2 sm:gap-3 shrink-0">
                        <UserMenu compact="Default" class="hidden lg:flex" />
                        <UButton icon="i-lucide-menu" color="neutral" variant="ghost" size="md" class="lg:hidden"
                            aria-label="เปิดเมนู" @click="isMobileOpen = true" />
                    </div>
                    <div v-else class="flex items-center gap-2 sm:gap-3 shrink-0">
                        <ButtomLogin />
                    </div>
                </div>
            </div>
        </nav>

        <!-- ── Main ── -->
        <main
            class="flex-1 px-4 sm:px-6 lg:px-16 xl:px-40 pt-6 sm:pt-10 pb-6 sm:pb-10 bg-white dark:bg-neutral-900 transition-colors duration-300">
            <slot />
        </main>

        <!-- ── Mobile Slideover ── -->
        <USlideover v-model:open="isMobileOpen" side="right" :ui="{ content: 'max-w-[270px] w-full' }">
            <template #content>
                <div class="flex flex-col h-full bg-white dark:bg-neutral-800">

                    <!-- Header -->
                    <div
                        class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-neutral-700">
                        <h2 class="font-bold text-gray-800 dark:text-gray-100">เมนู</h2>
                        <div class="flex items-center gap-2">
                            <UColorModeButton class="cursor-pointer" />
                            <UButton icon="i-heroicons-x-mark" color="neutral" variant="ghost" size="sm"
                                @click="isMobileOpen = false" />
                        </div>
                    </div>

                    <!-- User Profile (ถ้า login แล้ว) -->
                    <div v-if="authStore.isLoggedIn"
                        class="flex items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-neutral-700">
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

                    <!-- ถ้ายังไม่ได้ login -->
                    <div v-else class="px-4 py-4 border-b border-gray-100 dark:border-neutral-700">
                        <ButtomLogin />
                    </div>

                    <!-- Nav Menu -->
                    <nav class="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                        <NuxtLink v-for="item in menuItems" :key="item.to" :to="item.to" :class="[
                            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                            route.path === item.to
                                ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        ]">
                            <UIcon :name="item.icon"
                                :class="['w-5 h-5 shrink-0', route.path === item.to
                                    ? 'text-gray-900 dark:text-white'
                                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200']" />
                            <span class="font-medium text-sm">{{ item.label }}</span>
                        </NuxtLink>
                    </nav>

                    <!-- Logout (ถ้า login แล้ว) -->
                    <div v-if="authStore.isLoggedIn"
                        class="px-3 pb-6 pt-2 border-t border-gray-100 dark:border-neutral-700">
                        <button
                            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            @click="handleLogout">
                            <UIcon name="i-lucide-log-out" class="w-5 h-5 shrink-0" />
                            <span class="font-medium text-sm">ออกจากระบบ</span>
                        </button>
                    </div>

                </div>
            </template>
        </USlideover>
    </div>
</template>