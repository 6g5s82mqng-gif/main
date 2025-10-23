import { writable } from "svelte/store";

interface Alert {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

function createAlertStore() {
  const { subscribe, set, update } = writable<Alert[]>([]);

  return {
    subscribe,

    // Show alert
    show: (
      message: string,
      type: "success" | "error" | "warning" | "info" = "info",
      duration: number = 3000,
    ) => {
      const id = Date.now().toString();
      const alert: Alert = { id, message, type, duration };

      update((alerts) => [...alerts, alert]);

      // Auto remove after duration
      if (duration > 0) {
        setTimeout(() => {
          update((alerts) => alerts.filter((a) => a.id !== id));
        }, duration);
      }

      return id;
    },

    // Remove specific alert
    remove: (id: string) => {
      update((alerts) => alerts.filter((alert) => alert.id !== id));
    },

    // Clear all alerts
    clear: () => {
      set([]);
    },

    // Show success message
    success: (message: string, duration?: number) => {
      return alerts.show(message, "success", duration);
    },

    // Show error message
    error: (message: string, duration?: number) => {
      return alerts.show(message, "error", duration);
    },

    // Show warning message
    warning: (message: string, duration?: number) => {
      return alerts.show(message, "warning", duration);
    },

    // Show info message
    info: (message: string, duration?: number) => {
      return alerts.show(message, "info", duration);
    },
  };
}

export const alerts = createAlertStore();
