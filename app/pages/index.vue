<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import { useAuthStore } from '~/stores/auth'

// ========================================
// 1. Setup & Composables
// ========================================
const authStore = useAuthStore()
const {
    fetchMyChannels,
    fetchPublicChannels,
    fetchAllChannels,
    loading
} = useChannel()

const toast = useToast()
const route = useRoute()
const router = useRouter()

// ========================================
// 2. State Management
// ========================================
const channels = ref<any[]>([])

// ดึงค่าจาก URL Query ถ้าไม่มีให้เป็นค่าว่างไว้ก่อน แล้วค่อยกำหนดใน onMounted
const selectedTab = ref((route.query.tab as string) || '')

// ========================================
// 3. Tab Configuration
// ========================================
const items = computed<TabsItem[]>(() => {
    if (!authStore.token) {
        return [{ label: 'แชนแนลสาธารณะ', value: 'public_channels' }]
    }

    const baseTabs = [
        { label: 'แชนแนลของฉัน', value: 'my_channels' },
        { label: 'แชนแนลสาธารณะ', value: 'public_channels' }
    ]

    if (authStore.role === 'admin') {
        baseTabs.push({ label: 'ทั้งหมด (Admin)', value: 'all_channels' })
    }

    return baseTabs
})

const activeLabel = computed(() => {
    return items.value.find(i => i.value === selectedTab.value)?.label || 'แชนแนล'
})

// ========================================
// 4. Load Channels Function
// ========================================
const loadChannels = async () => {
    // ถ้าไม่มี tab ที่เลือก (เช่น เข้ามาครั้งแรก) ไม่ต้องทำอะไร
    if (!selectedTab.value) return

    try {
        let response

        switch (selectedTab.value) {
            case 'my_channels':
                if (!authStore.token) {
                    selectedTab.value = 'public_channels'
                    return
                }
                response = await fetchMyChannels()
                break

            case 'public_channels':
                response = await fetchPublicChannels()
                break

            case 'all_channels':
                if (authStore.role !== 'admin') {
                    toast.add({ title: 'ไม่มีสิทธิ์', color: 'error' })
                    selectedTab.value = 'public_channels'
                    return
                }
                response = await fetchAllChannels()
                break
        }

        // มาตรฐานการรับข้อมูล (Parsing)
        if (Array.isArray(response)) {
            channels.value = response
        } else if ((response as any)?.channels) {
            channels.value = (response as any).channels
        } else if ((response as any)?.data) {
            channels.value = (response as any).data
        } else {
            channels.value = []
        }

    } catch (error: any) {
        toast.add({
            title: 'เกิดข้อผิดพลาด',
            description: error.data?.message || 'ไม่สามารถโหลดข้อมูลได้',
            color: 'error'
        })
        channels.value = []
    }
}

// ========================================
// 5. Watch Tab Changes (Sync URL)
// ========================================
watch(selectedTab, (newTab) => {
    // อัปเดต URL ?tab=... เมื่อมีการเปลี่ยน Tab
    router.replace({
        query: { ...route.query, tab: newTab }
    })
    loadChannels()
})

// ========================================
// 6. Initial Load
// ========================================
onMounted(() => {
    const queryTab = route.query.tab as string

    // ตรวจสอบความถูกต้องของ Tab จาก URL
    const isValidTab = items.value.some(item => item.value === queryTab)

    if (queryTab && isValidTab) {
        selectedTab.value = queryTab
    } else {
        // ค่าเริ่มต้นถ้าไม่มี Query หรือ Query ไม่ถูกต้อง
        selectedTab.value = !authStore.token ? 'public_channels' : 'my_channels'
    }

    // เรียกโหลดข้อมูลครั้งแรก
    loadChannels()
})
</script>

