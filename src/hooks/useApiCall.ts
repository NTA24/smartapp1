import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "../api/interaction/toast";

type FeedbackType = "success" | "error" | "info";

export interface FeedbackState {
  type: FeedbackType;
  message: string;
}

interface UseApiCallOptions {
  autoClearMs?: number;
  toastOnSuccess?: boolean;
  toastOnError?: boolean;
}

interface RunOptions<TResult> {
  successMessage?: string | ((result: TResult) => string);
  errorMessage?: string | ((error: Error) => string);
  toastOnSuccess?: boolean;
  toastOnError?: boolean;
}

const DEFAULT_AUTO_CLEAR_MS = 5000;

const safeToast = async (message: string) => {
  if (!message) {
    return;
  }

  try {
    await toast({ message });
  } catch (err) {
    // Ignore toast failures (e.g., outside MiniApp environment)
    console.warn("Toast unavailable:", err);
  }
};

export const useApiCall = (options?: UseApiCallOptions) => {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const autoClearMs = options?.autoClearMs ?? DEFAULT_AUTO_CLEAR_MS;

  const clearFeedback = useCallback(() => {
    setFeedback(null);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scheduleClear = useCallback(() => {
    if (!autoClearMs) {
      return;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setFeedback(null);
      timeoutRef.current = null;
    }, autoClearMs);
  }, [autoClearMs]);

  const showFeedback = useCallback(
    async (
      type: FeedbackType,
      message: string,
      overrides?: RunOptions<any>
    ) => {
      if (!message) {
        return;
      }

      setFeedback({ type, message });
      scheduleClear();

      const toastFlag =
        type === "success"
          ? overrides?.toastOnSuccess ?? options?.toastOnSuccess ?? true
          : overrides?.toastOnError ?? options?.toastOnError ?? false;

      if (toastFlag) {
        await safeToast(message);
      }
    },
    [options?.toastOnError, options?.toastOnSuccess, scheduleClear]
  );

  const run = useCallback(
    async <TResult>(
      fn: () => Promise<TResult>,
      overrides?: RunOptions<TResult>
    ): Promise<TResult | undefined> => {
      setLoading(true);
      setFeedback(null);
      try {
        const result = await fn();
        const successMessage =
          typeof overrides?.successMessage === "function"
            ? overrides.successMessage(result)
            : overrides?.successMessage;
        if (successMessage) {
          await showFeedback("success", successMessage, overrides);
        }
        return result;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error((err as any)?.toString());
        const errorMessage =
          typeof overrides?.errorMessage === "function"
            ? overrides.errorMessage(error)
            : overrides?.errorMessage ||
              error.message ||
              "Something went wrong";
        await showFeedback("error", errorMessage, overrides);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [showFeedback]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    run,
    loading,
    feedback,
    clearFeedback,
    showFeedback,
  };
};
