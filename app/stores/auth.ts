import { defineStore } from "pinia";

// Interface ข้อมูล User
export interface UserProfile {
  users_id?: number;
  id?: number;
  username: string;
  name: string;
  email: string;
  role: string;
  theme?: string;
}

export const useAuthStore = defineStore("auth", () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  const toast = useToast();

  // === State ===
  // watch: true สำคัญมาก เพื่อให้ State อัปเดตตาม Cookie อัตโนมัติ
  const token = useCookie<string | null>("access_token", {
    maxAge: 60 * 60 * 24, // 1 วัน
    path: "/",
    sameSite: "lax",
    watch: true,
  });

  const user = useState<UserProfile | null>("user", () => null);
  const isLoading = useState<boolean>("authLoading", () => false);

  // === Getters ===
  const isLoggedIn = computed(() => !!token.value && !!user.value);
  const role = computed(() => user.value?.role || "guest");

  const displayName = computed(() => {
    if (!user.value) return "ผู้ใช้งานทั่วไป";
    return user.value.name || user.value.username || "Unknown User";
  });

  // === Actions ===

  // 1. Login
  const login = async (account: string, pass: string) => {
    isLoading.value = true;
    try {
      const params = new URLSearchParams();
      params.append("username", account);
      params.append("password", pass);
      params.append("grant_type", "password");

      const res: any = await $fetch(`${apiBase}/auth/token`, {
        method: "POST",
        body: params,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const accessToken = res?.access_token || res?.token;
      if (!accessToken) throw new Error("ไม่ได้รับ Token");

      token.value = accessToken;
      await fetchUser();

      return { success: true };
    } catch (e: any) {
      logout(false);
      return {
        success: false,
        error: e?.data?.detail || "เข้าสู่ระบบไม่สำเร็จ",
      };
    } finally {
      isLoading.value = false;
    }
  };

  // 2. Fetch User (แก้ไขจุดบั๊ก รีเฟรชแล้วหลุด)
  const fetchUser = async () => {
    if (!token.value) return;
    try {
      const res: any = await $fetch(`${apiBase}/get/userinfo/bytoken`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token.value}` },
      });
      user.value = res;
    } catch (error: any) {
      console.error("Fetch User Error:", error);

      // ** แก้ไข: ดีดออกเฉพาะเมื่อ Token หมดอายุ (401) จริงๆ เท่านั้น **
      if (error.statusCode === 401 || error.response?.status === 401) {
        logout();
      }
    }
  };

  // 3. Check Session
  const checkSession = async () => {
    if (user.value) return true;
    if (token.value) await fetchUser();
    return isLoggedIn.value;
  };

  // 4. Logout (แก้ไขให้ชัวร์ขึ้น)
  const logout = async (redirect = true) => {
    token.value = null;
    user.value = null;

    if (redirect) {
      toast.add({
        title: "ออกจากระบบสำเร็จ",
        color: "success",
        icon: "i-lucide-log-out",
        duration: 3000,
      });
      await navigateTo("/", { replace: true });
    }
  };

  return {
    token,
    user,
    isLoading,
    isLoggedIn,
    displayName,
    role,
    login,
    fetchUser,
    checkSession,
    logout,
  };
});
