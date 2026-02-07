<script setup lang="ts">
// ============================================
// 1. นำเข้า Composable และตั้งค่าหน้า
// ============================================
definePageMeta({
    middleware: ['auth', 'admin'],
    layout: 'dashboard-layout'
})

// ============================================
// 2. State Management
// ============================================
const searchQuery = ref('')
const sortBy = ref('created_at')
const sortOrder = ref<'asc' | 'desc'>('desc')
const pageSize = ref(10)
const currentPage = ref(1)
const selectedUsers = ref<any[]>([])

const users = ref<any[]>([
    {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        status: 'active',
        joinDate: '2024-01-15',
        avatar: 'https://avatar.vercel.sh/admin'
    },
    {
        id: 2,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        status: 'active',
        joinDate: '2024-02-01',
        avatar: 'https://avatar.vercel.sh/john'
    },
    {
        id: 3,
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'user',
        status: 'inactive',
        joinDate: '2024-02-05',
        avatar: 'https://avatar.vercel.sh/jane'
    }
])

const modalState = reactive({
    isOpen: false,
    mode: 'view' as 'view' | 'edit' | 'create',
    selectedUser: null as any
})

// ============================================
// 3. Computed Properties
// ============================================
const filteredUsers = computed(() => {
    let result = users.value

    // Filter by search query
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(u =>
            u.name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            u.id.toString().includes(query)
        )
    }

    // Sort
    result.sort((a, b) => {
        let aVal = a[sortBy.value]
        let bVal = b[sortBy.value]

        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase()
            bVal = (bVal as string).toLowerCase()
        }

        if (sortOrder.value === 'asc') {
            return aVal > bVal ? 1 : -1
        } else {
            return aVal < bVal ? 1 : -1
        }
    })

    return result
})

const paginatedUsers = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredUsers.value.slice(start, end)
})

const totalPages = computed(() => {
    return Math.ceil(filteredUsers.value.length / pageSize.value)
})

// ============================================
// 4. Functions
// ============================================
const openViewModal = (user: any) => {
    modalState.selectedUser = { ...user }
    modalState.mode = 'view'
    modalState.isOpen = true
}

const openEditModal = (user: any) => {
    modalState.selectedUser = { ...user }
    modalState.mode = 'edit'
    modalState.isOpen = true
}

const saveUser = () => {
    if (modalState.mode === 'create') {
        const newUser = {
            id: Math.max(...users.value.map(u => u.id), 0) + 1,
            ...modalState.selectedUser,
            joinDate: new Date().toISOString().split('T')[0],
            avatar: `https://avatar.vercel.sh/${modalState.selectedUser.email}`
        }
        users.value.push(newUser)
    } else if (modalState.mode === 'edit') {
        const index = users.value.findIndex(u => u.id === modalState.selectedUser.id)
        if (index !== -1) {
            users.value[index] = { ...users.value[index], ...modalState.selectedUser }
        }
    }
    modalState.isOpen = false
}

const deleteUser = (userId: number) => {
    users.value = users.value.filter(u => u.id !== userId)
    modalState.isOpen = false
}

const toggleUserStatus = (user: any) => {
    const index = users.value.findIndex(u => u.id === user.id)
    if (index !== -1) {
        users.value[index].status = user.status === 'active' ? 'inactive' : 'active'
    }
}

const getRoleColor = (role: string) => {
    switch (role) {
        case 'admin':
            return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
        case 'moderator':
            return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        default:
            return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }
}

const getStatusColor = (status: string) => {
    return status === 'active'
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
}

const getStatusLabel = (status: string) => {
    return status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'
}

const getRoleLabel = (role: string) => {
    switch (role) {
        case 'admin':
            return 'ผู้ดูแลระบบ'
        case 'moderator':
            return 'ผู้ควบคุม'
        default:
            return 'ผู้ใช้ทั่วไป'
    }
}
</script>

