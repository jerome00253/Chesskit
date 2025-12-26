import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

interface AutoImportResult {
  success: boolean;
  imported: {
    chesscom: { imported: number; skipped: number };
    lichess: { imported: number; skipped: number };
  };
  lastImport: string;
}

interface UseAutoImportOptions {
  enabled?: boolean;
  onSuccess?: (result: AutoImportResult) => void;
  onError?: (error: Error) => void;
}

export function useAutoImport(options: UseAutoImportOptions = {}) {
  const { enabled = true, onSuccess, onError } = options;
  const { data: session, status } = useSession();
  const [isImporting, setIsImporting] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [settings, setSettings] = useState({
    autoImportEnabled: false,
    autoImportInterval: 21600, // 6 hours default
    lastAutoImport: null as string | null,
  });

  // Fetch user settings
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user/profile")
        .then((res) => res.json())
        .then((data) => {
          setSettings({
            autoImportEnabled: data.autoImportEnabled || false,
            autoImportInterval: data.autoImportInterval || 21600,
            lastAutoImport: data.lastAutoImport,
          });
        })
        .catch(console.error);
    }
  }, [status]);

  // Trigger auto-import
  const triggerAutoImport = async () => {
    if (isImporting || !session) return;

    setIsImporting(true);
    setLastCheck(new Date());

    try {
      const response = await fetch("/api/user/auto-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: false }),
      });

      if (response.ok) {
        const result: AutoImportResult = await response.json();
        if (onSuccess) onSuccess(result);
        
        // Update settings with new lastAutoImport
        setSettings((prev) => ({
          ...prev,
          lastAutoImport: result.lastImport,
        }));
      } else {
        const error = await response.json();
        if (error.message !== "Not enough time since last import") {
          throw new Error(error.message || "Auto-import failed");
        }
      }
    } catch (error) {
      console.error("Auto-import error:", error);
      if (onError) onError(error as Error);
    } finally {
      setIsImporting(false);
    }
  };

  // Setup periodic checking
  useEffect(() => {
    if (!enabled || !settings.autoImportEnabled || status !== "authenticated") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Check every 5 minutes if auto-import is needed
    const checkInterval = 5 * 60 * 1000; // 5 minutes

    intervalRef.current = setInterval(() => {
      if (!settings.lastAutoImport) {
        // Never imported before, trigger now
        triggerAutoImport();
        return;
      }

      const timeSinceLastImport =
        (Date.now() - new Date(settings.lastAutoImport).getTime()) / 1000;
      
      if (timeSinceLastImport >= settings.autoImportInterval) {
        triggerAutoImport();
      }
    }, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, settings, status]);

  return {
    isImporting,
    lastCheck,
    settings,
    triggerManually: triggerAutoImport,
  };
}
