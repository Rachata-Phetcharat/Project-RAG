<script setup lang="ts">
const authStore = useAuthStore()
const route = useRoute()

const isMobileOpen = ref(false)
const authReady = ref(false)
onMounted(() => { authReady.value = true })

watch(() => route.path, () => { isMobileOpen.value = false })
</script>

<template>
    <div class="flex flex-col min-h-screen bg-white dark:bg-neutral-900">
        <UToaster />

        <!-- ── Navbar ── -->
        <nav
            class="sticky top-0 z-50 shrink-0 bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
            <div class="mx-auto px-4 sm:px-6 lg:px-10">
                <div class="flex items-center justify-between py-3 sm:py-4">

                    <!-- Logo -->
                    <template v-if="!authReady">
                        <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                            <USkeleton class="h-8 w-8 sm:h-10 sm:w-10 rounded-lg shrink-0" />
                            <USkeleton class="h-6 w-36 sm:w-48 rounded" />
                        </div>
                    </template>
                    <NuxtLink v-else to="/"
                        class="flex items-center gap-2 sm:gap-3 transition-opacity duration-200 hover:opacity-70 min-w-0">
                        <img src="/logo.png" alt="Logo" class="h-8 w-8 sm:h-10 sm:w-10 object-scale-down shrink-0" />
                        <span class="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                            KMUTNB ThinkHub
                        </span>
                    </NuxtLink>

                    <!-- Right -->
                    <div v-if="!authReady" class="flex items-center gap-2 sm:gap-3 shrink-0">
                        <USkeleton class="h-8 w-8 rounded-full" />
                        <div class="hidden lg:flex flex-col gap-1">
                            <USkeleton class="h-3 w-24 rounded" />
                            <USkeleton class="h-3 w-16 rounded" />
                        </div>
                        <USkeleton class="h-4 w-4 rounded hidden lg:block" />
                    </div>
                    <div v-else class="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div class="hidden lg:flex">
                            <UserMenu compact="Default" class="hidden lg:flex" />
                        </div>
                        <UButton icon="i-lucide-menu" color="neutral" variant="ghost" size="md" class="lg:hidden"
                            aria-label="เปิดเมนู" @click="isMobileOpen = true" />
                    </div>

                </div>
            </div>
        </nav>

        <!-- ── Main ── -->
        <main class="flex bg-white dark:bg-neutral-900 transition-colors duration-300">
            <AdminSidebar />
            <slot />
        </main>

        <!-- ── Mobile Slideover ── -->
        <AppSlideover v-model:open="isMobileOpen" title="Admin Panel" />
    </div>
</template>