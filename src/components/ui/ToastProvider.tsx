"use client";

import type { CSSProperties } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
};

type ToastContextValue = {
  push: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((toast: Omit<Toast, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => remove(id), 3500);
  }, [remove]);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={toastStackStyle}>
        {toasts.map((toast) => (
          <div key={toast.id} style={getToastStyle(toast.type)}>
            <div style={{ fontWeight: 600 }}>{toast.title}</div>
            {toast.message ? (
              <div style={{ fontSize: 12, marginTop: 4, color: "var(--muted)" }}>
                {toast.message}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

const toastStackStyle: CSSProperties = {
  position: "fixed",
  top: 20,
  right: 20,
  display: "grid",
  gap: 10,
  zIndex: 60
};

function getToastStyle(type: ToastType): CSSProperties {
  const base: CSSProperties = {
    minWidth: 220,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--line)",
    background: "white",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)"
  };

  if (type === "success") {
    return { ...base, borderColor: "#a6f4c5", background: "#f0fdf4" };
  }
  if (type === "error") {
    return { ...base, borderColor: "#f4c7c3", background: "#fef2f2" };
  }
  return base;
}
