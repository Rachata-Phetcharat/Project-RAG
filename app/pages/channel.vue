<script setup lang="ts">
import { ref, onMounted } from 'vue'
const { fetchMyChannels, createChannel, updateChannel, loading } = useChannel()

definePageMeta({
    middleware: 'auth'
})

const isCreateModalOpen = ref(false)
const channels = ref<any[]>([])
const errorMsg = ref('')
const searchQuery = ref('')

const loadChannels = async () => {
    errorMsg.value = ''
    try {
        const data = await fetchMyChannels()
        channels.value = Array.isArray(data) ? data : []
    } catch (e) {
        errorMsg.value = 'โหลดข้อมูลแชนแนลไม่สำเร็จ'
    }
}

const handleCreate = async (data: { title: string; description: string }) => {
    const id = await createChannel(data)
    await loadChannels()
    // navigateTo(`/channels/${id}`)
}

const handleEdit = async (id: number, data: { title: string; description: string }) => {
    await updateChannel(id, data)
    await loadChannels()
}

const filteredChannels = computed(() => {
    if (!searchQuery.value) return channels.value
    return channels.value.filter(ch =>
        ch.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        ch.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
})

onMounted(() => {
    loadChannels()
})
</script>

<template>

    <!-- Header Section -->
    <div class="mb-8">
        <div class="flex items-center gap-3 mb-6">
            <div class="p-3 bg-linear-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                <UIcon name="i-lucide-layout-grid" class="w-7 h-7 text-white" />
            </div>
            <div>
                <h1
                    class="text-3xl md:text-4xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    แชนแนลของฉัน
                </h1>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    จัดการและสร้างแชนแนลเพื่อแบ่งปันความรู้
                </p>
            </div>
        </div>

        <!-- Search & Action Bar -->
        <div class="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div class="flex-1 max-w-md">
                <div class="relative group">
                    <UIcon name="i-lucide-search"
                        class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input v-model="searchQuery" type="text" placeholder="ค้นหาแชนแนล..."
                        class="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" />
                </div>
            </div>

            <UButton size="lg" label="สร้างแชนแนลใหม่" color="primary" @click="isCreateModalOpen = true">
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
                <p class="text-lg font-medium text-gray-700 dark:text-gray-300">กำลังโหลดแชนแนล...</p>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">กรุณารอสักครู่</p>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!channels.length" class="relative">
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
                        <UIcon name="i-lucide-folder-plus" class="w-20 h-20 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>

                <div class="max-w-md">
                    <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                        เริ่มต้นการสร้างแชนแนล
                    </h2>
                    <p class="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                        คุณยังไม่มีแชนแนลใดๆ เลย<br />
                        สร้างแชนแนลแรกของคุณเพื่อเริ่มแบ่งปันความรู้และประสบการณ์
                    </p>
                </div>

                <UButton size="xl" label="สร้างแชนแนลแรกของคุณ" color="primary"
                    class="shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all"
                    @click="isCreateModalOpen = true">
                    <template #leading>
                        <UIcon name="i-lucide-sparkles" class="w-5 h-5" />
                    </template>
                </UButton>
            </div>
        </div>

        <!-- Channels Grid -->
        <div v-else>
            <!-- No Search Results -->
            <div v-if="searchQuery && !filteredChannels.length" class="text-center py-20">
                <div class="inline-flex items-center justify-center p-6 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                    <UIcon name="i-lucide-search-x" class="w-12 h-12 text-gray-400" />
                </div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    ไม่พบแชนแนลที่ค้นหา
                </h3>
                <p class="text-gray-500 dark:text-gray-400">
                    ลองค้นหาด้วยคำอื่นหรือสร้างแชนแนลใหม่
                </p>
            </div>

            <!-- Grid -->
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <!-- Create New Card -->
                <button type="button" @click="isCreateModalOpen = true"
                    class="group relative overflow-hidden bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-2xl p-8 min-h-[240px] flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105">
                    <div
                        class="absolute inset-0 bg-linear-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 transition-all duration-300">
                    </div>

                    <div class="relative z-10 flex flex-col items-center gap-4">
                        <div class="relative">
                            <div
                                class="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300">
                            </div>
                            <div
                                class="relative w-16 h-16 rounded-full bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <UIcon name="i-lucide-plus" class="w-8 h-8 text-white" />
                            </div>
                        </div>

                        <div class="text-center">
                            <p
                                class="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                สร้างแชนแนลใหม่
                            </p>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                เพิ่มแชนแนลเพื่อแบ่งปันความรู้
                            </p>
                        </div>
                    </div>
                </button>

                <!-- Channel Cards -->
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
    <div v-if="errorMsg" class="fixed bottom-6 right-6 max-w-md">
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

    <!-- Decorative Elements -->
    <div
        class="fixed top-20 right-20 w-72 h-72 bg-linear-to-br from-blue-400 to-indigo-400 rounded-full opacity-10 blur-3xl -z-10 pointer-events-none">
    </div>
    <div
        class="fixed bottom-20 left-20 w-96 h-96 bg-linear-to-br from-purple-400 to-pink-400 rounded-full opacity-10 blur-3xl -z-10 pointer-events-none">
    </div>

    <!-- Modal -->
    <ModalChannelForm v-model:open="isCreateModalOpen" mode="create" :loading="loading" :create-handler="handleCreate"
        :edit-handler="handleEdit" />
</template>
