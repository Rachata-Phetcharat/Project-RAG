// composables/useDashboard.ts

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface DailyStatItem {
  date: string;
  count?: number; // Questions
  active_users?: number; // Users
}

export interface DashboardStats {
  total: number;
  todayCount: number;
  growth: string;
  data: DailyStatItem[];
}

export interface ChannelStatsResult {
  data: DailyStatItem[];
  total: number;
}

export interface ChannelOption {
  channels_id: number;
  title: string;
  description?: string | null;
  status?: string;
}

type ChannelType = "public" | "private" | "pending";

const CHANNEL_RESPONSE_KEY: Record<ChannelType, string> = {
  public: "Channel_public_count",
  private: "Channel_private_count",
  pending: "Channel_pending_count",
};

// ─────────────────────────────────────────────
// Composable
// ─────────────────────────────────────────────

export const useDashboard = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  const authStore = useAuthStore();

  const loading = ref(false);

  const getHeaders = () => ({
    Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
  });

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  const getGrowth = (current: number, previous: number): string => {
    if (current === previous) return "+0%";
    if (previous === 0) return "+100%";

    const diff = ((current - previous) / previous) * 100;
    const capped = Math.min(Math.max(diff, -100), 100);

    return `${capped >= 0 ? "+" : ""}${capped.toFixed(0)}%`;
  };

  const buildEmptyStats = (): DashboardStats => ({
    total: 0,
    todayCount: 0,
    growth: "+0%",
    data: [],
  });
  const buildEmptyChannel = (): ChannelStatsResult => ({ data: [], total: 0 });

  const getTodayString = (): string => {
    const now = new Date();
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
  };

  // ─────────────────────────────────────────────
  // Fetch: Questions รายวัน (ภาพรวม)
  // ─────────────────────────────────────────────

  const fetchQuestionsStats = async (
    params: Record<string, string> = {},
  ): Promise<DashboardStats> => {
    try {
      const res = await $fetch<DailyStatItem[]>(
        `${apiBase}/questions/stats/daily`,
        { method: "GET", headers: getHeaders(), query: params },
      );

      const today = getTodayString();
      const todayItem = res.find((item) => item.date === today);
      const todayVal = res.at(-1)?.count ?? 0;
      const yesterdayVal = res.at(-2)?.count ?? 0;
      const totalVal = res.reduce((sum, item) => sum + (item.count ?? 0), 0);

      return {
        total: totalVal,
        todayCount: todayItem?.count ?? 0,
        growth: getGrowth(todayVal, yesterdayVal),
        data: res,
      };
    } catch {
      return buildEmptyStats();
    }
  };

  // ─────────────────────────────────────────────
  // Fetch: Users รายวัน (ภาพรวม)
  // ─────────────────────────────────────────────

  const fetchUsersStats = async (
    params: Record<string, string> = {},
  ): Promise<DashboardStats> => {
    try {
      const res = await $fetch<DailyStatItem[]>(
        `${apiBase}/users/stats/daily`,
        { method: "GET", headers: getHeaders(), query: params },
      );

      const today = getTodayString();
      const todayItem = res.find((item) => item.date === today);
      const todayVal = res.at(-1)?.active_users ?? 0;
      const yesterdayVal = res.at(-2)?.active_users ?? 0;
      const totalVal = res.reduce(
        (sum, item) => sum + (item.active_users ?? 0),
        0,
      );

      return {
        total: totalVal,
        todayCount: todayItem?.active_users ?? 0,
        growth: getGrowth(todayVal, yesterdayVal),
        data: res,
      };
    } catch {
      return buildEmptyStats();
    }
  };

  // ─────────────────────────────────────────────
  // Fetch: Channels ยอดรวม (ไม่มีกราฟรายวัน)
  // ─────────────────────────────────────────────

  const fetchChannelStats = async (
    type: ChannelType,
  ): Promise<DashboardStats> => {
    try {
      const res = await $fetch<Record<string, unknown>>(
        `${apiBase}/channels/${type}/count`,
        { method: "GET", headers: getHeaders() },
      );

      const key = CHANNEL_RESPONSE_KEY[type];
      const total =
        typeof res === "object" ? Number(res[key]) || 0 : Number(res) || 0;

      return { total, todayCount: 0, growth: "+0%", data: [] };
    } catch {
      return buildEmptyStats();
    }
  };

  // ─────────────────────────────────────────────
  // Fetch: Questions รายวัน เฉพาะ Channel
  // GET /questions/stats/only-channel
  // ─────────────────────────────────────────────

  const fetchQuestionsByChannel = async (params: {
    channel_id: number;
    start_date?: string;
    end_date?: string;
  }): Promise<ChannelStatsResult> => {
    try {
      const res = await $fetch<DailyStatItem[]>(
        `${apiBase}/questions/stats/only-channel`,
        {
          method: "GET",
          headers: getHeaders(),
          query: {
            channel_id: params.channel_id,
            start_date: params.start_date ?? undefined,
            end_date: params.end_date ?? undefined,
          },
        },
      );

      const data = Array.isArray(res) ? res : [];
      const total = data.reduce((sum, item) => sum + (item.count ?? 0), 0);

      return { data, total };
    } catch {
      return buildEmptyChannel();
    }
  };

  // ─────────────────────────────────────────────
  // Fetch: Users รายวัน เฉพาะ Channel
  // GET /users/stats/only-channel
  // ─────────────────────────────────────────────

  const fetchUsersByChannel = async (params: {
    channel_id: number;
    start_date?: string;
    end_date?: string;
  }): Promise<ChannelStatsResult> => {
    try {
      const res = await $fetch<DailyStatItem[]>(
        `${apiBase}/users/stats/only-channel`,
        {
          method: "GET",
          headers: getHeaders(),
          query: {
            channel_id: params.channel_id,
            start_date: params.start_date ?? undefined,
            end_date: params.end_date ?? undefined,
          },
        },
      );

      const data = Array.isArray(res) ? res : [];
      const total = data.reduce(
        (sum, item) => sum + (item.active_users ?? 0),
        0,
      );

      return { data, total };
    } catch {
      return buildEmptyChannel();
    }
  };

  // ─────────────────────────────────────────────
  // Exports
  // ─────────────────────────────────────────────

  return {
    loading,
    // ภาพรวม
    fetchQuestionsStats,
    fetchUsersStats,
    fetchChannelStats,
    // เฉพาะ Channel
    fetchQuestionsByChannel,
    fetchUsersByChannel,
  };
};
