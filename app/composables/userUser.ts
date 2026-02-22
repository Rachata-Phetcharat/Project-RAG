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
    file_size: number;
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

  const fetchRole = async () => {
    loading.value = true;
    try {
      return await $fetch(`${apiBase}/role/list`, {
        method: "GET",
        headers: getHeaders(),
      });
    } finally {
      loading.value = false;
    }
  };

  const changeRole = async (user_id: number, new_role: string) => {
    loading.value = true;
    try {
      return await $fetch(`${apiBase}/role/update/${user_id}/${new_role}`, {
        method: "PUT",
        headers: getHeaders(),
      });
    } finally {
      loading.value = false;
    }
  };

  const changeFileSize = async (payload: {
    users_id: number;
    file_size: number;
  }) => {
    loading.value = true;
    try {
      return await $fetch(`${apiBase}/users/file-size/`, {
        method: "POST",
        headers: getHeaders(),
        body: {
          users_id: payload.users_id,
          file_size: payload.file_size,
        },
      });
    } finally {
      loading.value = false;
    }
  };

  return {
    fetchUser,
    fetchRole,
    changeRole,
    changeFileSize,
    loading,
  };
};
