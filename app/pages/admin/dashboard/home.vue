<script setup lang="ts">
// ============================================
// 1. นำเข้า Composable และตั้งค่าหน้า
// ============================================
const {
    fetchQuestionsStats,
    fetchUsersStats,
    fetchChannelsStatsPublic,
    fetchChannelsStatsPrivate,
    fetchChannelsStatsPending,
    loading
} = useDashboard();

definePageMeta({
    middleware: ['auth', 'admin'],
    layout: 'dashboard-layout'
})

// ============================================
// 2. ตั้งค่าช่วงวันที่ - ใช้ interface DateRange จาก DashboardDateSelector
// ============================================
interface DateRange {
    start: Date
    end: Date
}

const dateRange = ref<DateRange>({
    start: new Date(new Date().setDate(new Date().getDate() - 7)),
    end: new Date()
});

// ============================================
// 3. ตัวแปรเก็บข้อมูลสถิติ (รวมทั้ง data array)
// ============================================
const questionsData = ref<{ total: number; growth: string; data: DailyStatItem[] }>({
    total: 0,
    growth: '+0%',
    data: []
});

const usersData = ref<{ total: number; growth: string; data: DailyStatItem[] }>({
    total: 0,
    growth: '+0%',
    data: []
});

const publicChannelsData = ref<{ total: number; growth: string; data: DailyStatItem[] }>({
    total: 0,
    growth: '+0%',
    data: []
});

const privateChannelsData = ref<{ total: number; growth: string; data: DailyStatItem[] }>({
    total: 0,
    growth: '+0%',
    data: []
});

const pendingChannelsData = ref<{ total: number; growth: string; data: DailyStatItem[] }>({
    total: 0,
    growth: '+0%',
    data: []
});

