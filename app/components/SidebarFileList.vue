<script setup lang="ts">
/* ============================================
   Imports & Composables
============================================ */
const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()

// ลบ fetchPublicChannels, fetchMyChannels, fetchAllChannels ออก เพราะ parent โหลดให้แล้ว
const { loading, error, uploadFiles, downLoadFile, deleteFile } = useFileChannel()

const emit = defineEmits<{
    'update:sources': [sources: any[]]
    'update:open': [value: boolean]
    'refresh': []
}>()

// [RESPONSIVE] รับ open state จาก parent สำหรับ mobile slideover
const props = defineProps<{
    open?: boolean
    channelId?: string
    sources?: any[]
    totalFiles?: number
    loading?: boolean
    isOwner?: boolean // ✅ รับ isOwner จาก parent แทนที่จะเช็คเอง
}>()

const closeSlide = () => emit('update:open', false)

const allowedSize = computed(() => authStore.user?.file_size ? Math.floor(authStore.user.file_size / (1024 * 1024)) : 10)

/* ============================================
   Computed Properties
============================================ */
const channelId = computed(() => route.params.id as string)
const isLoggedIn = computed(() => authStore.isLoggedIn)

// ✅ ใช้ props.sources แทน state.sources (ข้อมูลมาจาก parent แล้ว)
const sources = computed(() => props.sources ?? [])
const fileCount = computed(() => sources.value.length)

const isOwnerOrAdmin = computed(() => {
    if (!isLoggedIn.value) return false
    if (authStore.role === 'admin') return true
    return props.isOwner ?? false
})

/* ============================================
   State Management
============================================ */
const state = reactive({
    isModalOpen: false,
    isUploading: false,
})

const deleteModalState = reactive({
    isOpen: false,
    selectedFile: null as any
})

// Mobile action sheet
const actionSheet = reactive({
    isOpen: false,
    selectedFile: null as any
})

const openActionSheet = (file: any) => {
    actionSheet.selectedFile = file
    actionSheet.isOpen = true
}

const closeActionSheet = () => {
    actionSheet.isOpen = false
    actionSheet.selectedFile = null
}

const actionSheetDownload = async () => {
    const file = actionSheet.selectedFile
    closeActionSheet()
    await handleDownload(file)
}

const actionSheetDelete = () => {
    const file = actionSheet.selectedFile
    closeActionSheet()
    openDeleteModal(file)
}

/* ============================================
   File Upload Handler
============================================ */
const handleOpenModal = () => {
    if (fileCount.value >= 50) {
        toast.add({
            title: 'ถึงขีดจำกัดแล้ว',
            description: 'ไม่สามารถเพิ่มไฟล์ได้อีก เนื่องจากมีไฟล์ครบ 50 ไฟล์แล้ว กรุณาลบไฟล์บางส่วนก่อน',
            color: 'warning'
        })
        return
    }
    state.isModalOpen = true
}

const currentUsedSizeMB = computed(() => {
    const bytes = sources.value.reduce((sum: number, f: any) => sum + (f.size_bytes || 0), 0)
    return bytes / (1024 * 1024)
})

