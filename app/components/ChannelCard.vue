<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'

// Composables
const {
    statusChannel,
    requestPublicChannel,
    cancelRequestPublicChannel,
    ownerSetPrivateChannel,
    adminforceSetPrivateChannel,
    adminforceSetPublicChannel,
    createChannel,
    updateChannel,
    deleteChannel,
    loading
} = useChannel()

const authStore = useAuthStore()
const toast = useToast()

// Emit & Props
const emit = defineEmits<{ (e: 'load'): void }>()

const props = defineProps<{
    item: {
        channels_id: number
        title: string
        description?: string | null
        status?: string | null
        created_by_name: string
        created_by_id: number
        created_at?: string | null
        file_count?: number | null
    }
}>()

const isLoggedIn = computed(() => authStore.isLoggedIn)
const isAdmin = computed(() => authStore.role === 'admin')

const isOwner = computed(() => {
    if (!authStore.user) return false
    return authStore.user.users_id === props.item.created_by_id
})

const isPublicChannel = computed(() => props.item.status === 'public')

/* =============================== */
/* Modal States                    */
/* =============================== */
const modals = ref({
    delete: false,
    edit: false,
    detail: false,
    rejected: false
})

const channelToDelete = computed(() => {
    if (!props.item) return null
    return {
        id: props.item.channels_id,
        name: props.item.title
    }
})

const handleCreate = async (data: { title: string; description: string }) => {
    const id = await createChannel(data)
    navigateTo(`/channels/${id}`)
}

const handleEdit = async (id: number, data: { title: string; description: string }) => {
    await updateChannel(id, data)
    emit('load')
}

const openModal = (type: keyof typeof modals.value) => {
    modals.value[type] = true
}

