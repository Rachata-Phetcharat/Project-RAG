<script setup lang="ts">
/* ============================================
   Imports & Composables
============================================ */
const route = useRoute()

const { createSession, sendOllamaReplyStream, loading: chatLoading } = useChat()
const { render } = useMarkdown()
const authStore = useAuthStore()

/* ============================================
   Props
============================================ */
const props = defineProps<{
    channelTitle: string
    fileCount: number
}>()

const emit = defineEmits<{ 'open-sidebar': [] }>()

/* ============================================
   Computed Properties
============================================ */
const channelId = computed(() => route.params.id as string)
const canSendMessage = computed(() => state.message.trim().length > 0)
const showChatArea = computed(() => props.fileCount > 0 || state.chatHistory.length > 0)

/* ============================================
   State Management
============================================ */
const state = reactive({
    message: '',
    chatHistory: [] as any[],
    sessionId: '',
    isTyping: false,
    streamingText: '',
})

/* ============================================
   Refs
============================================ */
const chatContainer = ref<HTMLElement | null>(null)
let abortController: AbortController | null = null

// ── User Scroll Detection ──────────────────────────────────────────────────
// ถ้า user เลื่อนขึ้นระหว่าง stream → หยุด auto-scroll จนกว่าจะกลับมาล่างสุด
const userHasScrolledUp = ref(false)
const SCROLL_THRESHOLD = 80 // px จากล่างสุด ถือว่า "อยู่ล่างสุด"

