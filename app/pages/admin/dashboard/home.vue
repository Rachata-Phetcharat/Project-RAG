<script setup lang="ts">
import type { DailyStatItem, DashboardStats } from "~/composables/useDashboard";

// ─────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────

definePageMeta({
    middleware: ["auth", "admin"],
    layout: "dashboard-layout",
});

const { fetchQuestionsStats, fetchUsersStats, fetchChannelStats, loading } =
    useDashboard();

// ─────────────────────────────────────────────
// Date Range  (DateRange type มาจาก DashboardDateSelector)
// ─────────────────────────────────────────────

interface DateRange {
    start: Date;
    end: Date;
}

const dateRange = ref<DateRange>({
    start: new Date(new Date().setDate(new Date().getDate() - 7)),
    end: new Date(),
});

const formatDate = (date: Date) =>
    [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");

const formatDateThai = (date: Date) =>
    date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

// ─────────────────────────────────────────────
// Stats State
// ─────────────────────────────────────────────

const emptyStats = (): DashboardStats => ({ total: 0, growth: "+0%", data: [] });

const questionsData = ref<DashboardStats>(emptyStats());
const usersData = ref<DashboardStats>(emptyStats());
const publicChannelsData = ref<DashboardStats>(emptyStats());
const privateChannelsData = ref<DashboardStats>(emptyStats());
const pendingChannelsData = ref<DashboardStats>(emptyStats());

const errorMsg = ref("");

// ─────────────────────────────────────────────
// Data Fetching
// ─────────────────────────────────────────────

const initDashboard = async () => {
    errorMsg.value = "";
    loading.value = true;

    const params = {
        start_date: formatDate(dateRange.value.start),
        end_date: formatDate(dateRange.value.end),
    };

    try {
        const [questions, users, publicCh, privateCh, pendingCh] =
            await Promise.all([
                fetchQuestionsStats(params),
                fetchUsersStats(params),
                fetchChannelStats("public"),
                fetchChannelStats("private"),
                fetchChannelStats("pending"),
            ]);

        questionsData.value = questions;
        usersData.value = users;
        publicChannelsData.value = publicCh;
        privateChannelsData.value = privateCh;
        pendingChannelsData.value = pendingCh;
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลด Dashboard:", error);
        errorMsg.value = "โหลดข้อมูล Dashboard ไม่สำเร็จ";
    } finally {
        loading.value = false;
    }
};

// watch getter เพื่อให้ Vue detect การเปลี่ยนแปลง start/end ได้ถูกต้อง
watch(
    () => ({ start: dateRange.value.start, end: dateRange.value.end }),
    () => initDashboard(),
    { deep: true }
);

onMounted(initDashboard);

// ─────────────────────────────────────────────
// Computed Stats Cards
// ─────────────────────────────────────────────

const statsCards = computed(() => [
    {
        label: "คำถามทั้งหมด",
        value: questionsData.value.total.toLocaleString(),
        change: questionsData.value.growth,
        icon: "i-lucide-message-circle-question",
        gradient: "from-blue-500 to-cyan-500",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        textColor: "text-blue-600 dark:text-blue-400",
    },
    {
        label: "ผู้ใช้งาน",
        value: usersData.value.total.toLocaleString(),
        change: usersData.value.growth,
        icon: "i-lucide-users",
        gradient: "from-purple-500 to-pink-500",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        textColor: "text-purple-600 dark:text-purple-400",
    },
    {
        label: "แชนแนลสาธารณะ",
        value: publicChannelsData.value.total.toLocaleString(),
        change: publicChannelsData.value.growth,
        icon: "i-lucide-globe",
        gradient: "from-green-500 to-emerald-500",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        textColor: "text-green-600 dark:text-green-400",
    },
    {
        label: "แชนแนลส่วนตัว",
        value: privateChannelsData.value.total.toLocaleString(),
        change: privateChannelsData.value.growth,
        icon: "i-lucide-lock",
        gradient: "from-rose-500 to-pink-500",
        bgColor: "bg-rose-50 dark:bg-rose-900/20",
        textColor: "text-rose-600 dark:text-rose-400",
    },
    {
        label: "คำขอรอดำเนินการ",
        value: pendingChannelsData.value.total.toLocaleString(),
        change: pendingChannelsData.value.growth,
        icon: "i-lucide-clock",
        gradient: "from-amber-500 to-orange-500",
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        textColor: "text-amber-600 dark:text-amber-400",
    },
]);
</script>

<template>
    <div class="flex">
        <AdminSidebar />

        <main class="flex-1 p-6 md:p-8 overflow-auto mx-auto w-full">
            <!-- ── Header ── -->
            <div class="mb-8">
                <!-- Title Row -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div class="flex items-center gap-3">
                        <div class="relative">
                            <div
                                class="absolute inset-0 bg-linear-to-r from-indigo-500 to-purple-500 rounded-xl blur-lg opacity-50" />
                            <div
                                class="relative p-3 bg-linear-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                                <UIcon name="i-lucide-bar-chart-3" class="w-7 h-7 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1
                                class="text-3xl md:text-4xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                แดชบอร์ดผู้ดูแลระบบ
                            </h1>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                ภาพรวมระบบและสถิติการใช้งาน
                            </p>
                        </div>
                    </div>

                    <button :disabled="loading"
                        class="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        @click="initDashboard">
                        <UIcon name="i-lucide-refresh-cw"
                            :class="['w-4 h-4 text-gray-700 dark:text-gray-300', loading && 'animate-spin']" />
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">รีเฟรช</span>
                    </button>
                </div>

                <!-- Date Selector -->
                <div
                    class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none p-6 border border-gray-200 dark:border-gray-700">
                    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
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
                        <div class="flex items-center gap-3">
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">เลือกช่วงเวลา:</span>
                            <DateSelector v-model="dateRange" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- ── Stats Cards ── -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                <!-- Loading Skeleton -->
                <template v-if="loading">
                    <div v-for="i in 5" :key="i"
                        class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg flex flex-col items-center justify-center gap-4 py-10">
                        <div class="relative">
                            <div class="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse" />
                            <div
                                class="relative p-5 bg-linear-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full">
                                <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-indigo-500" />
                            </div>
                        </div>
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                            กำลังโหลด...
                        </p>
                    </div>
                </template>

                <!-- Stat Cards -->
                <template v-else>
                    <div v-for="stat in statsCards" :key="stat.label"
                        class="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-default">
                        <!-- Hover gradient overlay -->
                        <div :class="[
                            'absolute inset-0 bg-linear-to-br opacity-0 group-hover:opacity-5 transition-opacity',
                            stat.gradient,
                        ]" />

                        <div class="relative p-6">
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
                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
                                ]">
                                    <UIcon :name="stat.change?.startsWith('+')
                                        ? 'i-lucide-trending-up'
                                        : stat.change?.startsWith('-')
                                            ? 'i-lucide-trending-down'
                                            : 'i-lucide-minus'
                                        " class="w-3 h-3" />
                                    {{ stat.change }}
                                </div>
                            </div>

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

                        <!-- Bottom accent line -->
                        <div :class="[
                            'absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r opacity-0 group-hover:opacity-100 transition-opacity',
                            stat.gradient,
                        ]" />
                    </div>
                </template>
            </div>

            <!-- ── Charts ── -->
            <div class="mb-8">
                <Charts :questions-data="questionsData" :users-data="usersData"
                    :public-channels-data="publicChannelsData.total" :private-channels-data="privateChannelsData.total"
                    :pending-channels-data="pendingChannelsData.total" />
            </div>
        </main>
    </div>

    <!-- Error Toast -->
    <div v-if="errorMsg" class="fixed bottom-6 right-6 max-w-md z-50">
        <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg shadow-xl">
            <div class="flex items-start gap-3">
                <UIcon name="i-lucide-alert-circle" class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                    <p class="font-medium text-red-800 dark:text-red-200">เกิดข้อผิดพลาด</p>
                    <p class="text-sm text-red-700 dark:text-red-300 mt-1">{{ errorMsg }}</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Background Decorations -->
    <div
        class="fixed top-20 right-20 w-72 h-72 bg-linear-to-br from-indigo-400 to-purple-400 rounded-full opacity-10 blur-3xl -z-10 pointer-events-none" />
    <div
        class="fixed bottom-20 left-20 w-96 h-96 bg-linear-to-br from-purple-400 to-pink-400 rounded-full opacity-10 blur-3xl -z-10 pointer-events-none" />
</template>