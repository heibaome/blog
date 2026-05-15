"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          background: "#1e1e2e",
          color: "#cdd6f4",
          border: "1px solid #45475a",
        },
        success: {
          iconTheme: { primary: "#a6e3a1", secondary: "#1e1e2e" },
        },
        error: {
          iconTheme: { primary: "#f38ba8", secondary: "#1e1e2e" },
        },
      }}
    />
  );
}
