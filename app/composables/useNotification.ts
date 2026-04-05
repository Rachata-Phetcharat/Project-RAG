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
  // แยก read state ตาม role
  is_user_read: boolean;
  is_admin_read: boolean;
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

// Long Polling controller
let longPollController: AbortController | null = null;
let longPollActive = false;

// ── Pagination config ──────────────────────────────────────────────────────
const PAGE_LIMIT = 10;

export const useNotification = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  const authStore = useAuthStore();

  const isAdmin = computed(() => authStore.user?.role === "admin");

  const getHeaders = () => ({
    Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
  });

  // ── Computed ──────────────────────────────────────────────────────────────
  /**
   * นับ unread ตาม role:
   * - admin → ดู is_admin_read
   * - user  → ดู is_user_read
   */
  const unreadCount = computed(
    () =>
      notifications.value.filter((n) =>
        isAdmin.value ? !n.is_admin_read : !n.is_user_read,
      ).length,
  );
  const hasUnread = computed(() => unreadCount.value > 0);

  // ── Helper: is_read ตาม role ──────────────────────────────────────────────
  const isReadByRole = (n: NotificationEvent): boolean =>
    isAdmin.value ? n.is_admin_read : n.is_user_read;

  // ── Helper: resolve notif type ────────────────────────────────────────────
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

  // ── Merge helper: รักษา read state เดิมไว้ ───────────────────────────────
  const mergeWithExisting = (
    incoming: NotificationEvent[],
  ): NotificationEvent[] => {
    const existingMap = new Map(
      notifications.value.map((n) => [n.event_id, n]),
    );
    return incoming.map((n) => {
      const prev = existingMap.get(n.event_id);
      if (!prev) return n;
      return {
        ...n,
        // ถ้า optimistic update ไปแล้ว (true) ให้คงค่านั้นไว้
        is_user_read: prev.is_user_read || n.is_user_read,
        is_admin_read: prev.is_admin_read || n.is_admin_read,
      };
    });
  };

  // ── Fetch (REST) ──────────────────────────────────────────────────────────
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

      const mapped = mergeWithExisting(data ?? []);

      if (append) {
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
  /**
   * POST /events/read
   * body: { event_id, type: "user" | "admin" }
   */
  const markAsRead = async (eventId: number) => {
    const item = notifications.value.find((n) => n.event_id === eventId);
    if (!item) return;

    const type = isAdmin.value ? "admin" : "user";

    // Optimistic update
    if (isAdmin.value) item.is_admin_read = true;
    else item.is_user_read = true;

    try {
      await $fetch(`${apiBase}/events/read`, {
        method: "POST",
        headers: getHeaders(),
        body: { event_id: eventId, type },
      });
    } catch (e) {
      // rollback
      if (isAdmin.value) item.is_admin_read = false;
      else item.is_user_read = false;
      console.error("[useNotification] markAsRead error:", e);
    }
  };

  const markAllAsRead = async () => {
    const type = isAdmin.value ? "admin" : "user";
    const unread = notifications.value.filter((n) =>
      isAdmin.value ? !n.is_admin_read : !n.is_user_read,
    );

    // Optimistic update
    unread.forEach((n) => {
      if (isAdmin.value) n.is_admin_read = true;
      else n.is_user_read = true;
    });

    try {
      await Promise.all(
        unread.map((n) =>
          $fetch(`${apiBase}/events/read`, {
            method: "POST",
            headers: getHeaders(),
            body: { event_id: n.event_id, type },
          }),
        ),
      );
    } catch (e) {
      // rollback
      unread.forEach((n) => {
        if (isAdmin.value) n.is_admin_read = false;
        else n.is_user_read = false;
      });
      console.error("[useNotification] markAllAsRead error:", e);
    }
  };

  // ── Long Polling ──────────────────────────────────────────────────────────
  /**
   * Long Polling loop:
   * 1. GET /events/list/{user_id}?skip=0&limit=10
   * 2. backend ค้าง response ไว้จนมีข้อมูลใหม่ (หรือ timeout ~30s)
   * 3. client ได้ response → merge → loop ใหม่ทันที
   * 4. ถ้า abort / error → รอ 3s แล้ว retry
   *
   * หมายเหตุ: backend ต้องรองรับ long-poll timeout บน endpoint นี้
   * ถ้า backend ยังไม่รองรับ ให้ใช้ endpoint แยก เช่น /events/poll/{user_id}
   */
  const startLongPolling = () => {
    if (!authStore.isLoggedIn || !authStore.user?.users_id) return;
    if (longPollActive) return;

    longPollActive = true;
    const userId = authStore.user.users_id;

    const poll = async () => {
      while (longPollActive) {
        longPollController = new AbortController();
        const signal = longPollController.signal;

        try {
          const data = await $fetch<NotificationEvent[]>(
            `${apiBase}/events/list/${userId}`,
            {
              headers: getHeaders(),
              query: { skip: 0, limit: PAGE_LIMIT },
              signal,
            },
          );

          if (!longPollActive) break;

          const incoming = data ?? [];
          const currentIds = new Set(
            notifications.value.map((n) => n.event_id),
          );
          const hasNew = incoming.some((n) => !currentIds.has(n.event_id));

          // ตรวจสถานะที่เปลี่ยน (เช่น pending → approved)
          const hasChanged = incoming.some((n) => {
            const existing = notifications.value.find(
              (e) => e.event_id === n.event_id,
            );
            return existing && existing.decision !== n.decision;
          });

          if (hasNew || hasChanged) {
            notifications.value = mergeWithExisting(incoming);
          }
        } catch (e: any) {
          if (e?.name === "AbortError") break;
          // network error / timeout → retry หลัง 3s
          console.warn("[LongPoll] error, retry in 3s", e);
          await new Promise((r) => setTimeout(r, 3_000));
        }

        // loop ทันที (ไม่ delay) — backend จะ hold request แทน
        // ถ้า backend ยังเป็น short-poll ให้เพิ่ม delay: await new Promise(r => setTimeout(r, 5_000));
        await new Promise((r) => setTimeout(r, 5_000));
      }
    };

    poll();
  };

  const stopLongPolling = () => {
    longPollActive = false;
    if (longPollController) {
      longPollController.abort();
      longPollController = null;
    }
    console.log("[LongPoll] Stopped");
  };

  // ── Init ──────────────────────────────────────────────────────────────────
  const startRealtime = async () => {
    await fetchNotifications(); // โหลดครั้งแรก
    startLongPolling();
  };

  const stopRealtime = () => {
    stopLongPolling();
  };

  return {
    // state
    notifications,
    loading,
    unreadCount,
    hasUnread,
    NOTIF_CONFIG,

    // helpers
    isAdmin,
    isReadByRole,
    resolveNotifType,
    formatTime,

    // actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,

    // realtime
    startRealtime,
    stopRealtime,
    startLongPolling,
    stopLongPolling,
  };
};
