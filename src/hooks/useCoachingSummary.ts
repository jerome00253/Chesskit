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

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/coaching-summary", {
        method: "POST",
      });

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

  // Auto-generate on mount if user is authenticated
  useEffect(() => {
    if (status === "authenticated" && !summary && !isLoading) {
      generateSummary();
    }
  }, [status]); // Only trigger on authentication status change

  return {
    summary,
    isLoading,
    error,
    regenerate: generateSummary,
  };
}
