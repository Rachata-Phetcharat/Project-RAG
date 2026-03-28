<script setup lang="ts">
/* ============================================
   Imports & Composables
============================================ */
const route = useRoute()

const { createSession, sendOllamaReply, loading: chatLoading } = useChat()
const { render } = useMarkdown()

/* ============================================
   Props
============================================ */
const props = defineProps<{
    channelTitle: string
    fileCount: number
}>()

/* ============================================
   Computed Properties
============================================ */
const channelId = computed(() => route.params.id as string)
const canSendMessage = computed(() => state.message.trim().length > 0)
// แสดง chat area เมื่อมีไฟล์ หรือมีประวัติการสนทนาแล้ว
const showChatArea = computed(() => props.fileCount > 0 || state.chatHistory.length > 0)

/* ============================================
   State Management
============================================ */
const state = reactive({
    message: '',
    chatHistory: [] as any[],
    sessionId: '',
    isTyping: false
})

/* ============================================
   Refs
============================================ */
const chatContainer = ref<HTMLElement | null>(null)

/* ============================================
   Chat Logic
============================================ */
const initChatSession = async () => {
    try {
        const session = await createSession(channelId.value)
        state.sessionId = session.sessions_id
    } catch (err) {
        console.error('Init session failed:', err)
    }
}

const handleSendMessage = async () => {
    if (!canSendMessage.value || state.isTyping) return

    const userText = state.message.trim()

    // 1. เพิ่มข้อความ User
    state.chatHistory.push({
        id: Date.now(),
        role: 'user',
        text: userText,
        copied: false
    })

    state.message = ''
    state.isTyping = true

    // เลื่อนทันทีเพื่อให้เห็นข้อความที่เพิ่งส่ง + typing indicator
    await scrollToBottom('smooth')

    try {
        const aiResponse = await sendOllamaReply(state.sessionId, userText)

        state.chatHistory.push({
            id: Date.now() + 1,
            role: 'bot',
            text: aiResponse,
            copied: false
        })

        // เลื่อนอีกครั้งหลังจาก AI ตอบกลับมา
        await scrollToBottom('smooth')
    } catch (err) {
        state.chatHistory.pop()
        state.message = userText
    } finally {
        state.isTyping = false
    }
}

/* ============================================
   Copy Logic
============================================ */
const copyMessage = async (msg: any) => {
    try {
        await navigator.clipboard.writeText(msg.text)
        msg.copied = true
        setTimeout(() => {
            msg.copied = false
        }, 2000)
    } catch (err) {
        console.error('Copy failed:', err)
    }
}

const lastBotIndex = computed(() =>
    state.chatHistory.map((m, i) => m.role === 'bot' ? i : -1).filter(i => i !== -1).at(-1)
)

/* ============================================
   Auto Scroll
============================================ */
const scrollToBottom = async (behavior: 'smooth' | 'instant' = 'smooth') => {
    // ใช้ await nextTick เพื่อรอให้ Vue render DOM ใหม่ให้เสร็จก่อน
    await nextTick()
    if (chatContainer.value) {
        chatContainer.value.scrollTo({
            top: chatContainer.value.scrollHeight,
            behavior
        })
    }
}

/* ============================================
   Lifecycle Hooks
============================================ */
onMounted(() => {
    initChatSession()
})

watch(() => route.params.id, () => {
    // Reset chat when channel changes
    state.chatHistory = []
    initChatSession()
})
</script>

