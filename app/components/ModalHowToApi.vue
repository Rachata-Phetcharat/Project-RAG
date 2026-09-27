<script setup lang="ts">
import { ref, computed } from 'vue'

defineProps<{ open: boolean }>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const copiedId = ref<string | null>(null)
const dropdownOpen = ref(false)
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const languages = [
  { id: 'python', label: 'Python', ext: 'py' },
  { id: 'javascript', label: 'JavaScript', ext: 'js' },
  { id: 'curl', label: 'cURL', ext: 'sh' },
  { id: 'php', label: 'PHP', ext: 'php' },
] as const

type LangId = typeof languages[number]['id']
const activeLang = ref<LangId>('python')
const activeLanguage = computed(() => languages.find(l => l.id === activeLang.value)!)



const selectLang = (id: LangId) => {
  activeLang.value = id
  dropdownOpen.value = false
}

const snippets: Record<LangId, string> = {
  python: `import requests

url = "https://thinkhub.kmutnb.ac.th/fastapi/api/v1/chat/completions"
headers = {
    "Authorization": "Bearer <API_KEY>",
    "Content-Type": "application/json",
}
payload = {
    "channel_id": "ABCd123",
    "conversation_id": "client-app-user-1234",
    "messages": [
        {"content": "ข้อความคำถามของคุณ", "role": "user"}
    ],
}

response = requests.post(url, json=payload, headers=headers, timeout=30)
print(response.json())`,

  javascript: `const response = await fetch(
  "https://thinkhub.kmutnb.ac.th/fastapi/api/v1/chat/completions",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer <API_KEY>",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel_id: "ABCd123",
      conversation_id: "client-app-user-1234",
      messages: [
        { content: "ข้อความคำถามของคุณ", role: "user" }
      ],
    }),
  }
)

const data = await response.json()
console.log(data)`,

  curl: `curl -X POST \\
  https://thinkhub.kmutnb.ac.th/fastapi/api/v1/chat/completions \\
  -H "Authorization: Bearer <API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "channel_id": "ABCd123",
    "conversation_id": "client-app-user-1234",
    "messages": [
      { "content": "ข้อความคำถามของคุณ", "role": "user" }
    ]
  }'`,

  php: `<?php

$ch = curl_init();
curl_setopt_array($ch, [
  CURLOPT_URL            => "https://thinkhub.kmutnb.ac.th/fastapi/api/v1/chat/completions",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST           => true,
  CURLOPT_HTTPHEADER     => [
    "Authorization: Bearer <API_KEY>",
    "Content-Type: application/json",
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "channel_id"      => "ABCd123",
    "conversation_id" => "client-app-user-1234",
    "messages"        => [
      ["content" => "ข้อความคำถามของคุณ", "role" => "user"],
    ],
  ]),
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
}

const activeCode = computed(() => snippets[activeLang.value])

const toast = useToast()
const copyText = async (text: string, id: string) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }

    copiedId.value = id
    setTimeout(() => (copiedId.value = null), 2000)
    toast.add({ title: 'คัดลอกแล้ว!', icon: 'i-lucide-check-circle', color: 'success', duration: 1500 })

  } catch {
    toast.add({ title: 'คัดลอกไม่สำเร็จ', icon: 'i-lucide-x-circle', color: 'error', duration: 1500 })
  }
}

const downloadCode = (code: string, language: LangId) => {
  try {
    const lang = languages.find(l => l.id === language)
    const filename = `api-example.${lang?.ext}`

    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(code))
    element.setAttribute('download', filename)
    element.style.display = 'none'

    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)

    toast.add({ title: 'ดาวน์โหลดแล้ว!', icon: 'i-lucide-download', color: 'success', duration: 1500 })
  } catch {
    toast.add({ title: 'ดาวน์โหลดไม่สำเร็จ', icon: 'i-lucide-x-circle', color: 'error', duration: 1500 })
  }
}

const downloadPdf = () => {
  try {
    const link = document.createElement('a')
    link.href = '/files/คู่มือการใช้งาน.pdf'
    link.download = 'คู่มือการใช้งาน.pdf'
    link.click()
    document.body.removeChild(link)

    toast.add({ title: 'ดาวน์โหลด PDF แล้ว!', icon: 'i-lucide-download', color: 'success', duration: 1500 })
  } catch {
    toast.add({ title: 'ดาวน์โหลด PDF ไม่สำเร็จ', icon: 'i-lucide-x-circle', color: 'error', duration: 1500 })
  }
}

const close = () => emit('update:open', false)
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="open" class="modal-backdrop" :class="{ dark: isDark }" @click.self="close">
        <Transition name="modal">
          <div v-if="open" class="modal-panel" role="dialog" aria-modal="true">

            <!-- Stripe -->
            <div class="modal-stripe" aria-hidden="true" />

            <!-- Header -->
            <header class="modal-header">
              <div class="modal-header-left">
                <div class="modal-icon-wrap">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
                <div>
                  <p class="modal-title">วิธีใช้ API</p>
                  <p class="modal-subtitle">Public Chat Completions · v1</p>
                </div>
              </div>
              <button class="modal-close" @click="close" aria-label="ปิด">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <!-- Body -->
            <div class="modal-body">

              <!-- Endpoint -->
              <div class="endpoint-row">
                <span class="badge-post">POST</span>
                <code class="endpoint-path">https://thinkhub.kmutnb.ac.th/fastapi/api/v1/chat/completions</code>
                <span class="endpoint-sep">·</span>
                <span class="endpoint-hint">REST · JSON</span>
              </div>

              <!-- Code card -->
              <div class="code-card">
                <!-- Toolbar -->
                <div class="code-bar">
                  <!-- Language dropdown -->
                  <div class="lang-dropdown-wrap">
                    <button class="lang-trigger" @click="dropdownOpen = !dropdownOpen">
                      <span class="lang-dot" :data-lang="activeLang" />
                      <span class="lang-label">{{ activeLanguage.label }}</span>
                      <svg class="lang-caret" :class="{ 'lang-caret--open': dropdownOpen }" width="10" height="10"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    <Transition name="dropdown">
                      <div v-if="dropdownOpen" class="lang-dropdown">
                        <button v-for="lang in languages" :key="lang.id" class="lang-option"
                          :class="{ 'lang-option--active': activeLang === lang.id }" @click="selectLang(lang.id)">
                          <span class="lang-dot" :data-lang="lang.id" />
                          {{ lang.label }}
                          <svg v-if="activeLang === lang.id" class="lang-check" width="11" height="11"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                            stroke-linecap="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                      </div>
                    </Transition>
                  </div>

                  <!-- Copy & Download buttons -->
                  <div class="code-actions">
                    <button class="copy-btn" @click="copyText(activeCode, activeLang)">
                      <Transition name="fade-swap" mode="out-in">
                        <span v-if="copiedId === activeLang" key="ok" class="copy-ok">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2.5" stroke-linecap="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          คัดลอกแล้ว
                        </span>
                        <span v-else key="idle" class="copy-idle">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          คัดลอก
                        </span>
                      </Transition>
                    </button>

                    <button class="download-btn" @click="downloadCode(activeCode, activeLang)"
                      :title="`ดาวน์โหลดเป็น ${activeLanguage.label}`">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      ดาวน์โหลด
                    </button>
                  </div>
                </div>

                <!-- Code -->
                <Transition name="slide-code" mode="out-in">
                  <pre :key="activeLang" class="code-pre"><code>{{ activeCode }}</code></pre>
                </Transition>
              </div>

              <!-- Notice -->
              <div class="notice">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" class="notice-icon">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p class="notice-text">
                  เปลี่ยน <code class="notice-code">&lt;API_KEY&gt;</code> ให้เป็น key จริง และอย่าเปิดเผยหรือ commit
                  ขึ้น repository
                </p>
              </div>

            </div>

            <!-- Footer -->
            <footer class="modal-footer">
              <button class="btn-pdf" @click="downloadPdf" title="ดาวน์โหลดคู่มือ PDF">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <text x="8" y="17" font-size="6" font-weight="bold" fill="currentColor">PDF</text>
                </svg>
                ดาวน์โหลด PDF
              </button>
              <button class="btn-close" @click="close">ปิด</button>
            </footer>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Variables ── */
.modal-backdrop {
  --bg: #ffffff;
  --surface: #f5f4f1;
  --surface-2: #eeede9;
  --border: rgba(0, 0, 0, 0.08);
  --border-md: rgba(0, 0, 0, 0.13);
  --text: #111009;
  --text-2: #6b6960;
  --text-3: #a09e97;
  --code-bg: #f7f6f2;
  --code-text: #1d1a14;
  --code-border: rgba(0, 0, 0, 0.10);
  --code-muted: rgba(0, 0, 0, 0.55);
  --code-muted-strong: rgba(0, 0, 0, 0.78);
  --code-hover: rgba(0, 0, 0, 0.06);
  --code-hover-strong: rgba(0, 0, 0, 0.12);
  --code-dropdown-bg: #ffffff;
  --code-dropdown-border: rgba(0, 0, 0, 0.12);
  --code-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  --r-sm: 6px;
  --r-md: 10px;
  --r-lg: 16px;
}


.dark .modal-backdrop {
  --bg: #1a1914;
  --surface: #242318;
  --surface-2: #2c2b22;
  --border: rgba(255, 255, 255, 0.08);
  --border-md: rgba(255, 255, 255, 0.14);
  --text: #f0ede6;
  --text-2: #a09e97;
  --text-3: #6b6960;
  --code-bg: #0d0c09;
  --code-text: #cdc9bf;
  --code-border: rgba(255, 255, 255, 0.10);
  --code-muted: rgba(255, 255, 255, 0.55);
  --code-muted-strong: rgba(255, 255, 255, 0.85);
  --code-hover: rgba(255, 255, 255, 0.07);
  --code-hover-strong: rgba(255, 255, 255, 0.12);
  --code-dropdown-bg: #1c1b14;
  --code-dropdown-border: rgba(255, 255, 255, 0.12);
  --code-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
}

/* ── Lang dot colors ── */
.lang-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.lang-dot[data-lang="python"] {
  background: #3b82f6;
}

.lang-dot[data-lang="javascript"] {
  background: #f59e0b;
}

.lang-dot[data-lang="curl"] {
  background: #10b981;
}

.lang-dot[data-lang="php"] {
  background: #8b5cf6;
}

/* ── Backdrop ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

/* ── Panel ── */
.modal-panel {
  width: 100%;
  max-width: 560px;
  max-height: 92vh;
  background: var(--bg);
  border: 1px solid var(--border-md);
  border-radius: var(--r-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.04) inset,
    0 32px 64px rgba(0, 0, 0, 0.20),
    0 8px 24px rgba(0, 0, 0, 0.10);
}

/* ── Stripe ── */
.modal-stripe {
  height: 2.5px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4);
  flex-shrink: 0;
}

/* ── Header ── */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.modal-header-left {
  display: flex;
  align-items: center;
  gap: 11px;
}

.modal-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: var(--r-sm);
  background: #ede9fe;
  color: #5b21b6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dark .modal-icon-wrap {
  background: #2d1e6a;
  color: #c4b5fd;
}

.modal-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  letter-spacing: -0.01em;
}

.modal-subtitle {
  font-size: 11px;
  color: var(--text-3);
  margin: 1px 0 0;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.modal-close {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}

.modal-close:hover {
  background: var(--surface);
  color: var(--text);
}

/* ── Body ── */
.modal-body {
  padding: 18px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
  min-height: 0;
}

/* ── Endpoint ── */
.endpoint-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface-2);
  border: 2px solid var(--border);
  border-radius: var(--r-md);
  padding: 9px 13px;
}

.badge-post {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.07em;
  color: #065f46;
  background: #d1fae5;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.dark .badge-post {
  color: #6ee7b7;
  background: #064e3b;
}

.endpoint-path {
  font-size: 12px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: var(--text);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.endpoint-sep {
  color: var(--text-3);
  font-size: 12px;
}

.endpoint-hint {
  font-size: 11px;
  color: var(--text-3);
  white-space: nowrap;
}

/* ── Code card ── */
.code-card {
  border-radius: var(--r-md);
  overflow: visible;
  border: 1px solid var(--code-border);
}

/* ── Code bar ── */
.code-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  background: var(--code-bg);
  border-radius: var(--r-md) var(--r-md) 0 0;
  border-bottom: 1px solid var(--code-border);
  position: relative;
}

/* ── Lang dropdown ── */
.lang-dropdown-wrap {
  position: relative;
}

.lang-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--code-hover);
  border: 1px solid var(--code-border);
  border-radius: 5px;
  padding: 4px 8px 4px 7px;
  cursor: pointer;
  color: var(--code-muted-strong);
  font-size: 11.5px;
  font-weight: 500;
  transition: background 0.13s;
}

.lang-trigger:hover {
  background: var(--code-hover-strong);
}

.lang-label {
  line-height: 1;
}

.lang-caret {
  color: var(--code-muted);
  transition: transform 0.15s ease;
  flex-shrink: 0;
}

.lang-caret--open {
  transform: rotate(180deg);
}

.lang-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  background: var(--code-dropdown-bg);
  border: 1px solid var(--code-dropdown-border);
  border-radius: 8px;
  padding: 4px;
  min-width: 148px;
  z-index: 20;
  box-shadow: var(--code-shadow);
}

.lang-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  border: none;
  background: transparent;
  color: var(--code-muted);
  font-size: 12px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
  text-align: left;
}

.lang-option:hover {
  background: var(--code-hover);
  color: var(--code-muted-strong);
}

.lang-option--active {
  color: var(--code-muted-strong);
}

.lang-check {
  margin-left: auto;
  color: #4ade80;
  flex-shrink: 0;
}

/* ── Copy button ── */
.code-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.copy-btn,
.download-btn {
  background: var(--code-hover);
  border: 1px solid var(--code-border);
  border-radius: 5px;
  padding: 4px 10px;
  cursor: pointer;
  color: var(--code-muted);
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background 0.13s, color 0.13s;
}

.copy-btn:hover,
.download-btn:hover {
  background: var(--code-hover-strong);
  color: var(--code-muted-strong);
}

.copy-ok,
.copy-idle {
  display: flex;
  align-items: center;
  gap: 5px;
}

.copy-ok {
  color: #4ade80;
}

/* ── Code pre ── */
.code-pre {
  margin: 0;
  padding: 15px 16px;
  background: var(--code-bg);
  overflow-x: auto;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 12px;
  line-height: 1.75;
  color: var(--code-text);
  max-height: 280px;
  overflow-y: auto;
  border-radius: 0 0 var(--r-md) var(--r-md);
}

.code-pre code {
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  white-space: pre;
}

.code-pre::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.code-pre::-webkit-scrollbar-track {
  background: transparent;
}

.code-pre::-webkit-scrollbar-thumb {
  background: var(--code-border);
  border-radius: 2px;
}

/* ── Notice ── */
.notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: var(--r-md);
  padding: 10px 13px;
}

.dark .notice {
  background: #1e1906;
  border-color: #6b4c08;
}

.notice-icon {
  color: #92400e;
  flex-shrink: 0;
  margin-top: 1px;
}

.dark .notice-icon {
  color: #fbbf24;
}

.notice-text {
  font-size: 12px;
  color: #92400e;
  line-height: 1.55;
  margin: 0;
}

.dark .notice-text {
  color: #fcd34d;
}

.notice-code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
  background: #fef3c7;
  padding: 1px 5px;
  border-radius: 3px;
}

.dark .notice-code {
  background: #2d2007;
}

/* ── Footer ── */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 13px 18px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.footer-link {
  font-size: 12px;
  color: var(--text-3);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.15s;
}

.footer-link:hover {
  color: var(--text);
}

.btn-close {
  font-size: 12.5px;
  font-weight: 500;
  background: var(--surface);
  border: 1px solid var(--border-md);
  color: var(--text);
  border-radius: var(--r-sm);
  padding: 6px 16px;
  cursor: pointer;
  transition: background 0.13s;
}

.btn-close:hover {
  background: var(--surface-2);
}

.btn-pdf {
  font-size: 12.5px;
  font-weight: 500;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #dc2626;
  border-radius: var(--r-sm);
  padding: 6px 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.13s, color 0.13s;
  margin-right: 10px;
}

.btn-pdf:hover {
  background: #e5e7eb;
  color: #b91c1c;
}

.dark .btn-pdf {
  background: #2d2d2d;
  border-color: #404040;
  color: #f87171;
}

.dark .btn-pdf:hover {
  background: #3f3f3f;
  color: #fca5a5;
}

/* ── Transitions ── */
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.2s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.modal-enter-active {
  transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.34, 1.3, 0.64, 1);
}

.modal-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.97) translateY(4px);
}

.slide-code-enter-active,
.slide-code-leave-active {
  transition: opacity 0.13s ease, transform 0.13s ease;
}

.slide-code-enter-from {
  opacity: 0;
  transform: translateY(5px);
}

.slide-code-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

.dropdown-enter-active {
  transition: opacity 0.12s ease, transform 0.12s cubic-bezier(0.34, 1.3, 0.64, 1);
}

.dropdown-leave-active {
  transition: opacity 0.09s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-4px) scale(0.97);
}

.dropdown-leave-to {
  opacity: 0;
}

.fade-swap-enter-active,
.fade-swap-leave-active {
  transition: opacity 0.1s;
}

.fade-swap-enter-from,
.fade-swap-leave-to {
  opacity: 0;
}
</style>