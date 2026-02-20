export const useUser = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  const authStore = useAuthStore();
  const loading = ref(false);

  // ฟังก์ชันสำหรับดึง Header (เพื่อลดความซ้ำซ้อนในการเขียน Authorization)
  const getHeaders = () => ({
    Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
  });

  // --- CRUD Operations ---

  /**
   * ดึงข้อมูลผู้ใช้ปัจจุบัน (Current User)
   * GET /users/me/
   */
  const fetchCurrentUser = async () => {
    loading.value = true;
    try {
      return await $fetch(`${apiBase}/users/me/`, {
        method: "GET",
        headers: getHeaders(),
      });
    } finally {
      loading.value = false;
    }
  };

  return {
    fetchCurrentUser,
    loading,
  };
};
