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

// กำหนดว่าหน้านี้ต้องล็อกอินและเป็น Admin เท่านั้น
definePageMeta({
    middleware: ['auth', 'admin']
})

// ============================================
// 2. ตั้งค่าช่วงวันที่ (เริ่มต้น 7 วันย้อนหลัง)
// ============================================
const dateRange = ref({
    start: new Date(new Date().setDate(new Date().getDate() - 7)), // 7 วันที่แล้ว
    end: new Date() // วันนี้
});

// ============================================
// 3. สร้างตัวแปรเก็บข้อมูลสถิติแต่ละประเภท
// ============================================
const questionsData = ref({
    total: 0,      // จำนวนคำถามทั้งหมด
    growth: '+0%'  // เปอร์เซ็นต์การเติบโต
});

const usersData = ref({
    total: 0,      // จำนวนผู้ใช้ทั้งหมด
    growth: '+0%'
});

const publicChannelsData = ref({
    total: 0,      // จำนวนแชนแนลสาธารณะ
    growth: '+0%'
});

const privateChannelsData = ref({
    total: 0,      // จำนวนแชนแนลส่วนตัว
    growth: '+0%'
});

const pendingChannelsData = ref({
    total: 0,      // จำนวนคำขอแชนแนลที่รออนุมัติ
    growth: '+0%'
});

// ============================================
// 4. ฟังก์ชันแปลงวันที่เป็นรูปแบบ YYYY-MM-DD
// ============================================
const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // เติม 0 ข้างหน้า
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// ============================================
// 5. ฟังก์ชันดึงข้อมูลทั้งหมดมาแสดง
// ============================================
const initDashboard = async () => {
    // สร้างพารามิเตอร์วันที่สำหรับส่งไป API
    const params = {
        start_date: formatDate(dateRange.value.start),
        end_date: formatDate(dateRange.value.end)
    };

    try {
        // เรียก API ทั้ง 5 ตัวพร้อมกัน (เพื่อความเร็ว)
        const [
            questionsResponse,
            usersResponse,
            publicChannelsResponse,
            privateChannelsResponse,
            pendingChannelsResponse
        ] = await Promise.all([
            fetchQuestionsStats(params),        // ดึงสถิติคำถาม
            fetchUsersStats(params),            // ดึงสถิติผู้ใช้
            fetchChannelsStatsPublic(),         // ดึงสถิติแชนแนลสาธารณะ
            fetchChannelsStatsPrivate(),        // ดึงสถิติแชนแนลส่วนตัว
            fetchChannelsStatsPending()         // ดึงสถิติคำขอแชนแนล
        ]);

        // อัปเดตข้อมูลถ้าได้รับค่ากลับมา
        if (questionsResponse) {
            questionsData.value = questionsResponse;
        }
        if (usersResponse) {
            usersData.value = usersResponse;
        }
        if (publicChannelsResponse) {
            publicChannelsData.value = publicChannelsResponse;
        }
        if (privateChannelsResponse) {
            privateChannelsData.value = privateChannelsResponse;
        }
        if (pendingChannelsResponse) {
            pendingChannelsData.value = pendingChannelsResponse;
        }

    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลด Dashboard:", error);
    }
};

// ============================================
// 6. ติดตามการเปลี่ยนแปลงช่วงวันที่
// ============================================
// เมื่อผู้ใช้เปลี่ยนช่วงวันที่ ให้โหลดข้อมูลใหม่
watch(dateRange, () => {
    initDashboard();
}, { deep: true }); // deep: true เพื่อติดตาม object ข้างใน

// ============================================
// 7. โหลดข้อมูลครั้งแรกเมื่อเปิดหน้า
// ============================================
onMounted(() => {
    initDashboard();
});

