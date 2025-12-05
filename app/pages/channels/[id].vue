<script setup>
const message = ref('')
const value = ref(0)

const sources = [
    // { id: 1, name: 'Project_Specs_2024.pdf' },
    // { id: 2, name: 'Meeting_Transcript.txt' },
    // { id: 3, name: 'Budget_Q1.xlsx' },
]

for (const key in sources) {
    value.value += 1
}

const onFileSelect = (files) => {
    return navigateTo('/channels/chat')
}

const chatHistory = [
    // {
    //     id: 1,
    //     role: 'user',
    //     text: 'ช่วยสรุปงบประมาณของไตรมาส 1 ให้หน่อยครับ',
    //     citations: []
    // },
    // {
    //     id: 2,
    //     role: 'ai',
    //     text: 'จากเอกสาร Budget_Q1.xlsx พบว่ามีการจัดสรรงบประมาณไว้ทั้งหมด 5 ล้านบาท โดยแบ่งเป็นหมวดหมู่หลักๆ ดังนี้ครับ...',
    //     citations: ['Budget_Q1.xlsx']
    // },
]
</script>

<template>
    <div class="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">

        <aside
            class="w-72 bg-white dark:bg-gray-900 border-r border-l border-gray-200 dark:border-gray-800 flex flex-col hidden md:flex">
            <div class="p-4 border-b border-gray-100 dark:border-gray-800">
                <h2 class="font-semibold text-gray-700 dark:text-gray-200 mb-2">แหล่งข้อมูล</h2>
                <UModal title="เพิ่มแหล่งที่มา" description="อัปโหลดเอกสารเพื่อให้ AI ช่วยวิเคราะห์ข้อมูลได้ดียิ่งขึ้น"
                    v-model="isOpen" :ui="{ width: 'sm:max-w-[900px]' }">


                    <UButton block class="cursor-pointer" icon="i-heroicons-plus" color="primary" variant="solid"
                        label="Add Source" />

                    <template #body>

                        <div class="p-6 pt-2 space-y-6">
                            <div class="relative group">
                                <div
                                    class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl h-56 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-400 transition-colors cursor-pointer relative z-0">

                                    <div class="flex flex-col items-center text-center space-y-3 pointer-events-none">
                                        <div
                                            class="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 text-blue-600 rounded-full flex items-center justify-center mb-1">
                                            <UIcon name="i-heroicons-arrow-up-tray" class="w-6 h-6" />
                                        </div>
                                        <h4 class="text-lg font-semibold text-gray-700 dark:text-gray-200">
                                            อัปโหลดแหล่งข้อมูล</h4>
                                        <p class="text-gray-500 text-sm">
                                            ลากและวาง หรือ <span class="text-blue-600 font-medium">เลือกไฟล์</span>
                                        </p>
                                        <p class="text-gray-500 text-sm">
                                            รองรับไฟล์: PDF, TEXT (ขนาดสูงสุด 50MB)
                                        </p>
                                    </div>

                                    <UFileUpload multiple :dropzone="true"
                                        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        @change="onFileSelect" />
                                </div>
                            </div>
                        </div>

                        <div
                            class="p-4 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4">
                            <span class="text-sm text-gray-600 font-medium whitespace-nowrap">ขีดจำกัดแหล่งที่มา</span>
                            <UProgress v-model="value" :max="50" />
                            <span class="text-xs text-gray-500 whitespace-nowrap">{{ value }}/50</span>
                        </div>
                    </template>
                </UModal>
            </div>

            <div class="flex-1 overflow-y-auto p-2 space-y-1">
                <div v-for="file in sources" :key="file.id"
                    class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer group transition">
                    <div class="flex items-center gap-2 truncate">
                        <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-gray-400" />
                        <span class="text-sm text-gray-600 dark:text-gray-300 truncate">{{ file.name }}</span>
                    </div>
                    <UButton icon="i-heroicons-trash" color="red" variant="ghost" size="xs"
                        class="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>

            <div class="p-4 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4">
                <span class="text-sm text-gray-600 font-medium whitespace-nowrap">ขีดจำกัดแหล่งที่มา</span>
                <UProgress v-model="value" :max="50" />
                <span class="text-xs text-gray-500 whitespace-nowrap">{{ value }}/50</span>
            </div>
        </aside>

        <main class="flex-1 flex flex-col relative min-w-0">

            <div class="bg-white dark:bg-gray-900 px-6 sticky top-0 z-20">
                <nav class="flex items-center justify-between py-4">
                    <div class="flex items-center gap-3">
                        <UInput v-model="a" class="text-2xl" value="Untitled Channel" type="text" :ui="{
                            wrapper: 'w-fit',
                            base: '[field-sizing:content] min-w-[100px] max-w-[1000px] overflow-hidden text-ellipsis text-2xl'
                        }" />
                    </div>
                    <div>
                        <UserMenu />
                    </div>
                </nav>
                <USeparator size="md" />
            </div>

            <div v-if="value === 0" class="flex-1 flex flex-col items-center justify-center gap-6 px-4 text-center">
                <UIcon name="i-heroicons-chat-bubble-oval-left" class="w-16 h-16 text-gray-400" />
                <h2 class="text-2xl font-semibold text-gray-700 dark:text-gray-200">เริ่มต้นการสนทนา</h2>
                <p class="text-gray-500 max-w-md">
                    เพิ่มแหล่งข้อมูลของคุณแล้วถามคำถามเกี่ยวกับเอกสารเหล่านั้นได้เลย AI ของเราพร้อมช่วยเหลือคุณ
                </p>
            </div>
            <div v-else class="flex flex-col h-[calc(100vh-64px)] relative bg-white dark:bg-gray-900">
                <div
                    class="flex-1 w-full overflow-y-auto p-4 sm:p-8 space-y-6 scroll-smooth scrollbar scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">

                    <div v-for="msg in chatHistory" :key="msg.id"
                        :class="['flex', msg.role === 'user' ? 'justify-end' : 'justify-start']">

                        <div :class="['max-w-3xl', msg.role === 'user' ? 'w-fit' : 'w-full']">

                            <div v-if="msg.role === 'user'"
                                class="bg-primary-500 text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-md text-base">
                                {{ msg.text }}
                            </div>

                            <UCard v-else
                                :ui="{ body: { padding: 'p-5 sm:p-6' }, ring: 'ring-1 ring-gray-200 dark:ring-gray-800 shadow-sm' }">
                                <div class="flex gap-4">
                                    <div class="flex-shrink-0">
                                        <UAvatar icon="i-heroicons-sparkles" size="sm"
                                            class="bg-primary-50 text-primary-600 ring-1 ring-primary-100" />
                                    </div>

                                    <div class="space-y-3 w-full">
                                        <p class="text-gray-800 dark:text-gray-200 leading-7 text-base">{{ msg.text }}
                                        </p>

                                        <div v-if="msg.citations && msg.citations.length"
                                            class="flex gap-2 flex-wrap pt-4 border-t border-gray-100 dark:border-gray-800">
                                            <UBadge v-for="(cit, idx) in msg.citations" :key="idx" color="gray"
                                                variant="soft" size="xs"
                                                class="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                                <UIcon name="i-heroicons-paper-clip" class="w-3 h-3 mr-1" />
                                                {{ cit }}
                                            </UBadge>
                                        </div>
                                    </div>
                                </div>
                            </UCard>

                        </div>
                    </div>
                </div>

                <div class="shrink-0 p-4 pb-6 z-10 bg-white dark:bg-gray-900">
                    <div class="w-full max-w-5xl mx-auto">

                        <UChatPrompt v-model="message" variant="soft" placeholder="ถามคำถามเกี่ยวกับเอกสาร..." :rows="1"
                            autoresize :ui="{
                                wrapper: 'relative',
                                base: 'pl-6 pr-12 py-4'
                            }"
                            class="shadow-lg border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800 text-base focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all">

                            <template #trailing>
                                <div class="absolute right-3 bottom-auto top-0 flex items-center h-full">
                                    <UChatPromptSubmit size="sm" color="primary" variant="solid" :disabled="!message"
                                        icon="i-heroicons-paper-airplane" class="transition-all duration-200 rounded-xl"
                                        :class="{ 'scale-0 opacity-0': !message, 'scale-100 opacity-100': message }" />
                                </div>
                            </template>
                        </UChatPrompt>

                    </div>
                </div>

            </div>

        </main>
    </div>
</template>

<style scoped>
/* Scrollbar สวยๆ */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.3);
    border-radius: 99px;
}
</style>