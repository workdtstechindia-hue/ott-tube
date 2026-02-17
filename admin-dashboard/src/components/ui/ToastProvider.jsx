/* eslint-disable react-refresh/only-export-components */
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ToastContext = createContext(null);

let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message, type = "info") => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => removeToast(id), 3200);
    },
    [removeToast]
  );

  const value = useMemo(
    () => ({
      success: (msg) => show(msg, "success"),
      error: (msg) => show(msg, "error"),
      info: (msg) => show(msg, "info"),
    }),
    [show]
  );

  useEffect(() => {
    const onApiError = (event) => {
      if (!event?.detail?.message) return;
      show(event.detail.message, "error");
    };

    window.addEventListener("api:error", onApiError);
    return () => window.removeEventListener("api:error", onApiError);
  }, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur ${
              toast.type === "success"
                ? "border-green-400/30 bg-green-500/10 text-green-700 dark:text-green-300"
                : toast.type === "error"
                ? "border-red-400/30 bg-red-500/10 text-red-700 dark:text-red-300"
                : "border-blue-400/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
            }`}
          >
            <p className="flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="rounded-md p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
              aria-label="Dismiss notification"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};
