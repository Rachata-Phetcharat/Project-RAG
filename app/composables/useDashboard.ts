// composables/useDashboard.ts

// เพิ่ม Interface ให้ครอบคลุมทั้งสองแบบ
export interface DailyStatItem {
  date: string;
  count?: number; // สำหรับ Questions
  active_users?: number; // สำหรับ Users
}

export interface DashboardStats {
  total: number;
  growth: string;
  data: DailyStatItem[];
}

export interface ChannelStatItem {
  date: string;
  Channel_public_count: string;
  Channel_private_count: string;
  Channel_pending_count: string;
}

export const useDashboard = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  const authStore = useAuthStore();
  const loading = ref(false);

  const getHeaders = () => ({
    Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
  });

  // ในส่วนของ getGrowth ใน useDashboard.ts

  const getGrowth = (current: number, previous: number): string => {
    // 1. ถ้าเท่ากันเป๊ะ หรือเป็น 0 ทั้งคู่
    if (current === previous) return "+0%";

    // 2. ถ้าเมื่อวานเป็น 0 แต่แค่วันนี้มีเข้ามา (เช่น จาก 0 เป็น 1)
    // แทนที่จะให้ขึ้น 100% เราอาจจะใช้คำว่า "+100%" แต่ Cap ไว้แค่ตัวเลขนี้
    // หรือจะโชว์เป็น New (N/A) ก็ได้
    if (previous === 0) return "+100%";

    const diff = ((current - previous) / previous) * 100;

    // 3. จำกัดเพดาน (Cap) ไม่ให้เกิน 100%
    // และทำให้เป็นเลขจำนวนเต็มเพื่อไม่ให้ดูยุ่บยั่บ
    const finalDiff = Math.min(Math.max(diff, -100), 100);

    return `${finalDiff >= 0 ? "+" : ""}${finalDiff.toFixed(0)}%`;
  };

  // --- 1. สำหรับ Questions (ใช้ Key 'count') ---
  const fetchQuestionsStats = async (params: any = {}) => {
    loading.value = true;
    try {
      const res = await $fetch<DailyStatItem[]>(
        `${apiBase}/questions/stats/daily`,
        {
          method: "GET",
          headers: getHeaders(),
          query: params,
        },
      );

      // หาค่าวันนี้ (ตัวสุดท้าย) และ เมื่อวาน (ตัวรองสุดท้าย)
      const todayVal = res[res.length - 1]?.count || 0;
      const yesterdayVal = res[res.length - 2]?.count || 0;

      return {
        total: todayVal,
        growth: getGrowth(todayVal, yesterdayVal),
        data: res,
      };
    } catch (err) {
      return { total: 0, growth: "+0%", data: [] };
    } finally {
      loading.value = false;
    }
  };

  const fetchUsersStats = async (params: any = {}) => {
    loading.value = true;
    try {
      const res = await $fetch<DailyStatItem[]>(
        `${apiBase}/users/stats/daily`,
        {
          method: "GET",
          headers: getHeaders(),
          query: params,
        },
      );

      const todayVal = res[res.length - 1]?.active_users || 0;
      const yesterdayVal = res[res.length - 2]?.active_users || 0;

      return {
        total: todayVal,
        growth: getGrowth(todayVal, yesterdayVal),
        data: res,
      };
    } catch (err) {
      return { total: 0, growth: "+0%", data: [] };
    } finally {
      loading.value = false;
    }
  };

  // --- 3. สำหรับ Channels ---
  const fetchChannelsStatsPublic = async () => {
    loading.value = true;
    try {
      // เรียกไปที่ endpoint ตามรูปภาพที่คุณส่งมา
      const res = await $fetch<any>(`${apiBase}/channels/public/count`, {
        method: "GET",
        headers: getHeaders(),
      });

      // สมมติว่า API คืนค่ามาเป็นตัวเลขตรงๆ เช่น 42
      // แต่ระบบคุณต้องการอาศัยข้อมูลย้อนหลังเพื่อคำนวณ Growth
      // ถ้า API ตัวนี้คืนแค่ "เลขปัจจุบัน" เราจะคำนวณ Growth ไม่ได้ (จะเป็น +0%)
      const Channel_public_count =
        typeof res === "object" ? res.Channel_public_count : parseInt(res);

      return {
        total: Channel_public_count || 0,
        growth: "+0%", // เนื่องจาก endpoint นี้ดูเหมือนจะคืนแค่ยอดรวมปัจจุบัน
        data: [], // และไม่มีกราฟรายวัน
      };
    } catch (err) {
      return { total: 0, growth: "+0%", data: [] };
    } finally {
      loading.value = false;
    }
  };

  const fetchChannelsStatsPrivate = async () => {
    loading.value = true;
    try {
      // เรียกไปที่ endpoint ตามรูปภาพที่คุณส่งมา
      const res = await $fetch<any>(`${apiBase}/channels/private/count`, {
        method: "GET",
        headers: getHeaders(),
      });

      // สมมติว่า API คืนค่ามาเป็นตัวเลขตรงๆ เช่น 42
      // แต่ระบบคุณต้องการอาศัยข้อมูลย้อนหลังเพื่อคำนวณ Growth
      // ถ้า API ตัวนี้คืนแค่ "เลขปัจจุบัน" เราจะคำนวณ Growth ไม่ได้ (จะเป็น +0%)
      const Channel_private_count =
        typeof res === "object" ? res.Channel_private_count : parseInt(res);

      return {
        total: Channel_private_count || 0,
        growth: "+0%", // เนื่องจาก endpoint นี้ดูเหมือนจะคืนแค่ยอดรวมปัจจุบัน
        data: [], // และไม่มีกราฟรายวัน
      };
    } catch (err) {
      return { total: 0, growth: "+0%", data: [] };
    } finally {
      loading.value = false;
    }
  };

  const fetchChannelsStatsPending = async () => {
    loading.value = true;
    try {
      // เรียกไปที่ endpoint ตามรูปภาพที่คุณส่งมา
      const res = await $fetch<any>(`${apiBase}/channels/pending/count`, {
        method: "GET",
        headers: getHeaders(),
      });

      // สมมติว่า API คืนค่ามาเป็นตัวเลขตรงๆ เช่น 42
      // แต่ระบบคุณต้องการอาศัยข้อมูลย้อนหลังเพื่อคำนวณ Growth
      // ถ้า API ตัวนี้คืนแค่ "เลขปัจจุบัน" เราจะคำนวณ Growth ไม่ได้ (จะเป็น +0%)
      const Channel_pending_count =
        typeof res === "object" ? res.Channel_pending_count : parseInt(res);

      return {
        total: Channel_pending_count || 0,
        growth: "+0%", // เนื่องจาก endpoint นี้ดูเหมือนจะคืนแค่ยอดรวมปัจจุบัน
        data: [], // และไม่มีกราฟรายวัน
      };
    } catch (err) {
      return { total: 0, growth: "+0%", data: [] };
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    fetchQuestionsStats,
    fetchUsersStats,
    fetchChannelsStatsPublic,
    fetchChannelsStatsPrivate,
    fetchChannelsStatsPending,
  };
};
