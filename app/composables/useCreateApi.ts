export const useCreateApi = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  const authStore = useAuthStore();
  const loading = ref(false);

  // ฟังก์ชันสำหรับดึง Header (เพื่อลดความซ้ำซ้อนในการเขียน Authorization)
  const getHeaders = () => ({
    Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
  });

  /**
   * สร้างแชนแนลใหม่
   * POST /channels/create/
   */
  const createApi = async (payload: { name: string; channel_id: string }) => {
    loading.value = true;
    try {
      return await $fetch(`${apiBase}/auth/api-keys`, {
        method: "POST",
        headers: getHeaders(),
        body: payload,
      });
    } finally {
      loading.value = false;
    }
  };

  return {
    createApi,
    loading,
  };
};
