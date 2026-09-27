import React, { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);
let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const notify = useCallback(
    (message, category = "success") => {
      const id = nextId++;
      setToasts((current) => [...current, { id, message, category }]);
      timers.current[id] = setTimeout(() => dismiss(id), 6000);
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="messages toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`message ${toast.category}`}
            onClick={() => dismiss(toast.id)}
            role="alert"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast deve ser usado dentro de um ToastProvider.");
  }
  return ctx;
}
