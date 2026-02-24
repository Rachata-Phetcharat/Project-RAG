<script setup lang="ts">
import type { SelectMenuItem } from '@nuxt/ui'

const props = defineProps<{
    open: boolean
    item?: {
        name: string
        channel_id: string
    }
}>()

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
}>()

const close = () => {
    emit('update:open', false)
}

const items = ref<SelectMenuItem[]>([
    {
        label: 'Backlog',
        id: 'backlog'
    }
])
const value = ref('todo')

</script>

<template>
    <UModal :open="open" @update:open="emit('update:open', $event)" :ui="{
        content: 'sm:max-w-lg',
        overlay: 'backdrop-blur-sm'
    }">
        <template #header>
            <div class="flex items-center gap-3">
                <div
                    class="w-10 h-10 rounded-xl bg-linear-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                    <UIcon :name="'i-lucide-key-round'" class="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">Create a new key</h3>
                </div>
            </div>
        </template>

        <template #body>
            <UForm ref="channelForm" :validate-on="[]" @submit.prevent="" class="space-y-6">
                <UFormField name="title" label="ชื่อแชนแนล" size="xl">
                    <UInput size="xl" :placeholder="'กรอกชื่อแชนแนลใหม่...'" class="w-full" :icon="'i-heroicons-tag'" />
                </UFormField>
                <UFormField name="title" label="ชื่อแชนแนล" size="xl">
                    <USelectMenu placeholder="Select status" size="xl" value-key="id" :items="items" class="w-full" />
                </UFormField>
            </UForm>
        </template>

        <template #footer>
            <div class="flex justify-end gap-3">
                <UButton size="lg" color="neutral" variant="ghost" class="cursor-pointer" @click="close">
                    ยกเลิก
                </UButton>
                <UButton size="lg" color="primary" class="cursor-pointer px-6 shadow-md" @click="">
                    สร้าง
                </UButton>
            </div>
        </template>
    </UModal>
</template>