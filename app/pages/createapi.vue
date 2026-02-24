<script setup lang="ts">
const isCreateModalOpen = ref(false)

const { createApi, loading } = useCreateApi()
const { fetchMyChannels } = useChannel()



const searchQuery = ref('')

</script>

<template>
    <div class="mb-8">
        <div class="flex items-center gap-3 mb-6">
            <div class="p-3 bg-linear-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                <UIcon name="i-lucide-layout-grid" class="w-7 h-7 text-white" />
            </div>
            <div>
                <h1
                    class="text-3xl md:text-4xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    API Keys
                </h1>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    จัดการและสร้างแชนแนลเพื่อแบ่งปันความรู้
                </p>
            </div>
        </div>

        <!-- Search & Action Bar -->
        <div class="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div class="flex-1 max-w-md">
                <div class="relative group">
                    <UIcon name="i-lucide-search"
                        class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input v-model="searchQuery" type="text" placeholder="ค้นหาแชนแนล..."
                        class="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" />
                </div>
            </div>

            <UButton size="lg" label="Create API Key" color="primary" @click="isCreateModalOpen = true">
                <template #leading>
                    <UIcon name="i-lucide-key-round" class="w-5 h-5" />
                </template>
            </UButton>
        </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        asdas
    </div>

    <ModalCreateApi v-model:open="isCreateModalOpen" />
</template>