const onContainerScroll = () => {
    if (!chatContainer.value) return
    const el = chatContainer.value
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    userHasScrolledUp.value = distFromBottom > SCROLL_THRESHOLD
}

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

    state.chatHistory.push({
        id: Date.now(),
        role: 'user',
        text: userText,
        copied: false
    })

    state.message = ''
    state.isTyping = true
    state.streamingText = ''
    userHasScrolledUp.value = false // reset เมื่อส่งข้อความใหม่

    await scrollToBottom('smooth')

    abortController = new AbortController()

    try {
        const fullText = await sendOllamaReplyStream(
            state.sessionId,
            userText,
            (chunk) => {
                state.streamingText += chunk
                // เลื่อนลงก็ต่อเมื่อ user ไม่ได้เลื่อนขึ้น
                if (!userHasScrolledUp.value) {
                    scrollToBottom('instant')
                }
            },
            abortController.signal
        )

        state.chatHistory.push({
            id: Date.now() + 1,
            role: 'bot',
            text: fullText,
            copied: false
        })
        state.streamingText = ''

        if (!userHasScrolledUp.value) {
            await scrollToBottom('smooth')
        }

    } catch (err: any) {
        if (err?.name === 'AbortError') return

        state.chatHistory.pop()
        state.message = userText
        state.streamingText = ''
    } finally {
        state.isTyping = false
        abortController = null
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

onBeforeUnmount(() => {
    // ── FIX: เปลี่ยนเป็น abort เฉพาะเมื่อ component unmount จริง ๆ
    // ไม่ abort เมื่อแค่เปลี่ยน route ภายใน layout เดียวกัน
    // (ถ้า layout ไม่ re-mount component นี้ ก็จะไม่ถูกเรียก)
    abortController?.abort()
})

watch(() => route.params.id, (newId, oldId) => {
    if (newId === oldId) return
    // abort stream ของ channel เก่า แล้วเริ่ม session ใหม่
    abortController?.abort()
    state.chatHistory = []
    state.streamingText = ''
    state.isTyping = false
    userHasScrolledUp.value = false
    initChatSession()
})
</script>

<template>
    <main class="flex-1 flex flex-col relative min-w-0 min-h-0 overflow-hidden">
        <!-- Header -->
        <div
            class="bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-3 sm:px-6 sticky top-0 z-20 shrink-0">
            <nav class="flex items-center justify-between py-3 sm:py-4">
                <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                    <UButton icon="i-heroicons-arrow-left" color="neutral" variant="ghost" size="md"
                        @click="$router.back()"
                        class="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-xl shrink-0"
                        aria-label="ย้อนกลับ" />
                    <div class="w-1 h-6 sm:h-8 rounded-full bg-gradient-to-b from-primary-500 to-primary-600 shrink-0">
                    </div>
                    <h1 class="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                        {{ channelTitle }}
                    </h1>
                </div>
                <div v-if="authStore.isLoggedIn" class="flex items-center gap-2 shrink-0">
                    <UButton icon="i-lucide-menu" color="neutral" variant="ghost" size="md" class="lg:hidden"
                        :badge="fileCount > 0 ? String(fileCount) : undefined" aria-label="ดูไฟล์"
                        @click="emit('open-sidebar')" />
                    <div class="hidden lg:flex">
                        <UserMenu compact="Default" class="hidden lg:flex" />
                    </div>
                </div>
                <div v-else class="flex items-center gap-2 shrink-0">
                    <ButtomLogin />
                </div>
            </nav>
        </div>

        <!-- Loading State -->
        <div v-if="chatLoading && state.chatHistory.length === 0"
            class="flex-1 flex items-center justify-center min-h-0">
            <div class="text-center space-y-4">
                <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
                <p class="text-gray-500">กำลังเตรียมห้องสนทนา...</p>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!showChatArea"
            class="flex-1 flex flex-col items-center justify-center gap-6 sm:gap-8 px-4 text-center min-h-0">
            <div class="relative">
                <div
                    class="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-linear-to-br from-primary-500 to-blue-600 flex items-center justify-center shadow-2xl">
                    <UIcon name="i-heroicons-chat-bubble-oval-left-ellipsis"
                        class="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>
            </div>
            <div class="space-y-2 sm:space-y-3">
                <h2
                    class="text-2xl sm:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    เริ่มต้นการสนทนา
                </h2>
                <p class="text-gray-600 dark:text-gray-400 max-w-sm text-base sm:text-lg px-4">
                    เพิ่มแหล่งข้อมูลของคุณแล้วถามคำถามเกี่ยวกับเอกสารเหล่านั้นได้เลย
                </p>
            </div>
        </div>

        <!-- Chat Area -->
        <div v-else class="flex flex-col flex-1 relative overflow-hidden min-h-0">
            <!-- Chat Messages -->
            <div ref="chatContainer"
                class="flex-1 w-full overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 scroll-smooth min-h-0"
                @scroll="onContainerScroll">

                <!-- Welcome prompt -->
                <div v-if="state.chatHistory.length === 0 && !state.isTyping"
                    class="flex flex-col items-center justify-center h-full min-h-48 sm:min-h-64 gap-4 sm:gap-5 text-center animate-fade-in">
                    <div
                        class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-linear-to-br from-primary-500 to-blue-600 flex items-center justify-center shadow-xl">
                        <UIcon name="i-heroicons-sparkles" class="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div class="space-y-2">
                        <h3 class="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">พร้อมแล้ว!</h3>
                        <p class="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-xs sm:max-w-sm px-4">
                            เอกสารพร้อมแล้ว ถามมาได้เลยครับ 😊
                        </p>
                    </div>
                </div>

                <!-- ── Completed messages ── -->
                <div v-for="(msg, index) in state.chatHistory" :key="msg.id"
                    :class="['flex max-w-5xl mx-auto w-full px-1 lg:px-2 xl:px-8', msg.role === 'user' ? 'justify-end' : 'justify-start']">
                    <div :class="['max-w-full sm:max-w-full', msg.role === 'user' ? 'w-fit' : 'w-full']">

                        <!-- User Message -->
                        <div v-if="msg.role === 'user'" class="pl-17 lg:pl-65">
                            <div
                                class="bg-gray-200/50 dark:bg-gray-700 dark:text-white text-gray-900 px-4 py-3 rounded-lg text-sm sm:text-base font-medium">
                                {{ msg.text }}
                            </div>
                        </div>

                        <!-- AI Message (completed) -->
                        <div v-else class="group">
                            <div
                                class="space-y-3 w-full min-w-0 text-gray-800 dark:text-gray-200 leading-7 text-sm sm:text-base lg:text-lg">
                                <div class="markdown-body" v-html="render(msg.text)" />
                                <!-- Copy Button -->
                                <div class="flex justify-start" :class="index === lastBotIndex
                                    ? 'opacity-100'
                                    : 'opacity-0 group-hover:opacity-100 transition-opacity duration-200'">
                                    <UTooltip :delay-duration="0" text="คัดลอกข้อความ" :ui="{
                                        content: 'bg-gray-900/90 text-white dark:text-gray-900 dark:bg-gray-100 text-sm rounded-md px-2 py-1'
                                    }">
                                        <UButton
                                            :icon="msg.copied ? 'i-heroicons-check' : 'i-heroicons-clipboard-document'"
                                            size="lg" color="neutral" variant="ghost"
                                            class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                                            @click="copyMessage(msg)" />
                                    </UTooltip>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ── Streaming bubble ── -->
                <div v-if="state.isTyping"
                    class="flex max-w-5xl mx-auto w-full px-1 lg:px-2 xl:px-8 justify-start animate-fade-in">
                    <div class="flex gap-3 sm:gap-5 flex-row items-start">
                        <div
                            class="space-y-3 w-full min-w-0 text-gray-800 dark:text-gray-200 leading-7 text-sm sm:text-base lg:text-lg">

                            <!-- dot loading -->
                            <div v-if="!state.streamingText" class="flex items-center gap-1 py-1">
                                <span class="typing-dot" />
                                <span class="typing-dot" style="animation-delay: 0.15s" />
                                <span class="typing-dot" style="animation-delay: 0.3s" />
                            </div>

                            <!-- streaming markdown + cursor -->
                            <div v-else class="markdown-body streaming-content" v-html="render(state.streamingText)" />
                        </div>
                    </div>
                </div>

            </div>

            <!-- Input Area -->
            <div class="w-full max-w-5xl mx-auto px-3 sm:px-4">
                <form @submit.prevent="handleSendMessage">
                    <UChatPrompt v-model="state.message" variant="soft" placeholder="ถามคำถามเกี่ยวกับเอกสาร..."
                        :rows="1" autoresize :disabled="state.isTyping" @keydown.enter.exact.prevent="handleSendMessage"
                        class="border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-100 dark:bg-gray-800 focus-within:ring-primary-500/20 focus-within:border-primary-400 transition-all duration-300"
                        :ui="{
                            root: 'relative',
                            base: 'pl-4 sm:pl-6 pr-12 sm:pr-14 py-3 sm:py-4 text-sm sm:text-base'
                        }">
                        <template #trailing>
                            <div class="absolute right-3 sm:right-4 bottom-auto top-0 flex items-center h-full">
                                <UChatPromptSubmit @click="handleSendMessage" size="md" color="primary"
                                    :disabled="!canSendMessage || state.isTyping" icon="i-heroicons-paper-airplane"
                                    class="transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl" :class="{
                                        'scale-0 opacity-0 rotate-90': !canSendMessage,
                                        'scale-100 opacity-100 rotate-0 hover:scale-110': canSendMessage
                                    }" />
                            </div>
                        </template>
                    </UChatPrompt>
                </form>
            </div>

            <div class="shrink-0 input-area-wrapper z-10">
                <div class="w-full max-w-5xl mx-auto px-3 sm:px-4 pt-2 pb-3">
                    <p class="text-center text-sm text-gray-400 dark:text-gray-500 mt-2 hidden sm:block">
                        ข้อความจะหายไปเมื่อคุณออกจากห้องนี้ และอาจะมีความผิดพลาดได้
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

