import { useState, useEffect } from "react";
import { ENGINE_LABELS, DEFAULT_ENGINE } from "@/constants";

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
        // Fetch ONLY from database - no hardcoded engines
        const res = await fetch("/api/engines/active");
        if (!res.ok) throw new Error("Failed to fetch engines");
        
        const data = await res.json();
        const dbEngines: Engine[] = data.engines || [];

        // Sort: Default -> Version Desc -> Name Asc
        dbEngines.sort((a, b) => {
          if (a.isDefault && !b.isDefault) return -1;
          if (!a.isDefault && b.isDefault) return 1;

          // Heuristic for version extraction
          const getVer = (s: string) => {
            const m = s.match(/stockfish.*?(\d+)(?:[._](\d+))?/i);
            if (!m) return 0;
            return parseFloat(m[1] + "." + (m[2] || "0"));
          };
          const vA = getVer(a.identifier) || getVer(a.name);
          const vB = getVer(b.identifier) || getVer(b.name);

          if (vA !== vB) return vB - vA; // Descending version

          return a.name.localeCompare(b.name);
        });

        setEngines(dbEngines);
      } catch (err) {
        // Fallback to hardcoded list only if API completely fails
        console.error("Failed to fetch engines from DB, using fallback:", err);
        const fallbackEngines: Engine[] = Object.entries(ENGINE_LABELS).map(
          ([key, label], index) => ({
             id: -(index + 1),
             name: label.small,
             identifier: key,
             version: "Standard",
             type: "Hardcoded",
             filePath: "",
             isDefault: key === DEFAULT_ENGINE,
          })
        );
        setEngines(fallbackEngines);
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
