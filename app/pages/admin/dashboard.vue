<script setup lang="ts">
const { fetchQuestionsStats, fetchUsersStats, fetchChannelsStatsPublic, fetchChannelsStatsPrivate, fetchChannelsStatsPending, loading } = useDashboard();

definePageMeta({
    middleware: ['auth', 'admin']
})

const dateRange = ref({
    start: new Date(new Date().setDate(new Date().getDate() - 7)),
    end: new Date()
});

// เตรียม State สำหรับเก็บข้อมูลแต่ละส่วน
const questionsData = ref({ total: 0, growth: '+0%' });
const usersData = ref({ total: 0, growth: '+0%' });
const publicChannelsData = ref({ total: 0, growth: '+0%' });
const privateChannelsData = ref({ total: 0, growth: '+0%' });
const pendingChannelsData = ref({ total: 0, growth: '+0%' });

const initDashboard = async () => {
    const formatDate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const params = {
        start_date: formatDate(dateRange.value.start),
        end_date: formatDate(dateRange.value.end)
    };

    try {
        // ดึงข้อมูลพร้อมกัน 3 ตัว (รวม fetchChannelsStats)
        const [qRes, uRes, puRes, prRes, peRes] = await Promise.all([
            fetchQuestionsStats(params),
            fetchUsersStats(params),
            fetchChannelsStatsPublic(),
            fetchChannelsStatsPrivate(),
            fetchChannelsStatsPending()
        ]);

        if (qRes) questionsData.value = qRes;
        if (uRes) usersData.value = uRes;
        if (puRes) publicChannelsData.value = puRes;
        if (prRes) privateChannelsData.value = prRes;
        if (peRes) pendingChannelsData.value = peRes;
    } catch (e) {
        console.error("Dashboard Load Error:", e);
    }
}

watch(dateRange, () => {
    initDashboard();
}, { deep: true });

onMounted(() => {
    initDashboard();
});

// ปรับปรุง Computed ให้ดึงค่าจาก Ref จริงๆ
const statsCards = computed(() => [
    {
        label: 'คำถามช่วงนี้',
        value: questionsData.value.total.toLocaleString(),
        change: questionsData.value.growth,
        icon: 'i-heroicons-question-mark-circle',
        color: 'primary'
    },
    {
        label: 'ผู้ใช้ช่วงนี้',
        value: usersData.value.total.toLocaleString(),
        change: usersData.value.growth,
        icon: 'i-heroicons-users',
        color: 'green'
    },
    {
        label: 'แชนแนลสาธารณะ',
        value: publicChannelsData.value.total.toLocaleString(), // ใช้ค่าจาก API
        change: publicChannelsData.value.growth,
        icon: 'i-heroicons-globe-alt',
        color: 'blue'
    },
    {
        label: 'แชนแนลส่วนตัว',
        value: privateChannelsData.value.total.toLocaleString(), // รอ API เพิ่มเติม
        change: privateChannelsData.value.growth,
        icon: 'i-heroicons-lock-closed',
        color: 'amber'
    },
    {
        label: 'แชนแนลส่วนตัว',
        value: pendingChannelsData.value.total.toLocaleString(), // รอ API เพิ่มเติม
        change: pendingChannelsData.value.growth,
        icon: 'i-heroicons-lock-closed',
        color: 'amber'
    }
])
</script>

<template>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav class="flex items-center justify-between py-4">
            <NuxtLink to="/" class="text-xl font-semibold text-gray-900 dark:text-white">ห้องคำขอ</NuxtLink>

            <div class="flex items-center gap-3">
                <UserMenu />
            </div>
        </nav>

        <USeparator size="md" />

        <main class="py-8">

            <div class="pb-10">
                <DashboardDateSelector v-model="dateRange" />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <template v-if="loading">
                    <UCard v-for="i in 4" :key="i">
                        <div class="space-y-3">
                            <USkeleton class="h-4 w-[120px]" />
                            <USkeleton class="h-8 w-[80px]" />
                            <USkeleton class="h-4 w-[60px]" />
                        </div>
                    </UCard>
                </template>

                <template v-else>
                    <UCard v-for="stat in statsCards" :key="stat.label"
                        class="hover:shadow-lg transition-all duration-300 group cursor-default">
                        <div class="flex items-center justify-between">
                            <div class="space-y-1">
                                <p
                                    class="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-primary-500 transition-colors">
                                    {{ stat.label }}
                                </p>
                                <p
                                    class="text-3xl font-bold text-gray-900 dark:text-white transition-transform group-hover:scale-105 origin-left">
                                    {{ stat.value }}
                                </p>
                                <div class="flex items-center gap-1">
                                    <span :class="[
                                        'text-xs font-semibold px-2 py-0.5 rounded-full',
                                        stat.change?.startsWith('+') ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'
                                    ]">
                                        {{ stat.change }}
                                    </span>
                                    <span class="text-[10px] text-gray-400">เทียบกับก่อนหน้า</span>
                                </div>
                            </div>
                            <div :class="[
                                'w-14 h-14 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform',
                                stat.color === 'primary' ? 'bg-primary-50 dark:bg-primary-900/20' :
                                    stat.color === 'green' ? 'bg-green-50 dark:bg-green-900/20' :
                                        stat.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
                            ]">
                                <UIcon :name="stat.icon" :class="[
                                    'w-8 h-8',
                                    stat.color === 'primary' ? 'text-primary-500' :
                                        stat.color === 'green' ? 'text-green-500' :
                                            stat.color === 'blue' ? 'text-blue-500' : 'text-amber-500'
                                ]" />
                            </div>
                        </div>
                    </UCard>
                </template>
            </div>

            <div v-if="loading" class="fixed bottom-4 right-4 z-50">
                <UButton loading variant="soft" color="primary">กำลังอัปเดตข้อมูล...</UButton>
            </div>
        </main>
    </div>
</template>