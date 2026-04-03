// composables/useNotification.ts

export interface NotificationEvent {
  event_id: number;
  channel_id: string;
  channel_title: string;
  old_status: string;
  new_status: string;
  requested_by: number;
  decided_by: number;
  decision: "approved" | "rejected" | "pending" | string;
  decision_reason: string;
  decided_at: string;
  created_at: string;
  is_read?: boolean;
}

type NotifType =
  | "approved_public"
  | "approved_private"
  | "rejected"
  | "pending";

export const NOTIF_CONFIG: Record<
  NotifType,
  { icon: string; color: "success" | "error" | "warning" | "info" }
> = {
  approved_public: { icon: "i-lucide-check-circle-2", color: "success" },
  approved_private: { icon: "i-lucide-lock", color: "warning" },
  rejected: { icon: "i-lucide-x-circle", color: "error" },
  pending: { icon: "i-lucide-clock", color: "info" },
};

// ── Shared state (singleton) ───────────────────────────────────────────────
const notifications = ref<NotificationEvent[]>([]);
const loading = ref(false);
let eventSource: EventSource | null = null;
let pollingTimer: ReturnType<typeof setInterval> | null = null;

// ── Pagination config ──────────────────────────────────────────────────────
const PAGE_LIMIT = 10; // max limit ที่ backend รองรับ

