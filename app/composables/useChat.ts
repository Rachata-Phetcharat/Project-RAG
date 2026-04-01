export const useChat = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  const authStore = useAuthStore();
  const error = ref<string | null>(null);
  const loading = ref(false);

  const chatBase = apiBase;

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (authStore.token) {
      headers.Authorization = `Bearer ${authStore.token}`;
    }
    return headers;
  };

  // 1. สร้าง Session ใหม่
  const createSession = async (channelId: string) => {
    loading.value = true;
    error.value = null;

    try {
      const data = await $fetch<any>(`${chatBase}/session`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: { channel_id: channelId },
        credentials: "include",
      });

      const sessionId =
        data?.session_id || data?.sessions_id || data?.id || data?.sessionId;

      if (!sessionId) {
        throw new Error("ไม่พบ session_id ใน response");
      }

      return {
        sessions_id: sessionId,
        session_id: sessionId,
        channel_id: channelId,
        ...data,
      };
    } catch (err: any) {
      const errorMsg =
        err?.data?.detail || err?.message || "ไม่สามารถสร้าง Session ได้";
      error.value = errorMsg;
      throw new Error(errorMsg);
    } finally {
      loading.value = false;
    }
  };

  // 2. ส่งข้อความแบบ SSE Streaming
  //    Backend ส่ง EventStream ทีละ token ในรูปแบบ: {"token": "xxx"}
  const sendOllamaReplyStream = async (
    sessionId: string,
    message: string,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal,
  ): Promise<string> => {
    error.value = null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      // บอก backend ว่าเราต้องการ event-stream
      Accept: "text/event-stream",
    };

    if (authStore.token) {
      headers.Authorization = `Bearer ${authStore.token}`;
    }

    try {
      const response = await fetch(`${chatBase}/sessions/ollama-reply`, {
        method: "POST",
        headers,
        // ส่งแค่ sessions_id กับ message ตาม API spec จริง
        body: JSON.stringify({
          sessions_id: sessionId,
          message: message,
        }),
        credentials: "include",
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";

      // ── กรณี Backend ตอบกลับเป็น SSE จริง ──────────────────────────────
      if (
        contentType.includes("text/event-stream") ||
        contentType.includes("application/x-ndjson")
      ) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            // SSE lines มาในรูป "data: {...}"
            const trimmed = line.trim();
            if (!trimmed || trimmed === "[DONE]") continue;

            const dataLine = trimmed.startsWith("data:")
              ? trimmed.slice(5).trim()
              : trimmed;

            if (!dataLine || dataLine === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataLine);

              // รูปแบบที่ backend ส่งมาจริง: { "token": "xxx" }
              // รองรับ fallback รูปแบบอื่นด้วยกัน
              const chunk =
                parsed?.token ?? // ← รูปแบบหลักจาก backend นี้
                parsed?.delta?.text ??
                parsed?.delta?.content ??
                parsed?.content ??
                parsed?.text ??
                parsed?.message ??
                parsed?.chunk ??
                null;

              if (chunk !== null && chunk !== undefined) {
                fullText += chunk;
                onChunk(String(chunk));
              }
            } catch {
              // parse ไม่ได้ → ใช้เป็น plain text เลย
              if (dataLine) {
                fullText += dataLine;
                onChunk(dataLine);
              }
            }
          }
        }

        return fullText || "ไม่ได้รับข้อความจาก AI";
      }

      // ── Fallback: Backend ตอบเป็น JSON ปกติ (ไม่น่าเกิดแต่รองรับไว้) ──
      const data = await response.json();

      let replyText = "";
      if (data?.ai_message?.message) {
        replyText = data.ai_message.message;
      } else if (typeof data === "string") {
        replyText = data;
      } else if (
        data?.reply ||
        data?.answer ||
        data?.content ||
        data?.message
      ) {
        replyText = data.reply || data.answer || data.content || data.message;
      } else {
        replyText = "ไม่สามารถอ่านรูปแบบการตอบกลับได้";
      }

      // Simulate typewriter
      await simulateTypewriter(replyText, onChunk, signal);
      return replyText;
    } catch (err: any) {
      if (err?.name === "AbortError") throw err;
      const errorMsg =
        err?.data?.detail || err?.message || "เกิดข้อผิดพลาดในการสื่อสารกับ AI";
      error.value = errorMsg;
      throw new Error(errorMsg);
    }
  };

  // Helper: simulate typewriter (fallback กรณี JSON ปกติ)
  const simulateTypewriter = (
    text: string,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal,
    chunkSize = 3,
    delayMs = 18,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      let i = 0;
      const tick = () => {
        if (signal?.aborted) {
          reject(new DOMException("Aborted", "AbortError"));
          return;
        }
        if (i >= text.length) {
          resolve();
          return;
        }
        const end = Math.min(i + chunkSize, text.length);
        onChunk(text.slice(i, end));
        i = end;
        setTimeout(tick, delayMs);
      };
      tick();
    });
  };

  return {
    loading,
    error,
    createSession,
    sendOllamaReplyStream,
  };
};
