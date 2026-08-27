"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { syncPresence } from "@/lib/api-client";
import { PRESENCE_HEARTBEAT_MS } from "@/lib/presenceCatalog";
import { PresenceSyncResponse, PresenceUser } from "@/lib/types";

const SESSION_STORAGE_KEY = "tasks-tracker-session-id";

let syncInFlight: Promise<PresenceSyncResponse | null> | null = null;

async function performPresenceSync(): Promise<PresenceSyncResponse | null> {
  if (syncInFlight) {
    return syncInFlight;
  }

  syncInFlight = (async () => {
    const storedSessionId = window.sessionStorage.getItem(SESSION_STORAGE_KEY);

    try {
      const response = await syncPresence(storedSessionId);

      if (response.sessionId) {
        window.sessionStorage.setItem(SESSION_STORAGE_KEY, response.sessionId);
      } else {
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }

      return response;
    } catch {
      return null;
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
}

export function usePresence() {
  const [data, setData] = useState<PresenceSyncResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const runSync = useCallback(async () => {
    const response = await performPresenceSync();
    setData(response);
    setLoading(false);
  }, []);

  useEffect(() => {
    void runSync();
    const intervalId = window.setInterval(() => {
      void runSync();
    }, PRESENCE_HEARTBEAT_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [runSync]);

  const visibleUsers = useMemo(() => {
    if (!data) {
      return [] as PresenceUser[];
    }

    const users: PresenceUser[] = [];

    if (data.self) {
      users.push({ ...data.self, isSelf: true });
    }

    users.push(...data.others.slice(0, data.self ? 11 : 12));

    return users;
  }, [data]);

  return {
    visibleUsers,
    activeCount: data?.activeCount ?? 0,
    loading,
  };
}
