<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
const { fetchPendingChannels, loading } = useChannel()

definePageMeta({
    middleware: ['auth', 'admin'],
    layout: 'dashboard-layout'
})

const channels = ref<any[]>([])
const errorMsg = ref('')
const searchQuery = ref('')
const filterStatus = ref('all') // all, today, week, month

const loadChannels = async () => {
    errorMsg.value = ''
    try {
        const data = await fetchPendingChannels()
        channels.value = Array.isArray(data) ? data : []
    } catch (e) {
        errorMsg.value = 'โหลดข้อมูลแชนแนลไม่สำเร็จ'
    }
}

const filteredChannels = computed(() => {
    let result = channels.value

    // Search filter
    if (searchQuery.value) {
        result = result.filter(ch =>
            ch.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            ch.description?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            ch.created_by_name?.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
    }

    // Time filter
    // if (filterStatus.value !== 'all') {
    //     const now = new Date()
    //     result = result.filter(ch => {
    //         const createdDate = new Date(ch.created_at)
    //         const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

    //         switch (filterStatus.value) {
    //             case 'today':
    //                 return diffDays === 0
    //             case 'week':
    //                 return diffDays <= 7
    //             case 'month':
    //                 return diffDays <= 30
    //             default:
    //                 return true
    //         }
    //     })
    // }

    return result
})

const stats = computed(() => {
    const now = new Date()
    const today = channels.value.filter(ch => {
        const createdDate = new Date(ch.created_at)
        const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
        return diffDays === 0
    }).length

    const week = channels.value.filter(ch => {
        const createdDate = new Date(ch.created_at)
        const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
        return diffDays <= 7
    }).length

    return {
        total: channels.value.length,
        today,
        week
    }
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
                <!-- Admin Badge & Title -->
                <div class="flex items-center gap-3 mb-6">
                    <div class="relative">
                        <div
                            class="absolute inset-0 bg-linear-to-r from-amber-500 to-orange-500 rounded-xl blur-lg opacity-50">
                        </div>
                        <div class="relative p-3 bg-linear-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg">
                            <UIcon name="i-lucide-shield-alert" class="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <h1
                                class="text-3xl md:text-4xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                คำขอแชนแนลรอดำเนินการ
                            </h1>
                        </div>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            ตรวจสอบและอนุมัติคำขอแชนแนลสาธารณะ
                        </p>
                    </div>
                </div>

                <!-- Search & Filter Bar -->
                <div class="flex flex-col sm:flex-row gap-4">
                    <!-- Search -->
                    <div class="flex-1 max-w-md">
                        <div class="relative group">
                            <UIcon name="i-lucide-search"
                                class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                            <input v-model="searchQuery" type="text" placeholder="ค้นหาแชนแนล ผู้สร้าง หรือคำอธิบาย..."
                                class="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <main>
                <!-- Loading State -->
                <div v-if="loading" class="flex flex-col items-center justify-center gap-6 px-4 text-center py-32">
                    <div class="relative">
                        <div class="absolute inset-0 bg-amber-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                        <div
                            class="relative p-6 bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-full">
                            <UIcon name="i-lucide-loader-circle" class="w-12 h-12 animate-spin text-amber-600" />
                        </div>
                    </div>
                    <div>
                        <p class="text-lg font-medium text-gray-700 dark:text-gray-300">กำลังโหลดคำขอแชนแนล...</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">กรุณารอสักครู่</p>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-else-if="!channels.length" class="relative">
                    <div
                        class="absolute inset-0 bg-linear-to-r from-amber-600/5 to-orange-600/5 dark:from-amber-500/10 dark:to-orange-500/10 rounded-3xl blur-2xl">
                    </div>
                    <div
                        class="relative flex flex-col items-center justify-center gap-8 px-4 text-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm py-5 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <div class="relative">
                            <div
                                class="absolute inset-0 bg-linear-to-r from-amber-500 to-orange-500 rounded-full blur-2xl opacity-20 animate-pulse">
                            </div>
                            <div
                                class="relative p-8 bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-full shadow-xl border border-amber-100 dark:border-amber-800">
                                <UIcon name="i-lucide-inbox" class="w-20 h-20 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>

                        <div class="max-w-md">
                            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                                ไม่มีคำขอในขณะนี้
                            </h2>
                            <p class="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                                ยังไม่มีคำขอแชนแนลสาธารณะที่รอการอนุมัติ<br />
                                เมื่อมีคำขอเข้ามาจะแสดงที่นี่
                            </p>
                        </div>

                        <div class="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                            <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-green-600 dark:text-green-400" />
                            <span
                                class="text-sm font-medium text-green-700 dark:text-green-300">ทุกอย่างเรียบร้อย</span>
                        </div>
                    </div>
                </div>

                <!-- No Search Results -->
                <div v-else-if="searchQuery && !filteredChannels.length" class="text-center py-20">
                    <div
                        class="inline-flex items-center justify-center p-6 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                        <UIcon name="i-lucide-search-x" class="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        ไม่พบคำขอที่ค้นหา
                    </h3>
                    <p class="text-gray-500 dark:text-gray-400">
                        ลองค้นหาด้วยคำอื่นหรือเปลี่ยนตัวกรอง
                    </p>
                    <button @click="searchQuery = ''"
                        class="mt-4 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors">
                        ล้างการค้นหา
                    </button>
                </div>

                <!-- Channels Grid -->
                <div v-else>
                    <div class="mb-4 flex items-center justify-between">
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            แสดง <span class="font-semibold text-amber-600 dark:text-amber-400">{{
                                filteredChannels.length }}</span> จาก {{ channels.length }} คำขอ
                        </p>
                    </div>

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
        class="fixed top-20 right-20 w-72 h-72 bg-linear-to-br from-amber-400 to-orange-400 rounded-full opacity-10 blur-3xl -z-10 pointer-events-none">
    </div>
    <div
        class="fixed bottom-20 left-20 w-96 h-96 bg-linear-to-br from-orange-400 to-red-400 rounded-full opacity-10 blur-3xl -z-10 pointer-events-none">
    </div>
</template>
