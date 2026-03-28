<script setup lang="ts">
const props = defineProps<{
    open: boolean
}>()

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
    (e: 'created'): void
}>()

const toast = useToast()
const config = useRuntimeConfig()
const authStore = useAuthStore()
const { createApiKey, fetchApiKeys, apiKeys, loading } = useCreateApi()
const { fetchMyChannels, fetchChannelDetail } = useChannel()

// Form state
const keyName = ref('')
const selectedChannelId = ref<string | null>(null)
const channels = ref<any[]>([])
const loadingChannels = ref(false)

// Detail ของ channel ที่เลือก (จาก /channels/{channel_id})
const selectedChannelDetail = ref<any | null>(null)
const loadingDetail = ref(false)

// Success state — แสดง key_secret หลังสร้าง (เห็นแค่ครั้งเดียว)
const createdKey = ref<{
    key_id: number
    name: string
    channel_id: string
    key_secret: string
    created_at: string
} | null>(null)
const copied = ref(false)

// Step 1: ดึง channels ของตัวเอง กรองเฉพาะที่เป็น public และยังไม่มี key
const fetchAvailableChannels = async () => {
    loadingChannels.value = true
    try {
        const data = await fetchMyChannels() as any[]

        const existingKeyChannelIds = new Set(
            (apiKeys.value || []).map((k: any) => k.channel_id)
        )

        channels.value = (data || []).filter(
            (c: any) => c.status === 'public' && !existingKeyChannelIds.has(c.channels_id)
        )
    } catch (e) {
        console.error('Fetch channels error', e)
    } finally {
        loadingChannels.value = false
    }
}

// Step 2: พอเลือก channel → call /channels/{channel_id} เพื่อดึง detail จริง
const fetchChannelDetailHandler = async (channelId: string) => {
    loadingDetail.value = true
    selectedChannelDetail.value = null
    try {
        const data = await fetchChannelDetail(channelId)
        selectedChannelDetail.value = data
    } catch (e: any) {
        const status = e?.response?.status || e?.status
        if (status === 404) {
            toast.add({
                title: 'ไม่พบแชนแนลนี้',
                description: 'Channel ID ไม่ถูกต้องหรือถูกลบไปแล้ว',
                icon: 'i-lucide-x-circle',
                color: 'error',
            })
            selectedChannelId.value = null
        } else {
            console.error('Fetch channel detail error', e)
        }
    } finally {
        loadingDetail.value = false
    }
}

// Channel options สำหรับ USelectMenu
const channelOptions = computed(() =>
    channels.value.map((c: any) => ({
        label: c.title,
        value: c.channels_id,
    }))
)

// Watch เมื่อผู้ใช้เลือก channel → fetch detail
watch(selectedChannelId, (id) => {
    if (id) fetchChannelDetailHandler(id)
    else selectedChannelDetail.value = null
})

// Watch เปิด modal → reset + fetch
watch(() => props.open, async (val) => {
    if (val) {
        createdKey.value = null
        keyName.value = ''
        selectedChannelId.value = null
        selectedChannelDetail.value = null
        copied.value = false
        await fetchApiKeys()
        await fetchAvailableChannels()
    }
})

const handleCreate = async () => {
    if (!keyName.value.trim()) {
        toast.add({ title: 'กรุณากรอกชื่อ Key', color: 'warning', icon: 'i-lucide-alert-circle' })
        return
    }
    if (!selectedChannelId.value) {
        toast.add({ title: 'กรุณาเลือกแชนแนล', color: 'warning', icon: 'i-lucide-alert-circle' })
        return
    }
    if (!selectedChannelDetail.value) {
        toast.add({ title: 'ยังโหลดข้อมูลแชนแนลไม่เสร็จ', color: 'warning', icon: 'i-lucide-alert-circle' })
        return
    }

    try {
        const res = await createApiKey({
            name: keyName.value.trim(),
            channel_id: selectedChannelId.value,
        })
        createdKey.value = res as any
        emit('created')
        toast.add({
            title: 'สร้าง API Key สำเร็จ!',
            description: 'คัดลอก Key Secret ก่อนปิดหน้าต่างนี้ จะไม่แสดงอีก',
            icon: 'i-lucide-check-circle',
            color: 'success',
        })
    } catch (e: any) {
        toast.add({
            title: 'เกิดข้อผิดพลาด',
            description: e?.data?.detail || 'สร้าง Key ไม่สำเร็จ',
            icon: 'i-lucide-x-circle',
            color: 'error',
        })
    }
}

