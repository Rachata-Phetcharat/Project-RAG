<script setup lang="ts">
const props = defineProps<{
    open: boolean
    roleItems: { label: string; value: string }[]
    accountTypeItems: { label: string; value: string }[]
    selectedRoles: string[]
    selectedAccountTypes: string[]
}>()

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
    (e: 'apply', filters: { roles: string[]; accountTypes: string[] }): void
}>()

// local state ที่ copy มาจาก props ตอนเปิด
const localRoles = ref<string[]>([])
const localAccountTypes = ref<string[]>([])

watch(
    () => props.open,
    (isOpen) => {
        if (!isOpen) return
        localRoles.value = [...props.selectedRoles]
        localAccountTypes.value = [...props.selectedAccountTypes]
    },
    { immediate: true }
)

const toggleRole = (val: string) => {
    const idx = localRoles.value.indexOf(val)
    if (idx === -1) localRoles.value.push(val)
    else localRoles.value.splice(idx, 1)
}

const toggleAccountType = (val: string) => {
    const idx = localAccountTypes.value.indexOf(val)
    if (idx === -1) localAccountTypes.value.push(val)
    else localAccountTypes.value.splice(idx, 1)
}

const isRoleSelected = (val: string) => localRoles.value.includes(val)
const isAccountTypeSelected = (val: string) => localAccountTypes.value.includes(val)

const totalActive = computed(
    () => localRoles.value.length + localAccountTypes.value.length
)

const roleBadgeColor = (r: string): string => {
    const map: Record<string, string> = {
        admin: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700',
        special: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700',
        user: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
    }
    return map[r] ?? map['user']!
}

const roleBadgeColorSelected = (r: string): string => {
    const map: Record<string, string> = {
        admin: 'bg-red-500 text-white border-red-500 shadow-md shadow-red-200 dark:shadow-red-900/40',
        special: 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-200 dark:shadow-amber-900/40',
        user: 'bg-gray-600 text-white border-gray-600 shadow-md shadow-gray-200 dark:shadow-gray-900/40',
    }
    return map[r] ?? map['user']!
}

const clearAll = () => {
    localRoles.value = []
    localAccountTypes.value = []
}

const apply = () => {
    emit('apply', { roles: [...localRoles.value], accountTypes: [...localAccountTypes.value] })
    emit('update:open', false)
}

const close = () => emit('update:open', false)
</script>

