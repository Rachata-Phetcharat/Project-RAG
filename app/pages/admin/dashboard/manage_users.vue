<script setup lang="ts">
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { TableColumn } from '@nuxt/ui'
const authStore = useAuthStore()

const { fetchUser, fetchRole, changeRole, changeFileSize, defaultFilesize, updateDefaultFilesize, loading } = useUser()

definePageMeta({
    middleware: ['auth', 'admin'],
    layout: 'dashboard-layout'
})

const table = useTemplateRef('table')
const user = ref<User[]>([])
const role = ref()
const accountType = ref()

// ── Modal: ขนาดไฟล์เริ่มต้น ───────────────────────────────────
const isFilesizeModalOpen = ref(false)

// ── Modal: ตัวกรอง ────────────────────────────────────────────
const isFilterModalOpen = ref(false)
const filterRoles = ref<string[]>([])
const filterAccountTypes = ref<string[]>([])

// ดึง account_type unique จาก user list โดยตรง → ไม่ต้องรอ API แยก
const accountTypeItems = computed<{ label: string; value: string }[]>(() => {
    const seen = new Set<string>()
    const items: { label: string; value: string }[] = []
    for (const u of user.value) {
        const t = u.account_type?.trim()
        if (t && !seen.has(t)) {
            seen.add(t)
            items.push({ label: t, value: t })
        }
    }
    return items
})

const onApplyFilter = (filters: { roles: string[]; accountTypes: string[] }) => {
    filterRoles.value = filters.roles
    filterAccountTypes.value = filters.accountTypes
    tableKey.value++
}

const activeFilterCount = computed(
    () => filterRoles.value.length + filterAccountTypes.value.length
)

const loadUser = async () => {
    user.value = await fetchUser({ skip: 0, limit: 100000000 })
}

const itemsRole = async () => {
    const res = await fetchRole()
    role.value = res
}

// normalize ทุกรูปแบบที่ API อาจส่งมา → เป็น { label, value }[] เสมอ
const roleItems = computed<{ label: string; value: string }[]>(() => {
    if (!role.value) return []
    return (role.value as any[]).map((r: any) => {
        const v = typeof r === 'string' ? r : (r.value ?? r.role ?? r.name ?? r.role_name ?? String(r))
        return { label: v, value: v }
    })
})

const itemsAccountTypes = async () => {
    accountType.value = await defaultFilesize()
}

// saveHandler ที่ส่งให้ ModalFilesizeDefault
const handleSaveDefaultFilesize = async (accountTypeId: number, mb: number) => {
    await updateDefaultFilesize({
        account_type_id: accountTypeId,
        file_size_byte: mb * 1024 * 1024
    })

    // อัปเดต accountType local ให้ตรงกับค่าที่บันทึก
    const target = accountType.value?.find((a: any) => a.account_type_id === accountTypeId)
    if (target) target.file_size_byte = mb * 1024 * 1024

    // อัปเดต user ที่ account_type ตรงกัน
    user.value.forEach((u) => {
        if (u.account_type.trim() === target?.type_name.trim()) {
            u.file_size_byte = mb * 1024 * 1024
        }
    })

    await authStore.fetchUser()
}

const updateRole = async (userId: number, newRole: string) => {
    await changeRole(userId, newRole)
}

const updateFileSize = async (userId: number, fileSize: number | null) => {
    await changeFileSize({ users_id: userId, file_size_byte: fileSize })
}

interface User {
    users_id: number
    username: string
    name: string
    role: string
    account_type: string
    file_size_byte: number
}