<template>
    <div class="flex">
        <!-- Admin Sidebar -->
        <AdminSidebar />

        <!-- Main Content -->
        <main class="flex-1 p-6 md:p-8 overflow-auto max-w-7xl mx-auto w-full">
            <!-- Header Section -->
            <div class="mb-8">
                <!-- Title & Welcome -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div class="flex items-center gap-3">
                        <div class="relative">
                            <div
                                class="absolute inset-0 bg-linear-to-r from-blue-500 to-cyan-500 rounded-xl blur-lg opacity-50">
                            </div>
                            <div class="relative p-3 bg-linear-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                                <UIcon name="i-lucide-users" class="w-7 h-7 text-white" />
                            </div>
                        </div>
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <h1
                                    class="text-3xl md:text-4xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                    จัดการผู้ใช้
                                </h1>
                            </div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                จัดการผู้ใช้งานและสิทธิของพวกเขาในระบบ
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Search and Filter Section -->
            <div
                class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
                <div class="flex flex-col lg:flex-row gap-4 items-end">
                    <!-- Search -->
                    <div class="flex-1">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">ค้นหา</label>
                        <input v-model="searchQuery" type="text" placeholder="ค้นหาจากชื่อ อีเมล หรือ ID..."
                            class="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>

                    <!-- Sort By -->
                    <div class="w-full lg:w-48">
                        <label
                            class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">เรียงลำดับโดย</label>
                        <select v-model="sortBy"
                            class="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="created_at">วันที่สร้าง</option>
                            <option value="name">ชื่อ</option>
                            <option value="email">อีเมล</option>
                        </select>
                    </div>

                    <!-- Sort Order -->
                    <div class="w-full lg:w-32">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">ลำดับ</label>
                        <select v-model="sortOrder"
                            class="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="asc">น้อยไปมาก</option>
                            <option value="desc">มากไปน้อย</option>
                        </select>
                    </div>
                </div>

                <!-- Results count -->
                <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    <span class="font-medium">{{ filteredUsers.length }}</span> รายการจาก
                    <span class="font-medium">{{ users.length }}</span> ผู้ใช้ทั้งหมด
                </div>
            </div>

            <!-- Users Table -->
            <div
                class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <!-- Desktop Table -->
                <div class="hidden md:block overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                    ผู้ใช้</th>
                                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                    อีเมล</th>
                                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                    บทบาท</th>
                                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                    สถานะ</th>
                                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                    วันที่เข้าระบบ</th>
                                <th class="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                                    การดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                            <tr v-for="user in paginatedUsers" :key="user.id"
                                class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                <!-- User Info -->
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-3">
                                        <img :src="user.avatar" :alt="user.name"
                                            class="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700">
                                        <div>
                                            <p class="font-medium text-gray-900 dark:text-white">{{ user.name }}</p>
                                            <p class="text-xs text-gray-500 dark:text-gray-400">#{{ user.id }}</p>
                                        </div>
                                    </div>
                                </td>

                                <!-- Email -->
                                <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{{ user.email }}</td>

                                <!-- Role -->
                                <td class="px-6 py-4">
                                    <span
                                        :class="['px-3 py-1 rounded-full text-xs font-bold', getRoleColor(user.role)]">
                                        {{ getRoleLabel(user.role) }}
                                    </span>
                                </td>

                                <!-- Status -->
                                <td class="px-6 py-4">
                                    <button @click="toggleUserStatus(user)"
                                        :class="['px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all hover:scale-105', getStatusColor(user.status)]">
                                        {{ getStatusLabel(user.status) }}
                                    </button>
                                </td>

                                <!-- Join Date -->
                                <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{{ user.joinDate }}</td>

                                <!-- Actions -->
                                <td class="px-6 py-4">
                                    <div class="flex items-center justify-center gap-2">
                                        <button @click="openViewModal(user)"
                                            class="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-blue-600 dark:text-blue-400"
                                            title="ดู">
                                            <UIcon name="i-lucide-eye" class="w-5 h-5" />
                                        </button>
                                        <button @click="openEditModal(user)"
                                            class="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors text-green-600 dark:text-green-400"
                                            title="แก้ไข">
                                            <UIcon name="i-lucide-edit-2" class="w-5 h-5" />
                                        </button>
                                        <button @click="deleteUser(user.id)"
                                            class="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-red-600 dark:text-red-400"
                                            title="ลบ">
                                            <UIcon name="i-lucide-trash-2" class="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>

                            <!-- Empty State -->
                            <tr v-if="paginatedUsers.length === 0">
                                <td colspan="6" class="px-6 py-12 text-center">
                                    <div class="flex flex-col items-center gap-3">
                                        <UIcon name="i-lucide-inbox" class="w-12 h-12 text-gray-300" />
                                        <p class="text-gray-500 dark:text-gray-400">ไม่พบผู้ใช้</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Mobile Cards -->
                <div class="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                    <div v-for="user in paginatedUsers" :key="user.id" class="p-4 space-y-3">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-3">
                                <img :src="user.avatar" :alt="user.name"
                                    class="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700">
                                <div>
                                    <p class="font-medium text-gray-900 dark:text-white">{{ user.name }}</p>
                                    <p class="text-xs text-gray-600 dark:text-gray-400">{{ user.email }}</p>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button @click="openEditModal(user)"
                                    class="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                                    <UIcon name="i-lucide-edit-2" class="w-4 h-4" />
                                </button>
                                <button @click="deleteUser(user.id)"
                                    class="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                                    <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div class="flex items-center justify-between gap-2 text-sm">
                            <span :class="['px-2 py-1 rounded-full text-xs font-bold', getRoleColor(user.role)]">
                                {{ getRoleLabel(user.role) }}
                            </span>
                            <button @click="toggleUserStatus(user)"
                                :class="['px-2 py-1 rounded-full text-xs font-bold cursor-pointer', getStatusColor(user.status)]">
                                {{ getStatusLabel(user.status) }}
                            </button>
                        </div>

                        <p class="text-xs text-gray-500">เข้าระบบ: {{ user.joinDate }}</p>
                    </div>

                    <!-- Empty State Mobile -->
                    <div v-if="paginatedUsers.length === 0" class="p-8 text-center">
                        <UIcon name="i-lucide-inbox" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p class="text-gray-500 dark:text-gray-400">ไม่พบผู้ใช้</p>
                    </div>
                </div>
            </div>

            <!-- Pagination -->
            <div class="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    แสดงผลลัพธ์ <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span> ถึง
                    <span class="font-medium">{{ Math.min(currentPage * pageSize, filteredUsers.length) }}</span> จาก
                    <span class="font-medium">{{ filteredUsers.length }}</span>
                </p>

                <div class="flex items-center gap-2">
                    <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1"
                        class="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        ← ก่อนหน้า
                    </button>

                    <div class="flex items-center gap-2">
                        <span v-for="page in totalPages" :key="page" @click="currentPage = page" :class="[
                            'px-3 py-2 rounded-lg cursor-pointer transition-all font-medium',
                            currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        ]">
                            {{ page }}
                        </span>
                    </div>

                    <button @click="currentPage = Math.min(totalPages, currentPage + 1)"
                        :disabled="currentPage === totalPages"
                        class="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        ถัดไป →
                    </button>
                </div>
            </div>

            <!-- User Detail/Edit Modal -->
            <UModal v-model="modalState.isOpen" :ui="{ content: 'sm:max-w-2xl', overlay: 'backdrop-blur-sm' }">
                <template #header>
                    <div class="flex items-center gap-3">
                        <div :class="[
                            'w-10 h-10 rounded-xl flex items-center justify-center',
                            modalState.mode === 'view' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                modalState.mode === 'edit' ? 'bg-green-100 dark:bg-green-900/30' :
                                    'bg-purple-100 dark:bg-purple-900/30'
                        ]">
                            <UIcon :name="modalState.mode === 'view' ? 'i-lucide-eye' :
                                modalState.mode === 'edit' ? 'i-lucide-edit-2' :
                                    'i-lucide-user-plus'
                                " :class="[
                                    'w-5 h-5',
                                    modalState.mode === 'view' ? 'text-blue-600 dark:text-blue-400' :
                                        modalState.mode === 'edit' ? 'text-green-600 dark:text-green-400' :
                                            'text-purple-600 dark:text-purple-400'
                                ]" />
                        </div>
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                            {{ modalState.mode === 'view' ? 'รายละเอียดผู้ใช้' : modalState.mode === 'edit' ?
                                'แก้ไขผู้ใช้' :
                                'เพิ่มผู้ใช้ใหม่' }}
                        </h3>
                    </div>
                </template>

                <template #body>
                    <div class="p-6 space-y-6">
                        <!-- Avatar -->
                        <div class="flex justify-center">
                            <img :src="modalState.selectedUser?.avatar" :alt="modalState.selectedUser?.name"
                                class="w-20 h-20 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700">
                        </div>

                        <div class="space-y-4">
                            <!-- Name -->
                            <div>
                                <label
                                    class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">ชื่อ</label>
                                <input v-if="modalState.mode !== 'view'" v-model="modalState.selectedUser.name"
                                    type="text"
                                    class="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="กรุณากรอกชื่อ">
                                <p v-else class="text-gray-900 dark:text-white font-medium">{{
                                    modalState.selectedUser.name }}
                                </p>
                            </div>

                            <!-- Email -->
                            <div>
                                <label
                                    class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">อีเมล</label>
                                <input v-if="modalState.mode !== 'view'" v-model="modalState.selectedUser.email"
                                    type="email"
                                    class="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="กรุณากรอกอีเมล">
                                <p v-else class="text-gray-900 dark:text-white font-medium">{{
                                    modalState.selectedUser.email }}
                                </p>
                            </div>

                            <!-- Role -->
                            <div>
                                <label
                                    class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">บทบาท</label>
                                <select v-if="modalState.mode !== 'view'" v-model="modalState.selectedUser.role"
                                    class="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="user">ผู้ใช้ทั่วไป</option>
                                    <option value="moderator">ผู้ควบคุม</option>
                                    <option value="admin">ผู้ดูแลระบบ</option>
                                </select>
                                <p v-else
                                    :class="['px-3 py-2 rounded-full text-sm font-bold w-fit', getRoleColor(modalState.selectedUser.role)]">
                                    {{ getRoleLabel(modalState.selectedUser.role) }}
                                </p>
                            </div>

                            <!-- Status -->
                            <div>
                                <label
                                    class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">สถานะ</label>
                                <select v-if="modalState.mode !== 'view'" v-model="modalState.selectedUser.status"
                                    class="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="active">ใช้งาน</option>
                                    <option value="inactive">ไม่ใช้งาน</option>
                                </select>
                                <p v-else
                                    :class="['px-3 py-2 rounded-full text-sm font-bold w-fit', getStatusColor(modalState.selectedUser.status)]">
                                    {{ getStatusLabel(modalState.selectedUser.status) }}
                                </p>
                            </div>
                        </div>
                    </div>
                </template>

                <template #footer>
                    <div v-if="modalState.mode !== 'view'" class="flex gap-3">
                        <button @click="modalState.isOpen = false"
                            class="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium">
                            ยกเลิก
                        </button>
                        <button @click="saveUser"
                            class="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium">
                            บันทึก
                        </button>
                    </div>
                    <button v-else @click="modalState.isOpen = false"
                        class="w-full px-4 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium">
                        ปิด
                    </button>
                </template>
            </UModal>

            <!-- Decorative Elements -->
            <div
                class="fixed top-40 right-20 w-72 h-72 bg-linear-to-br from-blue-400 to-cyan-400 rounded-full opacity-10 blur-3xl -z-10 pointer-events-none">
            </div>
        </main>
    </div>
</template>
