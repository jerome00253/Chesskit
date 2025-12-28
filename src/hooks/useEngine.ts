import { isWasmSupported } from "@/lib/engine/shared";
import { Stockfish11 } from "@/lib/engine/stockfish11";
import { Stockfish16 } from "@/lib/engine/stockfish16";
import { Stockfish16_1 } from "@/lib/engine/stockfish16_1";
import { Stockfish17 } from "@/lib/engine/stockfish17";
import { UciEngine } from "@/lib/engine/uciEngine";
import { EngineName } from "@/types/enums";
import { useEffect, useState } from "react";
import { useEngines } from "@/hooks/useEngines";

export const useEngine = (engineName: EngineName | undefined | string) => {
  const [engine, setEngine] = useState<UciEngine | null>(null);
  const { engines } = useEngines(); // Need list to find path of dynamic engines

  useEffect(() => {
    if (!engineName) return;

    if (engineName !== EngineName.Stockfish11 && !isWasmSupported()) {
      return;
    }

    // 1. Try hardcoded engines first
    const hardcodedPromise = pickHardcodedEngine(engineName as EngineName);

    if (hardcodedPromise) {
        hardcodedPromise.then((newEngine) => {
            setEngine((prev) => {
                prev?.shutdown();
                return newEngine;
            });
        });
        return;
    }

    // 2. Try dynamic engines
    if (engines.length > 0) {
        const dynamicEngine = engines.find(e => e.identifier === engineName);
        if (dynamicEngine && dynamicEngine.filePath) {
            // Create specific dynamic engine
            // Ensure path starts with / so it's absolute from public root if not already
            const path = dynamicEngine.filePath.startsWith("/") ? dynamicEngine.filePath : "/" + dynamicEngine.filePath;
            
            UciEngine.create(engineName as EngineName, path).then(newEngine => {
                 setEngine((prev) => {
                    prev?.shutdown();
                    return newEngine;
                });
            }).catch(console.error);
        }
    }

  }, [engineName, engines]);

  return engine;
};

const pickHardcodedEngine = (engine: EngineName): Promise<UciEngine> | null => {
  switch (engine) {
    case EngineName.Stockfish17:
      return Stockfish17.create(false);
    case EngineName.Stockfish17Lite:
      return Stockfish17.create(true);
    case EngineName.Stockfish16_1:
      return Stockfish16_1.create(false);
    case EngineName.Stockfish16_1Lite:
      return Stockfish16_1.create(true);
    case EngineName.Stockfish16:
      return Stockfish16.create(false);
    case EngineName.Stockfish16NNUE:
      return Stockfish16.create(true);
    case EngineName.Stockfish11:
      return Stockfish11.create();
    default:
        return null;
  }
};
