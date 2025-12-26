"use client";

import { useAutoImport } from "@/hooks/useAutoImport";
import { useEffect, useState } from "react";
import { Snackbar, Alert, IconButton } from "@mui/material";
import { Icon } from "@iconify/react";

/**
 * AutoImportMonitor - Component to monitor and display auto-import status
 * Wrap your app layout with this component to enable auto-import
 */
export function AutoImportMonitor() {
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "info" | "error";
  }>({ open: false, message: "", severity: "info" });

  const { isImporting, triggerManually } = useAutoImport({
    enabled: true,
    onSuccess: (result) => {
      const total =
        result.imported.chesscom.imported + result.imported.lichess.imported;
      if (total > 0) {
        setNotification({
          open: true,
          message: `${total} nouvelle${total > 1 ? "s" : ""} partie${total > 1 ? "s" : ""} importée${total > 1 ? "s" : ""}`,
          severity: "success",
        });
      }
    },
    onError: (error) => {
      console.error("Auto-import error:", error);
    },
  });

  return (
    <>
      {/* Floating import indicator */}
      {isImporting && (
        <div
          style={{
            position: "fixed",
            bottom: 80,
            right: 20,
            zIndex: 9999,
            backgroundColor: "#1976d2",
            color: "white",
            padding: "8px 16px",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          <Icon icon="mdi:loading" className="animate-spin" width={20} />
          <span style={{ fontSize: "14px" }}>Import en cours...</span>
        </div>
      )}

      {/* Success notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: "100%" }}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={() => setNotification({ ...notification, open: false })}
            >
              <Icon icon="mdi:close" />
            </IconButton>
          }
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}
