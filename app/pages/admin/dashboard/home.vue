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

// ✅ FIX: สร้าง start/end อย่างถูกต้อง และ end ต้องเป็น 23:59:59
// เพื่อให้ครอบคลุมทั้งวันสุดท้าย ตรงกับที่ DateSelector ส่ง
const makeDefaultRange = (): DateRange => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date();
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);

    return { start, end };
};

const dateRange = ref<DateRange>(makeDefaultRange());

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

const emptyStats = (): DashboardStats => ({ total: 0, todayCount: 0, growth: "+0%", data: [] });

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
        label: "ยอดคำถาม",
        value: questionsData.value.total.toLocaleString(),
        todayValue: questionsData.value.todayCount.toLocaleString(),
        todayLabel: "วันนี้",
        showToday: true,
        change: questionsData.value.growth,
        showGrowth: true,
        icon: "i-lucide-message-circle-question",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        textColor: "text-blue-600 dark:text-blue-400",
    },
    {
        label: "ผู้ใช้งาน",
        value: usersData.value.total.toLocaleString(),
        todayValue: usersData.value.todayCount.toLocaleString(),
        todayLabel: "วันนี้",
        showToday: true,
        change: usersData.value.growth,
        showGrowth: true,
        icon: "i-lucide-users",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        textColor: "text-purple-600 dark:text-purple-400",
    },
    {
        label: "แชนแนลสาธารณะ",
        value: publicChannelsData.value.total.toLocaleString(),
        todayValue: null,
        todayLabel: null,
        showToday: false,
        change: publicChannelsData.value.growth,
        showGrowth: false,
        icon: "i-lucide-globe",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        textColor: "text-green-600 dark:text-green-400",
    },
    {
        label: "แชนแนลส่วนตัว",
        value: privateChannelsData.value.total.toLocaleString(),
        todayValue: null,
        todayLabel: null,
        showToday: false,
        change: privateChannelsData.value.growth,
        showGrowth: false,
        icon: "i-lucide-lock",
        bgColor: "bg-rose-50 dark:bg-rose-900/20",
        textColor: "text-rose-600 dark:text-rose-400",
    },
    {
        label: "คำขอรอดำเนินการ",
        value: pendingChannelsData.value.total.toLocaleString(),
        todayValue: null,
        todayLabel: null,
        showToday: false,
        change: pendingChannelsData.value.growth,
        showGrowth: false,
        icon: "i-lucide-clock",
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
                            <div class="absolute inset-0 bg-slate-500 rounded-xl blur-lg opacity-20" />
                            <div class="relative p-3 bg-blue-500 dark:bg-blue-500 rounded-xl">
                                <UIcon name="i-lucide-bar-chart-3" class="w-6 h-6 text-white dark:text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 class="text-3xl font-semibold text-gray-900 dark:text-white">
                                สถิติการใช้งาน
                            </h1>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
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
                        class="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">

                        <div class="relative p-6">
                            <div class="flex items-start justify-between mb-4">
                                <div :class="['p-3 rounded-xl', stat.bgColor]">
                                    <UIcon :name="stat.icon" :class="['w-7 h-7', stat.textColor]" />
                                </div>

                                <!-- Growth Badge -->
                                <div v-if="stat.showGrowth" :class="[
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
                                <p class="text-3xl font-bold text-gray-900 dark:text-white origin-left inline-block">
                                    {{ stat.value }}
                                </p>
                                <div class="flex justify-between item-center">
                                    <p class="text-md font-medium text-gray-500 dark:text-gray-400">
                                        {{ stat.label }}
                                    </p>
                                    <!-- Today sub-label -->
                                    <div v-if="stat.showToday"
                                        class="flex items-center gap-1.5  border-gray-100 dark:border-gray-700">
                                        <span
                                            class="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                            <UIcon name="i-lucide-sun" class="w-3 h-3" />
                                            {{ stat.todayLabel }}:
                                        </span>
                                        <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            {{ stat.todayValue }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

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
</template>