const handleFileUpload = async (files: File[]) => {
    if (!files || files.length === 0) return

    const MAX_FILE_SIZE = allowedSize.value * 1024 * 1024

    if (fileCount.value + files.length > 50) {
        const remaining = 50 - fileCount.value
        toast.add({
            title: 'ไฟล์เกินขีดจำกัด',
            description: remaining > 0
                ? `สามารถเพิ่มได้อีก ${remaining} ไฟล์เท่านั้น (ปัจจุบัน ${fileCount.value}/50)`
                : 'ไม่สามารถเพิ่มไฟล์ได้อีก เนื่องจากมีไฟล์ครบ 50 ไฟล์แล้ว',
            color: 'warning'
        })
        return
    }

    const totalNewSizeMB = files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024)
    const totalAfterUpload = currentUsedSizeMB.value + totalNewSizeMB

    if (totalAfterUpload > allowedSize.value && authStore.role !== 'admin') {
        const remainingMB = (allowedSize.value - currentUsedSizeMB.value).toFixed(1)
        toast.add({
            title: 'ขนาดไฟล์เกินขีดจำกัด',
            description: `ขนาดรวมจะเกิน ${allowedSize.value} MB (เหลือพื้นที่อีก ${remainingMB} MB)`,
            color: 'error'
        })
        return
    }

    try {
        state.isUploading = true
        await uploadFiles(channelId.value, files)

        // ✅ emit ให้ parent reload แทนที่จะ fetch เอง
        emit('refresh')

        toast.add({
            title: 'สำเร็จ',
            description: `อัปโหลดไฟล์ ${files.length} ไฟล์เรียบร้อย`,
            color: 'success'
        })

        state.isModalOpen = false
    } catch (err) {
        toast.add({
            title: 'เกิดข้อผิดพลาด',
            description: error.value || 'ไม่สามารถอัปโหลดไฟล์ได้',
            color: 'error'
        })
    } finally {
        state.isUploading = false
    }
}

/* ============================================
   File Management Handlers
============================================ */
const handleDownload = async (file: any) => {
    try {
        await downLoadFile(file.files_id, file.original_filename)
    } catch (err) {
        toast.add({
            title: 'ดาวน์โหลดไม่สำเร็จ',
            description: 'เกิดข้อผิดพลาดในการโหลดไฟล์',
            color: 'error'
        })
    }
}

const fileToDelete = computed(() => {
    if (!deleteModalState.selectedFile) return null
    return {
        id: deleteModalState.selectedFile.files_id,
        name: deleteModalState.selectedFile.original_filename
    }
})

const openDeleteModal = (file: any) => {
    deleteModalState.selectedFile = file
    deleteModalState.isOpen = true
}

const handleFileDeleted = (fileId: string | number) => {
    // ✅ emit ให้ parent อัปเดต sources แทน
    const updated = sources.value.filter((f: any) => f.files_id !== fileId)
    emit('update:sources', updated)
}

// ✅ ลบ loadChannelData(), onMounted, และ watch ออกทั้งหมด เพราะ parent จัดการแล้ว
</script>

