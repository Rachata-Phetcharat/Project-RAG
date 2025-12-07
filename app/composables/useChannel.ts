export const useChannel = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  const loading = ref(false);

  const authStore = useAuthStore();
  const token = authStore.token;

  const fetchChannels = async () => {
    loading.value = true;
    try {
      return await $fetch(`${apiBase}/channels/list/`);
    } finally {
      loading.value = false;
    }
  };

  const createChannel = async (payload: {
    title: string;
    description: string | (string | null);
  }) => {
    loading.value = true;
    try {
      const formData = new FormData();

      formData.append("title", payload.title);
      formData.append("description", payload.description ?? "");

      return await $fetch(`${apiBase}/channels`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
    } finally {
      loading.value = false;
    }
  };

  const updateChannel = async (id: number, payload: any) => {
    return await $fetch(`${apiBase}/channels/${id}`, {
      method: "PUT",
      body: payload,
    });
  };

  const deleteChannel = async (id: number) => {
    return await $fetch(`${apiBase}/channels/${id}`, {
      method: "DELETE",
    });
  };

  return {
    fetchChannels,
    createChannel,
    updateChannel,
    deleteChannel,
    loading,
  };
};
