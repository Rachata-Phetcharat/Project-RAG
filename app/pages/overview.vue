<script setup lang="ts">
import type { ChannelStatsResult } from "~/composables/useDashboard";

// ─────────────────────────────────────────────
// Page Meta
// ─────────────────────────────────────────────

definePageMeta({
    middleware: ["auth", "admin"],
    layout: "default",
});

// ─────────────────────────────────────────────
// Composables
// ─────────────────────────────────────────────

const { fetchQuestionsByChannel, fetchUsersByChannel } = useDashboard();
const { fetchMyChannels } = useChannel();

// loading ของหน้านี้เอง (composable loading ไม่ได้ถูก set จาก fetch เหล่านี้)
const loading = ref(false);

// ─────────────────────────────────────────────
// Date Range
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
// Channel Selector
// ─────────────────────────────────────────────

const loadingChannels = ref(false);
const rawChannels = ref<any[]>([]);

// ไม่ใช้ value-key → v-model ได้ object เต็ม { label, value }
const selectedChannel = ref<{ label: string; value: number } | undefined>(undefined);

const channelOptions = computed(() =>
    rawChannels.value.map((c: any) => ({
        label: c.title,
        value: c.channels_id,
    }))
);

const loadChannels = async () => {
    loadingChannels.value = true;
    try {
        const data = await fetchMyChannels({ limit: 150 }) as any;
        rawChannels.value = Array.isArray(data) ? data : (data?.items ?? data?.channels ?? []);
    } catch {
        rawChannels.value = [];
    } finally {
        loadingChannels.value = false;
    }
};

onMounted(loadChannels);

// watch เฉพาะ channel_id — trigger เมื่อเลือก channel ใหม่
watch(
    () => selectedChannel.value?.value,
    (id) => { if (id) loadStats(); }
);

// ─────────────────────────────────────────────
// Stats State
// ─────────────────────────────────────────────

const questionsStats = ref<ChannelStatsResult>({ data: [], total: 0 });
const usersStats = ref<ChannelStatsResult>({ data: [], total: 0 });
const errorMsg = ref("");

const loadStats = async () => {
    if (!selectedChannel.value?.value) return;

    errorMsg.value = "";
    loading.value = true;

    const params = {
        channel_id: selectedChannel.value.value,   // ← number จาก object
        start_date: formatDate(dateRange.value.start),
        end_date: formatDate(dateRange.value.end),
    };

    try {
        const [q, u] = await Promise.all([
            fetchQuestionsByChannel(params),
            fetchUsersByChannel(params),
        ]);
        questionsStats.value = q;
        usersStats.value = u;
    } catch {
        errorMsg.value = "โหลดข้อมูลไม่สำเร็จ";
    } finally {
        loading.value = false;
    }
};

watch(
    () => ({ start: dateRange.value.start, end: dateRange.value.end }),
    () => loadStats(),
    { deep: true }
);

// ─────────────────────────────────────────────
// Summary Cards
// ─────────────────────────────────────────────

const summaryCards = computed(() => [
    {
        label: "คำถามทั้งหมด (ช่วงนี้)",
        value: questionsStats.value.total.toLocaleString(),
        icon: "i-lucide-message-circle-question",
        gradient: "from-blue-500 to-cyan-500",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        textColor: "text-blue-600 dark:text-blue-400",
    },
    {
        label: "ผู้ใช้งานรวม (ช่วงนี้)",
        value: usersStats.value.total.toLocaleString(),
        icon: "i-lucide-users",
        gradient: "from-purple-500 to-pink-500",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        textColor: "text-purple-600 dark:text-purple-400",
    },
    {
        label: "วันที่มีข้อมูล",
        value: `${questionsStats.value.data.length} วัน`,
        icon: "i-lucide-calendar-days",
        gradient: "from-green-500 to-emerald-500",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        textColor: "text-green-600 dark:text-green-400",
    },
]);
</script>

