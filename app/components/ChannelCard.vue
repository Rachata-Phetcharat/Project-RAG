<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'

// composables
const {
    statusChannel,
    requestPublicChannel,       // ส่งคำขอ
    cancelRequestPublicChannel, // ยกเลิกคำขอ (Pending)
    ownerSetPrivateChannel,     // ยกเลิก Public (Public -> Private)
    loading
} = useChannel()

const authStore = useAuthStore()
const toast = useToast() // ✅ เพิ่ม Toast สำหรับแจ้งเตือน

// emit
const emit = defineEmits<{ (e: 'load'): void }>()

// props
const props = defineProps<{
    item: {
        channels_id: number
        title: string
        description?: string | null
        status?: string | null
        created_by_name: string
        created_at?: string | null
        file_count?: number | null
    }
}>()

/* =============================== */
/* Actions              */
/* =============================== */

// 1. ส่งคำขอ (Private -> Pending)
const handleRequestPublic = async () => {
    if (loading.value) return
    try {
        await requestPublicChannel(props.item.channels_id)
        toast.add({ title: 'ส่งคำขอเรียบร้อยแล้ว', color: 'success' })
        emit('load')
    } catch (error) {
        toast.add({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถส่งคำขอได้', color: 'error' })
    }
}

// 2. ยกเลิกคำขอ (Pending -> Private)
const handleCancelRequest = async () => {
    if (loading.value) return
    try {
        await cancelRequestPublicChannel(props.item.channels_id)
        toast.add({ title: 'ยกเลิกคำขอเรียบร้อยแล้ว', color: 'success' })
        emit('load')
    } catch (error) {
        toast.add({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถยกเลิกคำขอได้', color: 'error' })
    }
}

// 3. ตั้งเป็นส่วนตัว (Public -> Private)
const handleSetPrivate = async () => {
    if (loading.value) return
    try {
        await ownerSetPrivateChannel(props.item.channels_id)
        toast.add({ title: 'ตั้งค่าเป็นส่วนตัวเรียบร้อยแล้ว', color: 'success' })
        emit('load')
    } catch (error) {
        toast.add({ title: 'เกิดข้อผิดพลาด', description: 'ดำเนินการไม่สำเร็จ', color: 'error' })
    }
}

/* =============================== */
/* Modal State          */
/* =============================== */
const OpenDelete = ref(false)
const OpenEdit = ref(false)
const OpenDetail = ref(false)
const OpenRejected = ref(false)

const openDelete = () => (OpenDelete.value = true)
const openEdit = () => (OpenEdit.value = true)
const openDetail = () => (OpenDetail.value = true)
const openRejected = () => (OpenRejected.value = true)

/* =============================== */
/* Card Info           */
/* =============================== */
const cardTitle = computed(() => props.item.title || 'Untitled Channel')
const cardDescription = computed(() => props.item.description || 'ยังไม่ได้เขียนคำอธิบายแชนแนล')
const cardLink = computed(() => `/channels/${props.item.channels_id}`)
const fileCountLabel = computed(() => `${props.item.file_count ?? 0} ไฟล์`)
const cardCreated_by = computed(() => props.item.created_by_name)

const cardCreated_at = computed(() => {
    if (!props.item.created_at) return 'ไม่ทราบวันที่'
    return new Date(props.item.created_at).toLocaleString('th-TH', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
})

/* =============================== */
/* Status Badge         */
/* =============================== */
const badgeColor = computed(() => {
    const s = props.item.status
    return s === 'public' ? 'success'
        : s === 'private' ? 'error'
            : s === 'pending' ? 'warning'
                : 'neutral'
})

const badgeLabel = computed(() => {
    const s = props.item.status
    return s === 'public' ? 'Public'
        : s === 'private' ? 'Private'
            : s === 'pending' ? 'Pending'
                : s
})

/* =============================== */
/* Status Switch (Admin)      */
/* =============================== */
const isPublic = ref(props.item.status === 'public')
const statusLoading = ref(false)

watch(() => props.item.status, (newStatus) => {
    const isNewStatusPublic = newStatus === 'public'
    if (isPublic.value !== isNewStatusPublic) {
        isPublic.value = isNewStatusPublic
    }
})

watch(isPublic, async (val, oldVal) => {
    if (statusLoading.value) return
    const currentPropIsPublic = props.item.status === 'public'
    if (val === currentPropIsPublic) return

    statusLoading.value = true
    try {
        await statusChannel(props.item.channels_id, {
            approve: val,
            reason: ""
        })
        emit('load')
    } catch (err) {
        console.error(err)
        isPublic.value = oldVal
    } finally {
        statusLoading.value = false
    }
})

/* =============================== */
/* Dropdown Menu         */
/* =============================== */
// ✅ เปลี่ยนเป็น computed เพื่อให้ตรวจสอบ status ล่าสุดและเปลี่ยนเมนูตามเงื่อนไข
const items = computed<DropdownMenuItem[][]>(() => {
    const status = props.item.status
    const isAdmin = authStore.role === 'admin'

    // 1. เมนูพื้นฐาน (Detail, Edit)
    const baseMenu = [
        {
            label: 'Detail',
            icon: 'i-lucide-eye',
            class: "cursor-pointer",
            onSelect: () => openDetail()
        },
        {
            label: 'Edit',
            icon: 'i-lucide-pencil',
            class: "cursor-pointer",
            onSelect: () => openEdit()
        }
    ]

    // 2. เมนูจัดการสถานะ (แยก User / Admin)
    let statusMenu: DropdownMenuItem[] = []

    if (isAdmin) {
        // --- Admin เห็น Switch และปุ่ม Rejected ---
        statusMenu = [
            {
                slot: 'status-switch',
                onSelect: (e: Event) => e.preventDefault()
            },
            {
                label: 'Rejected',
                icon: 'i-lucide-circle-x',
                class: "cursor-pointer",
                color: 'error' as const,
                onSelect: () => openRejected()
            }
        ]
    } else {
        // --- User ทั่วไป ---
        if (status === 'pending') {
            // กรณี: รออนุมัติ -> ให้ปุ่ม "ยกเลิกคำขอ"
            statusMenu.push({
                label: 'ยกเลิกคำขอ',
                icon: 'i-lucide-x-circle',
                class: "cursor-pointer",
                color: 'error' as const,
                disabled: loading.value,
                onSelect: () => handleCancelRequest()
            })
        } else if (status === 'public') {
            // กรณี: เป็นสาธารณะแล้ว -> ให้ปุ่ม "ตั้งเป็นส่วนตัว"
            statusMenu.push({
                label: 'ตั้งเป็นส่วนตัว',
                icon: 'i-lucide-lock',
                class: "cursor-pointer",
                color: 'neutral' as const,
                disabled: loading.value,
                onSelect: () => handleSetPrivate()
            })
        } else {
            // กรณี: เป็นส่วนตัว -> ให้ปุ่ม "ส่งคำขอเป็นสาธารณะ"
            statusMenu.push({
                label: 'ส่งคำขอเป็นสาธารณะ',
                icon: 'i-lucide-cloud',
                class: "cursor-pointer",
                disabled: loading.value,
                onSelect: () => handleRequestPublic()
            })
        }
    }

    // 3. เมนู Delete
    const deleteMenu = [
        {
            label: 'Delete',
            icon: 'i-lucide-trash',
            class: "cursor-pointer",
            color: 'error' as const,
            onSelect: () => openDelete()
        }
    ]

    return [baseMenu, statusMenu, deleteMenu]
})

/* =============================== */
/* Testimonial           */
/* =============================== */
const testimonial = ref({
    user: {
        name: cardCreated_by,
        description: cardCreated_at,
        avatar: {
            src: 'https://avatars.githubusercontent.com/u/0?v=4',
            alt: 'User avatar'
        }
    }
})
</script>

<template>
    <div class="w-full max-w-md mx-auto relative">

        <UPageCard :title="cardTitle" :description="cardDescription" :to="cardLink" variant="subtle"
            class="w-full cursor-pointer">
            <template #footer>
                <div class="pb-3 flex items-center justify-between text-sm">
                    <div class="flex items-center gap-2">
                        <UBadge :color="badgeColor" size="md" variant="subtle">
                            {{ badgeLabel }}
                        </UBadge>
                        <span class="text-gray-500 dark:text-gray-400">{{ fileCountLabel }}</span>
                    </div>
                </div>

                <UUser v-bind="testimonial.user" />
            </template>
        </UPageCard>

        <div class="absolute top-2 right-2 z-10">
            <UDropdownMenu :items="items" :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
                :ui="{ content: 'w-48' }">
                <UButton variant="ghost" icon="i-lucide-more-vertical" aria-label="More actions"
                    class="p-1 cursor-pointer" />

                <template #status-switch>
                    <div class="flex items-center justify-between w-full" @click.stop>
                        <div class="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                            <UIcon name="i-lucide-globe" class="w-4 h-4 text-gray-500" />
                            <span class="truncate">Public Access</span>
                        </div>

                        <USwitch v-model="isPublic" :disabled="statusLoading" />
                    </div>
                </template>
            </UDropdownMenu>
        </div>
    </div>

    <ModalDelete v-model:open="OpenDelete" :item="{ channels_id: props.item.channels_id, title: props.item.title }"
        @deleted="emit('load')" />

    <ModalEdit v-model:open="OpenEdit" :item="{
        channels_id: props.item.channels_id,
        title: props.item.title,
        description: props.item.description
    }" @edit="emit('load')" />

    <ModalDetail v-model:open="OpenDetail" :item="props.item" @edit="emit('load')" />

    <ModalRejected v-model:open="OpenRejected" :item="{
        channels_id: props.item.channels_id,
        title: props.item.title
    }" @rejected="emit('load')" />
</template>