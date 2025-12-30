import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export function useCoachingSummary() {
  const { data: session, status } = useSession();
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async () => {
    if (!session?.user) {
      return;
    }

    // Check if AI is enabled in user settings
    const analysisSettings = (session?.user as any)?.analysisSettings;
    if (analysisSettings?.enableAI === false) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/coaching-summary", {
        method: "POST",
      });

      if (response.status === 403) {
        // AI Disabled by user preferences
        setSummary(null);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      console.error("Error generating coaching summary:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate on mount if user is authenticated and AI is enabled
  const analysisSettings = (session?.user as any)?.analysisSettings;
  const enableAI = analysisSettings?.enableAI !== false;

  useEffect(() => {
    if (status === "authenticated" && enableAI && !summary && !isLoading) {
      generateSummary();
    }
  }, [status, enableAI]); // React to authentication and enableAI changes

  return {
    summary,
    isLoading,
    error,
    regenerate: generateSummary,
  };
}