.input-area-safe {
    padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
}

.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, rgba(156, 163, 175, 0.3), rgba(156, 163, 175, 0.5));
    border-radius: 99px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(to bottom, rgba(156, 163, 175, 0.5), rgba(156, 163, 175, 0.7));
}

/* ตัวแชท */
:deep(.markdown-body) {
    line-height: 1.8;
    font-size: 1rem;
    min-width: 0;
    overflow-x: hidden;
    max-width: 100%;
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

/* ── Typing dots ── */
.typing-dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.4;
    animation: typing-bounce 0.8s ease-in-out infinite;
}

@keyframes typing-bounce {

    0%,
    80%,
    100% {
        transform: translateY(0);
        opacity: 0.4;
    }

    40% {
        transform: translateY(-5px);
        opacity: 1;
    }
}
</style>

<!-- Global styles — ใช้กับ v-html ได้โดยตรง -->
<style>
/* ── Code block layout ── */
.code-block {
    border-radius: 12px;
    overflow: hidden;
    /* ใช้โทนสีเดียวกับ layout border */
    border: 1px solid #e2e8f0;
    margin: 1rem 0;
    font-size: 14.5px;
    /* ใหญ่ขึ้นจาก 13px */
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    /* subtle shadow เหมือน ChatGPT / Claude */
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
}

.code-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    /* โทนเดียวกับ navbar: bg-gray-50 */
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
}

.code-lang {
    font-size: 12.5px;
    color: #64748b;
    /* slate-500 — ดูสะอาดกว่า GitHub gray */
    font-family: 'Consolas', 'JetBrains Mono', monospace;
    font-weight: 500;
    letter-spacing: 0.02em;
    text-transform: lowercase;
}

