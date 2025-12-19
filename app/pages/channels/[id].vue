<script setup lang="ts">
/* ============================================
   Dynamic Route & Composables
============================================ */
const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const channelId = computed(() => route.params.id as string)

const { loading, error, listFiles, uploadFiles, clearError } = useFileChannel()
const { fetchChannelTitle } = useChannel()

/* ============================================
   State Management
============================================ */
const state = reactive({
    isModalOpen: false,
    isUploading: false,
    channelTitle: '',
    message: '',
    sources: [] as any[],
    chatHistory: [] as any[]
})

/* ============================================
   Computed Properties
============================================ */
const fileCount = computed(() => state.sources.length)
const canSendMessage = computed(() => state.message.trim().length > 0)

/* ============================================
   Data Loading
============================================ */
const loadChannelData = async () => {
    if (!channelId.value) return

    try {
        const response = await fetchChannelTitle(channelId.value)
        if (response && response.channel_title) {
            state.channelTitle = response.channel_title
        }
    } catch (err: any) {
        console.error('Error fetching channel title:', err)
        toast.add({
            title: 'ไม่สามารถโหลดข้อมูลแชนแนลได้',
            description: 'แชนแนลอาจไม่มีอยู่จริง หรือคุณไม่มีสิทธิ์เข้าถึง',
            color: 'error'
        })
    }
}

const loadChannelFiles = async () => {
    try {
        const data = await listFiles(channelId.value)
        state.sources = data.files || []
    } catch (err) {
        console.error('Failed to load files:', err)
        toast.add({
            title: 'เกิดข้อผิดพลาด',
            description: 'ไม่สามารถโหลดรายการไฟล์ได้',
            color: 'error'
        })
    }
}

/* ============================================
   File Upload Handler
============================================ */
const handleFileUpload = async (event: any) => {
    const files = event.target?.files || event.dataTransfer?.files || event

    if (!files || files.length === 0) return

    const fileArray = Array.from(files) as File[]

    // Validate file count
    if (state.sources.length + fileArray.length > 50) {
        toast.add({
            title: 'เกิดข้อผิดพลาด',
            description: 'ไม่สามารถอัปโหลดได้เกิน 50 ไฟล์',
            color: 'error'
        })
        return
    }

    // Validate file size (50MB)
    const invalidFiles = fileArray.filter(f => f.size > 50 * 1024 * 1024)
    if (invalidFiles.length > 0) {
        toast.add({
            title: 'ไฟล์ใหญ่เกินไป',
            description: `${invalidFiles[0]?.name} มีขนาดเกิน 50MB`,
            color: 'error'
        })
        return
    }

    try {
        state.isUploading = true
        const result = await uploadFiles(channelId.value, fileArray)

        state.sources.push(...result.files)

        toast.add({
            title: 'สำเร็จ',
            description: `อัปโหลดไฟล์ ${fileArray.length} ไฟล์เรียบร้อย`,
            color: 'success'
        })

        state.isModalOpen = false
    } catch (err) {
        console.error('Upload failed:', err)
        toast.add({
            title: 'เกิดข้อผิดพลาด',
            description: error.value || 'ไม่สามารถอัปโหลดไฟล์ได้',
            color: 'error'
        })
    } finally {
        state.isUploading = false
    }
}

// State สำหรับ Delete Modal
const deleteModalState = reactive({
    isOpen: false,
    selectedFile: null as any
})

/* ============================================
   Delete Modal Handlers
============================================ */
const openDeleteModal = (file: any) => {
    deleteModalState.selectedFile = file
    deleteModalState.isOpen = true
}

// รับ event จาก Modal เมื่อลบสำเร็จแล้ว
const handleFileDeleted = (fileId: string) => {
    state.sources = state.sources.filter(f => f.files_id !== fileId)
}

/* ============================================
   Chat Message Handler
============================================ */
const handleSendMessage = () => {
    if (!canSendMessage.value) return

    // TODO: Implement chat with AI
    console.log('Send message:', state.message)

    state.chatHistory.push({
        id: Date.now(),
        role: 'user',
        text: state.message,
        citations: []
    })

    state.message = ''
}

/* ============================================
   Lifecycle Hooks
============================================ */
onMounted(async () => {
    await Promise.all([
        loadChannelData(),
        loadChannelFiles()
    ])
})

watch(() => route.params.id, (newId) => {
    if (newId) {
        loadChannelData()
        loadChannelFiles()
    }
})
</script>

