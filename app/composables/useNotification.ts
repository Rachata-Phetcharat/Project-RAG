// composables/useNotification.ts
// npm install event-source-polyfill
// npm install -D @types/event-source-polyfill

import { EventSourcePolyfill } from "event-source-polyfill";

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

// SSE instance (EventSourcePolyfill รองรับ Authorization header)
let eventSource: EventSourcePolyfill | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

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

  // ── Merge helper: รักษา read state เดิม (optimistic) ไว้ ─────────────────
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

  // ── SSE via EventSourcePolyfill ───────────────────────────────────────────
  /**
   * EventSourcePolyfill แก้ปัญหา native EventSource ที่ส่ง Authorization header ไม่ได้
   *
   * Flow:
   * 1. เชื่อมต่อ GET /events/stream/{user_id} พร้อม Authorization header
   * 2. รับ event "notification" → ถ้าใหม่ → unshift, ถ้า decision เปลี่ยน → merge
   * 3. รับ event "ping" → ไม่ทำอะไร (กัน heartbeat timeout)
   * 4. onerror → close → reconnect หลัง 10s อัตโนมัติ
   */
  const startSSE = () => {
    if (!authStore.isLoggedIn || !authStore.user?.users_id) return;
    if (eventSource) return; // ป้องกัน connect ซ้ำ

    const url = `${apiBase}/events/stream/${authStore.user.users_id}`;

    eventSource = new EventSourcePolyfill(url, {
      headers: {
        Authorization: `Bearer ${authStore.token ?? ""}`,
      },
      // heartbeatTimeout: ควรมากกว่า ping interval ของ backend (default polyfill: 45000ms)
      heartbeatTimeout: 60_000,
    });

    eventSource.onopen = () => {
      console.log("[SSE] Connected via EventSourcePolyfill");
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    // รับ notification ใหม่จาก backend
    eventSource.addEventListener(
      "notification" as any,
      ((e: MessageEvent) => {
        try {
          const newNotif: NotificationEvent = JSON.parse(e.data);

          const existing = notifications.value.find(
            (n) => n.event_id === newNotif.event_id,
          );

          if (!existing) {
            // notification ใหม่ → เพิ่มขึ้นหน้าสุด
            notifications.value.unshift(newNotif);
          } else if (existing.decision !== newNotif.decision) {
            // สถานะเปลี่ยน (pending → approved / rejected) → merge อัปเดต
            notifications.value = mergeWithExisting(
              notifications.value.map((n) =>
                n.event_id === newNotif.event_id ? newNotif : n,
              ),
            );
          }
        } catch (err) {
          console.error("[SSE] parse error:", err);
        }
      }) as EventListener,
    );

    // ping frame จาก backend — prevent heartbeat timeout เฉยๆ
    eventSource.addEventListener("ping" as any, (() => {}) as EventListener);

    eventSource.onerror = (err) => {
      console.warn("[SSE] Connection error, reconnecting in 10s", err);
      stopSSE();
      reconnectTimer = setTimeout(() => {
        if (authStore.isLoggedIn) startSSE();
      }, 10_000);
    };
  };

  const stopSSE = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (eventSource) {
      eventSource.close();
      eventSource = null;
      console.log("[SSE] Disconnected");
    }
  };

  // ── Init ──────────────────────────────────────────────────────────────────
  const startRealtime = async () => {
    await fetchNotifications(); // โหลดครั้งแรกด้วย REST
    startSSE(); // แล้วเปิด SSE รับ real-time
  };

  const stopRealtime = () => {
    stopSSE();
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
    startSSE,
    stopSSE,
  };
};
