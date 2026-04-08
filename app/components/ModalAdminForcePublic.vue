<script setup lang="ts">
const { adminforceSetPublicChannel, loading } = useChannel()
const toast = useToast()

const props = defineProps<{
    open: boolean
    item: {
        channels_id: number
        title: string
    }
}>()

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
    (e: 'confirmed'): void
}>()

const close = () => {
    emit('update:open', false)
}

const handleConfirm = async () => {
    try {
        await adminforceSetPublicChannel(props.item.channels_id)

        toast.add({
            title: 'ดำเนินการสำเร็จ',
            description: `บังคับตั้งแชนแนล "${props.item.title}" เป็นสาธารณะเรียบร้อยแล้ว`,
            icon: 'i-lucide-check-circle',
            color: 'success'
        })

        emit('confirmed')
        close()
    } catch (e: any) {
        toast.add({
            title: 'Error',
            description: e?.data?.detail || e?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
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
                    class="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                    <UIcon name="i-lucide-globe" class="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">ตั้งเป็นสาธารณะ</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">ยืนยันการเปิดให้ทุกคนเข้าถึงแชนแนลนี้</p>
                </div>
            </div>
        </template>

        <template #body>
            <div
                class="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50">
                <p class="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">
                    คุณกำลังตั้งแชนแนล
                    <span class="font-black underline decoration-emerald-400">"{{ item.title }}"</span>
                    ให้เป็นสาธารณะ ทุกคนจะสามารถเข้าถึงเนื้อหาภายในได้ทันที
                </p>
            </div>
        </template>

        <template #footer>
            <div class="flex gap-3 justify-start w-full">
                <UButton size="lg" variant="ghost" color="neutral" class="cursor-pointer font-bold" @click="close"
                    :disabled="loading">
                    ยกเลิก
                </UButton>

                <UButton size="lg" color="success" @click="handleConfirm" :disabled="loading"
                    class="cursor-pointer px-6 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                    <UIcon v-if="loading" name="i-heroicons-arrow-path" class="animate-spin" />
                    <span>{{ loading ? 'กำลังดำเนินการ...' : 'ยืนยันการตั้งเป็นสาธารณะ' }}</span>
                </UButton>
            </div>
        </template>
    </UModal>
</template>
