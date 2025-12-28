import { Select, MenuItem, FormControl, Box, Typography } from "@mui/material";
import { engineNameAtom, gameAtom } from "@/sections/analysis/states";
import { EngineName } from "@/types/enums";
import { isEngineSupported } from "@/lib/engine/shared";
import { useAtom, useAtomValue } from "jotai";
import { useEngines } from "@/hooks/useEngines";

export default function EngineSelector() {
  const [engineName, setEngineName] = useAtom(engineNameAtom);
  const game = useAtomValue(gameAtom);
  const { engines, loading } = useEngines();

  // Disable selector if no game loaded (no moves)
  const isDisabled = game.history().length === 0;

  const handleChange = (event: { target: { value: string } }) => {
    const newEngine = event.target.value as EngineName;

    if (isEngineSupported(newEngine)) {
      setEngineName(newEngine);
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <Select
          value={engineName}
          onChange={handleChange}
          displayEmpty
          disabled={isDisabled || loading}
          sx={{
            fontSize: "0.85rem",
            "& .MuiSelect-select": {
              py: 0.75,
            },
          }}
        >
          {engines.map((engine) => {
            const engineKey = engine.identifier as EngineName;
            const supported = isEngineSupported(engineKey);
            return (
              <MenuItem
                key={engine.identifier}
                value={engineKey}
                disabled={!supported}
                sx={{ fontSize: "0.85rem" }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    opacity: supported ? 1 : 0.5,
                  }}
                >
                  {engine.name}
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
