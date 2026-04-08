<script setup lang="ts">
const { adminforceSetPrivateChannel, loading } = useChannel()
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

const form = reactive({
    reason: ''
})

watch(
    () => props.open,
    (isOpen) => {
        if (!isOpen) {
            form.reason = ''
        }
    }
)

const close = () => {
    emit('update:open', false)
}

const handleSubmit = async () => {
    try {
        await adminforceSetPrivateChannel(props.item.channels_id, form.reason.trim())

        toast.add({
            title: 'ดำเนินการสำเร็จ',
            description: `บังคับตั้งแชนแนล "${props.item.title}" เป็นส่วนตัวเรียบร้อยแล้ว`,
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
                    class="w-10 h-10 rounded-xl bg-linear-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg">
                    <UIcon name="i-lucide-lock" class="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">ตั้งเป็นส่วนตัว</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">ระบุเหตุผลที่ต้องการตั้งแชนแนลนี้เป็นส่วนตัว</p>
                </div>
            </div>
        </template>

        <template #body>
            <UForm @submit.prevent="handleSubmit" class="space-y-5">
                <div
                    class="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50">
                    <p class="text-sm text-rose-800 dark:text-rose-200 leading-relaxed">
                        คุณกำลังตั้งแชนแนล
                        <span class="font-black underline decoration-rose-400">"{{ item.title }}"</span>
                        ให้เป็นส่วนตัว ระบบจะแจ้งเหตุผลนี้กลับไปยังเจ้าของแชนแนล
                    </p>
                </div>

                <UFormField name="reason" label="ระบุเหตุผล (Required)" size="xl" required>
                    <UTextarea v-model="form.reason" size="xl" :autofocus="false"
                        placeholder="เช่น เนื้อหาไม่เหมาะสม, ละเมิดนโยบาย หรือผิดกฎการใช้งาน..." class="w-full"
                        :rows="4" />
                </UFormField>
            </UForm>
        </template>

        <template #footer>
            <div class="flex gap-3 justify-start w-full">
                <UButton size="lg" variant="ghost" color="neutral" class="cursor-pointer font-bold" @click="close"
                    :disabled="loading">
                    ยกเลิก
                </UButton>

                <UButton size="lg" color="error" @click="handleSubmit" :disabled="loading"
                    class="cursor-pointer px-6 flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20">
                    <UIcon v-if="loading" name="i-heroicons-arrow-path" class="animate-spin" />
                    <span>{{ loading ? 'กำลังดำเนินการ...' : 'ยืนยันการตั้งเป็นส่วนตัว' }}</span>
                </UButton>
            </div>
        </template>
    </UModal>
</template>
