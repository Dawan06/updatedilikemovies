'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info', duration: number = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, message, variant, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const getIcon = (variant: ToastVariant) => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getColors = (variant: ToastVariant) => {
    switch (variant) {
      case 'success':
        return 'bg-green-500/10 border-green-500/50 text-green-400';
      case 'error':
        return 'bg-red-500/10 border-red-500/50 text-red-400';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400';
      case 'info':
      default:
        return 'bg-blue-500/10 border-blue-500/50 text-blue-400';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showWarning }}>
      {children}
      {mounted &&
        createPortal(
          <div
            className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-md w-full"
            aria-live="polite"
            aria-atomic="true"
          >
            <AnimatePresence mode="popLayout">
              {toasts.map((toast) => (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, x: 300, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 300, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className={`pointer-events-auto glass rounded-lg border p-4 flex items-start gap-3 shadow-lg backdrop-blur-md ${getColors(toast.variant)}`}
                  role="alert"
                >
                  <div className="flex-shrink-0 mt-0.5">{getIcon(toast.variant)}</div>
                  <p className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</p>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="flex-shrink-0 text-current/60 hover:text-current transition-colors p-1 -mt-1 -mr-1"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
