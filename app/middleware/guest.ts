import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware((to, from) => {
  const auth = useAuthStore();

  // ถ้ามี Token แล้ว (ล็อกอินอยู่แล้ว)
  if (auth.token) {
    // ให้ดีดไปหน้าแรก (หรือหน้า Dashboard)
    return navigateTo("/");
  }
});
