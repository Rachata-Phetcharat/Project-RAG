<script setup lang="ts">
import type { NotificationEvent } from "~/composables/useNotification";

const authStore = useAuthStore();
const {
    notifications,
    loading,
    unreadCount,
    hasUnread,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    startRealtime,
    stopRealtime,
    formatTime,
    resolveNotifType,
    isReadByRole,
    isAdmin,
    NOTIF_CONFIG,
} = useNotification();

const { fetchUser } = useUser();

interface User {
    users_id: number;
    username: string;
    name: string;
    role: string;
    account_type: string;
    file_size_byte: number;
}

const isOpen = ref(false);
const currentSkip = ref(0);
const PAGE_LIMIT = 10;
const hasMore = ref(true);
const users = ref<User[]>([]);

const loadUser = async () => {
    users.value = (await fetchUser({ skip: 0, limit: 100000 })) ?? [];
};

const getUserName = (userId: number | null | undefined): string => {
    if (!userId) return "ไม่ระบุ";
    const user = users.value.find((u) => u.users_id === userId);
    return user?.name ?? `#${userId}`;
};

onMounted(async () => {
    await loadUser();
});

// ── Start SSE เมื่อ login ─────────────────────────────────────────────────
watch(
    () => authStore.isLoggedIn,
    async (loggedIn) => {
        if (loggedIn) {
            await startRealtime();
        } else {
            stopRealtime();
        }
    },
    { immediate: true },
);

// เมื่อเปิด popover → refresh + reset pagination
const onOpen = async (val: boolean) => {
    isOpen.value = val;
    if (val) {
        currentSkip.value = 0;
        hasMore.value = true;
        await fetchNotifications(0, PAGE_LIMIT);
        hasMore.value = notifications.value.length >= PAGE_LIMIT;
    }
};

const handleMarkAsRead = async (eventId: number) => {
    await markAsRead(eventId);
};

const handleMarkAllAsRead = async () => {
    await markAllAsRead();
};

const loadMore = async () => {
    if (loading.value || !hasMore.value) return;
    currentSkip.value += PAGE_LIMIT;
    const prevCount = notifications.value.length;
    await fetchNotifications(currentSkip.value, PAGE_LIMIT, true);
    hasMore.value = notifications.value.length > prevCount;
};

// ─────────────────────────────────────────────────────────────────────────────
// resolveScenario: แปลง fields จาก backend → scenario ที่แน่นอน
// อ้างอิง backend logic จาก channel.py ทุก endpoint
// ─────────────────────────────────────────────────────────────────────────────
type Scenario =
    | "user_requested"          // user กด request-public → pending รอ admin
    | "user_cancelled"          // user กด cancel-request → กลับเป็น private
    | "admin_approved"          // admin moderate-public → approve
    | "admin_rejected"          // admin moderate-public → reject
    | "admin_forced_public"     // admin force-public (ไม่ผ่าน request flow)
    | "admin_forced_private"    // admin force-private (จาก public/pending)
    | "owner_set_private"       // owner กด owner-set-private
    | "unknown";

const resolveScenario = (n: NotificationEvent): Scenario => {
    const { old_status, new_status, decision, requested_by, decided_by } = n;

    // 1. user กด request-public: pending → (new_status=public, decision=null)
    if (new_status === "public" && !decision) return "user_requested";

    // 2. user กด cancel-request: pending → private, decision=rejected, decided_by = requested_by (ตัวเอง)
    if (
        old_status === "pending" &&
        new_status === "private" &&
        decision === "rejected" &&
        decided_by === requested_by
    )
        return "user_cancelled";

    // 3. admin moderate approve: pending → public, decision=approved
    if (old_status === "pending" && new_status === "public" && decision === "approved")
        return "admin_approved";

    // 4. admin moderate reject: pending → private, decision=rejected, decided_by ≠ requested_by
    if (
        old_status === "pending" &&
        new_status === "private" &&
        decision === "rejected" &&
        decided_by !== requested_by
    )
        return "admin_rejected";

    // 5. admin force-public: private → public, decision=approved (ไม่ผ่าน request flow)
    if (old_status === "private" && new_status === "public" && decision === "approved")
        return "admin_forced_public";

    // 6. admin force-private: public/pending → private, decision=approved, decided_by ≠ requested_by
    if (
        (old_status === "public" || old_status === "pending") &&
        new_status === "private" &&
        decision === "approved" &&
        decided_by !== requested_by
    )
        return "admin_forced_private";

    // 7. owner set-private: public → private, decision=approved, decided_by = requested_by
    if (
        old_status === "public" &&
        new_status === "private" &&
        decision === "approved" &&
        decided_by === requested_by
    )
        return "owner_set_private";

    return "unknown";
};

