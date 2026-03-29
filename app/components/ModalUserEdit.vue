<script setup lang="ts">
const toast = useToast()

interface UserItem {
    users_id: number
    username: string
    name: string
    role: string
    account_type: string
    file_size_byte: number
}

const props = defineProps<{
    open: boolean
    loading?: boolean
    user: UserItem | null
    roleItems: { label: string; value: string }[]
    isSelf: boolean
    defaultFileSizeMb: number   // ค่า default ของ account_type นั้น
    saveHandler: (userId: number, role: string, fileSizeByte: number | null) => Promise<void>
}>()

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
}>()

// ── local form state ──────────────────────────────────────────
const form = reactive({
    role: '',
    fileSizeMb: 0,
})
const originalRole = ref('')
const originalFileSizeMb = ref(0)
const isSaving = ref(false)

// sync เมื่อ modal เปิด หรือ user เปลี่ยน
watch(
    () => [props.open, props.user],
    ([isOpen]) => {
        if (!isOpen || !props.user) return
        form.role = props.user.role
        form.fileSizeMb = props.user.file_size_byte / (1024 * 1024)
        originalRole.value = props.user.role
        originalFileSizeMb.value = props.user.file_size_byte / (1024 * 1024)
    },
    { immediate: true }
)

// ปรับ fileSizeMb ให้สอดคล้องกับ role ที่เลือก
watch(
    () => form.role,
    (newRole, oldRole) => {
        if (newRole === oldRole) return
        if (newRole === 'user') {
            // เปลี่ยนเป็น user → reset เป็น default ของ account_type ทันที
            form.fileSizeMb = props.defaultFileSizeMb
        } else if (oldRole === 'admin') {
            // เปลี่ยนออกจาก admin → คืนค่าเดิมของ user
            form.fileSizeMb = originalFileSizeMb.value
        }
    }
)

const isAdmin = computed(() => form.role === 'admin')

const isDirty = computed(() =>
    form.role !== originalRole.value ||
    (!isAdmin.value && form.fileSizeMb !== originalFileSizeMb.value)
)

const close = () => emit('update:open', false)

const onSubmit = async () => {
    if (!props.user || !isDirty.value) { close(); return }

    isSaving.value = true
    try {
        const fileSizeByte = isAdmin.value ? null : form.fileSizeMb * 1024 * 1024
        await props.saveHandler(props.user.users_id, form.role, fileSizeByte)

        toast.add({
            title: 'บันทึกสำเร็จ!',
            description: `อัปเดตข้อมูลของ ${props.user.name} แล้ว`,
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
        content: 'sm:max-w-sm',
        overlay: 'backdrop-blur-sm'
    }">
        <template #header>
            <div class="flex items-center gap-3">
                <div
                    class="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shrink-0">
                    <UIcon name="i-lucide-user-pen" class="w-5 h-5 text-white" />
                </div>
                <div class="min-w-0">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white truncate">
                        {{ user?.name }}
                    </h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{{ user?.username }} · {{ user?.account_type }}
                    </p>
                </div>
            </div>
        </template>

        <template #body>
            <div class="space-y-5">
                <!-- Role -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        สิทธิ์การใช้งาน
                    </label>
                    <USelect v-model="form.role" :items="roleItems" color="neutral" size="lg" class="w-full"
                        :disabled="isSelf" />
                    <p v-if="isSelf" class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        ไม่สามารถแก้ไขสิทธิ์ของตัวเองได้
                    </p>
                </div>

                <!-- File size -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        ขนาดไฟล์สูงสุด
                    </label>
                    <div v-if="isAdmin"
                        class="flex items-center gap-2 h-10 px-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <UIcon name="i-lucide-infinity" class="w-4 h-4 text-gray-400" />
                        <span class="text-sm text-gray-500 dark:text-gray-400">ไม่จำกัด (admin)</span>
                    </div>
                    <div v-else class="flex items-center gap-2">
                        <UInput v-model="form.fileSizeMb" type="number" size="lg" class="flex-1" placeholder="0" />
                        <span class="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">MB</span>
                    </div>
                    <p v-if="!isAdmin && form.fileSizeMb !== originalFileSizeMb"
                        class="mt-1 text-xs text-amber-500 dark:text-amber-400">
                        ค่าเดิม: {{ originalFileSizeMb }} MB
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