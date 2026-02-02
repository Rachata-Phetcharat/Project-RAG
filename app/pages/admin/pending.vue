<script setup lang="ts">
import { ref, onMounted } from 'vue'
const { fetchPendingChannels, loading } = useChannel()

definePageMeta({
    middleware: ['auth', 'admin'] // เรียงลำดับสำคัญ
})

const channels = ref<any[]>([])
const errorMsg = ref('')

const loadChannels = async () => {
    errorMsg.value = ''

    try {
        const data = await fetchPendingChannels()
        channels.value = Array.isArray(data) ? data : []
    } catch (e) {
        console.error(e)
        errorMsg.value = 'โหลดข้อมูลแชนแนลไม่สำเร็จ'
    }
}

onMounted(() => {
    loadChannels()
})
</script>


<template>
    <USeparator size="md" />

    <main class="mt-6">
        <!-- 1) กำลังโหลด -->
        <div v-if="loading"
            class="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center py-20 rounded-lg">
            <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-gray-400" />
            <p class="text-gray-500">กำลังโหลดห้องแชนแนล...</p>
        </div>

        <!-- 2) ถ้าไม่มี channel -->
        <div v-else-if="!channels.length"
            class="flex-1 flex flex-col items-center justify-center gap-6 px-4 text-center bg-blue-50 dark:bg-gray-800 py-20 rounded-lg">
            <UIcon name="i-lucide-archive-x" class="w-16 h-16 text-gray-400" />
            <h2 class="text-2xl font-semibold text-gray-700 dark:text-gray-200">
                คำขอห้องแชนแนล
            </h2>
            <p class="text-gray-500 max-w-md">
                เหมือนจะยังไม่มีคำขอมาในตอนนี้
            </p>
        </div>

        <!-- 3) ถ้ามี channel ให้แสดง -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
            <!-- Loop แชนแนล -->
            <div v-for="ch in channels" :key="ch.channels_id" class="w-full">
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
    </main>

</template>
