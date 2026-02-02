<script setup lang="ts">
const route = useRoute()
// ดึงค่าที่เราตั้งไว้ในหน้า Page
const layoutClass = computed(() => route.meta.layoutCustomClass || 'default-theme')
</script>

<template>
    <div>
        <nav
            class="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm">
            <div class="mx-auto px-6 lg:px-10">
                <div class="flex items-center justify-between py-4">

                    <!-- Logo Section with Enhanced Design -->
                    <NuxtLink to="/" class="group flex items-center gap-3 transition-all duration-300 hover:scale-105">
                        <!-- Logo Icon/Badge -->
                        <div class="relative">
                            <div
                                class="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity">
                            </div>
                            <div
                                class="relative p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                                <UIcon name="i-lucide-graduation-cap" class="w-6 h-6 text-white" />
                            </div>
                        </div>

                        <!-- Logo Text -->
                        <div class="flex flex-col">
                            <span
                                class="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                KmutnbLM
                            </span>
                            <span class="text-xs text-gray-500 dark:text-gray-400 font-medium -mt-1">
                                Learning Platform
                            </span>
                        </div>
                    </NuxtLink>


                    <!-- Right Section: User Menu & Actions -->
                    <div class="flex items-center gap-3">
                        <!-- User Menu -->
                        <UserMenu />
                    </div>
                </div>
            </div>
        </nav>

        <main :class="[
            'min-h-screen px-40 pt-10 transition-colors duration-500',
            layoutClass === 'admin-theme'
                ? ' bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-orange-950'
                : 'bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950'
        ]">
            <slot />
        </main>
    </div>
</template>

<style scoped>
/* Smooth backdrop blur support */
@supports (backdrop-filter: blur(20px)) {
    nav {
        backdrop-filter: blur(20px) saturate(180%);
    }
}
</style>