export const useCreateApi = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  const authStore = useAuthStore();
  const loading = ref(false);
  const apiKeys = ref(); // เก็บรายการ key ที่สร้างแล้ว

  const getHeaders = () => ({
    Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
  });

  // ดึงรายการ API Keys ทั้งหมด (GET /auth/api-keys/list)
  const fetchApiKeys = async () => {
    loading.value = true;
    try {
      const data = await $fetch(`${apiBase}/auth/api-keys/list`, {
        headers: getHeaders(),
      });
      apiKeys.value = data;
    } catch (e) {
      console.error("Fetch API Keys error", e);
    } finally {
      loading.value = false;
    }
  };

  // สร้าง Key ใหม่
  const createApiKey = async (payload: {
    name: string;
    channel_id: string;
  }) => {
    loading.value = true;
    try {
      const res = await $fetch(`${apiBase}/auth/api-keys`, {
        method: "POST",
        headers: getHeaders(),
        body: payload,
      });
      await fetchApiKeys(); // อัปเดต list ทันที
      return res;
    } finally {
      loading.value = false;
    }
  };

  // ลบ Key (POST /auth/api-keys/revoke)
  const revokeApiKey = async (key_id: number) => {
    try {
      await $fetch(`${apiBase}/auth/api-keys/revoke`, {
        method: "POST",
        headers: getHeaders(),
        body: { key_id },
      });
      await fetchApiKeys();
    } catch (e) {
      console.error("Revoke error", e);
    }
  };

  return {
    apiKeys,
    createApiKey,
    fetchApiKeys,
    revokeApiKey,
    loading,
  };
};