<template>
    <div
        class="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 overflow-hidden">

        <!-- ============================================
         Sidebar - File Sources
    ============================================ -->
        <aside
            class="w-80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50 flex flex-col hidden md:flex shadow-xl">

            <!-- Header with Gradient -->
            <div
                class="p-6 border-b border-gray-100 dark:border-gray-800/50 bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-950/20">
                <div class="flex items-center gap-2 mb-4">
                    <div class="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                    <h2 class="font-bold text-gray-800 dark:text-gray-100 text-lg">
                        แหล่งข้อมูล
                    </h2>
                </div>

                <!-- Add Source Modal -->
                <UModal v-model="state.isModalOpen" :ui="{
                    content: 'sm:max-w-[900px]',
                    overlay: 'backdrop-blur-sm'
                }">
                    <UButton block icon="i-heroicons-plus" color="primary" size="lg"
                        :disabled="loading || state.isUploading"
                        class="cursor-pointer font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                        <span class="flex items-center gap-2">
                            <UIcon name="i-heroicons-sparkles" class="w-4 h-4" />
                            เพิ่มแหล่งที่มา
                        </span>
                    </UButton>

                    <template #header>
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                                <UIcon name="i-heroicons-document-plus" class="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-gray-900 dark:text-white">เพิ่มแหล่งที่มา</h3>
                                <p class="text-sm text-gray-500 dark:text-gray-400">อัปโหลดเอกสารเพื่อให้ AI
                                    วิเคราะห์ข้อมูล</p>
                            </div>
                        </div>
                    </template>

                    <template #body>
                        <div class="p-6 space-y-6">

                            <!-- Upload Zone with Enhanced Design -->
                            <div class="relative group">
                                <div
                                    class="border-3 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl h-64 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-900/50 hover:from-primary-50 hover:to-blue-50 dark:hover:from-primary-950/20 dark:hover:to-blue-950/20 hover:border-primary-400 dark:hover:border-primary-600 transition-all duration-300 cursor-pointer group-hover:shadow-2xl group-hover:scale-[1.01]">

                                    <!-- Default State -->
                                    <div v-if="!state.isUploading"
                                        class="flex flex-col items-center text-center space-y-4 pointer-events-none">
                                        <div
                                            class="w-16 h-16 bg-gradient-to-br from-primary-500 to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                            <UIcon name="i-heroicons-cloud-arrow-up" class="w-8 h-8" />
                                        </div>
                                        <h4 class="text-xl font-bold text-gray-800 dark:text-gray-100">
                                            อัปโหลดแหล่งข้อมูล
                                        </h4>
                                        <p class="text-gray-600 dark:text-gray-300 text-base">
                                            ลากและวาง หรือ <span
                                                class="text-primary-600 dark:text-primary-400 font-semibold">คลิกเพื่อเลือกไฟล์</span>
                                        </p>
                                        <div class="flex items-center gap-4 text-sm text-gray-500">
                                            <div class="flex items-center gap-1.5">
                                                <UIcon name="i-heroicons-document-text" class="w-4 h-4" />
                                                <span>PDF, TEXT</span>
                                            </div>
                                            <div class="w-1 h-1 rounded-full bg-gray-400"></div>
                                            <div class="flex items-center gap-1.5">
                                                <UIcon name="i-heroicons-arrow-up-tray" class="w-4 h-4" />
                                                <span>สูงสุด 50MB</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Loading State -->
                                    <div v-else class="flex flex-col items-center gap-4">
                                        <div class="relative">
                                            <div
                                                class="w-16 h-16 border-4 border-primary-200 dark:border-primary-900 rounded-full">
                                            </div>
                                            <div
                                                class="w-16 h-16 border-4 border-primary-600 rounded-full border-t-transparent animate-spin absolute inset-0">
                                            </div>
                                        </div>
                                        <p class="text-gray-700 dark:text-gray-200 font-medium text-lg">กำลังอัปโหลด...
                                        </p>
                                    </div>

                                    <!-- File Input -->
                                    <input type="file" multiple accept=".pdf,.txt"
                                        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        :disabled="state.isUploading" @change="handleFileUpload" />
                                </div>
                            </div>

                            <!-- Error Display -->
                            <UAlert v-if="error" color="error" variant="soft" :title="error"
                                :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'error', variant: 'link' }"
                                @close="clearError" />
                        </div>

                        <!-- Progress Footer -->
                        <div
                            class="p-6 bg-gradient-to-br from-gray-50 to-transparent dark:from-gray-900/50 border-t border-gray-100 dark:border-gray-800">
                            <div class="flex items-center gap-4">
                                <UIcon name="i-heroicons-folder" class="w-5 h-5 text-gray-500 flex-shrink-0" />
                                <div class="flex-1">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            ขีดจำกัดแหล่งที่มา
                                        </span>
                                        <span class="text-sm font-bold text-primary-600 dark:text-primary-400">
                                            {{ fileCount }}/50
                                        </span>
                                    </div>
                                    <UProgress :model-value="fileCount" :max="50" size="md" />
                                </div>
                            </div>
                        </div>
                    </template>
                </UModal>
            </div>

            <!-- File List with Enhanced Styling -->
            <div class="flex-1 overflow-y-auto p-3 space-y-2">
                <!-- Loading State -->
                <div v-if="loading && state.sources.length === 0" class="flex items-center justify-center h-32">
                    <div class="relative">
                        <div class="w-10 h-10 border-3 border-primary-200 dark:border-primary-900 rounded-full"></div>
                        <div
                            class="w-10 h-10 border-3 border-primary-600 rounded-full border-t-transparent animate-spin absolute inset-0">
                        </div>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-else-if="state.sources.length === 0"
                    class="flex flex-col items-center justify-center h-48 text-center px-4 py-8 rounded-2xl bg-gradient-to-br from-gray-100/50 to-transparent dark:from-gray-800/30">
                    <div
                        class="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center mb-3">
                        <UIcon name="i-heroicons-document" class="w-8 h-8 text-gray-400" />
                    </div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">ยังไม่มีไฟล์</p>
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">เริ่มเพิ่มแหล่งข้อมูลของคุณ</p>
                </div>

                <!-- File Items with Animation -->
                <div v-for="(file, index) in state.sources" :key="file.files_id"
                    class="flex items-center justify-between p-3 rounded-xl hover:bg-gradient-to-r hover:from-primary-50 hover:to-transparent dark:hover:from-primary-950/30 cursor-pointer group transition-all duration-300 hover:shadow-md hover:scale-[1.02] border border-transparent hover:border-primary-200 dark:hover:border-primary-900"
                    :style="{ animationDelay: `${index * 50}ms` }">
                    <div class="flex items-center gap-3 truncate flex-1 min-w-0">
                        <div
                            class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <UIcon name="i-heroicons-document-text"
                                class="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-200 truncate block"
                                :title="file.original_filename">
                                {{ file.original_filename }}
                            </span>
                            <span class="text-xs text-gray-400 dark:text-gray-500">
                                {{ (file.size / 1024).toFixed(1) }} KB
                            </span>
                        </div>
                    </div>

                    <!-- ปุ่มลบที่เปิด Modal -->
                    <UButton icon="i-heroicons-trash" color="error" variant="ghost" size="sm"
                        @click.stop="openDeleteModal(file)"
                        class="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110" />
                </div>
            </div>

            <!-- Footer Progress with Gradient -->
            <div
                class="p-4 bg-gradient-to-t from-gray-100/50 to-transparent dark:from-gray-900/50 border-t border-gray-200/50 dark:border-gray-800/50 backdrop-blur-sm">
                <div class="flex items-center gap-3">
                    <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                ใช้งานแล้ว
                            </span>
                            <span class="text-sm font-bold text-primary-600 dark:text-primary-400">
                                {{ fileCount }}/50
                            </span>
                        </div>
                        <UProgress :model-value="fileCount" :max="50" size="md" />
                    </div>
                </div>
            </div>
        </aside>

        <!-- ============================================
         Main Content Area
    ============================================ -->
        <main class="flex-1 flex flex-col relative min-w-0">

            <!-- Header with Glassmorphism -->
            <div
                class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl px-6 sticky top-0 z-20 border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm">
                <nav class="flex items-center justify-between py-5">
                    <div class="flex items-center gap-3">
                        <div class="w-1 h-8 rounded-full bg-gradient-to-b from-primary-500 to-primary-600"></div>
                        <h1
                            class="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent truncate">
                            {{ state.channelTitle }}
                        </h1>
                    </div>
                    <UserMenu />
                </nav>
            </div>

            <!-- Empty State with Beautiful Design -->
            <div v-if="fileCount === 0" class="flex-1 flex flex-col items-center justify-center gap-8 px-4 text-center">
                <div class="relative">
                    <div
                        class="absolute inset-0 bg-gradient-to-r from-primary-400 to-blue-500 rounded-full blur-3xl opacity-20 animate-pulse">
                    </div>
                    <div
                        class="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center shadow-2xl">
                        <UIcon name="i-heroicons-chat-bubble-oval-left-ellipsis" class="w-12 h-12 text-white" />
                    </div>
                </div>
                <div class="space-y-3">
                    <h2
                        class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        เริ่มต้นการสนทนา
                    </h2>
                    <p class="text-gray-600 dark:text-gray-400 max-w-md text-lg">
                        เพิ่มแหล่งข้อมูลของคุณแล้วถามคำถามเกี่ยวกับเอกสารเหล่านั้นได้เลย
                    </p>
                </div>
                <UBadge color="primary" variant="subtle" size="lg" class="px-6 py-2">
                    <UIcon name="i-heroicons-sparkles" class="w-4 h-4 mr-2" />
                    AI พร้อมช่วยเหลือคุณ
                </UBadge>
            </div>

            <!-- Chat Area -->
            <div v-else class="flex flex-col h-[calc(100vh-64px)] relative">

                <!-- Messages Container -->
                <div
                    class="flex-1 w-full overflow-y-auto p-6 sm:p-10 space-y-8 scroll-smooth bg-gradient-to-b from-transparent via-gray-50/30 to-transparent dark:via-gray-900/30">

                    <div v-for="(msg, index) in state.chatHistory" :key="msg.id"
                        :class="['flex animate-fade-in', msg.role === 'user' ? 'justify-end' : 'justify-start']"
                        :style="{ animationDelay: `${index * 100}ms` }">
                        <div :class="['max-w-3xl', msg.role === 'user' ? 'w-fit' : 'w-full']">

                            <!-- User Message -->
                            <div v-if="msg.role === 'user'"
                                class="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-4 rounded-3xl rounded-tr-md shadow-lg hover:shadow-xl transition-all duration-300 text-base font-medium">
                                {{ msg.text }}
                            </div>

                            <!-- AI Message -->
                            <UCard v-else :ui="{
                                body: { padding: 'p-6 sm:p-7' },
                                ring: 'ring-1 ring-gray-200/80 dark:ring-gray-800/80 shadow-lg hover:shadow-xl transition-shadow duration-300',
                                rounded: 'rounded-3xl',
                                background: 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm'
                            }">
                                <div class="flex gap-5">
                                    <div class="flex-shrink-0">
                                        <UAvatar icon="i-heroicons-sparkles" size="md"
                                            class="bg-gradient-to-br from-primary-500 to-blue-600 text-white ring-2 ring-primary-100 dark:ring-primary-900 shadow-lg" />
                                    </div>

                                    <div class="space-y-4 w-full">
                                        <p class="text-gray-800 dark:text-gray-200 leading-8 text-base">
                                            {{ msg.text }}
                                        </p>

                                        <!-- Citations -->
                                        <div v-if="msg.citations && msg.citations.length"
                                            class="flex gap-2 flex-wrap pt-5 border-t border-gray-100 dark:border-gray-800">
                                            <UBadge v-for="(cit, idx) in msg.citations" :key="idx" color="primary"
                                                variant="subtle"
                                                class="cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900 transition-all duration-200 hover:scale-105 px-3 py-1.5">
                                                <UIcon name="i-heroicons-link" class="w-3.5 h-3.5 mr-1.5" />
                                                {{ cit }}
                                            </UBadge>
                                        </div>
                                    </div>
                                </div>
                            </UCard>

                        </div>
                    </div>
                </div>

                <!-- Input Area with Floating Effect -->
                <div
                    class="shrink-0 p-6 pb-8 z-10 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900">
                    <div class="w-full max-w-5xl mx-auto">
                        <form @submit.prevent="handleSendMessage">
                            <UChatPrompt v-model="state.message" variant="soft" placeholder="ถามคำถามเกี่ยวกับเอกสาร..."
                                :rows="1" autoresize :ui="{
                                    wrapper: 'relative',
                                    base: 'pl-6 pr-14 py-5 text-base'
                                }"
                                class="shadow-2xl border-2 border-gray-200 dark:border-gray-700 rounded-3xl bg-white dark:bg-gray-800 focus-within:ring-4 focus-within:ring-primary-500/20 focus-within:border-primary-400 transition-all duration-300 hover:shadow-3xl">
                                <template #trailing>
                                    <div class="absolute right-4 bottom-auto top-0 flex items-center h-full">
                                        <UChatPromptSubmit size="md" color="primary" :disabled="!canSendMessage"
                                            icon="i-heroicons-paper-airplane"
                                            class="transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl"
                                            :class="{
                                                'scale-0 opacity-0 rotate-90': !canSendMessage,
                                                'scale-100 opacity-100 rotate-0 hover:scale-110': canSendMessage
                                            }" />
                                    </div>
                                </template>
                            </UChatPrompt>
                        </form>
                        <p class="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
                            กด Enter เพื่อส่งข้อความ · Shift + Enter เพื่อขึ้นบรรทัดใหม่
                        </p>
                    </div>
                </div>

            </div>

        </main>

        <!-- Delete Modal Component -->
        <ChannelDeleteModal v-model:open="deleteModalState.isOpen" :file="deleteModalState.selectedFile"
            @deleted="handleFileDeleted" />
    </div>
</template>

<style scoped>
@keyframes fade-in {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in {
    animation: fade-in 0.5s ease-out forwards;
}

.overflow-y-auto::-webkit-scrollbar {
    width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, rgba(156, 163, 175, 0.3), rgba(156, 163, 175, 0.5));
    border-radius: 99px;
    transition: background 0.3s;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(to bottom, rgba(156, 163, 175, 0.5), rgba(156, 163, 175, 0.7));
}
</style>