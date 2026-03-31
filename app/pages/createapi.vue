<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
    middleware: 'auth'
})

const toast = useToast()
const { apiKeys, fetchApiKeys, revokeApiKey, refreshApiKeys, loading } = useCreateApi()
const UBadge = resolveComponent('UBadge')

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

// ========================================
// [Pagination] ตัวแปรสำหรับ Pagination
// ========================================
const currentPage = ref(1)
// ✏️ แก้ตรงนี้เพื่อเปลี่ยนจำนวนแถวที่แสดงต่อหน้า (ปัจจุบัน = 10)
const pageSize = ref(10)

// รีเซ็ตหน้า 1 เมื่อพิมพ์ค้นหา
watch(searchQuery, () => { currentPage.value = 1 })

// rows ที่แสดงในหน้านี้
const paginatedKeys = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredKeys.value.slice(start, start + pageSize.value)
})

// จำนวนหน้าทั้งหมด
const totalPages = computed(() => Math.ceil(filteredKeys.value.length / pageSize.value))

interface ApiKeyRow {
    key_id: number
    name: string
    channel_name: string
    channel_status: string
    key_hint: string
    created_at: string
}

const columns: TableColumn<ApiKeyRow>[] = [
    {
        accessorKey: 'name',
        header: 'ชื่อ Key',
    },
    {
        accessorKey: 'channel_name',
        header: 'ชื่อ Channel',
    },
    {
        accessorKey: 'key_hint',
        header: 'Key Hint',
    },
    {
        accessorKey: 'channel_status',
        header: 'สถานะ',
        cell: ({ row }) => {
            const colorMap = {
                public: 'success' as const,
                pending: 'warning' as const,
                private: 'error' as const,
            }
            const color = colorMap[row.getValue('channel_status') as keyof typeof colorMap]

            return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () =>
                row.getValue('channel_status')
            )
        }
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

const revealedId = ref<number | null>(null)

const copiedId = ref<string | null>(null)

const copyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    copiedId.value = id
    setTimeout(() => (copiedId.value = null), 2000)
    toast.add({ title: 'คัดลอกแล้ว!', icon: 'i-lucide-check-circle', color: 'success', duration: 1500 })
}

