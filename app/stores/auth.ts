import { defineStore } from "pinia";

/* ===============================
   Interface: User Profile
================================ */
export interface UserProfile {
  users_id: number;
  username: string;
  name: string;
  role: string;
  account_type: string;
  file_size: number;
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

  const role = computed(() => user.value?.role ?? "guest");

  const accountType = computed(() => user.value?.account_type ?? "guest");

  const displayName = computed(() => user.value?.name || "ผู้ใช้งานทั่วไป");

  /* ===============================
     Actions
  ================================ */

  /**
   * loginWithSSO:
   * แลก Authorization Code เป็น Access Token
   */
  const loginWithSSO = async (code: string, type: string) => {
    isLoading.value = true;
    try {
      const response: any = await $fetch(`${apiBase}/auth/kmutnb-sso/login`, {
        method: "POST",
        body: { code, type },
      });

      const accessToken =
        typeof response === "string" ? response : response?.local_access_token;

      if (!accessToken) throw new Error("ไม่ได้รับ Access Token");

      token.value = accessToken;
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
   * loginWithMock:
   * ใช้สำหรับ Development เท่านั้น — เรียก POST /auth/mock-login
   * Backend คืน access token (string) กลับมาโดยตรง
   */
  const loginWithMock = async () => {
    isLoading.value = true;
    try {
      // ดึงเป็น raw text ก่อน เพื่อหลีกเลี่ยงปัญหา $fetch parse JSON string แล้วได้ค่าไม่ตรง
      const raw = await $fetch<string>(`${apiBase}/auth/mock-login`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });

      // Backend ส่ง JSON string เช่น "eyJhbGci..." (มี quotes ครอบ) หรือ plain string
      let accessToken: string | undefined;
      if (typeof raw === "string") {
        // กรณี $fetch strip quotes ให้แล้ว → ได้ string ตรง ๆ
        accessToken = raw.trim().replace(/^"|"$/g, ""); // ลบ quotes เผื่อไว้
      } else if (typeof raw === "object" && raw !== null) {
        // กรณี backend เปลี่ยนเป็น object ภายหลัง
        accessToken =
          (raw as any)?.access_token ||
          (raw as any)?.local_access_token ||
          (raw as any)?.token;
      }

      if (!accessToken) throw new Error("ไม่ได้รับ Mock Access Token");

      token.value = accessToken;
      await fetchUser();

      return { success: true };
    } catch (error: any) {
      console.error("Mock Login Error:", error);
      // log raw response เพื่อ debug ได้ง่าย
      console.debug(
        "Mock Login raw response type issue — check /auth/mock-login response body",
      );
      return {
        success: false,
        error: error?.data?.detail || error?.message || "Mock Login ล้มเหลว",
      };
    } finally {
      isLoading.value = false;
    }
  };
  // *********

  /**
   * fetchUser:
   * ดึงข้อมูลผู้ใช้จาก Token
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
    loginWithMock,
    fetchUser,
    checkSession,
    logout,
  };
});
