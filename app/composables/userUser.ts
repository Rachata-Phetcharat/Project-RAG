export const useUser = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  const authStore = useAuthStore();
  const loading = ref(false);

  interface User {
    user_id: number;
    username: string;
    name: string;
    role: string;
  }

  // ฟังก์ชันสำหรับดึง Header (เพื่อลดความซ้ำซ้อนในการเขียน Authorization)
  const getHeaders = () => ({
    Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
  });

  const fetchUser = async (params: { skip?: number; limit?: number }) => {
    loading.value = true;
    try {
      return await $fetch<User[]>(`${apiBase}/users/list/`, {
        method: "GET",
        headers: getHeaders(),
        query: {
          skip: params.skip ?? 0,
          limit: params.limit ?? 10,
        },
      });
    } finally {
      loading.value = false;
    }
  };

  return {
    fetchUser,
    loading,
  };
};
