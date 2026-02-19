import { defineStore } from "pinia";

/* ===============================
   Interface: User Profile
================================ */
export interface UserProfile {
  username: string;
  display_name: string;
  account_type:
    | "personnel"
    | "student"
    | "templecturer"
    | "retirement"
    | "exchange_student"
    | "alumni"
    | "guest";
  role: string; // นำกลับมาเพื่อใช้จัดการสิทธิ์ (Permissions) ในฐานข้อมูลของคุณเอง
}

export const useAuthStore = defineStore("auth", () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;

  /* ===============================
     State
  ================================ */
  const token = useCookie<string | null>("access_token", {
    maxAge: 60 * 60 * 24,
    path: "/",
    sameSite: "lax",
    watch: true,
  });

  const user = useState<UserProfile | null>("user", () => null);
  const isLoading = useState<boolean>("authLoading", () => false);

  /* ===============================
     Getters
  ================================ */
  const isLoggedIn = computed(() => Boolean(token.value && user.value));

  // Getter สำหรับ Role โดยตรง
  const role = computed(() => user.value?.role ?? "guest");

  const accountType = computed(() => user.value?.account_type ?? "guest");

  const displayName = computed(
    () => user.value?.display_name || "ผู้ใช้งานทั่วไป",
  );

  /* ===============================
     Actions
  ================================ */

  /**
   * loginWithSSO:
   * แลก Authorization Code เป็น Access Token
   */
  const loginWithSSO = async (code: string) => {
    isLoading.value = true;
    try {
      // ยิงไปที่ Endpoint ของคุณที่รองรับ SSO
      const response: any = await $fetch(`${apiBase}/auth/sso/kmutnb`, {
        method: "POST",
        body: { code }, // ส่ง JSON { "code": "..." } ตาม Swagger
      });

      const accessToken =
        typeof response === "string" ? response : response?.access_token;

      if (!accessToken) throw new Error("ไม่ได้รับ Access Token");

      token.value = accessToken;

      // หลังจากได้ Token ให้ดึง Profile (ซึ่งควรจะมีข้อมูล Role จาก DB ของคุณรวมอยู่ด้วย)
      await fetchUser();

      return { success: true };
    } catch (error: any) {
      console.error("SSO Login Error:", error);
      return {
        success: false,
        error: error?.data?.detail || "ยืนยันตัวตนล้มเหลว",
      };
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * fetchUser:
   * ดึงข้อมูลผู้ใช้จาก Token (Backend ควรจะ Return ทั้งข้อมูล SSO และ Role จาก DB มาให้)
   */
  const fetchUser = async () => {
    if (!token.value) return;

    try {
      const response: any = await $fetch(`${apiBase}/get/userinfo/bytoken`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      });

      // Mapping ข้อมูลที่ได้ลงใน State user
      user.value = response;
    } catch (error: any) {
      if (error?.statusCode === 401) {
        await logout(false);
      }
    }
  };

  const checkSession = async () => {
    if (user.value) return true;
    if (token.value) await fetchUser();
    return isLoggedIn.value;
  };

  const logout = async (redirect = true) => {
    token.value = null;
    user.value = null;
    if (redirect) {
      await navigateTo("/", { replace: true });
    }
  };

  return {
    token,
    user,
    isLoading,
    isLoggedIn,
    role,
    accountType,
    displayName,
    loginWithSSO,
    fetchUser,
    checkSession,
    logout,
  };
});