<template>
    <main class="flex-1 p-6 md:p-8 overflow-auto mx-auto w-full">

        <!-- ── Header ── -->
        <div class="mb-8">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div class="flex items-center gap-3">
                    <div class="relative">
                        <div
                            class="absolute inset-0 bg-linear-to-r from-violet-500 to-fuchsia-500 rounded-xl blur-lg opacity-50" />
                        <div class="relative p-3 bg-linear-to-br from-violet-500 to-fuchsia-500 rounded-xl shadow-lg">
                            <UIcon name="i-lucide-bar-chart-2" class="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <div>
                        <h1
                            class="text-3xl md:text-4xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                            ภาพรวมแชนแนล
                        </h1>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            วิเคราะห์สถิติคำถามและผู้ใช้งานรายแชนแนล
                        </p>
                    </div>
                </div>

                <button :disabled="loading || !selectedChannel"
                    class="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    @click="loadStats">
                    <UIcon name="i-lucide-refresh-cw"
                        :class="['w-4 h-4 text-gray-700 dark:text-gray-300', loading && 'animate-spin']" />
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">รีเฟรช</span>
                </button>
            </div>

            <!-- ── Channel Selector + Date Range Card ── -->
            <div
                class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none p-6 border border-gray-200 dark:border-gray-700">
                <div class="flex flex-col gap-5">

                    <!-- Channel Picker -->
                    <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div class="flex items-center gap-2 shrink-0">
                            <UIcon name="i-lucide-tv-2" class="w-5 h-5 text-gray-500" />
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">แชนแนล:</span>
                        </div>

                        <!-- Loading channels -->
                        <div v-if="loadingChannels" class="flex items-center gap-2 text-sm text-gray-500">
                            <UIcon name="i-lucide-loader-circle" class="animate-spin w-4 h-4" />
                            กำลังโหลดแชนแนล...
                        </div>

                        <!-- No channels -->
                        <div v-else-if="channelOptions.length === 0"
                            class="flex items-center gap-2 text-sm text-gray-500 px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                            <UIcon name="i-lucide-info" class="w-4 h-4 text-blue-400" />
                            ไม่พบแชนแนล
                        </div>

                        <!-- USelectMenu — ไม่ใช้ value-key เพื่อให้ v-model ได้ object เต็ม -->
                        <USelectMenu v-else v-model="selectedChannel" :items="channelOptions" size="md"
                            placeholder="เลือกแชนแนล..." class="w-full sm:max-w-sm" />

                        <!-- Selected Badge -->
                        <div v-if="selectedChannel"
                            class="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 dark:bg-violet-900/30 rounded-full text-xs font-medium text-violet-700 dark:text-violet-300 shrink-0">
                            <UIcon name="i-lucide-check-circle" class="w-3.5 h-3.5" />
                            ID: {{ selectedChannel.value }}
                        </div>
                    </div>

                    <div class="border-t border-gray-100 dark:border-gray-700" />

                    <!-- Date Range -->
                    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
        </div>

        <!-- ── Empty: ยังไม่เลือก Channel ── -->
        <div v-if="!selectedChannel" class="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div class="p-6 bg-violet-50 dark:bg-violet-900/20 rounded-full">
                <UIcon name="i-lucide-tv-2" class="w-12 h-12 text-violet-400" />
            </div>
            <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300">
                เลือกแชนแนลเพื่อดูสถิติ
            </h2>
            <p class="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
                กรุณาเลือกแชนแนลจาก dropdown ด้านบน เพื่อดูข้อมูลคำถามและผู้ใช้งานรายวัน
            </p>
        </div>

        <!-- ── Loading ── -->
        <template v-else-if="loading">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div v-for="i in 3" :key="i"
                    class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg flex flex-col items-center justify-center gap-4 py-10">
                    <div class="p-5 bg-violet-50 dark:bg-violet-900/20 rounded-full">
                        <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-violet-500" />
                    </div>
                    <p class="text-sm text-gray-400">กำลังโหลด...</p>
                </div>
            </div>
        </template>

        <!-- ── Stats + Chart ── -->
        <template v-else>
            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div v-for="card in summaryCards" :key="card.label"
                    class="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div
                        :class="['absolute inset-0 bg-linear-to-br opacity-0 group-hover:opacity-5 transition-opacity', card.gradient]" />
                    <div class="relative p-6">
                        <div class="flex items-start justify-between mb-4">
                            <div :class="['p-3 rounded-xl', card.bgColor]">
                                <UIcon :name="card.icon" :class="['w-7 h-7', card.textColor]" />
                            </div>
                        </div>
                        <p
                            class="text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform origin-left inline-block">
                            {{ card.value }}
                        </p>
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                            {{ card.label }}
                        </p>
                    </div>
                    <div
                        :class="['absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r opacity-0 group-hover:opacity-100 transition-opacity', card.gradient]" />
                </div>
            </div>

            <!-- Chart -->
            <Charts mode="channel" accent-color="violet" :channel-questions="questionsStats"
                :channel-users="usersStats" />
        </template>

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

    </main>

    <!-- Background Decorations -->
    <div
        class="fixed top-20 right-20 w-72 h-72 bg-linear-to-br from-violet-400 to-fuchsia-400 rounded-full opacity-10 blur-3xl -z-10 pointer-events-none" />
    <div
        class="fixed bottom-20 left-20 w-96 h-96 bg-linear-to-br from-fuchsia-400 to-pink-400 rounded-full opacity-10 blur-3xl -z-10 pointer-events-none" />
</template>