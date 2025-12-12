<script setup lang="ts">
// สมมติว่าใน useChannel มี function channelRejected ที่คุณแปะมาให้แล้ว
const { channelRejected, loading } = useChannel()
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
    (e: 'rejected'): void // บอก parent ว่าปฏิเสธเรียบร้อย ให้ reload
}>()

const form = reactive({
    reason: ''
})

// Reset form ทุกครั้งที่เปิด Modal
watch(
    () => props.open,
    (isOpen) => {
        if (isOpen) {
            form.reason = ''
        }
    }
)

const close = () => {
    emit('update:open', false)
}

const handleSubmit = async () => {
    // Validation: บังคับให้ใส่เหตุผล
    if (!form.reason.trim()) {
        toast.add({
            title: 'กรุณาระบุเหตุผล',
            description: 'จำเป็นต้องระบุสาเหตุในการปฏิเสธคำขอ',
            icon: 'i-lucide-alert-circle',
            color: 'warning'
        })
        return
    }

    try {
        // เรียก API: approve = false, ส่ง reason ไปด้วย
        await channelRejected(props.item.channels_id, false, form.reason.trim())

        toast.add({
            title: 'ดำเนินการสำเร็จ',
            description: `ปฏิเสธแชนแนล ${props.item.title} เรียบร้อยแล้ว`,
            icon: 'i-lucide-check-circle',
            color: 'success'
        })

        emit('rejected') // สั่ง parent reload
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
    <UModal :open="open" @update:open="emit('update:open', $event)" title="ปฏิเสธคำขอ (Reject)">
        <template #body>
            <UForm @submit.prevent="handleSubmit">

                <div class="mb-4 text-gray-600 dark:text-gray-300">
                    คุณต้องการปฏิเสธคำขอเผยแพร่ของแชนแนล <span class="font-bold text-primary">{{ item.title }}</span>
                    ใช่หรือไม่?
                </div>

                <UFormField name="reason" label="ระบุเหตุผลในการปฏิเสธ (Reason)" size="xl" required>
                    <UTextarea v-model="form.reason" size="xl" placeholder="เช่น เนื้อหาไม่เหมาะสม, ผิดกฎการใช้งาน..."
                        class="w-full pt-2" :rows="4" />
                </UFormField>

                <div class="pt-5 flex gap-2 justify-end">
                    <UButton size="lg" variant="ghost" class="cursor-pointer" @click="close" type="button">
                        ยกเลิก
                    </UButton>

                    <UButton size="lg" color="error" type="submit" :disabled="loading"
                        class="cursor-pointer flex items-center justify-center gap-2">
                        <UIcon v-if="loading" name="i-heroicons-arrow-path" class="animate-spin" />
                        <span>{{ loading ? 'กำลังดำเนินการ...' : 'ยืนยันการปฏิเสธ' }}</span>
                    </UButton>
                </div>

            </UForm>
        </template>
    </UModal>
</template>