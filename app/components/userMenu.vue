<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import ButtomLogin from './ButtomLogin.vue';

const authStore = useAuthStore()

const isLogoutOpen = ref(false)
const open = defineModel<boolean>('open')

// compact = true → ใช้ใน Slideover header (ไม่มี padding, ไม่มี UUser label)
// compact = false (default) → ใช้ใน main header ปกติ
const props = defineProps<{
    compact?: string
}>()

const handleLogout = async () => {
    await authStore.logout()
}

const openLogoutModal = () => {
    open.value = false
    isLogoutOpen.value = true
}

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
            label: 'สถิติการใช้งาน',
            icon: 'i-lucide-bar-chart-3',
            to: '/admin/dashboard/home'
        }, {
            label: 'จัดการผู้ใช้งาน',
            icon: 'i-lucide-users',
            to: '/admin/dashboard/manage_users'
        }, {
            label: 'คำขอแชนแนล',
            icon: 'i-lucide-clipboard-list',
            to: '/admin/dashboard/pending'
        }, {
            label: 'แชนแนลทั้งหมด',
            icon: 'i-lucide-tv-2',
            to: '/admin/dashboard/all_channel'
        }]]
        : []
    ),
    [
        {
            label: 'ออกจากระบบ',
            icon: 'i-lucide-log-out',
            class: 'text-red-500 dark:text-red-400 cursor-pointer hover:bg-red-100/50 dark:hover:bg-red-900/50',
            onSelect: async () => {
                await openLogoutModal()
            }
        }
    ]
])
</script>

<template>
    <!-- ── Normal mode (header หลัก) ── -->
    <div v-if="compact === 'Default'" class="flex items-center gap-4 p-4">

        <!-- Notification -->
        <!-- <Notifications v-if="authStore.isLoggedIn" /> -->

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
        <!-- <Notifications v-if="authStore.isLoggedIn" /> -->

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

    <ModalLogout v-model:open="isLogoutOpen" @confirmed="handleLogout" />
</template>