/* =============================== */
/* Card Information                */
/* =============================== */
const cardInfo = computed(() => ({
    title: props.item.title || 'Untitled Channel',
    description: props.item.description || 'ยังไม่ได้เขียนคำอธิบายแชนแนล',
    link: `/channels/${props.item.channels_id}`,
    fileCount: props.item.file_count ?? 0,
    createdBy: props.item.created_by_name,
    createdAt: props.item.created_at
        ? new Date(props.item.created_at).toLocaleString('th-TH', {
            timeZone: 'Asia/Bangkok',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'ไม่ทราบวันที่',
    createdAtShort: props.item.created_at
        ? new Date(props.item.created_at).toLocaleString('th-TH', {
            timeZone: 'Asia/Bangkok',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
        : 'ไม่ทราบวันที่'
}))

/* =============================== */
/* Status Badge Configuration      */
/* =============================== */
const STATUS_CONFIG = {
    public: {
        color: 'emerald',
        label: 'Public',
        icon: 'i-lucide-globe',
        gradient: 'from-emerald-500 to-green-500'
    },
    private: {
        color: 'rose',
        label: 'Private',
        icon: 'i-lucide-lock',
        gradient: 'from-rose-500 to-pink-500'
    },
    pending: {
        color: 'amber',
        label: 'Pending',
        icon: 'i-lucide-clock',
        gradient: 'from-amber-500 to-orange-500'
    }
} as const

const statusBadge = computed(() => {
    const status = props.item.status as keyof typeof STATUS_CONFIG
    return STATUS_CONFIG[status] || {
        color: 'gray',
        label: status,
        icon: 'i-lucide-help-circle',
        gradient: 'from-gray-500 to-gray-600'
    }
})

/* =============================== */
/* Status Actions                  */
/* =============================== */
const handleAction = async (action: () => Promise<void>, successMsg: string, errorMsg: string) => {
    if (loading.value) return
    try {
        await action()
        toast.add({ title: successMsg, color: 'success' })
        emit('load')
    } catch (error) {
        toast.add({ title: 'เกิดข้อผิดพลาด', description: errorMsg, color: 'error' })
    }
}

const handleRequestPublic = () => handleAction(
    async () => { await requestPublicChannel(props.item.channels_id) },
    'ส่งคำขอเรียบร้อยแล้ว',
    'ไม่สามารถส่งคำขอได้'
)

const handleCancelRequest = () => handleAction(
    async () => { await cancelRequestPublicChannel(props.item.channels_id) },
    'ยกเลิกคำขอเรียบร้อยแล้ว',
    'ไม่สามารถยกเลิกคำขอได้'
)

const handleSetPrivate = () => handleAction(
    async () => { await ownerSetPrivateChannel(props.item.channels_id) },
    'ตั้งค่าเป็นส่วนตัวเรียบร้อยแล้ว',
    'ดำเนินการไม่สำเร็จ'
)

/* =============================== */
/* Status Switch (Admin)           */
/* =============================== */
const isPublic = ref(props.item.status === 'public')
const statusLoading = ref(false)

watch(() => props.item.status, (newStatus) => {
    isPublic.value = newStatus === 'public'
})

watch(isPublic, async (val, oldVal) => {
    if (statusLoading.value || val === (props.item.status === 'public')) return

    statusLoading.value = true
    try {
        if (isAdmin.value) {
            if (val) {
                await adminforceSetPublicChannel(props.item.channels_id)
            } else {
                await adminforceSetPrivateChannel(props.item.channels_id)
            }
        } else {
            if (val) {
                if (props.item.status === 'private') {
                    await requestPublicChannel(props.item.channels_id)
                }
                await statusChannel(props.item.channels_id, true)
            } else {
                await ownerSetPrivateChannel(props.item.channels_id)
            }
        }

        emit('load')
    } catch (err) {
        isPublic.value = oldVal
        toast.add({
            title: 'เกิดข้อผิดพลาด',
            description: 'ไม่สามารถเปลี่ยนสถานะได้',
            color: 'error'
        })
    } finally {
        statusLoading.value = false
    }
})

/* =============================== */
/* Dropdown Menu                   */
/* =============================== */
const dropdownItems = computed<DropdownMenuItem[][]>(() => {
    const detailMenu: DropdownMenuItem[] = [
        {
            label: 'รายละเอียด',
            icon: 'i-lucide-eye',
            class: 'cursor-pointer',
            onSelect: () => openModal('detail')
        }
    ]

    if (!isLoggedIn.value) {
        return [detailMenu]
    }

    if (isAdmin.value) {
        const adminActions: DropdownMenuItem[] = [...detailMenu]

        adminActions.push({
            label: 'แก้ไข',
            icon: 'i-lucide-pencil',
            class: 'cursor-pointer',
            onSelect: () => openModal('edit')
        })

        const statusSection: DropdownMenuItem[] = [
            {
                slot: 'status-switch',
                onSelect: (e: Event) => e.preventDefault()
            }
        ]

        if (props.item.status === 'pending') {
            statusSection.push({
                label: 'ปฏิเสธคำขอ',
                icon: 'i-lucide-ban',
                color: 'error',
                class: 'cursor-pointer text-red-600',
                onSelect: () => openModal('rejected')
            })
        }

        return [
            adminActions,
            statusSection,
            [
                {
                    label: 'ลบ',
                    icon: 'i-lucide-trash',
                    color: 'error',
                    class: 'cursor-pointer',
                    onSelect: () => openModal('delete')
                }
            ]
        ]
    }

    if (!isOwner.value && isPublicChannel.value) {
        return [detailMenu]
    }

    const ownerMenu: DropdownMenuItem[] = [
        ...detailMenu,
        {
            label: 'แก้ไข',
            icon: 'i-lucide-pencil',
            class: 'cursor-pointer',
            onSelect: () => openModal('edit')
        }
    ]

    const statusMenu: DropdownMenuItem[] = []

    if (props.item.status === 'private') {
        statusMenu.push({
            label: 'ส่งคำขอเป็นสาธารณะ',
            icon: 'i-lucide-cloud',
            onSelect: handleRequestPublic
        })
    }

    if (props.item.status === 'pending') {
        statusMenu.push({
            label: 'ยกเลิกคำขอ',
            icon: 'i-lucide-x-circle',
            color: 'error',
            onSelect: handleCancelRequest
        })
    }

    if (props.item.status === 'public') {
        statusMenu.push({
            label: 'ตั้งเป็นส่วนตัว',
            icon: 'i-lucide-lock',
            onSelect: handleSetPrivate
        })
    }

    const deleteMenu: DropdownMenuItem[] = [
        {
            label: 'ลบ',
            icon: 'i-lucide-trash',
            color: 'error',
            class: 'cursor-pointer',
            onSelect: () => openModal('delete')
        }
    ]

    return [ownerMenu, statusMenu, deleteMenu]
})
</script>

<template>
    <div class="group relative w-full">
        <!-- Card Container -->
        <NuxtLink :to="cardInfo.link"
            class="block relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300">
            <!-- Gradient Header -->
            <div :class="[
                'h-20 bg-linear-to-br relative overflow-hidden',
                statusBadge.gradient
            ]">
                <div class="absolute inset-0 bg-black/10"></div>
                <div class="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div class="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

                <!-- Status Badge on Header -->
                <div class="absolute top-4 left-4">
                    <div
                        class="flex items-center gap-2 px-3 py-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full shadow-lg">
                        <UIcon :name="statusBadge.icon" class="w-4 h-4" :class="`text-${statusBadge.color}-600`" />
                        <span class="text-sm font-semibold" :class="`text-${statusBadge.color}-600`">
                            {{ statusBadge.label }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Content -->
            <div class="p-6 space-y-4">
                <!-- Title & Description -->
                <div>
                    <h3
                        class="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {{ cardInfo.title }}
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {{ cardInfo.description }}
                    </p>
                </div>

                <div v-if="isLoggedIn" class="space-y-4">
                    <!-- Stats -->
                    <!-- <div class="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <div class="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <UIcon name="i-lucide-file-text" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span class="text-sm font-medium">
                                {{ cardInfo.fileCount }} ไฟล์
                            </span>
                        </div>

                        <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <div class="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <UIcon name="i-lucide-calendar" class="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span class="text-xs font-medium">
                                {{ cardInfo.createdAtShort }}
                            </span>
                        </div>
                    </div> -->

                    <!-- Creator Info -->
                    <div class="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div class="relative">
                            <div
                                class="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold shadow-lg">
                                {{ cardInfo.createdBy.charAt(0).toUpperCase() }}
                            </div>
                            <div
                                class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full">
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {{ cardInfo.createdBy }}
                            </p>
                            <!-- <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                                สร้างเมื่อ {{ cardInfo.createdAtShort }}
                            </p> -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Hover Effect Overlay -->
            <div
                class="absolute inset-0 bg-linear-to-t from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-transparent transition-all duration-300 pointer-events-none rounded-2xl">
            </div>
        </NuxtLink>

        <!-- Dropdown Menu (Floating) -->
        <div v-if="isLoggedIn" class="absolute top-4 right-4 z-20" @click.stop>
            <UDropdownMenu :items="dropdownItems" :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
                :ui="{ content: 'w-56' }">
                <button
                    class="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700"
                    aria-label="More actions">
                    <UIcon name="i-lucide-more-vertical" class="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>

                <template #status-switch>
                    <div class="flex items-center justify-between w-full px-2 py-1" @click.stop>
                        <div class="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                            <UIcon name="i-lucide-globe" class="w-4.5 h-4.5 text-gray-500" />
                            <span class="truncate">เข้าถึงสาธารณะ</span>
                        </div>
                        <USwitch v-model="isPublic" :disabled="statusLoading" />
                    </div>
                </template>
            </UDropdownMenu>
        </div>

        <!-- Quick View Badge (Optional) -->
        <!-- <div
            class="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div
                class="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl shadow-lg text-sm font-medium">
                <UIcon name="i-lucide-arrow-right" class="w-4 h-4" />
                <span>เปิดดู</span>
            </div>
        </div> -->
    </div>

    <!-- Modals -->
    <ModalDelete v-model:open="modals.delete" :item="channelToDelete"
        :delete-handler="(channels_id) => deleteChannel(props.item.channels_id)" title="คุณต้องการลบแชนแนล"
        description="การลบจะไม่สามารถย้อนกลับมาได้ และเอกสารทุกไฟล์ภายในแชนแนลนี้จะถูกลบออกถาวร"
        @deleted="emit('load')" />

    <ModalChannelForm v-model:open="modals.edit" mode="edit" :item="{
        channels_id: props.item.channels_id,
        title: props.item.title,
        description: props.item.description
    }" :loading="loading" :create-handler="handleCreate" :edit-handler="handleEdit" @edit="emit('load')" />

    <ModalDetail v-model:open="modals.detail" :item="props.item" @edit="emit('load')" />

    <ModalRejected v-model:open="modals.rejected" :item="{
        channels_id: props.item.channels_id,
        title: props.item.title
    }" @rejected="emit('load')" />
</template>