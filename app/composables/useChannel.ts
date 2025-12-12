export const useChannel = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  const loading = ref(false);

  const authStore = useAuthStore();
  const token = authStore.token;

  // const useHeaders = () => {};

  const fetchChannels = async () => {
    loading.value = true;
    try {
      return await $fetch(`${apiBase}/channels/list/`, {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
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
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: {
          title: payload.title,
          description: payload.description ?? "",
        },
      });

      // ดึง id ที่ backend ส่งมา
      return res.channels_id;
    } finally {
      loading.value = false;
    }
  };

  const updateChannel = async (
    id: number,
    payload: { title: string; description?: string | null }
  ) => {
    loading.value = true;
    try {
      // const token = useCookie<string | null>("access_token").value;

      return await $fetch(`${apiBase}/channels/${id}`, {
        method: "PUT",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: {
          title: payload.title,
          description: payload.description ?? "",
        },
        credentials: "include",
      });
    } finally {
      loading.value = false;
    }
  };

  const deleteChannel = async (id: number) => {
    loading.value = true;
    try {
      return await $fetch(`${apiBase}/channels/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
          credentials: "include",
        },
      });
    } finally {
      loading.value = false;
    }
  };

  const statusChannel = async (
    id: number,
    payload: {
      approve: boolean;
      reason: string | null;
    }
  ) => {
    // 1. เลือก Action ตามสถานะ: ถ้า approve=true ไป public, ถ้า false ไป private
    const action = payload.approve
      ? "admin-forced-public"
      : "admin-forced-private";

    return await $fetch(`${apiBase}/channels/${id}/${action}`, {
      // 2. ใส่ตัวแปร action ลงใน URL
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
      body: {
        approve: payload.approve,
        reason: payload.reason ?? "",
      },
    });
  };

  const fetchPendingChannels = async (
    params: { search?: string; skip?: number; limit?: number } = {}
  ) => {
    loading.value = true;
    try {
      // อ้างอิงจากรูป API: GET /channels/pending/list/
      return await $fetch(`${apiBase}/channels/pending/list/`, {
        method: "GET",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        query: {
          search_by_name: params.search || undefined, //
          skip: params.skip ?? 0,
          limit: params.limit ?? 20,
        },
      });
    } finally {
      loading.value = false;
    }
  };

  const channelRejected = async (
    id: number,
    approve: boolean,
    reason: string = ""
  ) => {
    loading.value = true;
    try {
      return await $fetch(`${apiBase}/channels/${id}/moderate-public`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: {
          approve: approve,
          reason: reason,
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
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
    } finally {
      loading.value = false;
    }
  };

  const cancelRequestPublicChannel = async (id: number) => {
    loading.value = true;
    try {
      // ใช้ endpoint: cancel-request
      return await $fetch(`${apiBase}/channels/${id}/cancel-request`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
    } finally {
      loading.value = false;
    }
  };

  const ownerSetPrivateChannel = async (id: number) => {
    loading.value = true;
    try {
      // ใช้ endpoint: owner-set-private
      return await $fetch(`${apiBase}/channels/${id}/owner-set-private`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
    } finally {
      loading.value = false;
    }
  };

  return {
    fetchChannels,
    createChannel,
    updateChannel,
    deleteChannel,
    statusChannel,
    channelRejected,
    fetchPendingChannels,
    requestPublicChannel,
    cancelRequestPublicChannel,
    ownerSetPrivateChannel,
    loading,
  };
};
