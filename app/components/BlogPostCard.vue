<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { ref, computed } from 'vue'

// ===== Props =====
const props = defineProps<{
    item: {
        channels_id: number | string
        title: string
        description?: string | null
        status?: string | null
        created_at?: string | null
        file_count?: number | null
    }
}>()

// ===== เมนู 3 จุด (ยังไม่ผูก event อะไรเพิ่ม ตามที่บอกว่าไม่ต้องยุ่ง UI เยอะ) =====
const items: DropdownMenuItem[][] = [
    [
        {
            label: 'View',
            icon: 'i-lucide-eye',
            class: 'cursor-pointer'
        },
        {
            label: 'Edit',
            icon: 'i-lucide-pencil',
            class: 'cursor-pointer'
        }
    ],
    [
        {
            label: 'Delete',
            color: 'error',
            icon: 'i-lucide-trash',
            class: 'cursor-pointer'
        }
    ]
]

// ===== ข้อมูล user ตอนนี้ยังเป็น mock ไว้ก่อน =====
const testimonial = ref({
    user: {
        name: 'Unknown',
        description: 'Channel owner',
        avatar: {
            src: 'https://avatars.githubusercontent.com/u/0?v=4',
            alt: 'User avatar'
        }
    },
    quote: '“Channel ready to use.”'
})

// ===== ค่าที่คำนวณจาก props =====
const cardLink = computed(() => `/channels/${props.item.channels_id}`)
const cardTitle = computed(() => props.item.title || 'Untitled Channel')
const cardDescription = computed(
    () => props.item.description || 'ยังไม่ได้เขียนคำอธิบายแชนแนล'
)

const badgeLabel = computed(() => {
    if (!props.item.status) return 'Unknown'
    if (props.item.status === 'public') return 'Public'
    if (props.item.status === 'private') return 'Private'
    return props.item.status
})

const fileCountLabel = computed(() => {
    const file = props.item.file_count ?? 0
    return `${file} ไฟล์`
})
</script>

<template>
    <div class="w-full max-w-md mx-auto relative">
        <UPageCard :title="cardTitle" :description="cardDescription" :to="cardLink" variant="subtle"
            class="w-full cursor-pointer">
            <template #footer>
                <div class="pb-3 flex items-center justify-between text-sm">
                    <div class="flex items-center gap-2">
                        <UBadge size="md" variant="subtle">
                            {{ badgeLabel }}
                        </UBadge>
                        <span class="text-gray-500 dark:text-gray-400">
                            {{ fileCountLabel }}
                        </span>
                    </div>
                </div>
                <UUser v-bind="testimonial.user" />
            </template>
        </UPageCard>

        <div class="absolute top-2 right-2 z-10">
            <UDropdownMenu :items="items" :content="{
                align: 'end',
                side: 'bottom',
                sideOffset: 8
            }" :ui="{ content: 'w-48' }">
                <UButton variant="ghost" icon="i-lucide-more-vertical" aria-label="More actions"
                    class="p-1 cursor-pointer" />
            </UDropdownMenu>
        </div>
    </div>
</template>
