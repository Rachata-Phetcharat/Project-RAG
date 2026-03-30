<script setup lang="ts">
/* ============================================
   Imports & Composables
============================================ */
const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const { fetchPublicChannels, fetchMyChannels, fetchAllChannels } = useChannel()

definePageMeta({
    layout: 'chat-layout',
})

// mobile sidebar state
const sidebarOpen = ref(false)

const isLoggedIn = computed(() => authStore.isLoggedIn)

const state = reactive({
    isOwner: false,
    channelOwnerId: null as string | null
})


const isOwnerOrAdmin = computed(() => {
    if (!isLoggedIn.value) return false

    // ถ้าเป็น admin ให้แสดงทุกอย่าง
    if (authStore.role === 'admin') return true

    // ตรวจสอบว่าช่องนี้อยู่ในรายการ "My Channels" หรือไม่
    return state.isOwner
})

/* ============================================
   Computed Properties
============================================ */
const channelId = computed(() => route.params.id as string)

const fileCount = computed(() => {
    return channelState.sources.length > 0
        ? channelState.sources.length
        : (channelState.totalFilesFromList || 0)
})

/* ============================================
   State Management
============================================ */
const channelState = reactive({
    channelTitle: '',
    sources: [] as any[],
    totalFilesFromList: 0,
    loading: true,
    isInitialized: false
})

/* ============================================
   Data Loading
============================================ */
const loadChannelData = async () => {
    if (!channelId.value) return

    try {
        channelState.loading = true
        let response
        let isChannelOwned = false

        if (authStore.role === 'admin') {
            response = await fetchAllChannels({ limit: 100 })
            isChannelOwned = true
        } else if (authStore.token) {
            response = await fetchMyChannels({ limit: 100 })
        }

        const findChannel = (list: any[]) =>
            list?.find((c: any) => String(c.channels_id) === String(channelId.value))

        let currentChannel = response ? findChannel(response as any[]) : null

        if (currentChannel && authStore.role !== 'admin') {
            isChannelOwned = true
        }

        if (!currentChannel) {
            const publicRes = await fetchPublicChannels({ limit: 100 })
            currentChannel = findChannel(publicRes as any[])
            isChannelOwned = false
        }

        if (currentChannel) {
            state.isOwner = isChannelOwned
            state.channelOwnerId = currentChannel.owner_id || null
            channelState.channelTitle = currentChannel.title || 'ไม่พบชื่อช่อง'
            channelState.totalFilesFromList = currentChannel.file_count || 0
            channelState.sources = currentChannel.files || []
        } else {
            toast.add({
                title: 'ไม่พบข้อมูลช่อง',
                description: 'คุณไม่มีสิทธิ์เข้าถึงช่องนี้',
                color: 'warning'
            })
            router.push('/')
        }
    } catch (err: any) {
        toast.add({
            title: 'เกิดข้อผิดพลาด',
            description: 'ไม่สามารถโหลดข้อมูลช่องได้',
            color: 'error'
        })
    } finally {
        channelState.loading = false
        channelState.isInitialized = true
    }
}

/* ============================================
   Event Handlers from Child Components
============================================ */
const handleSourcesUpdate = (newSources: any[]) => {
    channelState.sources = newSources
}

/* ============================================
   Lifecycle Hooks
============================================ */
onMounted(() => {
    loadChannelData()
})

watch(() => route.params.id, (newId) => {
    if (newId) {
        loadChannelData()
    }
})
</script>

<template>
    <!-- 
        ใช้ h-full แทน h-screen เพราะ parent layout (chatLayout.vue) จัดการ height ด้วย 100dvh แล้ว
        overflow-hidden เพื่อป้องกัน scroll ของตัว container นี้เอง
    -->
    <div class="flex h-full overflow-hidden">

        <!-- Loading Skeleton -->
        <template v-if="!channelState.isInitialized">
            <!-- Sidebar Skeleton (desktop lg+) -->
            <aside v-if="authStore.isLoggedIn"
                class="w-80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50 flex-col hidden lg:flex shadow-xl">
                <div class="p-6 border-b border-gray-100 dark:border-gray-800/50">
                    <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
                    <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div class="flex-1 p-3 space-y-2">
                    <div v-for="i in 3" :key="i" class="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse">
                    </div>
                </div>
            </aside>

            <!-- Main Content Skeleton -->
            <main class="flex-1 flex flex-col min-w-0 min-h-0">
                <div
                    class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200/50 dark:border-gray-800/50 shrink-0">
                    <div class="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div class="flex-1 flex flex-col overflow-hidden min-h-0">
                    <div class="flex-1 p-4 sm:p-10 space-y-8 overflow-hidden">
                        <div class="flex justify-start max-w-5xl mx-auto w-full">
                            <div class="flex gap-5 items-start w-full max-w-3xl">
                                <div class="w-10 h-10 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0">
                                </div>
                                <div class="space-y-2 flex-1">
                                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full"></div>
                                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
                                </div>
                            </div>
                        </div>
                        <div class="flex justify-end max-w-5xl mx-auto w-full">
                            <div class="h-10 w-56 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                        </div>
                    </div>
                    <div class="shrink-0 pb-safe-area pb-4 px-3 sm:px-4">
                        <div class="w-full max-w-5xl mx-auto">
                            <div class="h-14 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </main>
        </template>

        <!-- Main Content -->
        <template v-else>
            <!-- Sidebar Component -->
            <SidebarFileList v-if="isLoggedIn && isOwnerOrAdmin" :channel-id="channelId" :sources="channelState.sources"
                :total-files="channelState.totalFilesFromList" :loading="channelState.loading" :open="sidebarOpen"
                @update:open="sidebarOpen = $event" @update:sources="handleSourcesUpdate" />

            <!-- Main Content Component -->
            <MainContentChat :channel-id="channelId" :channel-title="channelState.channelTitle" :file-count="fileCount"
                @open-sidebar="sidebarOpen = true" />
        </template>
    </div>
</template>