<template>
    <main class="flex-1 flex-col relative min-w-0 flex">
        <!-- Header -->
        <div
            class="bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-6 sticky top-0 z-20 ">
            <nav class="flex items-center justify-between py-5">
                <div class="flex items-center gap-3">
                    <UButton icon="i-heroicons-arrow-left" color="neutral" variant="ghost" size="lg"
                        @click="$router.back()"
                        class="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-xl"
                        aria-label="ย้อนกลับ" />
                    <div class="w-1 h-8 rounded-full bg-gradient-to-b from-primary-500 to-primary-600"></div>
                    <h1
                        class="text-2xl font-bold bg-linear-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent truncate">
                        {{ channelTitle }}
                    </h1>
                </div>
                <UserMenu />
            </nav>
        </div>

        <!-- Loading State -->
        <div v-if="chatLoading && state.chatHistory.length === 0" class="flex-1 flex items-center justify-center">
            <div class="text-center space-y-4">
                <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
                <p class="text-gray-500">กำลังเตรียมห้องสนทนา...</p>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!showChatArea" class="flex-1 flex flex-col items-center justify-center gap-8 px-4 text-center">
            <div class="relative">
                <div
                    class="relative w-24 h-24 rounded-3xl bg-linear-to-br from-primary-500 to-blue-600 flex items-center justify-center shadow-2xl">
                    <UIcon name="i-heroicons-chat-bubble-oval-left-ellipsis" class="w-12 h-12 text-white" />
                </div>
            </div>
            <div class="space-y-3">
                <h2
                    class="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    เริ่มต้นการสนทนา
                </h2>
                <p class="text-gray-600 dark:text-gray-400 max-w-md text-lg">
                    เพิ่มแหล่งข้อมูลของคุณแล้วถามคำถามเกี่ยวกับเอกสารเหล่านั้นได้เลย
                </p>
            </div>
        </div>

        <!-- Chat Area -->
        <div v-else class="flex flex-col flex-1 relative overflow-hidden">
            <!-- Chat Messages -->
            <div ref="chatContainer" class="flex-1 w-full overflow-y-auto p-6 sm:p-10 space-y-8 scroll-smooth">

                <!-- Welcome prompt when files loaded but no messages yet -->
                <div v-if="state.chatHistory.length === 0 && !state.isTyping"
                    class="flex flex-col items-center justify-center h-full min-h-64 gap-5 text-center animate-fade-in">
                    <div
                        class="w-16 h-16 rounded-2xl bg-linear-to-br from-primary-500 to-blue-600 flex items-center justify-center shadow-xl">
                        <UIcon name="i-heroicons-sparkles" class="w-8 h-8 text-white" />
                    </div>
                    <div class="space-y-2">
                        <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100">พร้อมแล้ว!</h3>
                        <p class="text-gray-500 dark:text-gray-400 text-base max-w-sm">
                            เอกสารของคุณถูกโหลดเรียบร้อยแล้ว ลองถามคำถามได้เลย
                        </p>
                    </div>
                </div>

                <div v-for="(msg, index) in state.chatHistory" :key="msg.id"
                    :class="['flex max-w-5xl mx-auto animate-fade-in', msg.role === 'user' ? 'justify-end' : 'justify-start']">
                    <div :class="['max-w-3xl', msg.role === 'user' ? 'w-fit' : 'w-full']">

                        <!-- User Message -->
                        <div v-if="msg.role === 'user'"
                            class="bg-linear-to-r from-primary-500 to-primary-600 text-white px-6 py-4 rounded-3xl rounded-tr-md text-base font-medium">
                            {{ msg.text }}
                        </div>

                        <!-- AI Message -->
                        <div v-else class="group">
                            <div class="flex gap-5">
                                <div class="flex-shrink-0">
                                    <UAvatar icon="i-heroicons-sparkles" size="md"
                                        class="bg-linear-to-br from-primary-500 to-blue-600 text-white shadow-lg" />
                                </div>
                                <div class="space-y-4 w-full text-gray-800 dark:text-gray-200 leading-8 text-xl">
                                    <div class="markdown-body" v-html="render(msg.text)" />
                                    <!-- Copy Button -->
                                    <div class="flex justify-start pt-1" :class="index === lastBotIndex
                                        ? 'opacity-100'
                                        : 'opacity-0 group-hover:opacity-100 transition-opacity duration-200'">
                                        <UButton
                                            :icon="msg.copied ? 'i-heroicons-check' : 'i-heroicons-clipboard-document'"
                                            size="xs" color="neutral" variant="ghost"
                                            class="absolute text-gray-400 hover:text-primary-500 transition-colors"
                                            @click="copyMessage(msg)" />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <!-- Typing Indicator -->
                <div v-if="state.isTyping" class="flex justify-start animate-fade-in max-w-5xl mx-auto">
                    <div class="flex gap-4 items-center bg-gray-100/50 dark:bg-gray-800/50 px-6 py-4 rounded-3xl">
                        <div class="flex gap-1">
                            <span class="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></span>
                            <span
                                class="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span
                                class="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Input Area -->
            <div class="shrink-0 p-6 pb-2 z-10">
                <div class="w-full max-w-5xl mx-auto">
                    <form @submit.prevent="handleSendMessage">
                        <UChatPrompt v-model="state.message" variant="soft" placeholder="ถามคำถามเกี่ยวกับเอกสาร..."
                            :rows="1" autoresize :disabled="state.isTyping"
                            @keydown.enter.exact.prevent="handleSendMessage"
                            class="shadow-2xl border-2 border-gray-200 dark:border-gray-700 rounded-3xl bg-white dark:bg-gray-800 focus-within:ring-4 focus-within:ring-primary-500/20 focus-within:border-primary-400 transition-all duration-300 hover:shadow-3xl"
                            :ui="{
                                root: 'relative',
                                base: 'pl-6 pr-14 py-5 text-base'
                            }">
                            <template #trailing>
                                <div class="absolute right-4 bottom-auto top-0 flex items-center h-full">
                                    <UChatPromptSubmit @click="handleSendMessage" size="md" color="primary"
                                        :disabled="!canSendMessage || state.isTyping" icon="i-heroicons-paper-airplane"
                                        class="transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl"
                                        :class="{
                                            'scale-0 opacity-0 rotate-90': !canSendMessage,
                                            'scale-100 opacity-100 rotate-0 hover:scale-110': canSendMessage
                                        }" />
                                </div>
                            </template>
                        </UChatPrompt>
                    </form>
                    <p class="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
                        กด Enter เพื่อส่งข้อความ · Shift + Enter เพื่อขึ้นบรรทัดใหม่
                    </p>
                </div>
            </div>
        </div>
    </main>
