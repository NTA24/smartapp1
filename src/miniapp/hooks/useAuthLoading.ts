import { useEffect, useState } from "react";

const DEFAULT_AUTH_LOADING_TIMEOUT_MS = 15000;

function resolveAuthLoadingTimeoutMs(): number {
  const raw = String((import.meta.env as Record<string, unknown>).VITE_AUTH_LOADING_TIMEOUT_MS ?? "").trim();
  if (!raw) return DEFAULT_AUTH_LOADING_TIMEOUT_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_AUTH_LOADING_TIMEOUT_MS;
  return parsed;
}

const AUTH_LOADING_TIMEOUT_MS = resolveAuthLoadingTimeoutMs();

export function useAuthLoading(userPhone: string): boolean {
  const [loading, setLoading] = useState(!userPhone);

  useEffect(() => {
    setLoading(!userPhone);

    if (!userPhone) {
      const timeoutId = window.setTimeout(() => {
        setLoading(false);
      }, AUTH_LOADING_TIMEOUT_MS);
      return () => window.clearTimeout(timeoutId);
    }
    return undefined;
  }, [userPhone]);

  return loading;
}

