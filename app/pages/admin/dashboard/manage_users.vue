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
const value = ref('all')
// ── Modal: ขนาดไฟล์เริ่มต้น ───────────────────────────────────
const isFilesizeModalOpen = ref(false)

const loadUser = async () => {
    user.value = await fetchUser({ skip: 0, limit: 100000000 })
}

const itemsRole = async () => {
    role.value = await fetchRole()
}

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
        cell: ({ row }) => h(resolveComponent('USelect'), {
            modelValue: row.original.role,
            items: role.value,
            color: 'neutral',
            variant: 'subtle',
            class: 'w-26',
            disabled: row.original.username === authStore.user?.username,
            'onUpdate:modelValue': async (val: string) => {
                row.original.role = val
                await updateRole(row.original.users_id, val)
                if (val === 'user') {
                    const defaultForType = accountType.value?.find((a: any) => a.type_name.trim() === row.original.account_type.trim())
                    if (defaultForType) {
                        row.original.file_size_byte = defaultForType.file_size_byte
                    }
                }
            }
        })
    },
    {
        accessorKey: 'file_size',
        header: 'ขนาดไฟล์ (MB)',
        cell: ({ row }) => {
            if (row.original.role === 'admin') {
                return h('span', { class: 'text-gray-500 italic text-sm' }, 'ไม่จำกัด')
            }
            const mb = (row.original.file_size_byte / (1024 * 1024)).toFixed(0)
            return h('div', { class: 'flex items-center gap-2' }, [
                h('span', { class: 'text-sm tabular-nums' }, `${mb} MB`),
                h(resolveComponent('UButton'), {
                    icon: 'i-lucide-pencil',
                    color: 'neutral',
                    variant: 'ghost',
                    size: 'xs',
                    onClick: () => openUserEdit(row.original)
                })
            ])
        }
    }
]

const pagination = ref({
    pageIndex: 0,
    pageSize: 10
})

const globalFilter = ref('')

// ── Mobile pagination ──────────────────────────────────────────
const mobilePage = ref(1)
const mobilePageSize = 10

watch([() => value.value, globalFilter], () => { mobilePage.value = 1 })

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

const userData = computed(() => {
    if (value.value === 'all') return user.value
    return user.value.filter(u => u.role === value.value)
})

// ── Modal: แก้ไขรายคน ──────────────────────────────────────────
const isUserEditModalOpen = ref(false)
const editingUser = ref<User | null>(null)

const openUserEdit = (u: User) => {
    editingUser.value = u
    isUserEditModalOpen.value = true
}

const handleSaveUser = async (userId: number, newRole: string, fileSizeByte: number | null) => {
    const u = user.value.find(u => u.users_id === userId)
    if (!u) return

    if (newRole !== u.role) {
        await updateRole(userId, newRole)
        u.role = newRole

        // ถ้าเปลี่ยนเป็น user → reset filesize กลับเป็น default ของ account_type
        if (newRole === 'user') {
            const defaultForType = accountType.value?.find((a: any) => a.type_name.trim() === u.account_type.trim())
            if (defaultForType) {
                await updateFileSize(userId, defaultForType.file_size_byte)
                u.file_size_byte = defaultForType.file_size_byte
            }
            return // ไม่ต้องไปแก้ filesize เพิ่ม
        }
    }

    if (fileSizeByte !== null) {
        const newMb = fileSizeByte / (1024 * 1024)
        const oldMb = u.file_size_byte / (1024 * 1024)
        if (newMb !== oldMb) {
            await updateFileSize(userId, fileSizeByte)
            u.file_size_byte = fileSizeByte
            // ถ้าแก้ filesize ในขณะที่ role ยัง user → upgrade เป็น special
            if (newRole === 'user') {
                await updateRole(userId, 'special')
                u.role = 'special'
            }
        }
    }
}

