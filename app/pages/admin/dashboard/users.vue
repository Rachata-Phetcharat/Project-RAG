<script setup lang="ts">
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { TableColumn } from '@nuxt/ui'
const authStore = useAuthStore()

const { fetchUser, fetchRole, changeRole, changeFileSize, accountTypes, loading } = useUser()

definePageMeta({
    middleware: ['auth', 'admin'],
    layout: 'dashboard-layout'
})

const table = useTemplateRef('table')
const user = ref<User[]>([])
const role = ref()
const accountType = ref()
const value = ref('user')
const editingFileSize = ref<Record<number, number>>({})
const editingChanged = ref<Record<number, boolean>>({})

const itemsRole = async () => {
    role.value = await fetchRole()
}

const itemsAccountTypes = async () => {
    accountType.value = await accountTypes()
}

const updateRole = async (userId: number, newRole: string) => {
    await changeRole(userId, newRole)
}

const updateFileSize = async (userId: number, fileSize: number) => {
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

const loadUser = async () => {
    user.value = await fetchUser({ skip: 0, limit: 100000000 })
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
            }
        })
    },
    {
        accessorKey: 'file_size',
        header: 'ขนาดไฟล์ (MB)',
        cell: ({ row }) => {
            const userId = row.original.users_id
            if (editingFileSize.value[userId] === undefined) {
                editingFileSize.value[userId] = row.original.file_size_byte / (1024 * 1024)
            }

            return h('div', { class: 'flex items-center gap-2' }, [
                h(resolveComponent('UInput'), {
                    modelValue: editingFileSize.value[userId],
                    type: 'number',
                    color: 'neutral',
                    variant: 'subtle',
                    class: 'w-24',
                    disabled: row.original.role === 'user',
                    'onUpdate:modelValue': (val: string) => {
                        editingFileSize.value[userId] = Number(val)
                        editingChanged.value[userId] = true // mark ว่าแก้แล้ว
                    }
                }),
                // แสดงปุ่มเฉพาะตอนที่แก้ค่า
                editingChanged.value[userId]
                    ? h('div', { class: 'absolute right-30 items-center' }, [
                        h(resolveComponent('UButton'), {
                            icon: 'i-lucide-check',
                            color: 'success',
                            variant: 'ghost',
                            size: 'xs',
                            disabled: row.original.role === 'user',
                            onClick: async () => {
                                const fileSize = editingFileSize.value[userId]
                                if (fileSize !== undefined) {
                                    row.original.file_size_byte = fileSize * 1024 * 1024
                                    await updateFileSize(userId, row.original.file_size_byte)
                                    editingChanged.value[userId] = false
                                }
                            }
                        }),
                        h(resolveComponent('UButton'), {
                            icon: 'i-lucide-rotate-ccw',
                            color: 'error',
                            variant: 'ghost',
                            size: 'xs',
                            disabled: row.original.role === 'user',
                            onClick: () => {
                                editingFileSize.value[userId] = row.original.file_size_byte / (1024 * 1024) // คืนค่าเดิม
                                editingChanged.value[userId] = false // ซ่อนปุ่ม
                            }
                        })
                    ])
                    : null
            ])
        }
    }
]

const pagination = ref({
    pageIndex: 0,
    pageSize: 10
})

const globalFilter = ref('')

const userData = computed(() => {
    return user.value.filter(u => u.role === value.value)
})

onMounted(() => {
    loadUser()
    itemsRole()
    itemsAccountTypes()
})
</script>

<template>
    <div class="flex">
        <AdminSidebar />

        <main class="flex-1 p-6 md:p-8 overflow-auto mx-auto w-full">

            <!-- Header -->
            <div class="mb-8">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div class="flex items-center gap-3">
                        <div class="relative">
                            <div
                                class="absolute inset-0 bg-linear-to-r from-blue-500 to-cyan-500 rounded-xl blur-lg opacity-50" />
                            <div class="relative p-3 bg-linear-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                                <UIcon name="i-lucide-users" class="w-7 h-7 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1
                                class="text-3xl md:text-4xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                จัดการผู้ใช้
                            </h1>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                จัดการผู้ใช้งานและสิทธิของพวกเขาในระบบ
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between mb-10">
                <div class="relative group">
                    <UIcon name="i-lucide-search"
                        class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input v-model="globalFilter" type="text" placeholder="ค้นหาผู้ใช้งาน..."
                        class="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" />
                </div>

                <USelect v-model="value" :items="role" color="neutral" size="lg" class="w-25" />
            </div>

            <!-- Table -->
            <div
                class="w-full space-y-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">

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
                    <UTable v-if="userData.length > 0" :key="value" ref="table" v-model:pagination="pagination"
                        v-model:global-filter="globalFilter" :data="userData" :columns="columns"
                        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }" class="flex-1" />

                    <div v-if="userData.length > 10" class="flex justify-end border-t border-default pt-4 px-4">
                        <UPagination :page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
                            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
                            :total="table?.tableApi?.getFilteredRowModel().rows.length"
                            @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)" />
                    </div>
                </template>

            </div>

            <!-- Decorative -->
            <div
                class="fixed top-40 right-20 w-72 h-72 bg-linear-to-br from-blue-400 to-cyan-400 rounded-full opacity-10 blur-3xl -z-10 pointer-events-none">
            </div>

        </main>
    </div>
</template>