// middleware/admin.ts
import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware((to, from) => {
  const auth = useAuthStore();

  // 1. เช็คว่าล็อกอินรึยัง
  if (!auth.token) {
    return navigateTo("/login");
  }

  // 2. เช็คว่าเป็น Admin หรือไม่ (สมมติว่าใน store มีเก็บ role ไว้)
  if (auth.user?.role !== "admin") {
    // ถ้าไม่ใช่ admin ให้ดีดกลับไปหน้าแรก หรือหน้า 403
    return navigateTo("/");
  }
});
