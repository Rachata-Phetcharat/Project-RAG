<script setup lang="ts">
const props = defineProps<{
    open: boolean
}>()

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
    (e: 'confirmed'): void
}>()

const isLoading = ref(false)

const close = () => {
    emit('update:open', false)
}

const handleLogout = async () => {
    isLoading.value = true
    try {
        emit('confirmed')
        close()
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <UModal :open="open" @update:open="emit('update:open', $event)" :ui="{
        content: 'sm:max-w-md',
        overlay: 'backdrop-blur-sm'
    }">
        <template #header>
            <div class="flex items-center gap-3">
                <div
                    class="w-10 h-10 rounded-xl bg-linear-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                    <UIcon name="i-lucide-log-out" class="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">ยืนยันการออกจากระบบ</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">คุณต้องการออกจากระบบใช่หรือไม่?</p>
                </div>
            </div>
        </template>

        <template #body>
            <div class="space-y-4">
                <UAlert color="warning" variant="soft" icon="i-heroicons-exclamation-circle">
                    <template #title>แจ้งเตือน</template>
                    <template #description>
                        หากออกจากระบบ คุณจะต้องเข้าสู่ระบบใหม่อีกครั้ง
                    </template>
                </UAlert>
            </div>
        </template>

        <template #footer>
            <div class="flex gap-3 justify-end">
                <UButton size="lg" color="neutral" variant="ghost" class="cursor-pointer" @click="close"
                    :disabled="isLoading">
                    ยกเลิก
                </UButton>

                <UButton size="lg" color="error" @click="handleLogout" :disabled="isLoading"
                    class="cursor-pointer flex items-center justify-center gap-2 shadow-md">
                    <UIcon v-if="isLoading" name="i-heroicons-arrow-path" class="animate-spin" />
                    <span>{{ isLoading ? 'กำลังออกจากระบบ...' : 'ยืนยันออกจากระบบ' }}</span>
                </UButton>
            </div>
        </template>
    </UModal>
</template>
