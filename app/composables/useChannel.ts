export const useChannel = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  const authStore = useAuthStore();
  const loading = ref(false);

  // --- Helper Function สำหรับยิง API กลาง ---
  // ช่วยลด code ซ้ำเรื่อง loading, headers และ baseURL
  const request = async <T = any>(endpoint: string, options: any = {}) => {
    loading.value = true;
    try {
      return await $fetch<T>(endpoint, {
        baseURL: apiBase,
        ...options,
        headers: {
          Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
          ...options.headers,
        },
        // ถ้าจำเป็นต้องส่ง cookie ให้ uncomment บรรทัดล่าง
        // credentials: "include",
      });
    } finally {
      loading.value = false;
    }
  };

  // --- CRUD Operations ---

  const fetchChannels = () => {
    return request("/channels/list/", { method: "GET" });
  };

  const createChannel = async (payload: {
    title: string;
    description: string | null;
  }) => {
    const res = await request("/channels", {
      method: "POST",
      body: {
        title: payload.title,
        description: payload.description ?? "",
      },
    });
    return res.channels_id;
  };

  const updateChannel = (
    id: number,
    payload: { title: string; description?: string | null }
  ) => {
    return request(`/channels/${id}`, {
      method: "PUT",
      body: {
        title: payload.title,
        description: payload.description ?? "",
      },
    });
  };

  const deleteChannel = (id: number) => {
    return request(`/channels/${id}`, { method: "DELETE" });
  };

  // --- Status & Moderation Operations ---

  const statusChannel = (id: number, approve: boolean, reason: string = "") => {
    return request(`/channels/${id}/moderate-public`, {
      method: "POST",
      body: { approve, reason },
    });
  };

  const fetchPendingChannels = (
    params: { search?: string; skip?: number; limit?: number } = {}
  ) => {
    return request("/channels/pending/list/", {
      method: "GET",
      query: {
        search_by_name: params.search || undefined,
        skip: params.skip ?? 0,
        limit: params.limit ?? 20,
      },
    });
  };

  const requestPublicChannel = (id: number) => {
    return request(`/channels/${id}/request-public`, { method: "POST" });
  };

  const cancelRequestPublicChannel = (id: number) => {
    return request(`/channels/${id}/cancel-request`, { method: "POST" });
  };

  const ownerSetPrivateChannel = (id: number) => {
    return request(`/channels/${id}/owner-set-private`, { method: "POST" });
  };

  return {
    loading,
    fetchChannels,
    createChannel,
    updateChannel,
    deleteChannel,
    statusChannel,
    fetchPendingChannels,
    requestPublicChannel,
    cancelRequestPublicChannel,
    ownerSetPrivateChannel,
  };
};