// ============================================
// 4. ฟังก์ชันแปลงวันที่
// ============================================
const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// ฟังก์ชันแปลงวันที่แบบไทย
const formatDateThai = (date: Date) => {
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// ============================================
// 5. ฟังก์ชันดึงข้อมูล
// ============================================
const initDashboard = async () => {
    const params = {
        start_date: formatDate(dateRange.value.start),
        end_date: formatDate(dateRange.value.end)
    };

    try {
        const [
            questionsResponse,
            usersResponse,
            publicChannelsResponse,
            privateChannelsResponse,
            pendingChannelsResponse
        ] = await Promise.all([
            fetchQuestionsStats(params),
            fetchUsersStats(params),
            fetchChannelsStatsPublic(),
            fetchChannelsStatsPrivate(),
            fetchChannelsStatsPending()
        ]);

        // เก็บข้อมูลทั้ง total, growth และ data
        if (questionsResponse) questionsData.value = questionsResponse;
        if (usersResponse) usersData.value = usersResponse;
        if (publicChannelsResponse) publicChannelsData.value = publicChannelsResponse;
        if (privateChannelsResponse) privateChannelsData.value = privateChannelsResponse;
        if (pendingChannelsResponse) pendingChannelsData.value = pendingChannelsResponse;

    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลด Dashboard:", error);
    }
};

// ============================================
// 6. Watch และ Mount
// ============================================
watch(dateRange, () => {
    initDashboard();
}, { deep: true });

onMounted(() => {
    initDashboard();
});

// ============================================
// 7. Computed Stats
// ============================================
const totalChannels = computed(() =>
    publicChannelsData.value.total + privateChannelsData.value.total
);

const statsCards = computed(() => [
    {
        label: 'คำถามทั้งหมด',
        value: questionsData.value.total.toLocaleString(),
        change: questionsData.value.growth,
        icon: 'i-lucide-message-circle-question',
        color: 'blue',
        gradient: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
        label: 'ผู้ใช้งาน',
        value: usersData.value.total.toLocaleString(),
        change: usersData.value.growth,
        icon: 'i-lucide-users',
        color: 'purple',
        gradient: 'from-purple-500 to-pink-500',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        textColor: 'text-purple-600 dark:text-purple-400'
    },
    {
        label: 'แชนแนลสาธารณะ',
        value: publicChannelsData.value.total.toLocaleString(),
        change: publicChannelsData.value.growth,
        icon: 'i-lucide-globe',
        color: 'green',
        gradient: 'from-green-500 to-emerald-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        textColor: 'text-green-600 dark:text-green-400'
    },
    {
        label: 'แชนแนลส่วนตัว',
        value: privateChannelsData.value.total.toLocaleString(),
        change: privateChannelsData.value.growth,
        icon: 'i-lucide-lock',
        color: 'rose',
        gradient: 'from-rose-500 to-pink-500',
        bgColor: 'bg-rose-50 dark:bg-rose-900/20',
        textColor: 'text-rose-600 dark:text-rose-400'
    },
    {
        label: 'คำขอรอดำเนินการ',
        value: pendingChannelsData.value.total.toLocaleString(),
        change: pendingChannelsData.value.growth,
        icon: 'i-lucide-clock',
        color: 'amber',
        gradient: 'from-amber-500 to-orange-500',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        textColor: 'text-amber-600 dark:text-amber-400'
    }
]);
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
                                class="absolute inset-0 bg-linear-to-r from-indigo-500 to-purple-500 rounded-xl blur-lg opacity-50">
                            </div>
                            <div
                                class="relative p-3 bg-linear-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                                <UIcon name="i-lucide-bar-chart-3" class="w-7 h-7 text-white" />
                            </div>
                        </div>
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <h1
                                    class="text-3xl md:text-4xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                    แดชบอร์ดผู้ดูแลระบบ
                                </h1>
                            </div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                ภาพรวมระบบและสถิติการใช้งาน
                            </p>
                        </div>
                    </div>

                    <!-- Refresh Button -->
                    <button @click="initDashboard" :disabled="loading"
                        class="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                        <UIcon name="i-lucide-refresh-cw"
                            :class="['w-4 h-4 text-gray-700 dark:text-gray-300', loading && 'animate-spin']" />
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">รีเฟรช</span>
                    </button>
                </div>

                <!-- Date Range Selector -->
                <div
                    class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none p-6 border border-gray-200 dark:border-gray-700">
                    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <!-- Date Range Display -->
                        <div class="flex items-center gap-3 flex-wrap">
                            <UIcon name="i-lucide-calendar-range" class="w-5 h-5 text-gray-500" />
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">ช่วงเวลา:</span>
                            <div class="flex items-center gap-2 text-sm flex-wrap">
                                <span
                                    class="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium text-gray-900 dark:text-white">
                                    {{ formatDateThai(dateRange.start) }}
                                </span>
                                <UIcon name="i-lucide-arrow-right" class="w-4 h-4 text-gray-400" />
                                <span
                                    class="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium text-gray-900 dark:text-white">
                                    {{ formatDateThai(dateRange.end) }}
                                </span>
                            </div>
                        </div>

                        <!-- Date Picker Component -->
                        <div class="flex items-center gap-3">
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">เลือกช่วงเวลา:</span>
                            <DashboardDateSelector v-model="dateRange" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <main>
                <!-- Stats Overview -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                    <!-- Loading Skeleton -->
                    <template v-if="loading">
                        <div v-for="i in 5" :key="i"
                            class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
                            <div class="space-y-3">
                                <USkeleton class="h-4 w-24" />
                                <USkeleton class="h-8 w-16" />
                                <USkeleton class="h-4 w-20" />
                            </div>
                        </div>
                    </template>

                    <!-- Stats Cards -->
                    <template v-else>
                        <div v-for="stat in statsCards" :key="stat.label"
                            class="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-default">
                            <!-- Gradient Background -->
                            <div
                                :class="['absolute inset-0 bg-linear-to-br opacity-0 group-hover:opacity-5 transition-opacity', stat.gradient]">
                            </div>

                            <div class="relative p-6">
                                <!-- Header -->
                                <div class="flex items-start justify-between mb-4">
                                    <div :class="['p-3 rounded-xl', stat.bgColor]">
                                        <UIcon :name="stat.icon" :class="['w-7 h-7', stat.textColor]" />
                                    </div>

                                    <!-- Growth Badge -->
                                    <div :class="[
                                        'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold',
                                        stat.change?.startsWith('+')
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : stat.change?.startsWith('-')
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                    ]">
                                        <UIcon
                                            :name="stat.change?.startsWith('+') ? 'i-lucide-trending-up' : stat.change?.startsWith('-') ? 'i-lucide-trending-down' : 'i-lucide-minus'"
                                            class="w-3 h-3" />
                                        {{ stat.change }}
                                    </div>
                                </div>

                                <!-- Value -->
                                <div class="space-y-1">
                                    <p
                                        class="text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform origin-left inline-block">
                                        {{ stat.value }}
                                    </p>
                                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        {{ stat.label }}
                                    </p>
                                </div>
                            </div>

                            <!-- Hover Effect Line -->
                            <div
                                :class="['absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r opacity-0 group-hover:opacity-100 transition-opacity', stat.gradient]">
                            </div>
                        </div>
                    </template>
                </div>

                <!-- Charts Section -->
                <div class="mb-8">
                    <DashboardCharts :questions-data="questionsData" :users-data="usersData"
                        :public-channels-data="publicChannelsData.total"
                        :private-channels-data="privateChannelsData.total"
                        :pending-channels-data="pendingChannelsData.total" />
                </div>
            </main>

        </main>
    </div>

    <!-- Decorative Elements -->
    <div
        class="fixed top-20 right-20 w-72 h-72 bg-linear-to-br from-indigo-400 to-purple-400 rounded-full opacity-10 blur-3xl -z-10 pointer-events-none">
    </div>
    <div
        class="fixed bottom-20 left-20 w-96 h-96 bg-linear-to-br from-purple-400 to-pink-400 rounded-full opacity-10 blur-3xl -z-10 pointer-events-none">
    </div>
</template>

<style scoped>
@keyframes float {

    0%,
    100% {
        transform: translateY(0px);
    }

    50% {
        transform: translateY(-10px);
    }
}

.group:hover {
    animation: float 3s ease-in-out infinite;
}
</style>