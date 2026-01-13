<script setup lang="ts">
const { fetchQuestionsStats, fetchUsersStats, loading } = useDashboard();

definePageMeta({
    middleware: ['auth', 'admin'] // เรียงลำดับสำคัญ
})

const questionsData = ref({ total: 0, growth: '+0%' });
const usersData = ref({ total: 0, growth: '+0%' });

const initDashboard = async () => {
    // วิธีดึงวันที่ YYYY-MM-DD ตามเวลาเครื่องผู้ใช้ (Local Time)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // เติม 0 ข้างหน้าถ้าเป็นเลขหลักเดียว
    const day = String(now.getDate()).padStart(2, '0');

    const todayStr = `${year}-${month}-${day}`;

    const params = {
        start_date: todayStr,
        end_date: todayStr
    };

    try {
        const qRes = await fetchQuestionsStats(params);
        const uRes = await fetchUsersStats(params);

        if (qRes) questionsData.value = qRes;
        if (uRes) usersData.value = uRes;
    } catch (e) {
        console.error("Dashboard Load Error:", e);
    }
}

onMounted(() => {
    initDashboard();
});

// ใช้ Computed เพื่อ Map ข้อมูลเข้ากับ Card UI
const statsCards = computed(() => [
    {
        label: 'คำถามวันนี้',
        value: questionsData.value.total.toLocaleString(),
        change: questionsData.value.growth,
        icon: 'i-heroicons-question-mark-circle',
        color: 'primary'
    },
    {
        label: 'ผู้ใช้วันนี้',
        value: usersData.value.total.toLocaleString(),
        change: usersData.value.growth,
        icon: 'i-heroicons-users',
        color: 'green'
    },
    {
        label: 'ยอดขายรวม',
        value: '฿245,000', // ส่วนนี้ถ้ามี API ยอดขาย ก็ใช้วิธีเดียวกัน
        change: '+12.5%',
        icon: 'i-heroicons-currency-dollar',
        color: 'blue'
    },
    {
        label: 'อัตราการเติบโต',
        value: '23.5%',
        change: '+2.1%',
        icon: 'i-heroicons-chart-bar',
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
                        class="hover:shadow-lg transition-all duration-300 group">
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
                                    <span class="text-[10px] text-gray-400">เทียบกับวันก่อนหน้า</span>
                                </div>
                            </div>
                            <div :class="[
                                'w-14 h-14 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform',
                                stat.color === 'primary' ? 'bg-primary-50 dark:bg-primary-900/20' :
                                    stat.color === 'green' ? 'bg-green-50 dark:bg-green-900/20' :
                                        stat.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20' :
                                            'bg-amber-50 dark:bg-amber-900/20'
                            ]">
                                <UIcon :name="stat.icon" :class="[
                                    'w-8 h-8',
                                    stat.color === 'primary' ? 'text-primary-500' :
                                        stat.color === 'green' ? 'text-green-500' :
                                            stat.color === 'blue' ? 'text-blue-500' :
                                                'text-amber-500'
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