const refresh = async (key_id: number) => {
    const res = await refreshApiKeys(key_id) as any
    if (!res) return

    const index = apiKeys.value.findIndex((k: any) => k.key_id === key_id)
    if (index !== -1) {
        apiKeys.value[index] = {
            ...apiKeys.value[index],
            key_hint: res.key_secret
        }
    }

    revealedId.value = key_id
    toast.add({ title: 'รีเฟรชข้อมูลแล้ว', icon: 'i-lucide-refresh-ccw', color: 'success', duration: 1500 })
}

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
            <div class="relative p-3 bg-blue-500 dark:bg-blue-500 rounded-xl">
                <UIcon name="i-lucide-key-round" class="w-6 h-6 text-white dark:text-white" />
            </div>
            <div>
                <h1 class="text-3xl font-semibold text-gray-900 dark:text-white">
                    API Keys ของฉัน
                </h1>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    จัดการ API Keys สำหรับแชนแนลสาธารณะของคุณ
                </p>
            </div>
        </div>

        <!-- Search & Action Bar -->
        <div class="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div class="flex items-center gap-4">
                <div class="flex-1 max-w-md">
                    <div class="relative group">
                        <UIcon name="i-lucide-search"
                            class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input v-model="searchQuery" type="text" placeholder="ค้นหา API Key..."
                            class="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" />
                    </div>
                </div>
                <!-- จำนวนรายการที่พบ -->
                <p class="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    พบ <span class="font-semibold text-blue-600 dark:text-blue-400">{{ filteredKeys.length }}</span>
                    รายการ
                </p>
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
                <UButton size="xl" label="สร้าง API Key แรก" color="primary" class=" "
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
            <div v-if="searchQuery && !filteredKeys.length" class="text-center py-12 sm:py-20">
                <div
                    class="inline-flex items-center justify-center p-5 sm:p-6 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                    <UIcon name="i-lucide-search-x" class="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                </div>
                <h3 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">ไม่พบ API Key ที่ค้นหา
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">ลองค้นหาด้วยคำอื่น</p>
                <UButton @click="searchQuery = ''"
                    class="mt-4 px-4 py-2 text-md bg-blue-100 dark:bg-blue-400 text-blue-700 dark:text-gray-900 rounded-lg cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-500 transition-colors">
                    ล้างการค้นหา
                </UButton>
            </div>

            <!-- Table -->
            <div v-else
                class="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm bg-white dark:bg-gray-900">

                <!-- [RESPONSIVE] Desktop Table — ซ่อนบน mobile -->
                <div class="hidden sm:block overflow-x-auto">
                    <UTable :data="paginatedKeys" :columns="columns" class="w-full">
                        <template #key_hint-cell="{ row }">
                            <div class="flex items-center gap-2">
                                <span class="font-mono text-xs text-gray-700 dark:text-gray-300">
                                    {{ revealedId === row.original.key_id ? row.original.key_hint :
                                        '••••••••••••••••••••••••••••••••••••' }}
                                </span>
                                <button v-if="row.original.channel_status === 'public'"
                                    @click="revealedId = revealedId === row.original.key_id ? null : row.original.key_id"
                                    class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <UIcon
                                        :name="revealedId === row.original.key_id ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                                        class="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                                </button>
                            </div>
                        </template>
                        <template #actions-cell="{ row }">
                            <div class="flex justify-end gap-1">
                                <UButton v-if="row.original.channel_status === 'public'"
                                    :color="copiedId === `kh-${row.original.key_id}` ? 'success' : 'neutral'"
                                    variant="ghost" size="sm"
                                    :icon="copiedId === `kh-${row.original.key_id}` ? 'i-lucide-check' : 'i-lucide-copy'"
                                    @click="copyText(row.original.key_hint, `kh-${row.original.key_id}`)" />
                                <UButton v-if="row.original.channel_status === 'public'" color="neutral" variant="ghost"
                                    size="sm" icon="i-lucide-rotate-ccw" @click="refresh(row.original.key_id)" />
                                <UButton color="error" variant="ghost" size="sm" icon="i-lucide-trash-2"
                                    @click="openDeleteModal(row.original)" />
                            </div>
                        </template>
                    </UTable>
                </div>

                <!-- [RESPONSIVE] Mobile Card List — แสดงเฉพาะบน mobile แทน table -->
                <div class="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
                    <div v-for="row in paginatedKeys" :key="row.key_id" class="p-4 space-y-3">
                        <!-- ชื่อ Key + สถานะ -->
                        <div class="flex items-start justify-between gap-2">
                            <div class="min-w-0">
                                <p class="font-semibold text-gray-900 dark:text-white text-sm truncate">{{ row.name }}
                                </p>
                                <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{{ row.channel_name
                                    }}
                                </p>
                            </div>
                            <UBadge
                                :color="({ public: 'success', pending: 'warning', private: 'error' })[row.channel_status as string] ?? 'neutral'"
                                variant="subtle" class="capitalize shrink-0 text-xs">
                                {{ row.channel_status }}
                            </UBadge>
                        </div>

                        <!-- Key Hint -->
                        <div class="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                            <span class="font-mono text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">
                                {{ revealedId === row.key_id ? row.key_hint : '••••••••••••••••••••••••' }}
                            </span>
                            <button v-if="row.channel_status === 'public'"
                                @click="revealedId = revealedId === row.key_id ? null : row.key_id"
                                class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0">
                                <UIcon :name="revealedId === row.key_id ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                                    class="w-3.5 h-3.5 text-gray-400" />
                            </button>
                        </div>

                        <!-- วันที่ + Actions -->
                        <div class="flex items-center justify-between">
                            <span class="text-xs text-gray-400 dark:text-gray-500">
                                {{ new Date(row.created_at).toLocaleString('th-TH') }}
                            </span>
                            <div class="flex items-center gap-1">
                                <UButton v-if="row.channel_status === 'public'"
                                    :color="copiedId === `kh-${row.key_id}` ? 'success' : 'neutral'" variant="ghost"
                                    size="xs"
                                    :icon="copiedId === `kh-${row.key_id}` ? 'i-lucide-check' : 'i-lucide-copy'"
                                    @click="copyText(row.key_hint, `kh-${row.key_id}`)" />
                                <UButton v-if="row.channel_status === 'public'" color="neutral" variant="ghost"
                                    size="xs" icon="i-lucide-rotate-ccw" @click="refresh(row.key_id)" />
                                <UButton color="error" variant="ghost" size="xs" icon="i-lucide-trash-2"
                                    @click="openDeleteModal(row)" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Pagination -->
                <div v-if="totalPages > 1"
                    class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                    <UPagination v-model:page="currentPage" :total="filteredKeys.length" :items-per-page="pageSize" />
                </div>
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