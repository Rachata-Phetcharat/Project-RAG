<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    open: boolean
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

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void  // สำหรับ v-model:open
    (e: 'detail'): void                       // กดไปดูรายละเอียดแชนแนล
}>()

const close = () => {
    emit('update:open', false)
}

const goDetail = () => {
    emit('detail')
    close()
}

// description ถ้าไม่มีให้ขึ้นข้อความแทน
const descriptionText = computed(() =>
    props.item.description?.trim() || 'ยังไม่ได้ระบุรายละเอียดสำหรับแชนแนลนี้'
)

// แปลง created_at ให้ดูอ่านง่าย (ถ้าจะ format เพิ่มทีหลังได้)
const createdAtText = computed(() => {
    if (!props.item.created_at) return 'ไม่ทราบวันที่'

    const date = new Date(props.item.created_at)

    return date.toLocaleString('th-TH', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
})
</script>

<template>
    <UModal :open="open" @update:open="emit('update:open', $event)">
        <!-- Header สวย ๆ -->
        <template #header>
            <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/40">
                        <UIcon name="i-lucide-hash" class="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div class="min-w-0">
                        <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            รายละเอียดแชนแนล
                        </p>
                        <p class="text-base font-semibold truncate">
                            {{ item.title }}
                        </p>
                    </div>
                </div>

                <div class="flex flex-col items-end gap-1">
                    <UBadge v-if="item.status" :color="item.status === 'active' ? 'success' : 'neutral'" size="xs"
                        variant="soft">
                        {{ item.status === 'active' ? 'ใช้งานอยู่' : 'ปิดใช้งาน' }}
                    </UBadge>

                    <span class="text-[11px] text-gray-400">
                        ID: #{{ item.channels_id }}
                    </span>
                </div>
            </div>
        </template>

        <!-- Body -->
        <template #body>
            <div class="space-y-4 pt-1">
                <!-- Description card -->
                <div class="rounded-xl border bg-gray-50/80 dark:bg-gray-900/40 p-4">
                    <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        คำอธิบายแชนแนล
                    </p>
                    <p class="text-sm leading-relaxed" :class="{
                        'italic text-gray-400 dark:text-gray-500': !item.description
                    }">
                        {{ descriptionText }}
                    </p>
                </div>

                <!-- Meta info -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="rounded-xl border p-3">
                        <p class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                            ผู้สร้างแชนแนล
                        </p>
                        <div class="flex items-center gap-2">
                            <div
                                class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/40">
                                <UIcon name="i-lucide-user" class="h-4 w-4 text-blue-600 dark:text-blue-300" />
                            </div>
                            <p class="text-sm font-medium truncate">
                                {{ item.created_by_name || 'ไม่ทราบชื่อผู้สร้าง' }}
                            </p>
                        </div>
                    </div>

                    <div class="rounded-xl border p-3">
                        <p class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                            วันที่สร้าง
                        </p>
                        <div class="flex items-center gap-2">
                            <UIcon name="i-lucide-calendar" class="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <p class="text-sm">
                                {{ createdAtText }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- File count -->
                <div class="rounded-xl border border-dashed bg-transparent p-3 flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-folder" class="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <p class="text-sm text-gray-600 dark:text-gray-300">
                            จำนวนไฟล์ที่เชื่อมต่อในแชนแนลนี้
                        </p>
                    </div>
                    <UBadge size="sm" color="primary" variant="soft">
                        {{ item.file_count ?? 0 }} ไฟล์
                    </UBadge>
                </div>
            </div>

            <div class="flex items-center justify-end gap-2 w-full pt-2.5">
                <UButton size="lg" color="neutral" variant="subtle" class="cursor-pointer" @click="close">
                    ปิด
                </UButton>
            </div>
        </template>
    </UModal>
</template>
