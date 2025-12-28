import { useState, useEffect } from "react";

interface Engine {
  id: number;
  name: string;
  identifier: string;
  version: string;
  type: string;
  filePath: string;
  isDefault: boolean;
}

export function useEngines() {
  const [engines, setEngines] = useState<Engine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchEngines = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/engines/active");
        if (!res.ok) throw new Error("Failed to fetch engines");
        const data = await res.json();
        setEngines(data.engines || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    };

    fetchEngines();
  }, []);

  // Get default engine or first one
  const defaultEngine = engines.find((e) => e.isDefault) || engines[0];

  return {
    engines,
    loading,
    error,
    defaultEngine,
  };
}