// ============================================
// 8. สร้างข้อมูลการ์ดสำหรับแสดงผล
// ============================================
const statsCards = computed(() => [
    {
        label: 'คำถามช่วงนี้',
        value: questionsData.value.total.toLocaleString(), // แปลงเป็นรูปแบบมีคอมม่า
        change: questionsData.value.growth,
        icon: 'i-heroicons-question-mark-circle',
        color: 'green'
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
        value: publicChannelsData.value.total.toLocaleString(),
        change: publicChannelsData.value.growth,
        icon: 'i-heroicons-globe-alt',
        color: 'blue'
    },
    {
        label: 'แชนแนลส่วนตัว',
        value: privateChannelsData.value.total.toLocaleString(),
        change: privateChannelsData.value.growth,
        icon: 'i-heroicons-lock-closed',
        color: 'blue'
    },
    {
        label: 'คำขอแชนแนล',
        value: pendingChannelsData.value.total.toLocaleString(),
        change: pendingChannelsData.value.growth,
        icon: 'i-heroicons-clipboard-document-list',
        color: 'amber'
    }
]);
</script>

<template>
    <!-- ============================================ -->
    <!-- เนื้อหาหลักของหน้า -->
    <!-- ============================================ -->
    <main class="py-8">

        <!-- ส่วนเลือกช่วงวันที่ -->
        <div class="pb-10">
            <DashboardDateSelector v-model="dateRange" />
        </div>

        <!-- ============================================ -->
        <!-- Grid แสดงการ์ดสถิติ -->
        <!-- ============================================ -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

            <!-- แสดง Skeleton (โครงกระดูก) ขณะกำลังโหลด -->
            <template v-if="loading">
                <UCard v-for="cardIndex in 4" :key="cardIndex">
                    <div class="space-y-3">
                        <USkeleton class="h-4 w-[120px]" />
                        <USkeleton class="h-8 w-[80px]" />
                        <USkeleton class="h-4 w-[60px]" />
                    </div>
                </UCard>
            </template>

            <!-- แสดงการ์ดสถิติจริง เมื่อโหลดเสร็จแล้ว -->
            <template v-else>
                <UCard v-for="stat in statsCards" :key="stat.label"
                    class="hover:shadow-lg transition-all duration-300 group cursor-default">
                    <div class="flex items-center justify-between">

                        <!-- ส่วนซ้าย: แสดงข้อมูลตัวเลข -->
                        <div class="space-y-1">
                            <!-- ชื่อสถิติ -->
                            <p
                                class="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-primary-500 transition-colors">
                                {{ stat.label }}
                            </p>

                            <!-- ตัวเลขหลัก -->
                            <p
                                class="text-3xl font-bold text-gray-900 dark:text-white transition-transform group-hover:scale-105 origin-left">
                                {{ stat.value }}
                            </p>

                            <!-- แสดงเปอร์เซ็นต์การเติบโต -->
                            <div class="flex items-center gap-1">
                                <span :class="[
                                    'text-xs font-semibold px-2 py-0.5 rounded-full',
                                    stat.change?.startsWith('+')
                                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30'  // เติบโต = สีเขียว
                                        : 'bg-red-100 text-red-600 dark:bg-red-900/30'        // ลดลง = สีแดง
                                ]">
                                    {{ stat.change }}
                                </span>
                                <span class="text-[10px] text-gray-400">เทียบกับก่อนหน้า</span>
                            </div>
                        </div>

                        <!-- ส่วนขวา: แสดงไอคอน -->
                        <div :class="[
                            'w-14 h-14 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform',
                            // เลือกสีพื้นหลังตาม color
                            stat.color === 'primary' ? 'bg-primary-50 dark:bg-primary-900/20' :
                                stat.color === 'green' ? 'bg-green-50 dark:bg-green-900/20' :
                                    stat.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20' :
                                        'bg-amber-50 dark:bg-amber-900/20'
                        ]">
                            <UIcon :name="stat.icon" :class="[
                                'w-8 h-8',
                                // เลือกสีไอคอนตาม color
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

        <!-- ============================================ -->
        <!-- ปุ่มแสดงสถานะ Loading (ลอยมุมขวาล่าง) -->
        <!-- ============================================ -->
        <div v-if="loading" class="fixed bottom-4 right-4 z-50">
            <UButton loading variant="soft" color="primary">
                กำลังอัปเดตข้อมูล...
            </UButton>
        </div>
    </main>
</template>