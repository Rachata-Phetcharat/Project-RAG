import { defineStore } from "pinia";

/* ===============================
   Interface: User Profile
================================ */
export interface UserProfile {
  users_id?: number;
  username: string;
  name: string;
  email: string;
  role: string;
}

/* ===============================
   Auth Store
================================ */
export const useAuthStore = defineStore("auth", () => {
  /* ---------- Runtime ---------- */
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  const toast = useToast();

  /* ===============================
     State
  ================================ */

  // Token (Sync กับ Cookie)
  const token = useCookie<string | null>("access_token", {
    maxAge: 60 * 60 * 24, // 1 day
    path: "/",
    sameSite: "lax",
    watch: true,
  });

  // User Profile
  const user = useState<UserProfile | null>("user", () => null);

  // Loading state
  const isLoading = useState<boolean>("authLoading", () => false);

  /* ===============================
     Getters
  ================================ */

  // Login status
  const isLoggedIn = computed(() => Boolean(token.value && user.value));

  // User role
  const role = computed(() => user.value?.role ?? "guest");

  // Display name
  const displayName = computed(() => {
    if (!user.value) return "ผู้ใช้งานทั่วไป";
    return user.value.name || user.value.username || "Unknown User";
  });

  /* ===============================
     Actions
  ================================ */

  /* ---------- Login ---------- */
  const login = async (username: string, password: string) => {
    isLoading.value = true;

    try {
      const body = new URLSearchParams({
        username,
        password,
        grant_type: "password",
      });

      const response: any = await $fetch(`${apiBase}/auth/token`, {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const accessToken = response?.access_token || response?.token;
      if (!accessToken) throw new Error("Token not found");

      token.value = accessToken;
      await fetchUser();

      return { success: true };
    } catch (error: any) {
      await logout(false);

      return {
        success: false,
        error: error?.data?.detail || "เข้าสู่ระบบไม่สำเร็จ",
      };
    } finally {
      isLoading.value = false;
    }
  };

  /* ---------- Fetch User ---------- */
  const fetchUser = async () => {
    if (!token.value) return;

    try {
      const response: any = await $fetch(`${apiBase}/get/userinfo/bytoken`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      });

      user.value = response;
    } catch (error: any) {
      console.error("Fetch user failed:", error);

      // Logout เฉพาะ token หมดอายุ
      const isUnauthorized =
        error?.statusCode === 401 || error?.response?.status === 401;

      if (isUnauthorized) {
        await logout();
      }
    }
  };

  /* ---------- Check Session ---------- */
  const checkSession = async () => {
    if (user.value) return true;

    if (token.value) {
      await fetchUser();
    }

    return isLoggedIn.value;
  };

  /* ---------- Logout ---------- */
  const logout = async (redirect = true) => {
    token.value = null;
    user.value = null;

    if (!redirect) return;

    toast.add({
      title: "ออกจากระบบสำเร็จ",
      color: "success",
      icon: "i-lucide-log-out",
      duration: 3000,
    });

    await navigateTo("/", { replace: true });
  };

  /* ===============================
     Exports
  ================================ */
  return {
    // State
    token,
    user,
    isLoading,

    // Getters
    isLoggedIn,
    role,
    displayName,

    // Actions
    login,
    fetchUser,
    checkSession,
    logout,
  };
});
