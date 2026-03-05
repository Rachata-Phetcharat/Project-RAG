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
  growth: string;
  data: DailyStatItem[];
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

  // loading ควบคุมที่ composable ระดับเดียว ไม่กระจายใน each fetch
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
    growth: "+0%",
    data: [],
  });

  // ─────────────────────────────────────────────
  // Fetch: Questions (รายวัน)
  // ─────────────────────────────────────────────

  const fetchQuestionsStats = async (
    params: Record<string, string> = {},
  ): Promise<DashboardStats> => {
    try {
      const res = await $fetch<DailyStatItem[]>(
        `${apiBase}/questions/stats/daily`,
        { method: "GET", headers: getHeaders(), query: params },
      );

      const todayVal = res.at(-1)?.count ?? 0;
      const yesterdayVal = res.at(-2)?.count ?? 0;

      return {
        total: todayVal,
        growth: getGrowth(todayVal, yesterdayVal),
        data: res,
      };
    } catch {
      return buildEmptyStats();
    }
  };

  // ─────────────────────────────────────────────
  // Fetch: Users (รายวัน)
  // ─────────────────────────────────────────────

  const fetchUsersStats = async (
    params: Record<string, string> = {},
  ): Promise<DashboardStats> => {
    try {
      const res = await $fetch<DailyStatItem[]>(
        `${apiBase}/users/stats/daily`,
        { method: "GET", headers: getHeaders(), query: params },
      );

      const todayVal = res.at(-1)?.active_users ?? 0;
      const yesterdayVal = res.at(-2)?.active_users ?? 0;

      return {
        total: todayVal,
        growth: getGrowth(todayVal, yesterdayVal),
        data: res,
      };
    } catch {
      return buildEmptyStats();
    }
  };

  // ─────────────────────────────────────────────
  // Fetch: Channels (ยอดรวม — ไม่มีกราฟรายวัน)
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

      return { total, growth: "+0%", data: [] };
    } catch {
      return buildEmptyStats();
    }
  };

  // ─────────────────────────────────────────────
  // Exports
  // ─────────────────────────────────────────────

  return {
    loading,
    fetchQuestionsStats,
    fetchUsersStats,
    fetchChannelStats,
  };
};
