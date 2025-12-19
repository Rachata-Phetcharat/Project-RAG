<script setup lang="ts">
const { deleteChannel, loading } = useChannel()
const toast = useToast()

const props = defineProps<{
    open: boolean         // รับสถานะเปิดจาก v-model:open
    item: {
        channels_id: number
        title: string
    }
}>()

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void  // สำหรับ v-model:open
    (e: 'deleted'): void                      // บอก parent ว่าลบเสร็จแล้ว
}>()

const close = () => {
    emit('update:open', false)
}

const handleDelete = async () => {
    const id = props.item.channels_id

    try {
        await deleteChannel(id)
        toast.add({
            title: 'Successful!',
            description: `ลบแชนแนล ${props.item.title} แล้ว`,
            icon: 'i-lucide-check-circle',
            color: 'success'
        })

        emit('deleted')   // ให้ parent ไป reload list
        close()
    } catch (e: any) {
        toast.add({
            title: 'Error',
            description: e?.data?.detail || e?.message || 'ลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
            icon: 'i-lucide-x-circle',
            color: 'error'
        })
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
                    class="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                    <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">ยืนยันการลบแชนแนล</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">ระวัง: ข้อมูลทั้งหมดจะหายไป</p>
                </div>
            </div>
        </template>

        <template #body>
            <div class="space-y-4">
                <UAlert color="error" variant="soft" icon="i-heroicons-exclamation-circle">
                    <template #title>คำเตือนสำคัญ</template>
                    <template #description>
                        การลบจะไม่สามารถย้อนกลับมาได้ และเอกสารทุกไฟล์ภายในแชนแนลนี้จะถูกลบออกถาวร
                    </template>
                </UAlert>

                <p class="text-gray-700 dark:text-gray-300">
                    คุณต้องการลบแชนแนล
                    <span class="font-bold text-red-600 dark:text-red-400">"{{ item?.title }}"</span>
                    ใช่หรือไม่?
                </p>
            </div>
        </template>

        <template #footer>
            <div class="flex gap-3 justify-end">
                <UButton size="lg" color="neutral" variant="ghost" class="cursor-pointer" @click="close"
                    :disabled="loading">
                    ยกเลิก
                </UButton>

                <UButton size="lg" color="error" @click="handleDelete" :disabled="loading"
                    class="cursor-pointer flex items-center justify-center gap-2 shadow-md">
                    <UIcon v-if="loading" name="i-heroicons-arrow-path" class="animate-spin" />
                    <span>{{ loading ? 'กำลังลบแชนแนล...' : 'ลบแชนแนล' }}</span>
                </UButton>
            </div>
        </template>
    </UModal>
</template>