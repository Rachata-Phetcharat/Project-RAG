import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware((to, from) => {
  const auth = useAuthStore();

  // ถ้าไม่มี Token (ยังไม่ล็อกอิน)
  if (!auth.token) {
    // ให้ดีดกลับไปหน้า Login
    return navigateTo("/login");
  }
});
