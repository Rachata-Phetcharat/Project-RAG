<script setup lang="ts">
const toast = useToast()

interface DeleteItem {
    id: string | number
    name: string
}

const props = defineProps<{
    open: boolean
    item: DeleteItem | null
    title: string
    description?: string
    loading?: boolean
    deleteHandler: (id: string | number) => Promise<void>
}>()

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
    (e: 'deleted', id: string | number): void
}>()

const isDeleting = ref(false)

const close = () => {
    emit('update:open', false)
}

const handleDelete = async () => {
    if (!props.item) return

    isDeleting.value = true
    try {
        await props.deleteHandler(props.item.id)

        toast.add({
            title: 'สำเร็จ!',
            description: `ลบ "${props.item.name}" เรียบร้อยแล้ว`,
            icon: 'i-lucide-check-circle',
            color: 'success'
        })

        emit('deleted', props.item.id)
        close()
    } catch (e: any) {
        toast.add({
            title: 'เกิดข้อผิดพลาด',
            description: e?.data?.detail || e?.message || 'ลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
            icon: 'i-lucide-x-circle',
            color: 'error'
        })
    } finally {
        isDeleting.value = false
    }
}

const loading = computed(() => props.loading || isDeleting.value)
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
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">ยืนยันการลบ</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
                </div>
            </div>
        </template>

        <template #body>
            <div class="space-y-4" v-if="item">
                <UAlert color="error" variant="soft" icon="i-heroicons-exclamation-circle">
                    <template #title>คำเตือนสำคัญ</template>
                    <template #description>
                        {{ description || 'การลบจะไม่สามารถย้อนกลับได้ และข้อมูลจะถูกลบออกถาวร' }}
                    </template>
                </UAlert>

                <p class="text-gray-700 dark:text-gray-300">
                    {{ title }}
                    <span class="font-semibold text-red-600 dark:text-red-400">"{{ item.name }}"</span>
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
                    <span>{{ loading ? 'กำลังลบ...' : 'ยืนยันการลบ' }}</span>
                </UButton>
            </div>
        </template>
    </UModal>
</template>