const columns: TableColumn<User>[] = [
    {
        accessorKey: 'username',
        header: 'Username'
    },
    {
        accessorKey: 'name',
        header: 'ชื่อ-นามสกุล'
    },
    {
        accessorKey: 'account_type',
        header: 'ประเภท'
    },
    {
        accessorKey: 'role',
        header: 'สิทธิ์',
        cell: ({ row }) => {
            const colorMap: Record<string, 'error' | 'warning' | 'neutral'> = {
                admin: 'error',
                special: 'warning',
                user: 'neutral',
            }
            const color = colorMap[row.original.role] ?? 'neutral'
            return h(resolveComponent('UBadge'), {
                color,
                variant: 'subtle',
                class: 'capitalize',
            }, () => row.original.role)
        }
    },
    {
        accessorKey: 'file_size',
        header: 'ขนาดไฟล์ (MB)',
        cell: ({ row }) => {
            const isAdmin = row.original.role === 'admin'
            const isSelf = row.original.username === authStore.user?.username
            const mb = (row.original.file_size_byte / (1024 * 1024)).toFixed(0)
            return h('div', { class: 'flex items-center justify-between' }, [
                h('span', { class: isAdmin ? 'text-gray-500 italic text-sm' : 'text-sm tabular-nums' },
                    isAdmin ? 'ไม่จำกัด' : `${mb} MB`
                ),
                !isSelf ? h(resolveComponent('UButton'), {
                    icon: 'i-lucide-pencil',
                    color: 'neutral',
                    variant: 'ghost',
                    size: 'xs',
                    class: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors bg-gray-100 dark:bg-gray-700/30 hover:bg-gray-200 dark:hover:bg-gray-600/50 p-1 rounded',
                    onClick: () => openUserEdit(row.original)
                }) : null
            ])
        }
    }
]

const pagination = ref({
    pageIndex: 0,
    pageSize: 8
})

const globalFilter = ref('')

// force UTable re-render เมื่อ filter เปลี่ยน
const tableKey = ref(0)

// ── Mobile pagination ──────────────────────────────────────────
const mobilePage = ref(1)
const mobilePageSize = 10

// [Pagination] เลื่อนขึ้นบนเมื่อเปลี่ยนหน้า
const channelGridRef = ref<HTMLElement | null>(null)