<template>
    <div class="">
        <!-- Enhanced Header with Gradient Background -->
        <header class="mb-16 relative">
            <div
                class="absolute inset-0 bg-linear-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-500/20 dark:to-indigo-500/20 rounded-3xl blur-3xl -z-10">
            </div>
            <div class="text-center md:text-left space-y-4">

                <h1 class="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
                    <span
                        class="bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        ยินดีต้อนรับสู่
                    </span>
                    <br />
                    <span
                        class="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        KmutnbLM
                    </span>
                </h1>

                <!-- Search Bar (Optional Enhancement) -->
                <div class="pt-6 max-w-2xl">
                    <div class="relative">
                        <UIcon name="i-lucide-search"
                            class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="ค้นหาคอร์สหรือแชนแนล..."
                            class="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                    </div>
                </div>
            </div>
        </header>

        <main>
            <!-- Enhanced Filter Bar -->
            <div
                class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none p-6 mb-10 border border-gray-100 dark:border-gray-700">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div class="flex items-center gap-4">
                        <div class="p-3 bg-linear-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                            <UIcon name="i-lucide-layout-grid" class="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2
                                class="text-2xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                {{ activeLabel }}
                            </h2>
                            <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                <span class="inline-flex items-center gap-1">
                                    <UIcon name="i-lucide-book-open" class="w-4 h-4" />
                                    พบทั้งหมด <span class="font-semibold text-blue-600 dark:text-blue-400">{{
                                        channels.length }}</span> รายการ
                                </span>
                            </p>
                        </div>
                    </div>

                    <UTabs v-model="selectedTab" :items="items" class="w-full md:w-auto" />
                </div>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div v-for="i in 4" :key="i" class="group">
                    <div
                        class="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700">
                        <USkeleton class="h-20 w-full" />
                        <div class="p-6 space-y-3">
                            <USkeleton class="h-6 w-3/4" />
                            <USkeleton class="h-4 w-full" />
                            <USkeleton class="h-4 w-2/3" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content Grid -->
            <div v-else>
                <div v-if="channels.length > 0"
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    <div v-for="channel in channels" :key="channel.channels_id" class="group">
                        <ChannelCard :item="channel" @load="loadChannels"
                            class="transform transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl" />
                    </div>
                </div>

                <!-- Enhanced Empty State -->
                <div v-else class="relative">
                    <div
                        class="absolute inset-0 bg-linear-to-r from-blue-600/5 to-indigo-600/5 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-3xl blur-2xl">
                    </div>
                    <div
                        class="relative flex flex-col items-center justify-center py-12 px-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <div class="relative mb-4">
                            <div
                                class="absolute inset-0 bg-linear-to-r from-blue-500 to-indigo-500 rounded-full blur-lg opacity-20 animate-pulse">
                            </div>
                            <div
                                class="relative p-4 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full shadow-md border border-blue-100 dark:border-blue-800">
                                <UIcon name="i-lucide-search-x" class="w-10 h-10 text-blue-500" />
                            </div>
                        </div>

                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            ไม่พบข้อมูลแชนแนล
                        </h3>

                        <p class="text-gray-600 dark:text-gray-400 mt-1 max-w-xs text-center text-sm leading-relaxed">
                            {{ selectedTab === 'my_channels'
                                ? 'เริ่มต้นสร้างแชนแนลแรกของคุณเพื่อแบ่งปันความรู้และประสบการณ์'
                                : 'ลองเปลี่ยนหมวดหมู่หรือกลับมาตรวจสอบใหม่อีกครั้ง'
                            }}
                        </p>

                        <UButton v-if="selectedTab === 'my_channels'" label="สร้างแชนแนลใหม่" color="primary" size="md"
                            class="mt-6 shadow-md hover:shadow-lg transition-all" icon="i-lucide-plus" to="/channel">
                            <template #trailing>
                                <UIcon name="i-lucide-sparkles" class="w-4 h-4" />
                            </template>
                        </UButton>
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
    </div>
</template>

<style scoped>
@keyframes float {

    0%,
    100% {
        transform: translateY(0px);
    }

    50% {
        transform: translateY(-10px);
    }
}

.group:hover {
    animation: float 3s ease-in-out infinite;
}
</style>