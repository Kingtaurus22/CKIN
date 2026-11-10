"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWorkspace } from "@/src/components/workspace/WorkspaceProvider";
import { apiFetch, errorMessage } from "@/src/lib/client-api";
import type { ChatMessage, ConversationThread } from "@/src/types/customer";

const POLL_MS = 5000;

/**
 * State satu percakapan (per order):
 * - memuat riwayat dari REST API
 * - bergabung ke room Socket.IO untuk pesan real-time
 * - fallback polling bila socket tidak tersambung
 */
export function useConversation(orderId: string | null) {
  const { socket, socketConnected, role, refreshUnread } = useWorkspace();
  const [thread, setThread] = useState<ConversationThread | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!orderId) return;
      if (!silent) setLoading(true);
      try {
        const data = await apiFetch<ConversationThread>(`/api/conversations/${orderId}`);
        setThread(data);
        setError("");
        refreshUnread();
      } catch (err) {
        if (!silent) setError(errorMessage(err));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [orderId, refreshUnread],
  );

  useEffect(() => {
    setThread(null);
    setError("");
    if (orderId) load();
  }, [orderId, load]);

  // Real-time via Socket.IO.
  useEffect(() => {
    if (!socket || !socketConnected || !orderId) return;

    socket.emit("conversation:join", { orderId });

    const onMessage = (message: ChatMessage) => {
      if (message.orderId !== orderId) return;
      setThread((prev) =>
        prev && !prev.messages.some((m) => m.id === message.id)
          ? { ...prev, messages: [...prev.messages, message] }
          : prev,
      );
      setPeerTyping(false);
      // Sedang dibuka → langsung tandai dibaca.
      apiFetch(`/api/conversations/${orderId}/read`, { method: "PATCH" })
        .then(() => {
          socket.emit("conversation:read", { orderId });
          refreshUnread();
        })
        .catch(() => undefined);
    };

    const onRead = (payload: { orderId: string; readerRole: string }) => {
      if (payload.orderId !== orderId || payload.readerRole === role) return;
      const now = new Date().toISOString();
      setThread((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.map((m) =>
                m.senderRole === role && !m.readAt ? { ...m, readAt: now } : m,
              ),
            }
          : prev,
      );
    };

    const onTyping = (payload: { orderId: string; role: string; typing: boolean }) => {
      if (payload.orderId !== orderId || payload.role === role) return;
      setPeerTyping(payload.typing);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (payload.typing) typingTimer.current = setTimeout(() => setPeerTyping(false), 4000);
    };

    socket.on("message:new", onMessage);
    socket.on("conversation:read", onRead);
    socket.on("typing", onTyping);
    socket.emit("conversation:read", { orderId });

    return () => {
      socket.emit("conversation:leave", { orderId });
      socket.off("message:new", onMessage);
      socket.off("conversation:read", onRead);
      socket.off("typing", onTyping);
    };
  }, [socket, socketConnected, orderId, role, refreshUnread]);

  // Fallback polling saat socket tidak tersedia.
  useEffect(() => {
    if (socketConnected || !orderId) return;
    const timer = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(timer);
  }, [socketConnected, orderId, load]);

  const send = useCallback(
    async (text: string, image: File | null) => {
      if (!orderId) return false;
      setSending(true);
      try {
        let body: BodyInit;
        if (image) {
          const form = new FormData();
          form.append("text", text);
          form.append("image", image);
          body = form;
        } else {
          body = JSON.stringify({ text });
        }
        const data = await apiFetch<{ message: ChatMessage }>(
          `/api/conversations/${orderId}/messages`,
          { method: "POST", body },
        );
        setThread((prev) =>
          prev ? { ...prev, messages: [...prev.messages, data.message] } : prev,
        );
        socket?.emit("message:relay", { orderId, messageId: data.message.id });
        socket?.emit("typing", { orderId, typing: false });
        setError("");
        return true;
      } catch (err) {
        setError(errorMessage(err));
        return false;
      } finally {
        setSending(false);
      }
    },
    [orderId, socket],
  );

  const notifyTyping = useCallback(
    (typing: boolean) => {
      if (orderId && socketConnected) socket?.emit("typing", { orderId, typing });
    },
    [orderId, socket, socketConnected],
  );

  return { thread, loading, error, sending, send, peerTyping, notifyTyping, reload: load, live: socketConnected };
}