const roleWithAll = computed(() => [
    { label: 'all', value: 'all' },
    ...(role.value ?? [])
])

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
    <div class="flex">
        <AdminSidebar />

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
                                จัดการผู้ใช้
                            </h1>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                จัดการผู้ใช้งานและสิทธิ์ในระบบ
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Toolbar -->
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-6">
                <!-- Search — เต็มความกว้างบน mobile/md, ขยายได้บน lg -->
                <div class="relative group lg:flex-1 lg:max-w-md">
                    <UIcon name="i-lucide-search"
                        class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input v-model="globalFilter" type="text" placeholder="ค้นหาผู้ใช้งาน"
                        class="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm" />
                </div>

                <!-- Filters — wrap ได้บน mobile, อยู่ขวาบน lg -->
                <div class="flex flex-wrap items-center gap-2 lg:shrink-0">
                    <!-- ปุ่มเปิด modal ตั้งค่าขนาดไฟล์เริ่มต้น -->
                    <UButton color="primary" size="lg" icon="i-lucide-hard-drive" @click="isFilesizeModalOpen = true">
                        ขนาดไฟล์เริ่มต้น
                    </UButton>

                    <div class="w-px h-5 bg-gray-200 dark:bg-neutral-700" />

                    <!-- Role filter -->
                    <div
                        class="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                        <span class="text-xs">แสดงสิทธิ์ :</span>
                        <USelect v-model="value" :items="roleWithAll" color="neutral" size="sm" class="w-28" />
                    </div>
                </div>
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
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">ไม่มีผู้ใช้ในระบบ</p>
                    </div>
                </div>

                <template v-else>
                    <!-- ── Desktop Table (sm ขึ้นไป) ─────────────────────── -->
                    <div class="hidden sm:block overflow-x-auto">
                        <UTable ref="table" v-model:pagination="pagination" v-model:global-filter="globalFilter"
                            :data="userData" :columns="columns"
                            :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
                            class="flex-1 w-full" />

                        <div v-if="userData.length > 10"
                            class="flex justify-end border-t border-default pt-4 pb-3 px-4">
                            <UPagination :page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
                                :items-per-page="table?.tableApi?.getState().pagination.pageSize"
                                :total="table?.tableApi?.getFilteredRowModel().rows.length"
                                @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)" />
                        </div>
                    </div>

                    <!-- ── Mobile Card List (ต่ำกว่า sm) ──────────────────── -->
                    <div class="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
                        <!-- ไม่พบผลการค้นหา -->
                        <div v-if="filteredUserData.length === 0" class="text-center py-16 px-4">
                            <UIcon name="i-lucide-search-x" class="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">ไม่พบผู้ใช้ที่ค้นหา</p>
                            <button @click="globalFilter = ''"
                                class="mt-3 px-4 py-1.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg">
                                ล้างการค้นหา
                            </button>
                        </div>

                        <!-- การ์ดแต่ละ user -->
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

                            <!-- ปุ่มแก้ไข → เปิด ModalUserEdit -->
                            <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="sm" class="shrink-0"
                                @click="openUserEdit(u)" />
                        </div>

                        <!-- Pagination มือถือ -->
                        <div v-if="mobileTotalPages > 1"
                            class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                            <span class="text-xs text-gray-500 dark:text-gray-400">
                                หน้า {{ mobilePage }} / {{ mobileTotalPages }}
                            </span>
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
    </div>

    <!-- Modal: ขนาดไฟล์เริ่มต้น -->
    <ModalFilesizeDefault v-model:open="isFilesizeModalOpen" :account-type="accountType ?? []" :loading="loading"
        :save-handler="handleSaveDefaultFilesize" />

    <!-- Modal: แก้ไขรายคน -->
    <ModalUserEdit v-model:open="isUserEditModalOpen" :user="editingUser" :role-items="role ?? []"
        :is-self="editingUser?.username === authStore.user?.username"
        :default-file-size-mb="editingUser ? (accountType?.find((a: any) => a.type_name.trim() === editingUser?.account_type.trim())?.file_size_byte ?? 0) / (1024 * 1024) : 0"
        :loading="loading" :save-handler="handleSaveUser" />
</template>