.copy-code-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: #64748b;
    background: none;
    border: 1px solid #cbd5e1;
    /* slate-300 */
    padding: 3px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: inherit;
}

.copy-code-btn:hover {
    background: #e2e8f0;
    color: #334155;
    border-color: #94a3b8;
}

.copy-code-btn.copied {
    color: #059669;
    /* emerald-600 */
    border-color: #059669;
}

/* Pre / Code */
.code-block pre {
    margin: 0;
    padding: 16px 18px;
    /* พื้นหลัง off-white อ่านง่าย */
    background: #f8fafc;
    overflow-x: auto;
    max-width: 100%;
    box-sizing: border-box;
}

.code-block pre code {
    font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;
    background: none;
    padding: 0;
    font-size: 14.5px;
    /* ใหญ่ขึ้น */
    line-height: 1.7;
}

/* ── Syntax highlight (Light) — โทน VS Code Light+ ── */
.hljs {
    color: #1e293b;
    /* slate-800 */
    background: transparent;
}

.hljs-keyword,
.hljs-selector-tag,
.hljs-operator {
    color: #7c3aed;
    /* violet-600 — เข้ากับโทน primary */
    font-weight: 600;
}

.hljs-string,
.hljs-attr {
    color: #0369a1;
    /* sky-700 */
}

.hljs-number,
.hljs-literal {
    color: #d97706;
    /* amber-600 */
}

.hljs-comment {
    color: #94a3b8;
    /* slate-400 */
    font-style: italic;
}

.hljs-function,
.hljs-title {
    color: #0f766e;
    /* teal-700 */
    font-weight: 600;
}

.hljs-type,
.hljs-class {
    color: #c2410c;
    /* orange-700 */
}

.hljs-variable,
.hljs-params {
    color: #1e293b;
}

.hljs-built_in {
    color: #b45309;
    /* amber-700 */
}

.hljs-tag,
.hljs-name {
    color: #0f766e;
}

/* Inline code */
.inline-code {
    font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 0.875em;
    background: #f1f5f9;
    /* slate-100 */
    padding: 2px 6px;
    border-radius: 5px;
    color: #7c3aed;
    /* เข้ากับ primary accent */
    border: 1px solid #e2e8f0;
}

/* ══════════════════════════════════════
   DARK MODE
══════════════════════════════════════ */
/* โทน dark เดียวกับ layout: bg-neutral-800 / bg-neutral-900 */
.dark .code-block {
    border-color: #334155;
    /* slate-700 */
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.dark .code-header {
    background: #1e293b;
    /* slate-800 — เข้ากับ neutral-800 */
    border-color: #334155;
}

.dark .code-lang {
    color: #94a3b8;
    /* slate-400 */
}

.dark .copy-code-btn {
    color: #94a3b8;
    border-color: #334155;
}

.dark .copy-code-btn:hover {
    background: #334155;
    color: #e2e8f0;
    border-color: #475569;
}

.dark .copy-code-btn.copied {
    color: #34d399;
    /* emerald-400 */
    border-color: #34d399;
}

.dark .code-block pre {
    background: #0f172a;
    /* slate-900 — เข้ากับ neutral-900 */
}

/* Syntax highlight (Dark) — โทน GitHub Dark / VS Code Dark+ */
.dark .hljs {
    color: #e2e8f0;
    /* slate-200 */
}

.dark .hljs-keyword,
.dark .hljs-selector-tag,
.dark .hljs-operator {
    color: #c084fc;
    /* purple-400 — vivid แต่ไม่บาดตา */
    font-weight: 600;
}

.dark .hljs-string,
.dark .hljs-attr {
    color: #7dd3fc;
    /* sky-300 */
}

.dark .hljs-number,
.dark .hljs-literal {
    color: #fbbf24;
    /* amber-400 */
}

.dark .hljs-comment {
    color: #475569;
    /* slate-600 */
    font-style: italic;
}

.dark .hljs-function,
.dark .hljs-title {
    color: #34d399;
    /* emerald-400 */
    font-weight: 600;
}

.dark .hljs-type,
.dark .hljs-class {
    color: #fb923c;
    /* orange-400 */
}

.dark .hljs-variable,
.dark .hljs-params {
    color: #e2e8f0;
}

.dark .hljs-built_in {
    color: #fbbf24;
}

.dark .hljs-tag,
.dark .hljs-name {
    color: #34d399;
}

.dark .inline-code {
    background: #1e293b;
    /* slate-800 */
    border-color: #334155;
    color: #c084fc;
    /* purple-400 */
}
</style>