watch(mobilePage, () => {
    nextTick(() => {
        channelGridRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
})

watch([filterRoles, filterAccountTypes, globalFilter], () => { mobilePage.value = 1 })

// กรองตาม role + account_type + globalFilter
const userData = computed(() => {
    return user.value.filter(u => {
        const roleOk = filterRoles.value.length === 0
            || filterRoles.value.includes(u.role?.toLowerCase())
        const typeOk = filterAccountTypes.value.length === 0
            || filterAccountTypes.value.includes(u.account_type?.trim())
        return roleOk && typeOk
    })
})

const filteredUserData = computed(() => {
    if (!globalFilter.value.trim()) return userData.value
    const q = globalFilter.value.toLowerCase()
    return userData.value.filter(u =>
        u.username?.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q) ||
        u.account_type?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
    )
})

const mobilePaginatedData = computed(() => {
    const start = (mobilePage.value - 1) * mobilePageSize
    return filteredUserData.value.slice(start, start + mobilePageSize)
})

const mobileTotalPages = computed(() =>
    Math.ceil(filteredUserData.value.length / mobilePageSize)
)

// ── Modal: แก้ไขรายคน ──────────────────────────────────────────
const isUserEditModalOpen = ref(false)
const editingUser = ref<User | null>(null)

const openUserEdit = (u: User) => {
    editingUser.value = u
    isUserEditModalOpen.value = true
}

// handleSaveUser — รับค่าจาก ModalUserEdit
// fileSizeByte จะเป็น null เมื่อ role = user หรือ admin (Modal ไม่ส่งมา)
// fileSizeByte จะมีค่าเมื่อ role = special
const handleSaveUser = async (userId: number, newRole: string, fileSizeByte: number | null) => {
    const u = user.value.find(u => u.users_id === userId)
    if (!u) return

    // 1. เปลี่ยน role ถ้ามีการเปลี่ยน
    if (newRole !== u.role) {
        await updateRole(userId, newRole)
        u.role = newRole
    }

    // 2. อัปเดต filesize เฉพาะ special เท่านั้น
    //    user/admin → ไม่ยิง changeFileSize (ป้องกัน backend เด้งกลับ special)
    if (newRole === 'special' && fileSizeByte !== null) {
        if (fileSizeByte !== u.file_size_byte) {
            await updateFileSize(userId, fileSizeByte)
            u.file_size_byte = fileSizeByte
        }
    } else if (newRole === 'user') {
        // อัปเดต local state ให้แสดงค่า default ถูกต้อง
        const defaultForType = accountType.value?.find(
            (a: any) => a.type_name.trim() === u.account_type.trim()
        )
        u.file_size_byte = defaultForType?.file_size_byte ?? 0
    } else if (newRole === 'admin') {
        u.file_size_byte = 0
    }
}

const roleBadgeColor = (r: string): 'error' | 'warning' | 'neutral' => {
    const map: Record<string, 'error' | 'warning' | 'neutral'> = {
        admin: 'error',
        special: 'warning',
        user: 'neutral',
    }
    return map[r] ?? 'neutral'
}

onMounted(() => {
    loadUser()
    itemsRole()
    itemsAccountTypes()
})
</script>

<template>

    <main class="flex-1 p-4 md:p-6 lg:p-8 overflow-auto mx-auto w-full">

        <!-- Header -->
        <div class="mb-6 md:mb-8">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div class="flex items-center gap-3">
                    <div class="relative">
                        <div class="absolute inset-0 bg-slate-500 rounded-xl blur-lg opacity-20" />
                        <div class="relative p-3 bg-blue-500 dark:bg-blue-500 rounded-xl">
                            <UIcon name="i-lucide-users" class="w-6 h-6 text-white dark:text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 class="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">
                            จัดการผู้ใช้งาน
                        </h1>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            จัดการผู้ใช้งานและสิทธิ์ในระบบ
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div class="p-1" ref="channelGridRef"></div>

        <!-- Toolbar -->
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-6">
            <div class="relative group lg:flex-1 lg:max-w-md">
                <UIcon name="i-lucide-search"
                    class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input v-model="globalFilter" type="text" placeholder="ค้นหาผู้ใช้งาน"
                    class="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-base" />
            </div>


            <div class="flex flex-wrap items-center gap-2 lg:shrink-0">
                <UButton color="primary" size="lg" icon="i-lucide-hard-drive" @click="isFilesizeModalOpen = true">
                    ขนาดไฟล์เริ่มต้น
                </UButton>

                <div class="w-px h-5 bg-gray-200 dark:bg-neutral-700" />

                <!-- ปุ่มตัวกรอง -->
                <UButton color="neutral" variant="outline" size="lg" icon="i-lucide-sliders-horizontal"
                    class="cursor-pointer relative" @click="isFilterModalOpen = true">
                    ตัวกรอง
                    <span v-if="activeFilterCount > 0"
                        class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {{ activeFilterCount }}
                    </span>
                </UButton>
            </div>
        </div>

        <!-- Active filter chips -->
        <div v-if="activeFilterCount > 0" class="flex flex-wrap gap-2 mb-4">
            <span v-for="r in filterRoles" :key="'chip-r-' + r"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700">
                <UIcon name="i-lucide-shield" class="w-3 h-3" />
                {{ r }}
                <button @click="filterRoles = filterRoles.filter(x => x !== r); tableKey++"
                    class="ml-0.5 hover:text-red-500 transition-colors">
                    <UIcon name="i-lucide-x" class="w-3 h-3" />
                </button>
            </span>
            <span v-for="t in filterAccountTypes" :key="'chip-t-' + t"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700">
                <UIcon name="i-lucide-user-circle" class="w-3 h-3" />
                {{ t }}
                <button @click="filterAccountTypes = filterAccountTypes.filter(x => x !== t); tableKey++"
                    class="ml-0.5 hover:text-red-500 transition-colors">
                    <UIcon name="i-lucide-x" class="w-3 h-3" />
                </button>
            </span>
            <button @click="filterRoles = []; filterAccountTypes = []; tableKey++"
                class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-1 px-2 py-1">
                <UIcon name="i-lucide-rotate-ccw" class="w-3 h-3" />
                ล้างทั้งหมด
            </button>
        </div>

        <!-- Table Container -->
        <div
            class="w-full rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm bg-white dark:bg-gray-900">

            <!-- Loading -->
            <div v-if="loading" class="flex flex-col items-center justify-center gap-6 px-4 text-center py-32">
                <div class="relative">
                    <div class="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                    <div
                        class="relative p-6 bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-full">
                        <UIcon name="i-lucide-loader-circle" class="w-12 h-12 animate-spin text-blue-600" />
                    </div>
                </div>
                <div>
                    <p class="text-lg font-medium text-gray-700 dark:text-gray-300">กำลังโหลดข้อมูลผู้ใช้...</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">กรุณารอสักครู่</p>
                </div>
            </div>

            <!-- Empty -->
            <div v-else-if="userData.length === 0"
                class="flex flex-col items-center justify-center gap-6 px-4 text-center py-32">
                <div class="relative">
                    <div class="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                    <div
                        class="relative p-6 bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-full">
                        <UIcon name="i-lucide-user-x" class="w-12 h-12 text-blue-600" />
                    </div>
                </div>
                <div>
                    <p class="text-lg font-medium text-gray-700 dark:text-gray-300">ไม่มีข้อมูลผู้ใช้</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {{ activeFilterCount > 0 ? 'ไม่มีผู้ใช้ที่ตรงกับตัวกรองที่เลือก' : 'ไม่มีผู้ใช้ในระบบ' }}
                    </p>
                </div>
            </div>

            <template v-else>
                <!-- ── Desktop Table ─────────────────────── -->
                <div class="hidden sm:block overflow-x-auto">
                    <UTable :key="tableKey" ref="table" v-model:pagination="pagination"
                        v-model:global-filter="globalFilter" :data="userData" :columns="columns"
                        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
                        class="flex-1 w-full" />

                    <div v-if="userData.length > 10" class="flex justify-end border-t border-default pt-4 pb-3 px-4">
                        <UPagination :page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
                            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
                            :total="table?.tableApi?.getFilteredRowModel().rows.length"
                            @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)" />
                    </div>
                </div>

                <!-- ── Mobile Card List ──────────────────── -->
                <div class="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
                    <div v-if="filteredUserData.length === 0" class="text-center py-16 px-4">
                        <UIcon name="i-lucide-search-x" class="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">ไม่พบผู้ใช้ที่ค้นหา</p>
                        <button @click="globalFilter = ''"
                            class="mt-3 px-4 py-1.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg">
                            ล้างการค้นหา
                        </button>
                    </div>

                    <div v-for="u in mobilePaginatedData" :key="u.users_id" class="p-4 flex items-center gap-3">
                        <div class="flex-1 min-w-0 space-y-1">
                            <div class="flex items-center gap-2 flex-wrap">
                                <p class="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                    {{ u.name }}
                                </p>
                                <UBadge :color="roleBadgeColor(u.role)" variant="subtle"
                                    class="capitalize shrink-0 text-xs">
                                    {{ u.role }}
                                </UBadge>
                            </div>
                            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                                @{{ u.username }} · {{ u.account_type }}
                            </p>
                            <p class="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                <UIcon name="i-lucide-hard-drive" class="w-3 h-3 shrink-0" />
                                {{ u.role === 'admin' ? 'ไม่จำกัด' : `${(u.file_size_byte / (1024 *
                                    1024)).toFixed(0)} MB` }}
                            </p>
                        </div>

                        <UButton v-if="u.username !== authStore.user?.username" icon="i-lucide-pencil" color="neutral"
                            variant="ghost" size="sm" class="shrink-0" @click="openUserEdit(u)" />
                    </div>

                    <div v-if="mobileTotalPages > 1"
                        class="flex items-center justify-end px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                        <UPagination v-model:page="mobilePage" :total="filteredUserData.length"
                            :items-per-page="mobilePageSize" />
                    </div>
                </div>
            </template>
        </div>

        <!-- Decorative -->
        <div
            class="fixed top-40 right-20 w-72 h-72 bg-linear-to-br from-blue-400 to-cyan-400 rounded-full opacity-10 blur-3xl -z-10 pointer-events-none">
        </div>

    </main>

    <!-- Modal: ขนาดไฟล์เริ่มต้น -->
    <ModalFilesizeDefault v-model:open="isFilesizeModalOpen" :account-type="accountType ?? []" :loading="loading"
        :save-handler="handleSaveDefaultFilesize" />

    <!-- Modal: แก้ไขรายคน -->
    <ModalUserEdit v-model:open="isUserEditModalOpen" :user="editingUser" :role-items="roleItems"
        :is-self="editingUser?.username === authStore.user?.username"
        :default-file-size-mb="editingUser ? (accountType?.find((a: any) => a.type_name.trim() === editingUser?.account_type.trim())?.file_size_byte ?? 0) / (1024 * 1024) : 0"
        :loading="loading" :save-handler="handleSaveUser" />

    <!-- Modal: ตัวกรอง -->
    <ModalFilter v-model:open="isFilterModalOpen" :role-items="roleItems" :account-type-items="accountTypeItems"
        :selected-roles="filterRoles" :selected-account-types="filterAccountTypes" @apply="onApplyFilter" />
</template>