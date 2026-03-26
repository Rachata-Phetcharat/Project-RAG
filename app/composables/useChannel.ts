export const useChannel = () => {
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
   * ดึงแชนแนลของตัวเอง (My Channels)
   * GET /channels/list/
   */
  const fetchMyChannels = async (
    params: { search?: string; skip?: number; limit?: number } = {},
  ) => {
    loading.value = true;
    try {
      return await $fetch(`${apiBase}/channels/list/`, {
        method: "GET",
        headers: getHeaders(),
        query: {
          search_by_name: params.search || undefined,
          skip: params.skip ?? 0,
          limit: params.limit ?? 100,
        },
      });
    } finally {
      loading.value = false;
    }
  };

  /**
   * ดึงแชนแนลสาธารณะ (Public Channels)
   * GET /channels/public/list/
   */
  const fetchPublicChannels = async (
    params: { search?: string; skip?: number; limit?: number } = {},
  ) => {
    loading.value = true;
    try {
      return await $fetch(`${apiBase}/channels/public/list/`, {
        method: "GET",
        headers: getHeaders(),
        query: {
          search_by_name: params.search || undefined,
          skip: params.skip ?? 0,
          limit: params.limit ?? 100,
        },
      });
    } finally {
      loading.value = false;
    }
  };

  /**
   * ดึงแชนแนลทั้งหมด (All Channels - Admin Only)
   * GET /channels/list/all/
   */
  const fetchAllChannels = async (
    params: { search?: string; skip?: number; limit?: number } = {},
  ) => {
    loading.value = true;
    try {
      return await $fetch(`${apiBase}/channels/list/all/`, {
        method: "GET",
        headers: getHeaders(),
        query: {
          search_by_name: params.search || undefined,
          skip: params.skip ?? 0,
          limit: params.limit ?? 100,
        },
      });
    } finally {
      loading.value = false;
    }
  };

  const createChannel = async (payload: {
    title: string;
    description: string | null;
  }) => {
    loading.value = true;
    try {
      const res: any = await $fetch(`${apiBase}/channels`, {
        method: "POST",
        headers: getHeaders(),
        body: {
          title: payload.title,
          description: payload.description ?? "",
        },
      });
      return res.channels_id;
    } catch (e) {
      console.error("Create error:", e);
    } finally {
      loading.value = false;
    }
  };

  const updateChannel = async (
    id: number,
    payload: { title: string; description?: string | null },
  ) => {
    loading.value = true;
    try {
      return await $fetch(`${apiBase}/channels/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: {
          title: payload.title,
          description: payload.description ?? "",
        },
      });
    } finally {
      loading.value = false;
    }
  };

  const deleteChannel = async (id: number) => {
    loading.value = true;
    try {
      await $fetch(`${apiBase}/channels/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
    } finally {
      loading.value = false;
    }
  };

  // --- Status & Moderation Operations ---

  const statusChannel = async (
    id: number,
    approve: boolean,
    reason: string = "",
  ) => {
    loading.value = true;
    try {
      return await $fetch(`${apiBase}/channels/${id}/moderate-public`, {
        method: "POST",
        headers: getHeaders(),
        body: { approve, reason },
      });
    } finally {
      loading.value = false;
    }
  };

  const fetchPendingChannels = async (
    params: { search?: string; skip?: number; limit?: number } = {},
  ) => {
    loading.value = true;
    try {
      return await $fetch(`${apiBase}/channels/pending/list/`, {
        method: "GET",
        headers: getHeaders(),
        query: {
          search_by_name: params.search || undefined,
          skip: params.skip ?? 0,
          limit: params.limit ?? 100,
        },
      });
    } finally {
      loading.value = false;
    }
  };

  const requestPublicChannel = async (id: number) => {
    loading.value = true;
    try {
      return await $fetch(`${apiBase}/channels/${id}/request-public`, {
        method: "POST",
        headers: getHeaders(),
      });
    } finally {
      loading.value = false;
    }
  };

  const cancelRequestPublicChannel = async (id: number) => {
    loading.value = true;
    try {
      return await $fetch(`${apiBase}/channels/${id}/cancel-request`, {
        method: "POST",
        headers: getHeaders(),
      });
    } finally {
      loading.value = false;
    }
  };

  const ownerSetPrivateChannel = async (id: number) => {
    loading.value = true;
    try {
      return await $fetch(`${apiBase}/channels/${id}/owner-set-private`, {
        method: "POST",
        headers: getHeaders(),
      });
    } finally {
      loading.value = false;
    }
  };

  const adminforceSetPublicChannel = async (id: number) => {
    loading.value = true;
    try {
      return await $fetch(`${apiBase}/channels/${id}/admin-forced-public`, {
        method: "POST",
        headers: getHeaders(),
        body: { approve: true },
      });
    } finally {
      loading.value = false;
    }
  };

  const adminforceSetPrivateChannel = async (id: number) => {
    loading.value = true;
    try {
      return await $fetch(`${apiBase}/channels/${id}/admin-forced-private`, {
        method: "POST",
        headers: getHeaders(),
        body: { approve: true },
      });
    } finally {
      loading.value = false;
    }
  };

  interface StorageUsage {
    channel_id: string;
    remaining_storage_bytes: number;
    used_storage_bytes: number;
    storage_limit_bytes: number;
  }

  const storage_user = async (id: number) => {
    loading.value = true;
    try {
      const res = await $fetch<StorageUsage>(
        `${apiBase}/channels/${id}/storage-usage`,
        {
          method: "GET",
          headers: getHeaders(),
        },
      );

      return {
        ...res,
        used_mb: (res.used_storage_bytes / (1024 * 1024)).toFixed(2),
        limit_mb: (res.storage_limit_bytes / (1024 * 1024)).toFixed(2),
        remaining_mb: (res.remaining_storage_bytes / (1024 * 1024)).toFixed(2),
        used_percent:
          res.storage_limit_bytes > 0
            ? Math.round(
                (res.used_storage_bytes / res.storage_limit_bytes) * 100,
              )
            : 0,
      };
    } catch (e) {
      return null;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    fetchMyChannels,
    fetchPublicChannels,
    fetchAllChannels,
    createChannel,
    updateChannel,
    deleteChannel,
    statusChannel,
    fetchPendingChannels,
    requestPublicChannel,
    cancelRequestPublicChannel,
    ownerSetPrivateChannel,
    adminforceSetPublicChannel,
    adminforceSetPrivateChannel,
    storage_user,
  };
};