</template>

<style scoped>
@keyframes fade-in {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in {
    animation: fade-in 0.5s ease-out forwards;
}

.overflow-y-auto::-webkit-scrollbar {
    width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, rgba(156, 163, 175, 0.3), rgba(156, 163, 175, 0.5));
    border-radius: 99px;
    transition: background 0.3s;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(to bottom, rgba(156, 163, 175, 0.5), rgba(156, 163, 175, 0.7));
}

/* ตัวแชท */
:deep(.markdown-body) {
    line-height: 1.75;
    font-size: 1rem;
}

:deep(.markdown-body p) {
    margin: 0 0 0.75rem;
}

:deep(.markdown-body p:last-child) {
    margin-bottom: 0;
}

:deep(.markdown-body ul),
:deep(.markdown-body ol) {
    padding-left: 1.5rem;
    margin: 0.5rem 0 0.75rem;
}

:deep(.markdown-body li) {
    margin-bottom: 0.25rem;
}

:deep(.markdown-body strong) {
    font-weight: 600;
}
</style>

<!-- ไม่มี scoped — ใช้กับ v-html ได้โดยตรง -->
<style>
/* ── Code block layout ── */
.code-block {
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #e1e4e8;
    margin: 0.75rem 0;
    font-size: 13px;
}

.code-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 14px;
    background: #f0f2f4;
    border-bottom: 1px solid #e1e4e8;
}

.code-lang {
    font-size: 12px;
    color: #57606a;
    font-family: 'Consolas', monospace;
}

.copy-code-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: #57606a;
    background: none;
    border: 1px solid #d0d7de;
    padding: 2px 10px;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.15s;
}

.copy-code-btn:hover {
    background: #d0d7de;
}

.copy-code-btn.copied {
    color: #1a7f37;
    border-color: #1a7f37;
}

.code-block pre {
    margin: 0;
    padding: 14px 16px;
    background: #f8fafc;
    overflow-x: auto;
}

.code-block pre code {
    font-family: 'Consolas', 'Monaco', monospace;
    background: none;
    padding: 0;
    font-size: 13px;
    line-height: 1.6;
}

.inline-code {
    font-family: 'Consolas', monospace;
    font-size: 0.875em;
    background: rgba(175, 184, 193, 0.2);
    padding: 2px 6px;
    border-radius: 4px;
    color: #0a3069;
}

/* ── Dark mode ── */
.dark .code-block {
    border-color: #30363d;
}

.dark .code-header {
    background: #161b22;
    border-color: #30363d;
}

.dark .code-lang {
    color: #8b949e;
}

.dark .copy-code-btn {
    color: #8b949e;
    border-color: #30363d;
}

.dark .copy-code-btn:hover {
    background: #30363d;
}

.dark .copy-code-btn.copied {
    color: #3fb950;
    border-color: #3fb950;
}

.dark .code-block pre {
    background: #0d1117;
}

.dark .inline-code {
    background: rgba(110, 118, 129, 0.2);
    color: #79c0ff;
}

/* ── Syntax tokens (dark) ── */
.dark .hljs {
    color: #e6edf3;
}

.dark .hljs-keyword {
    color: #ff7b72;
}

.dark .hljs-string {
    color: #a5d6ff;
}

.dark .hljs-number {
    color: #f2cc60;
}

.dark .hljs-comment {
    color: #8b949e;
    font-style: italic;
}

.dark .hljs-function,
.dark .hljs-title {
    color: #d2a8ff;
}

.dark .hljs-type,
.dark .hljs-class,
.dark .hljs-literal,
.dark .hljs-attr {
    color: #79c0ff;
}

.dark .hljs-built_in {
    color: #ffa657;
}

.dark .hljs-tag,
.dark .hljs-name {
    color: #7ee787;
}

.dark .hljs-operator {
    color: #ff7b72;
}

.dark .hljs-variable,
.dark .hljs-params {
    color: #e6edf3;
}
</style>