<script setup lang="ts">
const toast = useToast()


interface AccountTypeItem {
    account_type_id: number
    type_name: string
    file_size_byte: number
}

const props = defineProps<{
    open: boolean
    loading?: boolean
    accountType: AccountTypeItem[]
    saveHandler: (accountTypeId: number, mb: number) => Promise<void>
}>()

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
}>()

// ── local state ──────────────────────────────────────────────
const editingValues = ref<Record<number, number>>({})
const originalValues = ref<Record<number, number>>({})
const isSaving = ref(false)

// sync ค่าจาก prop ทุกครั้งที่ modal เปิด
watch(
    () => props.open,
    (isOpen) => {
        if (!isOpen) return
        props.accountType.forEach((item) => {
            const mb = item.file_size_byte / (1024 * 1024)
            editingValues.value[item.account_type_id] = mb
            originalValues.value[item.account_type_id] = mb
        })
    },
    { immediate: true }
)

const isDirty = computed(() =>
    props.accountType.some(
        (item) => editingValues.value[item.account_type_id] !== originalValues.value[item.account_type_id]
    )
)

const labelOf = (typeName: string) => {
    const map: Record<string, string> = {
        student: 'นักศึกษา',
        personnel: 'อาจารย์/บุคลากร',
    }
    return map[typeName.trim()] ?? typeName
}

const close = () => emit('update:open', false)

const onSubmit = async () => {
    if (!isDirty.value) {
        close()
        return
    }

    isSaving.value = true
    try {
        const changed = props.accountType.filter(
            (item) => editingValues.value[item.account_type_id] !== originalValues.value[item.account_type_id]
        )
        await Promise.all(
            changed.map((item) =>
                props.saveHandler(item.account_type_id, editingValues.value[item.account_type_id] ?? 0)
            )
        )
        toast.add({
            title: 'บันทึกสำเร็จ!',
            description: 'อัปเดตขนาดไฟล์เริ่มต้นแล้ว',
            icon: 'i-lucide-check-circle',
            color: 'success',
        })
        close()
    } catch (e: any) {
        toast.add({
            title: 'เกิดข้อผิดพลาด',
            description: e?.data?.detail || e?.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
            icon: 'i-lucide-x-circle',
            color: 'error',
        })
    } finally {
        isSaving.value = false
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
                    class="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <UIcon name="i-lucide-hard-drive" class="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">ขนาดไฟล์เริ่มต้น</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">กำหนดขนาดไฟล์สูงสุดของแต่ละประเภทบัญชี</p>
                </div>
            </div>
        </template>

        <template #body>
            <div class="space-y-4">
                <div v-for="item in accountType.filter(
                    i => i.type_name.trim() === 'student' || i.type_name.trim() === 'personnel'
                )" :key="item.account_type_id">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {{ labelOf(item.type_name) }}
                    </label>
                    <div class="flex items-center gap-2">
                        <UInput v-model="editingValues[item.account_type_id]" type="number" size="lg" class="flex-1"
                            placeholder="0" />
                        <span class="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">MB</span>
                    </div>
                    <!-- แสดงค่าเดิมถ้ามีการแก้ -->
                    <p v-if="editingValues[item.account_type_id] !== originalValues[item.account_type_id]"
                        class="mt-1 text-xs text-amber-500 dark:text-amber-400">
                        ค่าเดิม: {{ originalValues[item.account_type_id] }} MB
                    </p>
                </div>
            </div>
        </template>

        <template #footer>
            <div class="flex justify-end gap-3">
                <UButton size="lg" color="neutral" variant="ghost" class="cursor-pointer" :disabled="isSaving"
                    @click="close">
                    ยกเลิก
                </UButton>
                <UButton size="lg" color="primary" :loading="isSaving || loading" :disabled="isSaving || !isDirty"
                    class="cursor-pointer px-6 shadow-md" @click="onSubmit">
                    บันทึก
                </UButton>
            </div>
        </template>
    </UModal>
</template>
