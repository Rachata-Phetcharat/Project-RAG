<script setup lang="ts">
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Line } from "vue-chartjs";
import type { DashboardStats, ChannelStatsResult } from "~/composables/useDashboard";

// ─────────────────────────────────────────────
// Register Chart.js
// ─────────────────────────────────────────────

ChartJS.register(
    CategoryScale, LinearScale, PointElement,
    LineElement, Title, Tooltip, Legend, Filler
);

// ─────────────────────────────────────────────
// Props
//
// mode="dashboard" — รับ DashboardStats (home.vue)
// mode="channel"   — รับ ChannelStatsResult (overview.vue)
// accentColor      — สีขีดเส้นใต้ tab + active tab (default: indigo)
// ─────────────────────────────────────────────

const props = withDefaults(
    defineProps<{
        // dashboard mode
        questionsData?: DashboardStats;
        usersData?: DashboardStats;
        // channel mode
        channelQuestions?: ChannelStatsResult;
        channelUsers?: ChannelStatsResult;
        // ตัวเลือกเสริม
        mode?: "dashboard" | "channel";
        accentColor?: "indigo" | "violet";
    }>(),
    {
        mode: "dashboard",
        accentColor: "indigo",
    }
);

// ─────────────────────────────────────────────
// Tab State
// ─────────────────────────────────────────────

type TabKey = "questions" | "users";
const activeTab = ref<TabKey>("questions");

const tabs = [
    { key: "questions" as TabKey, label: "คำถาม", icon: "i-lucide-message-circle-question" },
    { key: "users" as TabKey, label: "ผู้ใช้งาน", icon: "i-lucide-users" },
];

// active tab color ตาม accentColor prop
const tabActiveClass = computed(() =>
    props.accentColor === "violet"
        ? "text-violet-600 dark:text-violet-400"
        : "text-indigo-600 dark:text-indigo-400"
);
const tabUnderlineClass = computed(() =>
    props.accentColor === "violet" ? "bg-violet-500" : "bg-indigo-500"
);

// ─────────────────────────────────────────────
// Resolve data source ตาม mode
// ─────────────────────────────────────────────

const resolvedQuestions = computed((): { data: any[]; total: number } => {
    if (props.mode === "channel") return props.channelQuestions ?? { data: [], total: 0 };
    return props.questionsData ?? { data: [], total: 0, growth: "+0%" };
});

const resolvedUsers = computed((): { data: any[]; total: number } => {
    if (props.mode === "channel") return props.channelUsers ?? { data: [], total: 0 };
    return props.usersData ?? { data: [], total: 0, growth: "+0%" };
});

// ─────────────────────────────────────────────
// Theme
// ─────────────────────────────────────────────

const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");

const palette = {
    questions: { main: "rgb(59, 130, 246)", fill: "rgba(59, 130, 246, 0.15)" },
    users: { main: "rgb(168, 85, 247)", fill: "rgba(168, 85, 247, 0.15)" },
};

// ─────────────────────────────────────────────
// Chart Data
// ─────────────────────────────────────────────

const formatLabel = (dateString: string) =>
    new Date(dateString).toLocaleDateString("th-TH", {
        day: "numeric", month: "short",
    });

const chartKey = computed(() =>
    `${activeTab.value}-${resolvedQuestions.value.data.length}-${resolvedUsers.value.data.length}`
);

const activeSource = computed(() =>
    activeTab.value === "questions" ? resolvedQuestions.value : resolvedUsers.value
);

const activeChartData = computed(() => {
    const isQ = activeTab.value === "questions";
    const color = palette[activeTab.value];

    return {
        labels: activeSource.value.data.map((item: any) => formatLabel(item.date)),
        datasets: [
            {
                label: isQ ? "คำถาม" : "ผู้ใช้งาน",
                data: activeSource.value.data.map((item: any) =>
                    isQ ? (item.count ?? 0) : (item.active_users ?? 0)
                ),
                borderColor: color.main,
                backgroundColor: color.fill,
                borderWidth: 2.5,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: color.main,
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
            },
        ],
    };
});

const activeDayCount = computed(() => activeSource.value.data.length);
const hasData = computed(() => activeDayCount.value > 0);

// ─────────────────────────────────────────────
// Chart Options (Y-axis จำนวนเต็มเท่านั้น)
// ─────────────────────────────────────────────

const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: isDark.value ? "#1f2937" : "#ffffff",
            titleColor: isDark.value ? "#e5e7eb" : "#374151",
            bodyColor: isDark.value ? "#e5e7eb" : "#374151",
            borderColor: isDark.value ? "#374151" : "#e5e7eb",
            borderWidth: 1,
            padding: 12,
            callbacks: {
                label: (ctx: any) =>
                    ` ${ctx.dataset.label}: ${Math.round(ctx.parsed.y).toLocaleString()}`,
            },
        },
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: { color: isDark.value ? "#374151" : "#e5e7eb", drawBorder: false },
            ticks: {
                color: isDark.value ? "#e5e7eb" : "#374151",
                precision: 0,
                stepSize: 1,
                callback: (value: any) => Number.isInteger(value) ? value.toLocaleString() : null,
            },
        },
        x: {
            grid: { display: false },
            ticks: {
                color: isDark.value ? "#e5e7eb" : "#374151",
                maxRotation: 45,
                minRotation: 0,
            },
        },
    },
    interaction: { intersect: false, mode: "index" as const },
}));
</script>

<template>
    <div class="space-y-6">
        <!-- ── Header (dashboard mode เท่านั้น) ── -->
        <div v-if="mode === 'dashboard'" class="flex items-center gap-3">
            <div class="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                <UIcon name="i-lucide-line-chart" class="w-6 h-6 text-white" />
            </div>
            <div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                    สรุปข้อมูลแบบกราฟ
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    วิเคราะห์แนวโน้มและสถิติการใช้งาน
                </p>
            </div>
        </div>

        <!-- ── Chart Card ── -->
        <div
            class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">

            <!-- Tab Bar -->
            <div class="flex border-b border-gray-200 dark:border-gray-700">
                <button v-for="tab in tabs" :key="tab.key"
                    class="relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors" :class="activeTab === tab.key
                            ? tabActiveClass
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        " @click="activeTab = tab.key">
                    <UIcon :name="tab.icon" class="w-4 h-4" />
                    {{ tab.label }}

                    <span v-if="activeTab === tab.key"
                        :class="['absolute bottom-0 left-0 right-0 h-0.5 rounded-t', tabUnderlineClass]" />
                </button>

                <div class="ml-auto flex items-center px-6">
                    <span class="text-xs text-gray-400 dark:text-gray-500">
                        {{ activeDayCount }} วัน
                    </span>
                </div>
            </div>

            <!-- Chart Body -->
            <div class="p-6">
                <!-- Empty State -->
                <div v-if="!hasData" class="flex flex-col items-center justify-center h-80 gap-3">
                    <UIcon name="i-lucide-inbox" class="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        ไม่มีข้อมูลในช่วงเวลาที่เลือก
                    </p>
                </div>

                <!-- Line Chart -->
                <div v-else class="h-80">
                    <Line :key="chartKey" :data="activeChartData" :options="chartOptions" />
                </div>
            </div>
        </div>
    </div>
</template>