<template>
    <UModal :open="open" @update:open="emit('update:open', $event)" :ui="{
        content: 'sm:max-w-md',
        overlay: 'backdrop-blur-sm'
    }">
        <template #header>
            <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-3">
                    <div
                        class="w-9 h-9 rounded-xl bg-linear-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shrink-0">
                        <UIcon name="i-lucide-sliders-horizontal" class="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 class="text-base font-bold text-gray-900 dark:text-white">ตัวกรอง</h3>
                        <p class="text-xs text-gray-400 dark:text-gray-500">เลือกเงื่อนไขที่ต้องการแสดง</p>
                    </div>
                </div>

                <!-- active badge -->
                <div v-if="totalActive > 0"
                    class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-semibold">
                    <span
                        class="w-4 h-4 rounded-full bg-violet-500 text-white flex items-center justify-center text-[10px] font-bold">
                        {{ totalActive }}
                    </span>
                    กรองอยู่
                </div>
            </div>
        </template>

        <template #body>
            <div class="space-y-6">

                <!-- ── สิทธิ์ ─────────────────────────────────── -->
                <div>
                    <div class="flex items-center justify-between mb-3">
                        <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                            <UIcon name="i-lucide-shield" class="w-4 h-4 text-violet-500" />
                            สิทธิ์การใช้งาน
                        </p>
                        <button v-if="localRoles.length > 0"
                            class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            @click="localRoles = []">
                            ล้าง
                        </button>
                    </div>

                    <div class="flex flex-wrap gap-2">
                        <button v-for="r in roleItems" :key="r.value" :class="[
                            'px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 cursor-pointer',
                            isRoleSelected(r.value)
                                ? roleBadgeColorSelected(r.value)
                                : roleBadgeColor(r.value)
                        ]" @click="toggleRole(r.value)">
                            <span class="flex items-center gap-1.5">
                                <UIcon v-if="isRoleSelected(r.value)" name="i-lucide-check" class="w-3 h-3" />
                                {{ r.label }}
                            </span>
                        </button>
                    </div>
                </div>

                <div class="border-t border-gray-100 dark:border-gray-800" />

                <!-- ── ประเภทบัญชี ─────────────────────────────── -->
                <div>
                    <div class="flex items-center justify-between mb-3">
                        <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                            <UIcon name="i-lucide-user-circle" class="w-4 h-4 text-violet-500" />
                            ประเภทบัญชี
                        </p>
                        <button v-if="localAccountTypes.length > 0"
                            class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            @click="localAccountTypes = []">
                            ล้าง
                        </button>
                    </div>

                    <div class="flex flex-wrap gap-2">
                        <button v-for="a in accountTypeItems" :key="a.value" :class="[
                            'px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 cursor-pointer',
                            isAccountTypeSelected(a.value)
                                ? 'bg-violet-500 text-white border-violet-500 shadow-md shadow-violet-200 dark:shadow-violet-900/40'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-violet-300 dark:hover:border-violet-600'
                        ]" @click="toggleAccountType(a.value)">
                            <span class="flex items-center gap-1.5">
                                <UIcon v-if="isAccountTypeSelected(a.value)" name="i-lucide-check" class="w-3 h-3" />
                                {{ a.label }}
                            </span>
                        </button>
                    </div>

                    <p v-if="accountTypeItems.length === 0" class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        ไม่มีข้อมูลประเภทบัญชี
                    </p>
                </div>

                <!-- ── Active filters preview ──────────────────── -->
                <div v-if="totalActive > 0"
                    class="rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 px-4 py-3">
                    <p class="text-xs font-medium text-violet-600 dark:text-violet-300 mb-2">กรองอยู่:</p>
                    <div class="flex flex-wrap gap-1.5">
                        <span v-for="r in localRoles" :key="'r-' + r"
                            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 border border-violet-200 dark:border-violet-700 text-xs text-violet-700 dark:text-violet-300">
                            <UIcon name="i-lucide-shield" class="w-3 h-3" />
                            {{ r }}
                            <button @click="toggleRole(r)" class="hover:text-red-500 transition-colors ml-0.5">
                                <UIcon name="i-lucide-x" class="w-3 h-3" />
                            </button>
                        </span>
                        <span v-for="a in localAccountTypes" :key="'a-' + a"
                            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 border border-violet-200 dark:border-violet-700 text-xs text-violet-700 dark:text-violet-300">
                            <UIcon name="i-lucide-user-circle" class="w-3 h-3" />
                            {{ a }}
                            <button @click="toggleAccountType(a)" class="hover:text-red-500 transition-colors ml-0.5">
                                <UIcon name="i-lucide-x" class="w-3 h-3" />
                            </button>
                        </span>
                    </div>
                </div>

            </div>
        </template>

        <template #footer>
            <div class="flex items-center justify-between w-full">
                <button
                    class="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-1 cursor-pointer"
                    :class="totalActive === 0 ? 'opacity-40 pointer-events-none' : ''" @click="clearAll">
                    <UIcon name="i-lucide-rotate-ccw" class="w-3.5 h-3.5" />
                    ล้างทั้งหมด
                </button>
                <div class="flex gap-2">
                    <UButton size="lg" color="neutral" variant="ghost" class="cursor-pointer" @click="close">
                        ยกเลิก
                    </UButton>
                    <UButton size="lg" color="primary" class="cursor-pointer px-6 shadow-md" @click="apply">
                        แสดงผล
                        <span v-if="totalActive > 0"
                            class="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                            {{ totalActive }}
                        </span>
                    </UButton>
                </div>
            </div>
        </template>
    </UModal>
</template>