<script setup lang="ts">
/* ============================================
   Props & Emits
============================================ */
const props = defineProps<{
    modelValue: boolean
    fileCount: number
    currentUsedSizeMB: number
    allowedSize: number
    isUploading: boolean
    loading?: boolean
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'upload': [files: File[]]
}>()

const authStore = useAuthStore()

/* ============================================
   Computed
============================================ */
const isOpen = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

/* ============================================
   File Upload Handler
============================================ */
const handleFileChange = (event: any) => {
    const files = event.target?.files || event.dataTransfer?.files || event
    if (!files || files.length === 0) return
    const fileArray = Array.from(files) as File[]
    emit('upload', fileArray)
}
</script>

<template>
    <UModal v-model="isOpen" :ui="{
        content: 'sm:max-w-[900px]',
        overlay: 'backdrop-blur-sm'
    }">
        <!-- Trigger Slot (default slot) -->
        <slot />

        <!-- Header -->
        <template #header>
            <div class="flex items-center gap-3">
                <div
                    class="w-10 h-10 rounded-xl bg-linear-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                    <UIcon name="i-heroicons-document-plus" class="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">เพิ่มแหล่งที่มา</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        อัปโหลดเอกสารเพื่อให้ AI วิเคราะห์ข้อมูล
                    </p>
                </div>
            </div>
        </template>

        <!-- Body -->
        <template #body>
            <div class="p-6 space-y-6">
                <!-- Upload Zone -->
                <div class="relative group">
                    <div
                        class="border-3 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl h-64 flex flex-col items-center justify-center bg-linear-to-br from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-900/50 hover:from-primary-50 hover:to-blue-50 dark:hover:from-primary-950/20 dark:hover:to-blue-950/20 hover:border-primary-400 dark:hover:border-primary-600 transition-all duration-300 cursor-pointer group-hover:shadow-2xl group-hover:scale-[1.01]">

                        <!-- Default State -->
                        <div v-if="!isUploading"
                            class="flex flex-col items-center text-center space-y-4 pointer-events-none">
                            <div
                                class="w-16 h-16 bg-linear-to-br from-primary-500 to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <UIcon name="i-heroicons-cloud-arrow-up" class="w-8 h-8" />
                            </div>
                            <h4 class="text-xl font-bold text-gray-800 dark:text-gray-100">
                                อัปโหลดแหล่งข้อมูล
                            </h4>
                            <p class="text-gray-600 dark:text-gray-300 text-base">
                                ลากและวาง หรือ
                                <span class="text-primary-600 dark:text-primary-400 font-semibold">
                                    คลิกเพื่อเลือกไฟล์
                                </span>
                            </p>
                            <div class="flex items-center gap-4 text-sm text-gray-500">
                                <div class="flex items-center gap-1.5">
                                    <UIcon name="i-heroicons-document-text" class="w-4 h-4" />
                                    <span>PDF หรือ TEXT</span>
                                </div>
                            </div>
                        </div>

                        <!-- Loading State -->
                        <div v-else class="flex flex-col items-center gap-4">
                            <div class="relative">
                                <div class="w-16 h-16 border-4 border-primary-200 dark:border-primary-900 rounded-full">
                                </div>
                                <div
                                    class="w-16 h-16 border-4 border-primary-600 rounded-full border-t-transparent animate-spin absolute inset-0">
                                </div>
                            </div>
                            <p class="text-gray-700 dark:text-gray-200 font-medium text-lg">
                                กำลังอัปโหลด...
                            </p>
                        </div>

                        <!-- File Input -->
                        <input type="file" multiple accept=".pdf,.txt"
                            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" :disabled="isUploading"
                            @change="handleFileChange" />
                    </div>
                </div>
            </div>
        </template>

        <!-- Progress Footer -->
        <template #footer>
            <div
                class="px-6 py-4 bg-gray-50/80 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-800 w-full">
                <div class="flex items-center gap-2 mb-3">
                    <UIcon name="i-heroicons-signal" class="w-3.5 h-3.5 text-gray-400" />
                    <span class="text-xs font-semibold uppercase tracking-wider text-gray-400">การใช้งานปัจจุบัน</span>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <!-- File Count -->
                    <div class="space-y-1.5">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-1.5">
                                <UIcon name="i-heroicons-document-duplicate" class="w-3.5 h-3.5 text-gray-400" />
                                <span class="text-xs text-gray-500 dark:text-gray-400">แหล่งที่มา</span>
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

                    <!-- Storage Size -->
                    <div class="space-y-1.5">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-1.5">
                                <UIcon name="i-heroicons-circle-stack" class="w-3.5 h-3.5 text-gray-400" />
                                <span class="text-xs text-gray-500 dark:text-gray-400">พื้นที่</span>
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
        </template>
    </UModal>
</template>