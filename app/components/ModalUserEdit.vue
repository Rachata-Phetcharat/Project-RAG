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
    defaultFileSizeMb: number
    saveHandler: (userId: number, role: string, fileSizeByte: number | null) => Promise<void>
}>()

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
}>()

const form = reactive({
    role: '',
    fileSizeMb: 0,
})
const originalRole = ref('')
const originalFileSizeMb = ref(0)
const isSaving = ref(false)

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

// normalize กันเผื่อ USelect emit เป็น object { label, value }
const normalizedRole = computed(() =>
    typeof form.role === 'object' ? (form.role as any)?.value ?? '' : form.role
)

const isAdmin = computed(() => normalizedRole.value === 'admin')
const isUser = computed(() => normalizedRole.value === 'user')

watch(normalizedRole, (newVal, oldVal) => {
    if (newVal === oldVal) return
    if (newVal === 'user') {
        // user → ล็อก filesize ที่ค่า default ของ account_type, ห้ามแก้
        form.fileSizeMb = props.defaultFileSizeMb
    } else if (newVal === 'special') {
        // special → คืนค่าเดิมของ user ก่อน ให้กรอกเองได้
        form.fileSizeMb = originalFileSizeMb.value
    }
    // admin → ซ่อน field อยู่แล้ว ไม่ต้องเซ็ต fileSizeMb
})

const isDirty = computed(() => {
    const roleChanged = normalizedRole.value !== originalRole.value
    // user/admin ไม่นับ fileSizeMb เป็น dirty (ไม่ส่งค่าไปด้วย)
    const fileSizeChanged = !isAdmin.value && !isUser.value &&
        form.fileSizeMb !== originalFileSizeMb.value
    return roleChanged || fileSizeChanged
})

const close = () => emit('update:open', false)

const onSubmit = async () => {
    if (!props.user || !isDirty.value) { close(); return }

    isSaving.value = true
    try {
        // user/admin → null (ไม่แก้ filesize ผ่าน modal นี้)
        // special    → ส่ง fileSizeByte ที่กรอก
        const fileSizeByte = (isAdmin.value || isUser.value) ? null : form.fileSizeMb * 1024 * 1024
        await props.saveHandler(props.user.users_id, normalizedRole.value, fileSizeByte)

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

                    <!-- admin: ไม่จำกัด -->
                    <div v-if="isAdmin"
                        class="flex items-center gap-2 h-10 px-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <UIcon name="i-lucide-infinity" class="w-4 h-4 text-gray-400" />
                        <span class="text-sm text-gray-500 dark:text-gray-400">ไม่จำกัด (admin)</span>
                    </div>

                    <!-- user: แสดงค่า default, ปิดแก้ไข -->
                    <div v-else-if="isUser"
                        class="flex items-center gap-2 h-10 px-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-60">
                        <UIcon name="i-lucide-lock" class="w-4 h-4 text-gray-400" />
                        <span class="text-sm text-gray-500 dark:text-gray-400">
                            {{ defaultFileSizeMb }} MB (ค่าเริ่มต้นของประเภทบัญชี)
                        </span>
                    </div>

                    <!-- special: กรอกได้ -->
                    <div v-else class="flex items-center gap-2">
                        <UInput v-model="form.fileSizeMb" type="number" size="lg" class="flex-1" placeholder="0"
                            :min="0" />
                        <span class="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">MB</span>
                    </div>

                    <p v-if="!isAdmin && !isUser && form.fileSizeMb !== originalFileSizeMb"
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