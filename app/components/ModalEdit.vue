<script setup lang="ts">
const { updateChannel, loading } = useChannel()
const toast = useToast()

const props = defineProps<{
    open: boolean         // ใช้กับ v-model:open จาก parent
    item: {
        channels_id: number
        title: string
        description?: string | null
    }
}>()

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void  // สำหรับ v-model:open
    (e: 'edit'): void                         // บอก parent ว่าแก้ไขเสร็จแล้ว
}>()

const form = reactive({
    title: '',
    description: ''
})

// sync ค่า props.item -> form เวลาเปิด modal หรือเปลี่ยน item
watch(
    () => props.item,
    (val) => {
        if (!val) return
        form.title = val.title ?? ''
        form.description = val.description ?? ''
    },
    { immediate: true }
)

const close = () => {
    emit('update:open', false)
}

const handleEdit = async () => {
    if (!form.title.trim()) {
        toast.add({
            title: 'กรุณากรอกชื่อแชนแนล',
            icon: 'i-lucide-alert-circle',
            color: 'warning'
        })
        return
    }

    try {
        await updateChannel(props.item.channels_id, {
            title: form.title.trim(),
            description: form.description
        })

        toast.add({
            title: 'บันทึกสำเร็จ!',
            description: `แก้ไขแชนแนล ${form.title} แล้ว`,
            icon: 'i-lucide-check-circle',
            color: 'success'
        })

        emit('edit')   // ให้ parent reload list
        close()
    } catch (e: any) {
        toast.add({
            title: 'Error',
            description:
                e?.data?.detail || e?.message || 'แก้ไขไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
            icon: 'i-lucide-x-circle',
            color: 'error'
        })
    }
}
</script>

<template>
    <UModal :open="open" @update:open="emit('update:open', $event)" :ui="{
        content: 'sm:max-w-lg',
        overlay: 'backdrop-blur-sm'
    }">
        <template #header>
            <div class="flex items-center gap-3">
                <div
                    class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                    <UIcon name="i-heroicons-pencil-square" class="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">แก้ไขข้อมูลแชนแนล</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">ปรับปรุงชื่อและรายละเอียดของแชนแนลของคุณ</p>
                </div>
            </div>
        </template>

        <template #body>
            <UForm @submit.prevent="handleEdit" class="space-y-6 py-2">
                <UFormField name="title" label="ชื่อแชนแนล" size="xl" required>
                    <UInput v-model="form.title" type="text" size="xl" placeholder="กรอกชื่อแชนแนลใหม่..."
                        class="w-full" @keyup.enter="handleEdit" icon="i-heroicons-tag" />
                </UFormField>

                <UFormField name="description" label="รายละเอียดแชนแนล" size="xl">
                    <UTextarea v-model="form.description" size="xl" placeholder="เพิ่มคำอธิบายเกี่ยวกับแชนแนลนี้..."
                        class="w-full" :rows="4" />
                </UFormField>
            </UForm>
        </template>

        <template #footer>
            <div class="flex gap-3 justify-end">
                <UButton size="lg" color="neutral" variant="ghost" class="cursor-pointer" @click="close" type="button"
                    :disabled="loading">
                    ยกเลิก
                </UButton>

                <UButton size="lg" type="submit" color="primary" :disabled="loading"
                    class="cursor-pointer flex items-center justify-center gap-2 shadow-md px-6" @click="handleEdit">
                    <UIcon v-if="loading" name="i-heroicons-arrow-path" class="animate-spin" />
                    <span>{{ loading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข' }}</span>
                </UButton>
            </div>
        </template>
    </UModal>
</template>