export const useNotification = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  const authStore = useAuthStore();

  const getHeaders = () => ({
    Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
  });

  // ── Computed ──────────────────────────────────────────────────────────────
  const unreadCount = computed(
    () => notifications.value.filter((n) => !n.is_read).length,
  );
  const hasUnread = computed(() => unreadCount.value > 0);

  // ── Helper ────────────────────────────────────────────────────────────────
  const resolveNotifType = (n: NotificationEvent): NotifType => {
    if (n.decision === "approved" && n.new_status === "public")
      return "approved_public";
    if (n.decision === "approved" && n.new_status === "private")
      return "approved_private";
    if (n.decision === "rejected") return "rejected";
    return "pending";
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "เมื่อกี้";
    if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
    return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  };

  // ── Fetch (REST fallback) ─────────────────────────────────────────────────
  /**
   * ดึงข้อมูลพร้อม pagination
   * - skip: ข้ามกี่รายการ (default 0)
   * - limit: จำนวนสูงสุดต่อ page (default 10, max 10)
   * - append: ถ้า true จะ append ต่อท้าย list เดิม (สำหรับ load more)
   */
  const fetchNotifications = async (
    skip = 0,
    limit = PAGE_LIMIT,
    append = false,
  ) => {
    if (!authStore.isLoggedIn || !authStore.user?.users_id) return;
    loading.value = true;
    try {
      const data = await $fetch<NotificationEvent[]>(
        `${apiBase}/events/list/${authStore.user.users_id}`,
        {
          headers: getHeaders(),
          query: { skip, limit },
        },
      );

      const existingReadIds = new Set(
        notifications.value.filter((n) => n.is_read).map((n) => n.event_id),
      );

      const mapped = (data ?? []).map((n) => ({
        ...n,
        is_read: existingReadIds.has(n.event_id) ? true : (n.is_read ?? false),
      }));

      if (append) {
        // Load more: เพิ่มเฉพาะรายการที่ยังไม่มีใน list
        const existingIds = new Set(notifications.value.map((n) => n.event_id));
        notifications.value = [
          ...notifications.value,
          ...mapped.filter((n) => !existingIds.has(n.event_id)),
        ];
      } else {
        notifications.value = mapped;
      }
    } catch (e) {
      console.error("[useNotification] fetchNotifications error:", e);
    } finally {
      loading.value = false;
    }
  };

  // ── Mark as read ──────────────────────────────────────────────────────────
  const markAsRead = async (eventId: number) => {
    // Optimistic update
    const item = notifications.value.find((n) => n.event_id === eventId);
    if (item) item.is_read = true;

    try {
      await $fetch(`${apiBase}/events/read`, {
        method: "POST",
        headers: getHeaders(),
        body: { event_id: eventId },
      });
    } catch (e) {
      // rollback
      if (item) item.is_read = false;
      console.error("[useNotification] markAsRead error:", e);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.value.filter((n) => !n.is_read);
    // Optimistic update
    unread.forEach((n) => (n.is_read = true));
    try {
      await Promise.all(
        unread.map((n) =>
          $fetch(`${apiBase}/events/read`, {
            method: "POST",
            headers: getHeaders(),
            body: { event_id: n.event_id },
          }),
        ),
      );
    } catch (e) {
      // rollback
      unread.forEach((n) => (n.is_read = false));
      console.error("[useNotification] markAllAsRead error:", e);
    }
  };

  // ── SSE: Real-time connection ─────────────────────────────────────────────
  const startSSE = () => {
    if (!authStore.isLoggedIn || !authStore.user?.users_id) return;
    if (eventSource) return; // already connected

    const url = `${apiBase}/events/stream/${authStore.user.users_id}`;

    eventSource = new EventSource(url);

    eventSource.onopen = () => {
      console.log("[SSE] Connected");
    };

    // รับ event ชื่อ "notification" ที่ backend ส่งมา
    eventSource.addEventListener("notification", (e: MessageEvent) => {
      try {
        const newNotif: NotificationEvent = JSON.parse(e.data);
        // ถ้ายังไม่มีใน list → prepend
        const exists = notifications.value.some(
          (n) => n.event_id === newNotif.event_id,
        );
        if (!exists) {
          notifications.value.unshift({ ...newNotif, is_read: false });
        }
      } catch (err) {
        console.error("[SSE] parse error:", err);
      }
    });

    // Heartbeat (optional) — backend ส่ง event: "ping" ทุก 30s
    eventSource.addEventListener("ping", () => {
      // ไม่ต้องทำอะไร แค่ keep alive
    });

    eventSource.onerror = (err) => {
      console.warn("[SSE] Connection error, will reconnect in 10s", err);
      stopSSE();
      // auto-reconnect
      setTimeout(() => {
        if (authStore.isLoggedIn) startSSE();
      }, 10_000);
    };
  };

  const stopSSE = () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
      console.log("[SSE] Disconnected");
    }
  };

  // ── Polling fallback (ใช้แทน SSE ถ้า backend ยังไม่รองรับ) ─────────────
  const startPolling = (intervalMs = 30_000) => {
    if (pollingTimer) return;
    pollingTimer = setInterval(async () => {
      const prevUnread = unreadCount.value;
      await fetchNotifications();
      if (unreadCount.value > prevUnread) {
        console.log(
          `[Polling] New notifications: +${unreadCount.value - prevUnread}`,
        );
      }
    }, intervalMs);
  };

  const stopPolling = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
  };

  // ── Init: เลือกใช้ SSE หรือ Polling ──────────────────────────────────────
  /**
   * เรียกตอน login
   * - useSSE = true  → ใช้ SSE (backend /events/stream/{user_id} พร้อมแล้ว)
   * - useSSE = false → ใช้ polling แทน
   */
  const startRealtime = async (useSSE = true) => {
    await fetchNotifications(); // โหลดครั้งแรก
    if (useSSE) {
      startSSE();
    } else {
      startPolling(30_000); // poll ทุก 30 วิ
    }
  };

  const stopRealtime = () => {
    stopSSE();
    stopPolling();
  };

  return {
    // state
    notifications,
    loading,
    unreadCount,
    hasUnread,
    NOTIF_CONFIG,

    // actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,

    // realtime
    startRealtime,
    stopRealtime,
    startPolling,
    stopPolling,
    startSSE,
    stopSSE,

    // helpers
    resolveNotifType,
    formatTime,
  };
};
