export const useChat = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  const authStore = useAuthStore();
  const error = ref<string | null>(null);
  const loading = ref(false);

  // Base URL สำหรับ Chat API
  const chatBase = apiBase;

  // Helper function สำหรับ headers
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

  // 1. สร้าง Session ใหม่ - ใช้ POST /session (ไม่ใช่ /create/session)
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

      // ดึง session_id จาก response (รองรับหลายรูปแบบ)
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

  // 2. ส่งข้อความแชทกับ Ollama แบบ Non-streaming (เดิม)
  const sendOllamaReply = async (sessionId: string, message: string) => {
    error.value = null;

    try {
      const data = await $fetch<any>(`${chatBase}/sessions/ollama-reply`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: {
          sessions_id: sessionId,
          message: message,
        },
        credentials: "include",
      });

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

      return replyText;
    } catch (err: any) {
      const errorMsg =
        err?.data?.detail || err?.message || "เกิดข้อผิดพลาดในการสื่อสารกับ AI";
      error.value = errorMsg;
      throw new Error(errorMsg);
    }
  };

  // 3. ส่งข้อความแบบ Streaming — รองรับทั้ง SSE และ plain JSON พร้อม typewriter fallback
  //
  //    onChunk(chunk: string)  — callback รับทีละ chunk ขณะ stream
  //    returns: full response text
  //
  //    ถ้า backend รองรับ SSE (text/event-stream) จะ stream จริง
  //    ถ้า backend ยัง return JSON ธรรมดา จะ simulate typewriter เอง
  const sendOllamaReplyStream = async (
    sessionId: string,
    message: string,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal,
  ): Promise<string> => {
    error.value = null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "text/event-stream, application/json",
    };

    if (authStore.token) {
      headers.Authorization = `Bearer ${authStore.token}`;
    }

    try {
      const response = await fetch(`${chatBase}/sessions/ollama-reply`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          sessions_id: sessionId,
          message: message,
          stream: true, // บอก backend ว่าต้องการ stream
        }),
        credentials: "include",
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";

      // ── กรณี Backend รองรับ SSE / NDJSON streaming ──────────────────────
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
          buffer = lines.pop() ?? ""; // เก็บบรรทัดที่ยังไม่ครบไว้

          for (const line of lines) {
            // SSE format: "data: {...}" หรือ "data: text"
            const dataLine = line.startsWith("data:")
              ? line.slice(5).trim()
              : line.trim();
            if (!dataLine || dataLine === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataLine);
              // รองรับหลายรูปแบบ response
              const chunk =
                parsed?.delta?.text ||
                parsed?.delta?.content ||
                parsed?.content ||
                parsed?.text ||
                parsed?.message ||
                parsed?.chunk ||
                "";
              if (chunk) {
                fullText += chunk;
                onChunk(chunk);
              }
            } catch {
              // ถ้า parse ไม่ได้ ให้ใช้เป็น plain text chunk เลย
              if (dataLine) {
                fullText += dataLine;
                onChunk(dataLine);
              }
            }
          }
        }

        return fullText || "ไม่สามารถอ่านรูปแบบการตอบกลับได้";
      }

      // ── กรณี Backend ยัง return JSON ปกติ → simulate typewriter ──────────
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

      // Simulate typewriter: แบ่งเป็น chunk ~3-5 ตัวอักษรต่อ tick
      await simulateTypewriter(replyText, onChunk, signal);

      return replyText;
    } catch (err: any) {
      if (err?.name === "AbortError") throw err; // ส่ง abort ต่อไป
      const errorMsg =
        err?.data?.detail || err?.message || "เกิดข้อผิดพลาดในการสื่อสารกับ AI";
      error.value = errorMsg;
      throw new Error(errorMsg);
    }
  };

  // ── Helper: simulate typewriter สำหรับ backend ที่ยังไม่รองรับ stream ──
  const simulateTypewriter = (
    text: string,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal,
    chunkSize = 3, // ตัวอักษรต่อ tick
    delayMs = 18, // ms ต่อ tick (ปรับความเร็วได้)
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
    sendOllamaReply,
    sendOllamaReplyStream,
  };
};
