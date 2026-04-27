"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "error" | "success" | "info";
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, type = "info", onDismiss, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const colors = {
    error:   "bg-red-500/10 border-red-500/30 text-red-300",
    success: "bg-green-500/10 border-green-500/30 text-green-300",
    info:    "bg-brand-500/10 border-brand-500/30 text-brand-300",
  };

  return (
    <div className={`
      fixed bottom-6 right-6 z-[100] max-w-sm w-full
      border rounded-xl px-4 py-3 text-sm font-medium
      flex items-center justify-between gap-3
      shadow-lg modal-enter
      ${colors[type]}
    `}>
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="text-current opacity-50 hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Hook for easy toast usage
import { useCallback } from "react";

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);

  const showToast = useCallback((message: string, type: "error" | "success" | "info" = "info") => {
    setToast({ message, type });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const ToastComponent = toast ? (
    <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />
  ) : null;

  return { showToast, ToastComponent };
}