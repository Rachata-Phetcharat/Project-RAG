export const useUser = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  const authStore = useAuthStore();
  const loading = ref(false);

  const getHeaders = () => ({
    Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
  });

  interface User {
    users_id: number;
    username: string;
    name: string;
    role: string;
    account_type: string;
  }

  const fetchUser = async (params: { skip?: number; limit?: number }) => {
    loading.value = true;
    try {
      return await $fetch<User[]>(`${apiBase}/users/list/`, {
        method: "GET",
        headers: getHeaders(),
        query: {
          skip: params.skip ?? 0,
          limit: params.limit ?? 100,
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
