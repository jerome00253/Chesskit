import { Select, MenuItem, FormControl, Box, Typography } from "@mui/material";
import { engineNameAtom, gameAtom } from "@/sections/analysis/states";
import { EngineName } from "@/types/enums";
import { ENGINE_LABELS } from "@/constants";
import { isEngineSupported } from "@/lib/engine/shared";
import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";

export default function EngineSelector() {
  const [engineName, setEngineName] = useAtom(engineNameAtom);
  const game = useAtomValue(gameAtom);

  // Log engine name when it changes
  useEffect(() => {
    console.log('[EngineSelector] 🎯 Current engineName value:', engineName);
  }, [engineName]);

  // Disable selector if no game loaded (no moves)
  const isDisabled = game.history().length === 0;

  const handleChange = (event: { target: { value: string } }) => {
    const newEngine = event.target.value as EngineName;
    console.log('[EngineSelector] 🔄 Engine changed:', {
      from: engineName,
      to: newEngine,
      isSupported: isEngineSupported(newEngine)
    });
    
    if (isEngineSupported(newEngine)) {
      setEngineName(newEngine);
      console.log('[EngineSelector] ✅ Engine set to:', newEngine);
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <Select
          value={engineName}
          onChange={handleChange}
          displayEmpty
          disabled={isDisabled}
          sx={{
            fontSize: "0.85rem",
            "& .MuiSelect-select": {
              py: 0.75,
            },
          }}
        >
          {Object.entries(ENGINE_LABELS).map(([key, value]) => {
            const engineKey = key as EngineName;
            const supported = isEngineSupported(engineKey);
            return (
              <MenuItem
                key={key}
                value={key}
                disabled={!supported}
                sx={{ fontSize: "0.85rem" }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    opacity: supported ? 1 : 0.5,
                  }}
                >
                  {value.small}
                  {!supported && " (N/A)"}
                </Typography>
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
}