<template>
    <!-- [RESPONSIVE] Desktop: aside ปกติ, Mobile: USlideover slide จากขวา -->

    <!-- ===== Desktop Sidebar ===== -->
    <aside
        class="w-80 bg-white dark:bg-neutral-800 border-r border-gray-200 dark:border-neutral-700 flex-col hidden lg:flex shadow-xl">

        <!-- Header with Gradient -->
        <div
            class="p-2 border-b border-gray-200 dark:border-gray-600 bg-linear-to-br from-primary-50/50 to-transparent dark:from-primary-950/20">
            <div class="flex items-center gap-2 mb-4">
                <h2 class="font-bold text-gray-800 dark:text-gray-100 text-lg">
                    แหล่งข้อมูล
                </h2>
            </div>

            <!-- Upload Button → ModalFileUpload -->
            <ModalFileUpload v-model="state.isModalOpen" :file-count="fileCount"
                :current-used-size-m-b="currentUsedSizeMB" :allowed-size="allowedSize" :is-uploading="state.isUploading"
                :loading="loading" @upload="handleFileUpload">
                <UButton block icon="i-heroicons-plus" color="primary" size="lg"
                    :disabled="loading || state.isUploading" @click.prevent="handleOpenModal">
                    <span class="flex items-center gap-2 text-md">เพิ่มแหล่งที่มา</span>
                </UButton>
            </ModalFileUpload>
        </div>

        <!-- File List -->
        <div class="flex-1 overflow-y-auto p-3 space-y-2">
            <!-- Loading State -->
            <div v-if="props.loading && sources.length === 0" class="flex items-center justify-center h-32">
                <div class="relative">
                    <div class="w-10 h-10 border-3 border-primary-200 dark:border-primary-900 rounded-full"></div>
                    <div
                        class="w-10 h-10 border-3 border-primary-600 rounded-full border-t-transparent animate-spin absolute inset-0">
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="sources.length === 0"
                class="flex flex-col items-center justify-center h-48 text-center px-4 py-8 rounded-2xl bg-linear-to-br">
                <div
                    class="w-16 h-16 rounded-2xl bg-linear-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center mb-3">
                    <UIcon name="i-heroicons-document" class="w-8 h-8 text-gray-400" />
                </div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">ยังไม่มีไฟล์</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">เริ่มเพิ่มแหล่งข้อมูลของคุณ</p>
            </div>

            <!-- File Items -->
            <div v-for="(file, index) in sources" :key="file.files_id"
                class="flex items-center justify-between p-3 rounded-xl hover:bg-linear-to-r hover:from-primary-50 hover:to-transparent dark:hover:from-primary-950/30 group transition-all duration-300 hover:shadow-md hover:scale-[1.02] border border-transparent hover:border-primary-200 dark:hover:border-primary-900"
                :style="{ animationDelay: `${index * 50}ms` }">
                <div class="flex items-center gap-3 truncate flex-1 min-w-0">
                    <div
                        class="w-10 h-10 rounded-lg bg-linear-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <UIcon name="i-heroicons-document-text"
                            class="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div class="flex-1 min-w-0">
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-200 truncate block"
                            :title="file.original_filename">
                            {{ file.original_filename }}
                        </span>
                        <span class="text-xs text-gray-400 dark:text-gray-500">
                            {{ (file.size_bytes / (1024 * 1024)).toFixed(1) }} MB
                        </span>
                    </div>
                </div>
                <UButton icon="i-heroicons-arrow-down-tray" color="primary" variant="ghost" size="sm"
                    @click.stop="handleDownload(file)"
                    class="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110" />
                <UButton icon="i-heroicons-trash" color="error" variant="ghost" size="sm"
                    @click.stop="openDeleteModal(file)"
                    class="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110" />
            </div>
        </div>

        <!-- Footer Progress -->
        <div
            class="border-t border-gray-200 dark:border-gray-600 bg-linear-to-t from-gray-50/80 to-transparent dark:from-gray-900/60 backdrop-blur-sm">
            <div class="px-4 py-3 space-y-3">
                <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-signal" class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                    <span class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        การใช้งาน
                    </span>
                </div>
                <div class="space-y-1.5">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5">
                            <UIcon name="i-heroicons-document-duplicate"
                                class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                            <span class="text-xs text-gray-500 dark:text-gray-400">จำนวนแหล่งที่มา</span>
                        </div>
                        <span class="text-xs font-bold tabular-nums"
                            :class="fileCount >= 50 ? 'text-red-500' : fileCount >= 40 ? 'text-amber-500' : 'text-primary-600 dark:text-primary-400'">
                            {{ fileCount }}<span class="font-normal text-gray-400">/50</span>
                        </span>
                    </div>
                    <UProgress :model-value="fileCount"
                        :color="fileCount >= 50 ? 'error' : fileCount >= 40 ? 'warning' : 'primary'" :max="50"
                        size="sm" />
                </div>
                <div class="space-y-1.5 pb-1">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5">
                            <UIcon name="i-heroicons-circle-stack"
                                class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                            <span class="text-xs text-gray-500 dark:text-gray-400">พื้นที่จัดเก็บ</span>
                        </div>
                        <span class="text-xs font-bold tabular-nums"
                            :class="authStore.role === 'admin' ? 'text-green-600' : currentUsedSizeMB >= allowedSize ? 'text-red-500' : currentUsedSizeMB >= allowedSize * 0.8 ? 'text-amber-500' : 'text-primary-600 dark:text-primary-400'">
                            {{ authStore.role === 'admin' ? '∞' : currentUsedSizeMB.toFixed(1) }}
                            <span class="font-normal text-gray-400">
                                / {{ authStore.role === 'admin' ? '∞' : `${allowedSize} MB` }}
                            </span>
                        </span>
                    </div>
                    <UProgress :model-value="authStore.role === 'admin' ? 1 : currentUsedSizeMB"
                        :max="authStore.role === 'admin' ? 1 : allowedSize"
                        :color="authStore.role === 'admin' ? 'primary' : currentUsedSizeMB >= allowedSize ? 'error' : currentUsedSizeMB >= allowedSize * 0.8 ? 'warning' : 'primary'"
                        size="sm" />
                </div>
            </div>
        </div>
    </aside>

    <!-- ===== Mobile Slideover ===== -->
    <USlideover :open="props.open" side="right" :ui="{ content: 'max-w-xs w-full' }"
        @update:open="(val) => emit('update:open', val)">
        <template #content>
            <div class="flex flex-col h-full bg-white dark:bg-neutral-800">

                <!-- Slideover Header -->
                <div
                    class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-neutral-700">
                    <div class="flex items-center gap-2.5">
                        <span class="text-base font-bold text-gray-900 dark:text-white">แหล่งข้อมูล</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <UColorModeButton class="cursor-pointer" />
                        <UButton icon="i-heroicons-x-mark" color="neutral" variant="ghost" size="sm"
                            @click="closeSlide" />
                    </div>
                </div>

                <div class="border-b border-gray-100 dark:border-neutral-700">
                    <UserMenu compact="Mobile" class="lg:hidden" />
                </div>

                <!-- Upload Button (Mobile) → ModalFileUpload -->
                <div class="px-3 pt-3">
                    <ModalFileUpload v-model="state.isModalOpen" :file-count="fileCount"
                        :current-used-size-m-b="currentUsedSizeMB" :allowed-size="allowedSize"
                        :is-uploading="state.isUploading" :loading="loading" @upload="handleFileUpload">
                        <UButton block icon="i-heroicons-plus" color="primary" size="lg"
                            :disabled="loading || state.isUploading"
                            class="cursor-pointer font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                            @click.prevent="handleOpenModal">
                            <span class="flex items-center gap-2">เพิ่มแหล่งที่มา</span>
                        </UButton>
                    </ModalFileUpload>
                </div>

                <!-- File List (Mobile) -->
                <div class="flex-1 overflow-y-auto p-3 space-y-2 mt-2">
                    <div v-if="props.loading && sources.length === 0" class="flex items-center justify-center h-32">
                        <div class="relative">
                            <div class="w-10 h-10 border-3 border-primary-200 dark:border-primary-900 rounded-full">
                            </div>
                            <div
                                class="w-10 h-10 border-3 border-primary-600 rounded-full border-t-transparent animate-spin absolute inset-0">
                            </div>
                        </div>
                    </div>
                    <div v-else-if="sources.length === 0"
                        class="flex flex-col items-center justify-center h-48 text-center px-4">
                        <div
                            class="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                            <UIcon name="i-heroicons-document" class="w-7 h-7 text-gray-400" />
                        </div>
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">ยังไม่มีไฟล์</p>
                        <p class="text-xs text-gray-400 mt-1">เริ่มเพิ่มแหล่งข้อมูลของคุณ</p>
                    </div>
                    <div v-for="(file, index) in sources" :key="file.files_id"
                        class="flex items-center gap-3 p-3 rounded-xl active:bg-primary-50 dark:active:bg-primary-950/30 transition-all border border-transparent active:border-primary-100 dark:active:border-primary-900 cursor-pointer select-none"
                        @click="isOwnerOrAdmin ? openActionSheet(file) : undefined">
                        <div
                            class="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                            <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-primary-500" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{{
                                file.original_filename }}</p>
                            <p class="text-xs text-gray-400">{{ (file.size_bytes / (1024 * 1024)).toFixed(1) }} MB</p>
                        </div>
                        <UIcon name="i-heroicons-ellipsis-vertical"
                            class="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
                    </div>
                </div>

                <!-- Mobile Action Sheet — UDrawer -->
                <UDrawer v-model:open="actionSheet.isOpen" direction="bottom" :handle="true"
                    :ui="{ container: 'max-w-sm mx-auto px-4 pb-6 pt-2' }">
                    <template #header>
                        <div class="flex items-center gap-3 px-1">
                            <div
                                class="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-primary-500" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                                    {{ actionSheet.selectedFile?.original_filename }}
                                </p>
                                <p class="text-xs text-gray-400 mt-0.5">
                                    {{ actionSheet.selectedFile
                                        ? ((actionSheet.selectedFile.size_bytes / (1024 * 1024)).toFixed(1)) + ' MB'
                                        : '' }}
                                </p>
                            </div>
                        </div>
                    </template>

                    <template #body>
                        <div class="space-y-2 pt-2">
                            <button
                                class="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-neutral-700/60 active:bg-primary-50 dark:active:bg-primary-950/40 transition-colors text-left"
                                @click="actionSheetDownload">
                                <div
                                    class="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center shrink-0">
                                    <UIcon name="i-heroicons-arrow-down-tray"
                                        class="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div>
                                    <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">ดาวน์โหลด</p>
                                    <p class="text-xs text-gray-400">บันทึกไฟล์ลงเครื่อง</p>
                                </div>
                            </button>

                            <button
                                class="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-neutral-700/60 active:bg-red-50 dark:active:bg-red-950/40 transition-colors text-left"
                                @click="actionSheetDelete">
                                <div
                                    class="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                                    <UIcon name="i-heroicons-trash" class="w-5 h-5 text-red-500 dark:text-red-400" />
                                </div>
                                <div>
                                    <p class="text-sm font-semibold text-red-600 dark:text-red-400">ลบไฟล์</p>
                                    <p class="text-xs text-gray-400">ลบออกถาวร ไม่สามารถกู้คืนได้</p>
                                </div>
                            </button>
                        </div>
                    </template>

                    <template #footer>
                        <UButton block color="neutral" variant="soft" size="lg" class="rounded-2xl"
                            @click="closeActionSheet">
                            ยกเลิก
                        </UButton>
                    </template>
                </UDrawer>

                <!-- Footer Progress (Mobile) -->
                <div class="border-t border-gray-200 dark:border-gray-600 px-4 py-3 space-y-2">
                    <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">การใช้งาน</p>
                    <div class="flex justify-between text-xs text-gray-500">
                        <span>ไฟล์</span>
                        <span class="font-bold" :class="fileCount >= 50 ? 'text-red-500' : 'text-primary-600'">{{
                            fileCount }}/50</span>
                    </div>
                    <UProgress :model-value="fileCount"
                        :color="fileCount >= 50 ? 'error' : fileCount >= 40 ? 'warning' : 'primary'" :max="50"
                        size="sm" />
                    <div class="flex justify-between text-xs text-gray-500">
                        <span>พื้นที่</span>
                        <span class="font-bold"
                            :class="currentUsedSizeMB >= allowedSize ? 'text-red-500' : 'text-primary-600'">
                            {{ authStore.role === 'admin' ? '∞' : currentUsedSizeMB.toFixed(1) }} / {{ authStore.role
                                === 'admin' ? '∞' : `${allowedSize} MB` }}
                        </span>
                    </div>
                    <UProgress :model-value="authStore.role === 'admin' ? 1 : currentUsedSizeMB"
                        :max="authStore.role === 'admin' ? 1 : allowedSize"
                        :color="authStore.role === 'admin' ? 'primary' : currentUsedSizeMB >= allowedSize ? 'error' : currentUsedSizeMB >= allowedSize * 0.8 ? 'warning' : 'primary'"
                        size="sm" />
                </div>
            </div>
        </template>
    </USlideover>

    <!-- Delete Modal Component -->
    <ModalDelete v-model:open="deleteModalState.isOpen" :item="fileToDelete" :delete-handler="(id) => deleteFile(id)"
        title="คุณต้องการลบไฟล์" description="การลบจะไม่สามารถย้อนกลับได้และไฟล์นี้จะถูกลบออกถาวร"
        @deleted="handleFileDeleted" />
</template>

<style scoped>
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