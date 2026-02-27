<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
const { fetchAllChannels, loading } = useChannel()
const authStore = useAuthStore()
const toast = useToast()

definePageMeta({
    middleware: ['auth', 'admin'],
    layout: 'dashboard-layout'
})

const channels = ref<any[]>([])
const errorMsg = ref('')
const searchQuery = ref('')

const loadChannels = async () => {
    errorMsg.value = ''
    try {
        if (authStore.role !== 'admin') {
            toast.add({ title: 'ไม่มีสิทธิ์', color: 'error' })
            return
        }

        const response = await fetchAllChannels()

        if (Array.isArray(response)) {
            channels.value = response
        } else if ((response as any)?.channels) {
            channels.value = (response as any).channels
        } else if ((response as any)?.data) {
            channels.value = (response as any).data
        } else {
            channels.value = []
        }
    } catch (e: any) {
        errorMsg.value = e.data?.message || 'โหลดข้อมูลแชนแนลไม่สำเร็จ'
    }
}

const filteredChannels = computed(() => {
    let result = channels.value
    if (searchQuery.value) {
        result = result.filter(ch =>
            ch.title?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            ch.description?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            ch.created_by_name?.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
    }
    return result
})

onMounted(() => {
    loadChannels()
})
</script>

<template>
    <div class="flex">
        <AdminSidebar />

        <main class="flex-1 p-6 md:p-8 overflow-auto mx-auto w-full">
            <!-- Header Section -->
            <div class="mb-8">
                <div class="flex items-center gap-3 mb-6">
                    <div class="relative">
                        <div
                            class="absolute inset-0 bg-linear-to-r from-indigo-500 to-purple-500 rounded-xl blur-lg opacity-50">
                        </div>
                        <div class="relative p-3 bg-linear-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                            <UIcon name="i-lucide-layout-grid" class="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <div>
                        <h1
                            class="text-3xl md:text-4xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                            แชนแนลทั้งหมด
                        </h1>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            ดูและจัดการแชนแนลทั้งหมดในระบบ
                        </p>
                    </div>
                </div>

                <!-- Search Bar -->
                <div class="flex-1 max-w-md">
                    <div class="relative group">
                        <UIcon name="i-lucide-search"
                            class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input v-model="searchQuery" type="text" placeholder="ค้นหาแชนแนล ผู้สร้าง หรือคำอธิบาย..."
                            class="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none" />
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <main>
                <!-- Loading State -->
                <div v-if="loading" class="flex flex-col items-center justify-center gap-6 px-4 text-center py-32">
                    <div class="relative">
                        <div class="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse">
                        </div>
                        <div
                            class="relative p-6 bg-linear-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full">
                            <UIcon name="i-lucide-loader-circle" class="w-12 h-12 animate-spin text-indigo-600" />
                        </div>
                    </div>
                    <div>
                        <p class="text-lg font-medium text-gray-700 dark:text-gray-300">กำลังโหลดข้อมูลแชนแนล...</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">กรุณารอสักครู่</p>
                    </div>
                </div>

                <!-- No Search Results -->
                <div v-else-if="searchQuery && !filteredChannels.length" class="text-center py-20">
                    <div
                        class="inline-flex items-center justify-center p-6 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                        <UIcon name="i-lucide-search-x" class="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        ไม่พบแชนแนลที่ค้นหา
                    </h3>
                    <p class="text-gray-500 dark:text-gray-400">
                        ลองค้นหาด้วยคำอื่น
                    </p>
                    <button @click="searchQuery = ''"
                        class="mt-4 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors">
                        ล้างการค้นหา
                    </button>
                </div>

                <!-- Channels Grid -->
                <div v-else>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <div v-for="ch in filteredChannels" :key="ch.channels_id">
                            <ChannelCard :item="{
                                channels_id: ch.channels_id,
                                title: ch.title,
                                description: ch.description,
                                status: ch.status,
                                created_by_name: ch.created_by_name,
                                created_by_id: ch.created_by_id,
                                created_at: ch.created_at,
                                file_count: ch.file_count
                            }" @load="loadChannels" />
                        </div>
                    </div>
                </div>
            </main>

            <!-- Error Message -->
            <div v-if="errorMsg" class="fixed bottom-6 right-6 max-w-md z-50">
                <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg shadow-xl">
                    <div class="flex items-start gap-3">
                        <UIcon name="i-lucide-alert-circle" class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p class="font-medium text-red-800 dark:text-red-200">เกิดข้อผิดพลาด</p>
                            <p class="text-sm text-red-700 dark:text-red-300 mt-1">{{ errorMsg }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Decorative Elements -->
    <div
        class="fixed top-20 right-20 w-72 h-72 bg-linear-to-br from-indigo-400 to-purple-400 rounded-full opacity-10 blur-3xl -z-10 pointer-events-none">
    </div>
    <div
        class="fixed bottom-20 left-20 w-96 h-96 bg-linear-to-br from-purple-400 to-pink-400 rounded-full opacity-10 blur-3xl -z-10 pointer-events-none">
    </div>
</template>