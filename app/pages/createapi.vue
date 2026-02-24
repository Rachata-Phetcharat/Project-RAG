<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const toast = useToast()
const { apiKeys, fetchApiKeys, revokeApiKey, loading } = useCreateApi()

const isCreateModalOpen = ref(false)
const searchQuery = ref('')

const isDeleteModalOpen = ref(false)
const deleteTarget = ref<{ id: number; name: string } | null>(null)

onMounted(async () => {
    await fetchApiKeys()
})

const filteredKeys = computed(() => {
    const list = apiKeys.value || []
    if (!searchQuery.value.trim()) return list
    const q = searchQuery.value.toLowerCase()
    return list.filter((k: any) =>
        k.name?.toLowerCase().includes(q) || k.channel_id?.toLowerCase().includes(q)
    )
})

interface ApiKeyRow {
    key_id: number
    name: string
    channel_id: string
    key_hint: string
    created_at: string
}

const columns: TableColumn<ApiKeyRow>[] = [
    {
        accessorKey: 'key_id',
        header: '#',
        cell: ({ row }) => `#${row.getValue('key_id')}`,
    },
    {
        accessorKey: 'name',
        header: 'ชื่อ Key',
    },
    {
        accessorKey: 'channel_id',
        header: 'Channel ID',
    },
    {
        accessorKey: 'key_hint',
        header: 'Key Hint',
        cell: ({ row }) => `${row.getValue('key_hint')}••••••••`,
    },
    {
        accessorKey: 'created_at',
        header: 'สร้างเมื่อ',
        cell: ({ row }) => new Date(row.getValue('created_at')).toLocaleString('th-TH'),
    },
    {
        id: 'actions',
        header: '',
    },
]

const openDeleteModal = (row: ApiKeyRow) => {
    deleteTarget.value = { id: row.key_id, name: row.name }
    isDeleteModalOpen.value = true
}

const handleRevoke = async (id: string | number) => {
    await revokeApiKey(id as number)
}

const onCreated = async () => {
    await fetchApiKeys()
}
</script>

<template>
    <!-- Header Section -->
    <div class="mb-8">
        <div class="flex items-center gap-3 mb-6">
            <div class="p-3 bg-linear-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                <UIcon name="i-lucide-key-round" class="w-7 h-7 text-white" />
            </div>
            <div>
                <h1
                    class="text-3xl md:text-4xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    API Keys
                </h1>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    จัดการ API Keys สำหรับแชนแนลสาธารณะของคุณ
                </p>
            </div>
        </div>

        <!-- Search & Action Bar -->
        <div class="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div class="flex-1 max-w-md">
                <div class="relative group">
                    <UIcon name="i-lucide-search"
                        class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input v-model="searchQuery" type="text" placeholder="ค้นหา API Key..."
                        class="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" />
                </div>
            </div>

            <UButton size="lg" label="สร้าง API Key" color="primary" @click="isCreateModalOpen = true">
                <template #leading>
                    <UIcon name="i-lucide-plus-circle" class="w-5 h-5" />
                </template>
            </UButton>
        </div>
    </div>

    <!-- Main Content -->
    <main>
        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center gap-6 px-4 text-center py-32">
            <div class="relative">
                <div class="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <div
                    class="relative p-6 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full">
                    <UIcon name="i-lucide-loader-circle" class="w-12 h-12 animate-spin text-blue-600" />
                </div>
            </div>
            <div>
                <p class="text-lg font-medium text-gray-700 dark:text-gray-300">กำลังโหลด API Keys...</p>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">กรุณารอสักครู่</p>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!(apiKeys?.length)" class="relative">
            <div
                class="absolute inset-0 bg-linear-to-r from-blue-600/5 to-indigo-600/5 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-3xl blur-2xl">
            </div>
            <div
                class="relative flex flex-col items-center justify-center gap-8 px-4 text-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm py-5 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <div class="relative">
                    <div
                        class="absolute inset-0 bg-linear-to-r from-blue-500 to-indigo-500 rounded-full blur-2xl opacity-20 animate-pulse">
                    </div>
                    <div
                        class="relative p-8 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full shadow-xl border border-blue-100 dark:border-blue-800">
                        <UIcon name="i-lucide-key-round" class="w-20 h-20 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>
                <div class="max-w-md">
                    <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-3">เริ่มต้นสร้าง API Key</h2>
                    <p class="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                        คุณยังไม่มี API Key ใดๆ เลย<br />
                        สร้าง Key แรกเพื่อเชื่อมต่อแอปพลิเคชันกับแชนแนลของคุณ
                    </p>
                </div>
                <UButton size="xl" label="สร้าง API Key แรก" color="primary"
                    class="shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all"
                    @click="isCreateModalOpen = true">
                    <template #leading>
                        <UIcon name="i-lucide-sparkles" class="w-5 h-5" />
                    </template>
                </UButton>
            </div>
        </div>

        <!-- มี key แล้ว -->
        <div v-else>
            <!-- ค้นหาแล้วไม่เจอ -->
            <div v-if="searchQuery && !filteredKeys.length" class="text-center py-20">
                <div class="inline-flex items-center justify-center p-6 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                    <UIcon name="i-lucide-search-x" class="w-12 h-12 text-gray-400" />
                </div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">ไม่พบ API Key ที่ค้นหา</h3>
                <p class="text-gray-500 dark:text-gray-400">ลองค้นหาด้วยคำอื่น</p>
            </div>

            <!-- Table -->
            <div v-else class="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <UTable :data="filteredKeys" :columns="columns" class="w-full">
                    <template #actions-cell="{ row }">
                        <div class="flex justify-end">
                            <UButton color="error" variant="ghost" size="sm" icon="i-lucide-trash-2"
                                class="cursor-pointer" @click="openDeleteModal(row.original)" />
                        </div>
                    </template>
                </UTable>
            </div>

            <!-- Summary -->
            <div class="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <UIcon name="i-lucide-info" class="w-4 h-4" />
                ทั้งหมด {{ filteredKeys.length }} key
            </div>
        </div>
    </main>

    <!-- Decorative Elements -->
    <div
        class="fixed top-20 right-20 w-72 h-72 bg-linear-to-br from-blue-400 to-indigo-400 rounded-full opacity-10 blur-3xl -z-10 pointer-events-none">
    </div>
    <div
        class="fixed bottom-20 left-20 w-96 h-96 bg-linear-to-br from-purple-400 to-pink-400 rounded-full opacity-10 blur-3xl -z-10 pointer-events-none">
    </div>

    <!-- Modals -->
    <ModalCreateApi v-model:open="isCreateModalOpen" @created="onCreated" />
    <ModalDelete v-model:open="isDeleteModalOpen"
        :item="deleteTarget ? { id: deleteTarget.id, name: deleteTarget.name } : null" title="คุณต้องการลบ API Key"
        description="การลบ API Key จะทำให้แอปพลิเคชันที่ใช้ Key นี้ไม่สามารถเข้าถึง API ได้อีก"
        :delete-handler="handleRevoke" />
</template>