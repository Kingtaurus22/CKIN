"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { apiFetch } from "@/src/lib/client-api";
import type { PublicAccount } from "@/db/models/AccountModel";
import type { CoverageArea } from "@/db/models/types";

type Role = "customer" | "surveyor" | "admin";

export type WorkspaceUser = PublicAccount & {
  coverageArea?: CoverageArea;
  experience?: string;
  acceptingOrders?: boolean;
  verificationStatus?: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  rating?: { average: number; count: number };
};

type WorkspaceContextValue = {
  role: Role;
  user: WorkspaceUser | null;
  loading: boolean;
  setUser: (user: WorkspaceUser) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  /** Koneksi Socket.IO bersama (null jika server socket tidak tersedia). */
  socket: Socket | null;
  socketConnected: boolean;
  unreadMessages: number;
  refreshUnread: () => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace harus dipakai di dalam <WorkspaceProvider>");
  return value;
}

export default function WorkspaceProvider({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const [user, setUser] = useState<WorkspaceUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const unreadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: WorkspaceUser }>("/api/auth/me");
      setUser(data.user);
    } catch {
      // apiFetch sudah mengalihkan ke /login jika sesi berakhir.
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUnread = useCallback(() => {
    if (role === "admin") return; // admin tidak punya percakapan
    if (unreadTimer.current) clearTimeout(unreadTimer.current);
    unreadTimer.current = setTimeout(async () => {
      try {
        const data = await apiFetch<{ totalUnread: number }>("/api/conversations");
        setUnreadMessages(data.totalUnread);
      } catch {
        /* abaikan: badge tidak kritikal */
      }
    }, 250);
  }, [role]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    refreshUser();
    refreshUnread();
  }, [refreshUser, refreshUnread]);

  // Satu koneksi socket untuk seluruh halaman workspace.
  useEffect(() => {
    if (role === "admin") return;
    const client = io({
      path: "/socket.io",
      withCredentials: true,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"],
    });

    client.on("connect", () => setSocketConnected(true));
    client.on("disconnect", () => setSocketConnected(false));
    client.on("connect_error", () => setSocketConnected(false));
    client.on("conversation:updated", () => refreshUnread());

    setSocket(client);
    return () => {
      client.removeAllListeners();
      client.disconnect();
    };
  }, [refreshUnread, role]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      role,
      user,
      loading,
      setUser,
      refreshUser,
      logout,
      socket,
      socketConnected,
      unreadMessages,
      refreshUnread,
    }),
    [role, user, loading, refreshUser, logout, socket, socketConnected, unreadMessages, refreshUnread],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
