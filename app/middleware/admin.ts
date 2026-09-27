// middleware/admin.ts
import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware(async (to, from) => {
  // รันเฉพาะฝั่ง client เท่านั้น
  if (import.meta.server) return;

  const auth = useAuthStore();

  // รอ fetchUser ให้เสร็จก่อนเช็ค role
  if (!auth.user && auth.token) {
    await auth.fetchUser();
  }

  if (!auth.token) {
    return navigateTo("/");
  }

  if (auth.user?.role !== "admin") {
    return navigateTo("/");
  }
});
