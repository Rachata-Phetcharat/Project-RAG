<script setup lang="ts">
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

const isOpen = ref(false);
const currentSkip = ref(0);
const PAGE_LIMIT = 10;
const hasMore = ref(true);

// ── Start long polling เมื่อ login ────────────────────────────────────────
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

// เมื่อเปิด popover → refresh ข้อมูล (reset pagination)
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

// ── Load more (pagination) ────────────────────────────────────────────────
const loadMore = async () => {
    if (loading.value || !hasMore.value) return;
    currentSkip.value += PAGE_LIMIT;
    const prevCount = notifications.value.length;
    await fetchNotifications(currentSkip.value, PAGE_LIMIT, true);
    hasMore.value = notifications.value.length > prevCount;
};

// ── Description ตาม role ──────────────────────────────────────────────────
const getItemDescription = (n: any) => {
    const type = resolveNotifType(n);

    // admin เห็น: ใครขอ + สถานะ
    if (isAdmin.value) {
        switch (type) {
            case "pending":
                return `มีคำขอเปลี่ยนเป็นสาธารณะ (requested_by: #${n.requested_by})`;
            case "approved_public":
                return `อนุมัติแล้ว → Public`;
            case "approved_private":
                return `เปลี่ยนกลับเป็น Private${n.decision_reason ? ": " + n.decision_reason : ""}`;
            case "rejected":
                return `ปฏิเสธ${n.decision_reason ? ": " + n.decision_reason : ""}`;
            default:
                return `มีการเปลี่ยนแปลง`;
        }
    }

    // user เห็น: สถานะของคำขอตัวเอง
    switch (type) {
        case "pending":
            return `คำขอของคุณกำลังรอการพิจารณา`;
        case "approved_public":
            return `คำขอของคุณได้รับการอนุมัติ → Public แล้ว`;
        case "approved_private":
            return `ถูก Admin เปลี่ยนกลับเป็น Private${n.decision_reason ? ": " + n.decision_reason : ""}`;
        case "rejected":
            return `คำขอของคุณถูกปฏิเสธ${n.decision_reason ? ": " + n.decision_reason : ""}`;
        default:
            return `มีการเปลี่ยนแปลง`;
    }
};

const getBadgeLabel = (type: string) => {
    switch (type) {
        case "approved_public": return "อนุมัติ";
        case "approved_private": return "Private";
        case "rejected": return "ปฏิเสธ";
        default: return "รอดำเนินการ";
    }
};

onUnmounted(() => stopRealtime());
</script>

<template>
    <UPopover v-model:open="isOpen" arrow :popper="{ placement: 'bottom-end' }" @update:open="onOpen">
        <!-- ── Bell Button ── -->
        <UButton color="neutral" variant="ghost" icon="i-lucide-bell" class="relative cursor-pointer"
            :aria-label="`Notifications${hasUnread ? ` (${unreadCount} unread)` : ''}`">
            <!-- Badge ตัวเลข: แสดงเฉพาะตอนมี unread -->
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
                        <h3 class="font-semibold text-gray-900 dark:text-white text-sm">
                            การแจ้งเตือน
                        </h3>
                        <!-- Role badge -->
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
                        class="flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer" :class="isReadByRole(item)
                            ? 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                            : 'bg-primary-50/40 dark:bg-primary-900/10 hover:bg-primary-50/70 dark:hover:bg-primary-900/20'
                            " @click="!isReadByRole(item) && handleMarkAsRead(item.event_id)">

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
                                <UBadge :color="NOTIF_CONFIG[resolveNotifType(item)].color" variant="subtle" size="sm"
                                    class="shrink-0" :label="getBadgeLabel(resolveNotifType(item))" />
                            </div>

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
/* Badge pop animation */
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

/* Notification list slide-in */
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