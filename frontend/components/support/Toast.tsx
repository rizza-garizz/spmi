"use client";

import { useState, useEffect, createContext, useContext } from "react";

type ToastType = "success" | "danger" | "warning" | "info";

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div 
          className={`alert alert-${toast.type} alert-dismissible fade show`}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9999,
            minWidth: '250px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <strong>{toast.type === 'success' ? 'Sukses!' : 'Perhatian!'}</strong> {toast.message}
          <button type="button" className="btn-close" onClick={() => setToast(null)}></button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};
