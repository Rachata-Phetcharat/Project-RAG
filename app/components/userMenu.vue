<script setup lang="ts">
import { useAuthStore } from '~/stores/auth' // เรียกใช้ Store
import ButtomLogin from './ButtomLogin.vue';

const authStore = useAuthStore()

const items = computed(() => [
    [
        {
            label: 'หน้าหลัก',
            icon: 'i-lucide-house',
            to: '/'
        },
        {
            label: 'สร้างแชนแนลใหม่',
            icon: 'i-lucide-book-plus',
            to: '/channel'
        }
    ],
    ...(authStore.role === 'admin'
        ? [[{
            label: 'คำขอ',
            icon: 'i-lucide-clipboard-list',
            to: '/admin/pending'
        }, {
            label: 'dashboard',
            icon: 'i-lucide-gauge',
            to: '/admin/dashboard/home'
        }]]
        : []
    ),
    [
        {
            label: 'ออกจากระบบ',
            icon: 'i-lucide-log-out',
            class: 'text-red-500 dark:text-red-400 cursor-pointer hover:bg-red-100/50 dark:hover:bg-red-900/50',
            onSelect: async () => {
                await authStore.logout()
            }
        }
    ]
])
</script>

<template>
    <div class="flex items-center gap-4 p-4">

        <!-- Notification Section (เหมือนเดิม) -->
        <UPopover v-if="authStore.isLoggedIn" arrow :popper="{ placement: 'bottom-end' }">
            <UChip text="5" color="error" size="3xl" inset>
                <UButton class="cursor-pointer" icon="i-lucide-bell" color="neutral" variant="ghost" />
            </UChip>

            <template #content>
                <div
                    class="flex flex-col w-80 sm:w-96 bg-white dark:bg-gray-900 overflow-hidden rounded-lg shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
                    <div
                        class="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                        <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
                        <span class="text-xs text-gray-500 cursor-pointer hover:text-primary">Clear all</span>
                    </div>
                    <div class="flex flex-col">
                        <UEmpty icon="i-lucide-bell-off" title="No notifications" description="You're all caught up!"
                            class="py-8" />
                    </div>
                </div>
            </template>
        </UPopover>

        <!-- Theme Switcher -->
        <UColorModeButton class="cursor-pointer" />

        <!-- Auth Logic -->
        <ButtomLogin v-if="!authStore.isLoggedIn" />

        <UDropdownMenu v-else :items="items" :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
            :ui="{ content: 'w-48' }">
            <UUser :name="authStore.displayName" :description="authStore.role"
                :avatar="{ src: `https://ui-avatars.com/api/?name=${authStore.displayName}&background=random` }" chip
                size="sm" class="cursor-pointer transition-opacity hover:opacity-80 text-left" />
        </UDropdownMenu>

    </div>
</template>