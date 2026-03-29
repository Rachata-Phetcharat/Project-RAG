<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import ButtomLogin from './ButtomLogin.vue';

const authStore = useAuthStore()

// compact = true → ใช้ใน Slideover header (ไม่มี padding, ไม่มี UUser label)
// compact = false (default) → ใช้ใน main header ปกติ
const props = defineProps<{
    compact?: string
}>()

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
        },
        {
            label: 'สร้าง Key API',
            icon: 'i-lucide-key-round',
            to: '/createapi'
        },
        {
            label: 'ภาพรวม',
            icon: 'i-lucide-layout-list',
            to: '/overview'
        }
    ],
    ...(authStore.role === 'admin'
        ? [[{
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
    <!-- ── Normal mode (header หลัก) ── -->
    <div v-if="compact === 'Default'" class="flex items-center gap-4 p-4">

        <!-- Notification -->
        <UPopover v-if="authStore.isLoggedIn" arrow :popper="{ placement: 'bottom-end' }">
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

        <UColorModeButton class="cursor-pointer" />

        <!-- Auth -->
        <ButtomLogin v-if="!authStore.isLoggedIn" />

        <UDropdownMenu v-else :items="items" :content="{ align: 'center', side: 'bottom', sideOffset: 8 }"
            :ui="{ content: 'w-48' }">
            <div class="flex gap-1 items-center justify-between">
                <UUser :name="authStore.displayName"
                    :description="authStore.role === 'admin' ? `${authStore.accountType} ( ${authStore.role} )` : `${authStore.accountType}`"
                    :avatar="{ src: `https://ui-avatars.com/api/?name=${authStore.displayName}&background=random` }"
                    chip size="sm" class="cursor-pointer transition-opacity hover:opacity-80 text-left" />
                <UIcon name="i-lucide-chevrons-up-down"
                    class="w-5 h-5 shrink-0 text-gray-500 dark:text-gray-400 cursor-pointer" />
            </div>
        </UDropdownMenu>
    </div>

    <div v-else-if="compact === 'Mobile'" class=" items-center p-4">

        <!-- Notification -->
        <UPopover v-if="authStore.isLoggedIn" arrow :popper="{ placement: 'bottom-end' }">
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

        <!-- Auth -->
        <ButtomLogin v-if="!authStore.isLoggedIn" />

        <UDropdownMenu v-else :items="items" size="xl" :content="{ align: 'center', side: 'bottom', sideOffset: 8 }"
            :ui="{ content: 'w-48' }">
            <div class="flex items-center justify-between">
                <UUser :name="authStore.displayName"
                    :description="authStore.role === 'admin' ? `${authStore.accountType} ( ${authStore.role} )` : `${authStore.accountType}`"
                    :avatar="{ src: `https://ui-avatars.com/api/?name=${authStore.displayName}&background=random` }"
                    chip size="lg" class="cursor-pointer transition-opacity hover:opacity-80 text-left" />
                <UIcon name="i-lucide-chevrons-up-down" class="w-5 h-5 shrink-0 text-gray-500 dark:text-gray-400" />
            </div>
        </UDropdownMenu>
    </div>

    <!-- ── Compact mode (ใน Slideover header) ── -->
    <!-- แสดงแค่ avatar + dropdown เท่านั้น ไม่มี padding รก -->
    <div v-else class="flex items-center gap-2">

        <!-- Theme Switcher -->
        <UColorModeButton class="cursor-pointer" />

        <!-- Auth -->
        <ButtomLogin v-if="!authStore.isLoggedIn" />

        <UDropdownMenu v-else :items="items" :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
            :ui="{ content: 'w-48' }">
            <!-- compact: แสดง avatar อย่างเดียว ไม่แสดงชื่อ/role -->
            <UAvatar :src="`https://ui-avatars.com/api/?name=${authStore.displayName}&background=random`"
                :alt="authStore.displayName" size="sm" chip
                class="cursor-pointer transition-opacity hover:opacity-80" />
        </UDropdownMenu>
    </div>
</template>