// ─────────────────────────────────────────────────────────────────────────────
// getItemDescription: ข้อความแสดงตาม scenario + role
// ─────────────────────────────────────────────────────────────────────────────
const getItemDescription = (n: NotificationEvent): string => {
    const scenario = resolveScenario(n);
    const reason = n.decision_reason ? ` — "${n.decision_reason}"` : "";
    const requester = getUserName(n.requested_by);
    const decider = getUserName(n.decided_by);

    if (isAdmin.value) {
        // ── Admin view ──────────────────────────────────────────────────────
        switch (scenario) {
            case "user_requested":
                return `${requester} ส่งคำขอเปลี่ยนเป็นสาธารณะ`;
            case "user_cancelled":
                return `${requester} ยกเลิกคำขอแล้ว`;
            case "admin_approved":
                return `${decider} อนุมัติคำขอจาก ${requester} แล้ว`;
            case "admin_rejected":
                return `${decider} ปฏิเสธคำขอจาก ${requester}${reason}`;
            case "admin_forced_public":
                return `${decider} บังคับเปลี่ยนเป็นสาธารณะ`;
            case "admin_forced_private":
                return `${decider} บังคับเปลี่ยนกลับเป็น Private${reason}`;
            case "owner_set_private":
                return `${requester} เปลี่ยนแชนแนลกลับเป็น Private`;
            default:
                return `มีการเปลี่ยนแปลงสถานะ`;
        }
    }

    // ── User view ───────────────────────────────────────────────────────────
    switch (scenario) {
        case "user_requested":
            return `คุณส่งคำขอเปลี่ยนเป็นสาธารณะแล้ว กำลังรอ Admin พิจารณา`;
        case "user_cancelled":
            return `คุณยกเลิกคำขอแล้ว แชนแนลกลับเป็น Private`;
        case "admin_approved":
            return `${decider} อนุมัติแล้ว แชนแนลเป็นสาธารณะแล้ว`;
        case "admin_rejected":
            return `${decider} ปฏิเสธคำขอ${reason}`;
        case "admin_forced_public":
            return `${decider} เปลี่ยนแชนแนลของคุณเป็นสาธารณะ`;
        case "admin_forced_private":
            return `${decider} เปลี่ยนแชนแนลของคุณกลับเป็น Private${reason}`;
        case "owner_set_private":
            return `คุณเปลี่ยนแชนแนลกลับเป็น Private แล้ว`;
        default:
            return `มีการเปลี่ยนแปลงสถานะ`;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// getBadgeLabel + getBadgeColor: แสดง badge ตาม scenario จริง
// ─────────────────────────────────────────────────────────────────────────────
const getBadgeLabel = (n: NotificationEvent): string => {
    const scenario = resolveScenario(n);
    switch (scenario) {
        case "user_requested": return "รอพิจารณา";
        case "user_cancelled": return "ยกเลิกแล้ว";
        case "admin_approved": return "อนุมัติ";
        case "admin_rejected": return "ปฏิเสธ";
        case "admin_forced_public": return "บังคับ Public";
        case "admin_forced_private": return "บังคับ Private";
        case "owner_set_private": return "ตั้งเป็น Private";
        default: return "เปลี่ยนแปลง";
    }
};

const getBadgeColor = (
    n: NotificationEvent,
): "success" | "error" | "warning" | "info" | "neutral" => {
    const scenario = resolveScenario(n);
    switch (scenario) {
        case "user_requested": return "info";
        case "user_cancelled": return "neutral";
        case "admin_approved": return "success";
        case "admin_rejected": return "error";
        case "admin_forced_public": return "success";
        case "admin_forced_private": return "warning";
        case "owner_set_private": return "neutral";
        default: return "neutral";
    }
};

onUnmounted(() => stopRealtime());
</script>

<template>
    <UPopover v-model:open="isOpen" arrow :popper="{ placement: 'bottom-end' }" @update:open="onOpen">
        <!-- ── Bell Button ── -->
        <UButton color="neutral" variant="ghost" icon="i-lucide-bell" class="relative cursor-pointer"
            :aria-label="`Notifications${hasUnread ? ` (${unreadCount} unread)` : ''}`">
            <transition name="badge-pop">
                <span v-if="hasUnread" key="badge"
                    class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                    {{ unreadCount > 9 ? "9+" : unreadCount }}
                </span>
            </transition>
        </UButton>

        <!-- ── Popover Content ── -->
        <template #content>
            <div
                class="flex flex-col w-80 sm:w-96 bg-white dark:bg-gray-900 overflow-hidden rounded-xl shadow-2xl ring-1 ring-gray-200 dark:ring-gray-800">

                <!-- Header -->
                <div
                    class="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <div class="flex items-center gap-2">
                        <h3 class="font-semibold text-gray-900 dark:text-white text-sm">การแจ้งเตือน</h3>
                        <UBadge :label="isAdmin ? 'Admin' : 'ของฉัน'" :color="isAdmin ? 'warning' : 'info'"
                            variant="subtle" size="sm" />
                        <transition name="badge-pop">
                            <UBadge v-if="hasUnread" :label="String(unreadCount)" color="error" variant="solid"
                                size="sm" />
                        </transition>
                    </div>
                    <button v-if="hasUnread"
                        class="text-xs text-primary-500 cursor-pointer hover:text-primary-700 dark:hover:text-primary-300 transition-colors font-medium"
                        :disabled="loading" @click="handleMarkAllAsRead">
                        อ่านทั้งหมด
                    </button>
                </div>

                <!-- Loading -->
                <div v-if="loading && notifications.length === 0" class="flex items-center justify-center py-10">
                    <UIcon name="i-lucide-loader-circle" class="w-6 h-6 animate-spin text-primary-500" />
                </div>

                <!-- Empty -->
                <div v-else-if="notifications.length === 0">
                    <UEmpty icon="i-lucide-bell-off" title="ไม่มีการแจ้งเตือน" description="คุณอ่านทุกอย่างแล้ว!"
                        class="py-10" />
                </div>

                <!-- Notification List -->
                <TransitionGroup v-else name="notif-list" tag="div"
                    class="flex flex-col max-h-[420px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                    <div v-for="item in notifications" :key="item.event_id"
                        class="flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer"
                        :class="isReadByRole(item)
                            ? 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                            : 'bg-primary-50/40 dark:bg-primary-900/10 hover:bg-primary-50/70 dark:hover:bg-primary-900/20'" @click="!isReadByRole(item) && handleMarkAsRead(item.event_id)">

                        <!-- Icon -->
                        <div class="mt-0.5 shrink-0">
                            <UIcon :name="NOTIF_CONFIG[resolveNotifType(item)].icon" class="w-5 h-5" :class="{
                                'text-emerald-500': NOTIF_CONFIG[resolveNotifType(item)].color === 'success',
                                'text-red-500': NOTIF_CONFIG[resolveNotifType(item)].color === 'error',
                                'text-amber-500': NOTIF_CONFIG[resolveNotifType(item)].color === 'warning',
                                'text-blue-500': NOTIF_CONFIG[resolveNotifType(item)].color === 'info',
                            }" />
                        </div>

                        <!-- Content -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between gap-2">
                                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {{ item.channel_title }}
                                </p>
                                <!-- Badge แสดง scenario จริง ไม่ใช่แค่ decision -->
                                <UBadge :color="getBadgeColor(item)" variant="subtle" size="sm" class="shrink-0"
                                    :label="getBadgeLabel(item)" />
                            </div>

                            <!-- Description แยกตาม scenario + role -->
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                {{ getItemDescription(item) }}
                            </p>

                            <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                                {{ formatTime(item.created_at) }}
                            </p>
                        </div>

                        <!-- Unread dot -->
                        <div class="shrink-0 mt-1.5">
                            <span v-if="!isReadByRole(item)" class="block w-2 h-2 rounded-full bg-primary-500" />
                        </div>
                    </div>
                </TransitionGroup>

                <!-- Footer -->
                <div v-if="notifications.length > 0"
                    class="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                    <span class="text-xs text-gray-400 dark:text-gray-500">
                        {{ notifications.length }} รายการล่าสุด
                    </span>
                    <button v-if="hasMore"
                        class="text-xs text-primary-500 hover:text-primary-700 dark:hover:text-primary-300 transition-colors font-medium disabled:opacity-50"
                        :disabled="loading" @click="loadMore">
                        <span v-if="loading" class="flex items-center gap-1">
                            <UIcon name="i-lucide-loader-circle" class="w-3 h-3 animate-spin" />
                            กำลังโหลด...
                        </span>
                        <span v-else>โหลดเพิ่มเติม</span>
                    </button>
                </div>
            </div>
        </template>
    </UPopover>
</template>

<style scoped>
.badge-pop-enter-active {
    animation: badge-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.badge-pop-leave-active {
    animation: badge-pop 0.2s ease-in reverse;
}

@keyframes badge-pop {
    from {
        transform: scale(0);
        opacity: 0;
    }

    to {
        transform: scale(1);
        opacity: 1;
    }
}

.notif-list-enter-active {
    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.notif-list-enter-from {
    opacity: 0;
    transform: translateY(-8px) scale(0.97);
}

.notif-list-leave-active {
    transition: all 0.2s ease;
    position: absolute;
}

.notif-list-leave-to {
    opacity: 0;
    transform: translateX(10px);
}
</style>