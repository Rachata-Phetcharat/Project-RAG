<script setup lang="ts">
const authStore = useAuthStore()
const route = useRoute()

const isMobileOpen = ref(false)

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
        <AppSlideover v-model:open="isMobileOpen" title="เมนู" />
    </div>
</template>