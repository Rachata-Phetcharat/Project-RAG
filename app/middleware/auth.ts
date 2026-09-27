// middleware/auth.ts
import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (import.meta.server) return;

  const auth = useAuthStore();

  if (!auth.user && auth.token) {
    await auth.fetchUser();
  }

  if (!auth.token) {
    return navigateTo("/");
  }
});
