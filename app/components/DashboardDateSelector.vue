<script setup lang="ts">
// รับค่า Label ที่เลือกอยู่จากหน้าหลัก
defineProps<{
    modelValue: string
}>()

const emit = defineEmits<{
    (e: 'select', days: number, label: string): void
}>()

// รายการช่วงเวลาตามภาพ
const datePresets = [
    [{ label: 'Last 7 days', click: () => emit('select', 7, 'Last 7 days') }],
    [{ label: 'Last 14 days', click: () => emit('select', 14, 'Last 14 days') }],
    [{ label: 'Last 30 days', click: () => emit('select', 30, 'Last 30 days') }],
    [{ label: 'Last 3 months', click: () => emit('select', 90, 'Last 3 months') }],
    [{ label: 'Last year', click: () => emit('select', 365, 'Last year') }]
]
</script>

<template>
    <div class="flex items-center gap-4">
        <UDropdown :items="datePresets" :popper="{ placement: 'bottom-start' }">
            <UButton color="neutral" variant="subtle" icon="i-heroicons-calendar-days"
                trailing-icon="i-heroicons-chevron-down">
                {{ modelValue }}
            </UButton>
        </UDropdown>
        <div class="flex items-center gap-2 text-sm text-gray-500 font-medium">
            <span class="w-2 h-2 rounded-full bg-primary-500"></span>
            Daily Analytics
        </div>
    </div>
</template>