const copySecret = async () => {
    if (!createdKey.value) return
    await navigator.clipboard.writeText(createdKey.value.key_secret)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
}

const close = () => {
    emit('update:open', false)
}
</script>

<template>
    <UModal :open="open" @update:open="emit('update:open', $event)" :ui="{
        content: 'sm:max-w-lg',
        overlay: 'backdrop-blur-sm'
    }">
        <!-- Header -->
        <template #header>
            <div class="flex items-center gap-3">
                <div
                    class="w-10 h-10 rounded-xl bg-linear-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                    <UIcon name="i-lucide-key-round" class="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                        {{ createdKey ? 'API Key สร้างสำเร็จ!' : 'สร้าง API Key ใหม่' }}
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        {{ createdKey ? 'คัดลอก Key Secret' :
                            'เลือกแชนแนลสาธารณะที่ต้องการสร้าง Key' }}
                    </p>
                </div>
            </div>
        </template>

        <!-- Body -->
        <template #body>
            <!-- ✅ แสดง Key ที่เพิ่งสร้าง -->
            <div v-if="createdKey" class="space-y-4">

                <div class="space-y-3">
                    <div
                        class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">ชื่อ Key</span>
                            <span class="font-medium text-gray-900 dark:text-white">{{ createdKey.name }}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">Channel ID</span>
                            <span class="font-medium text-gray-900 dark:text-white font-mono text-xs">{{
                                createdKey.channel_id }}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">สร้างเมื่อ</span>
                            <span class="font-medium text-gray-900 dark:text-white">
                                {{ new Date(createdKey.created_at).toLocaleString('th-TH') }}
                            </span>
                        </div>
                    </div>

                    <!-- Key Secret -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key
                            Secret</label>
                        <div class="flex gap-2 items-center">
                            <div
                                class="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 font-mono text-xs text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-nowrap">
                                {{ createdKey.key_secret }}
                            </div>
                            <UButton :color="copied ? 'success' : 'primary'" variant="soft" size="sm"
                                :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'" @click="copySecret"
                                class="shrink-0">
                                {{ copied ? 'คัดลอกแล้ว' : 'คัดลอก' }}
                            </UButton>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 📝 Form สร้าง Key -->
            <div v-else class="space-y-5">
                <!-- Key Name -->
                <UFormField name="name" label="ชื่อ API Key" size="xl" required>
                    <UInput v-model="keyName" size="xl" placeholder="เช่น My App Key, Production Key..." class="w-full"
                        icon="i-lucide-tag" />
                </UFormField>

                <!-- Channel Select -->
                <UFormField name="channel" label="แชนแนล (สาธารณะ)" size="xl" required>
                    <div v-if="loadingChannels" class="flex items-center gap-2 text-sm text-gray-500 py-2">
                        <UIcon name="i-lucide-loader-circle" class="animate-spin w-4 h-4" />
                        กำลังโหลดแชนแนล...
                    </div>
                    <div v-else-if="channelOptions.length === 0"
                        class="flex items-center gap-2 text-sm text-gray-500 py-2 px-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                        <UIcon name="i-lucide-info" class="w-4 h-4 text-blue-400" />
                        ไม่มีแชนแนลสาธารณะที่สามารถสร้าง Key ได้
                    </div>
                    <USelectMenu v-else v-model="selectedChannelId" :items="channelOptions" value-key="value" size="xl"
                        placeholder="เลือกแชนแนล..." class="w-full" />
                </UFormField>
            </div>
        </template>

        <!-- Footer -->
        <template #footer>
            <div class="flex justify-end gap-3">
                <UButton size="lg" color="neutral" variant="ghost" class="cursor-pointer" @click="close">
                    {{ createdKey ? 'ปิด' : 'ยกเลิก' }}
                </UButton>
                <UButton v-if="!createdKey" size="lg" color="primary" class="cursor-pointer px-6 shadow-md"
                    :loading="loading"
                    :disabled="loading || loadingDetail || channelOptions.length === 0 || (!!selectedChannelId && !selectedChannelDetail)"
                    @click="handleCreate">
                    สร้าง Key
                </UButton>
            </div>
        </template>
    </UModal>
</template>