<script setup lang="ts">
</script>

<template>
    <!-- ให้ layout สูงเต็มหน้าจอพอดี ไม่เกิน viewport -->
    <div class="flex flex-col h-screen overflow-hidden bg-white dark:bg-neutral-900">
        <UToaster />

        <!-- Nav: 30% surface -->
        <nav
            class="sticky top-0 z-50 shrink-0 bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
            <div class="mx-auto px-6 lg:px-10">
                <div class="flex items-center justify-between py-4">

                    <!-- Logo -->
                    <NuxtLink to="/" class="flex items-center gap-3 transition-opacity duration-200 hover:opacity-70">
                        <img src="/logo.png" alt="Logo" class="h-10 w-10 object-scale-down" />
                        <span class="text-2xl font-bold text-gray-900 dark:text-white">
                            KMUTNB ThinkHub
                        </span>
                    </NuxtLink>

                    <!-- Right Section -->
                    <div class="flex items-center gap-3">
                        <UserMenu />
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main: 60% background -->
        <main class="flex-1 overflow-y-auto bg-white dark:bg-neutral-900 transition-colors duration-300">
            <slot />
        </main>
    </div>
</template>