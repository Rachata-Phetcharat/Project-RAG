import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const auth = useAuthStore();
  await auth.checkSession();

  // ถ้าไม่มี Token (ยังไม่ล็อกอิน)
  if (!auth.token) {
    // ให้ดีดกลับไปหน้า Login
    return navigateTo("/");
  }
});
