<script setup lang="ts">
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'vue-chartjs';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Props
const props = defineProps({
    questionsData: {
        type: Object,
        required: true
    },
    usersData: {
        type: Object,
        required: true
    },
    publicChannelsData: {
        type: Number,
        required: true
    },
    privateChannelsData: {
        type: Number,
        required: true
    },
    pendingChannelsData: {
        type: Number,
        required: true
    }
});

// Color mode
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === 'dark');

// Chart colors based on theme
const chartColors = computed(() => ({
    text: isDark.value ? '#e5e7eb' : '#374151',
    grid: isDark.value ? '#374151' : '#e5e7eb',
    blue: {
        main: 'rgb(59, 130, 246)',
        light: 'rgba(59, 130, 246, 0.2)',
        gradient: 'rgba(59, 130, 246, 0.8)'
    },
    purple: {
        main: 'rgb(168, 85, 247)',
        light: 'rgba(168, 85, 247, 0.2)',
        gradient: 'rgba(168, 85, 247, 0.8)'
    },
    green: {
        main: 'rgb(34, 197, 94)',
        light: 'rgba(34, 197, 94, 0.2)'
    },
    rose: {
        main: 'rgb(244, 63, 94)',
        light: 'rgba(244, 63, 94, 0.2)'
    },
    amber: {
        main: 'rgb(245, 158, 11)',
        light: 'rgba(245, 158, 11, 0.2)'
    }
}));

// ============================================
// ฟังก์ชันแปลงข้อมูลจาก API เป็นรูปแบบที่ Chart.js ใช้งาน
// ============================================

// แปลงวันที่จาก API (YYYY-MM-DD) เป็นรูปแบบที่แสดงบนกราฟ
const formatChartLabel = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
};

// สร้าง labels จากข้อมูล Questions
const chartLabels = computed(() => {
    if (props.questionsData.data && props.questionsData.data.length > 0) {
        return props.questionsData.data.map((item: any) => formatChartLabel(item.date));
    }
    return [];
});

// สร้างข้อมูลสำหรับกราฟ Questions
const questionsChartValues = computed(() => {
    if (props.questionsData.data && props.questionsData.data.length > 0) {
        return props.questionsData.data.map((item: any) => item.count || 0);
    }
    return [];
});

// สร้างข้อมูลสำหรับกราฟ Users
const usersChartValues = computed(() => {
    if (props.usersData.data && props.usersData.data.length > 0) {
        return props.usersData.data.map((item: any) => item.active_users || 0);
    }
    return [];
});

// ============================================
// กำหนดค่า Chart Data
// ============================================

const areaChartData = computed(() => ({
    labels: chartLabels.value,
    datasets: [
        {
            label: 'คำถาม',
            data: questionsChartValues.value,
            borderColor: chartColors.value.blue.main,
            backgroundColor: (context: any) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, chartColors.value.blue.gradient);
                gradient.addColorStop(1, 'rgba(59, 130, 246, 0.01)');
                return gradient;
            },
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: chartColors.value.blue.main,
            pointBorderColor: '#fff',
            pointBorderWidth: 2
        }
    ]
}));

const usersChart = computed(() => ({
    labels: chartLabels.value,
    datasets: [
        {
            label: 'ผู้ใช้งาน',
            data: usersChartValues.value,
            borderColor: chartColors.value.purple.main,
            backgroundColor: (context: any) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, chartColors.value.purple.gradient);
                gradient.addColorStop(1, 'rgba(168, 85, 247, 0.01)');
                return gradient;
            },
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: chartColors.value.purple.main,
            pointBorderColor: '#fff',
            pointBorderWidth: 2
        }
    ]
}));

// ============================================
// Bar Chart - เปรียบเทียบแชนแนล
// ============================================
const barChartData = computed(() => ({
    labels: ['แชนแนลสาธารณะ', 'แชนแนลส่วนตัว', 'คำขอรอดำเนินการ'],
    datasets: [
        {
            label: 'จำนวน',
            data: [
                props.publicChannelsData,
                props.privateChannelsData,
                props.pendingChannelsData
            ],
            backgroundColor: [
                chartColors.value.green.light,
                chartColors.value.rose.light,
                chartColors.value.amber.light
            ],
            borderColor: [
                chartColors.value.green.main,
                chartColors.value.rose.main,
                chartColors.value.amber.main
            ],
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false
        }
    ]
}));

const barChartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false
        },
        tooltip: {
            backgroundColor: isDark.value ? '#1f2937' : '#ffffff',
            titleColor: chartColors.value.text,
            bodyColor: chartColors.value.text,
            borderColor: chartColors.value.grid,
            borderWidth: 1,
            padding: 12,
            callbacks: {
                label: function (context: any) {
                    return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} แชนแนล`;
                }
            }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: {
                color: chartColors.value.grid,
                drawBorder: false
            },
            ticks: {
                color: chartColors.value.text,
                callback: function (value: any) {
                    return value.toLocaleString();
                }
            }
        },
        x: {
            grid: {
                display: false
            },
            ticks: {
                color: chartColors.value.text,
                font: {
                    size: 11
                }
            }
        }
    }
}));

// ============================================
// Doughnut Chart - สัดส่วนแชนแนล
// ============================================
const doughnutChartData = computed(() => ({
    labels: ['สาธารณะ', 'ส่วนตัว', 'รอดำเนินการ'],
    datasets: [
        {
            data: [
                props.publicChannelsData,
                props.privateChannelsData,
                props.pendingChannelsData
            ],
            backgroundColor: [
                chartColors.value.green.main,
                chartColors.value.rose.main,
                chartColors.value.amber.main
            ],
            borderColor: isDark.value ? '#1f2937' : '#ffffff',
            borderWidth: 3,
            hoverOffset: 10
        }
    ]
}));

const doughnutChartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: true,
            position: 'bottom' as const,
            labels: {
                color: chartColors.value.text,
                font: {
                    size: 12
                },
                padding: 15,
                usePointStyle: true
            }
        },
        tooltip: {
            backgroundColor: isDark.value ? '#1f2937' : '#ffffff',
            titleColor: chartColors.value.text,
            bodyColor: chartColors.value.text,
            borderColor: chartColors.value.grid,
            borderWidth: 1,
            padding: 12,
            callbacks: {
                label: function (context: any) {
                    const label = context.label || '';
                    const value = context.parsed || 0;
                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                }
            }
        }
    },
    cutout: '65%'
}));

// ============================================
// Area Chart Options
// ============================================
const areaChartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false
        },
        tooltip: {
            backgroundColor: isDark.value ? '#1f2937' : '#ffffff',
            titleColor: chartColors.value.text,
            bodyColor: chartColors.value.text,
            borderColor: chartColors.value.grid,
            borderWidth: 1,
            padding: 12,
            callbacks: {
                label: function (context: any) {
                    return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
                }
            }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: {
                color: chartColors.value.grid,
                drawBorder: false
            },
            ticks: {
                color: chartColors.value.text,
                callback: function (value: any) {
                    return value.toLocaleString();
                }
            }
        },
        x: {
            grid: {
                display: false
            },
            ticks: {
                color: chartColors.value.text,
                maxRotation: 45,
                minRotation: 0
            }
        }
    },
    interaction: {
        intersect: false,
        mode: 'index' as const
    }
}));

// ตรวจสอบว่ามีข้อมูลหรือไม่
const hasData = computed(() => {
    return questionsChartValues.value.length > 0 || usersChartValues.value.length > 0;
});
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center gap-3 mb-6">
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

        <!-- No Data Message -->
        <div v-if="!hasData"
            class="bg-white dark:bg-gray-800 rounded-2xl p-12 border border-gray-200 dark:border-gray-700 shadow-lg text-center">
            <UIcon name="i-lucide-inbox" class="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                ไม่มีข้อมูลในช่วงเวลาที่เลือก
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
                กรุณาเลือกช่วงเวลาอื่นหรือรอให้มีข้อมูลเพิ่มเติม
            </p>
        </div>

        <!-- Charts Grid -->
        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 1. Questions Line Chart -->
            <div
                class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-message-circle-question"
                            class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                            การเติบโตของคำถาม
                        </h3>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                        {{ questionsChartValues.length }} วัน
                    </div>
                </div>
                <div class="h-80">
                    <Line :data="areaChartData" :options="areaChartOptions" />
                </div>
            </div>

            <!-- 2. Users Line Chart -->
            <div
                class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-users" class="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                            แนวโน้มผู้ใช้งาน
                        </h3>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                        {{ usersChartValues.length }} วัน
                    </div>
                </div>
                <div class="h-80">
                    <Line :data="usersChart" :options="areaChartOptions" />
                </div>
            </div>
        </div>

    </div>
</template>