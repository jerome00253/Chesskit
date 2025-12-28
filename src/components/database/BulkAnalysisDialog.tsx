import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Typography,
  Stack,
  Box,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useState, useEffect } from "react";
import { EngineName } from "@/types/enums";
import { PIECE_SETS } from "@/constants";
import { isEngineSupported } from "@/lib/engine/shared";
import { Icon } from "@iconify/react";
import { useSession } from "next-auth/react";
import { useEngines } from "@/hooks/useEngines";

import { AnalysisSettings } from "@/types/analysisSettings";

type PieceSet = (typeof PIECE_SETS)[number];

export interface BulkAnalysisSettings {
  engineName: EngineName;
  engineDepth: number;
  engineMultiPv: number;
  boardHue: number;
  pieceSet: PieceSet;
  showBestMove: boolean;
  showPlayerMove: boolean;
  workersNb: number;
}

interface Props {
  open: boolean;
  gameCount: number;
  onClose: () => void;
  onConfirm: (settings: BulkAnalysisSettings) => void;
}

export default function BulkAnalysisDialog({
  open,
  gameCount,
  onClose,
  onConfirm,
}: Props) {
  const [engineName, setEngineName] = useState<EngineName>(
    EngineName.Stockfish17Lite
  );
  const [engineDepth, setEngineDepth] = useState(14);
  const [engineMultiPv, setEngineMultiPv] = useState(3);
  const [boardHue, setBoardHue] = useState(0);
  const [pieceSet, setPieceSet] = useState<PieceSet>("cburnett");
  const [showBestMove, setShowBestMove] = useState(true);
  const [showPlayerMove, setShowPlayerMove] = useState(true);
  const [workersNb, setWorkersNb] = useState(6);
  const { data: session } = useSession();
  const { engines, loading: enginesLoading } = useEngines();

  useEffect(() => {
    if (open && session) {
      const loadSettings = async () => {
        try {
          const res = await fetch("/api/user/settings");
          if (res.ok) {
            const data = await res.json();
            if (data.analysisSettings) {
              const s = data.analysisSettings as AnalysisSettings;
              setEngineName(s.engineName as EngineName);
              setEngineDepth(s.depth);
              setEngineMultiPv(s.multiPv);
              setBoardHue(s.boardHue);
              setPieceSet(s.pieceSet as PieceSet);
              setShowBestMove(s.showBestMove);
              setShowPlayerMove(s.showPlayerMove);
              setWorkersNb(s.threads);
            }
          }
        } catch (error) {
          console.error("Failed to load settings:", error);
        }
      };
      loadSettings();
    }
  }, [open, session]);

  const handleConfirm = () => {
    onConfirm({
      engineName,
      engineDepth,
      engineMultiPv,
      boardHue,
      pieceSet,
      showBestMove,
      showPlayerMove,
      workersNb,
    });
  };

  // Calculate board colors based on hue
  const lightSquareColor = `hsl(${boardHue}, 25%, 80%)`;
  const darkSquareColor = `hsl(${boardHue}, 25%, 45%)`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" gap={1}>
          <Icon icon="mdi:brain" width={24} height={24} />
          <Typography variant="h6">
            Analyse en masse ({gameCount} {gameCount > 1 ? "parties" : "partie"}
            )
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Engine Selection */}
          <FormControl fullWidth>
            <InputLabel>Moteur Stockfish</InputLabel>
            <Select
              value={engineName}
              label="Moteur Stockfish"
              onChange={(e) => setEngineName(e.target.value as EngineName)}
              disabled={enginesLoading}
            >
              {engines.map((engine) => {
                const engineKey = engine.identifier as EngineName;
                const supported = isEngineSupported(engineKey);
                return (
                  <MenuItem key={engine.identifier} value={engineKey} disabled={!supported}>
                    {engine.name}
                    {!supported && " (N/A)"}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* Depth Slider */}
          <Box>
            <Typography gutterBottom>
              Profondeur d'analyse : {engineDepth}
            </Typography>
            <Slider
              value={engineDepth}
              onChange={(_, value) => setEngineDepth(value as number)}
              min={10}
              max={20}
              marks={[
                { value: 10, label: "10" },
                { value: 15, label: "15" },
                { value: 20, label: "20" },
              ]}
              valueLabelDisplay="auto"
            />
          </Box>

          {/* MultiPV Slider */}
          <Box>
            <Typography gutterBottom>
              Nombre de variantes : {engineMultiPv}
            </Typography>
            <Slider
              value={engineMultiPv}
              onChange={(_, value) => setEngineMultiPv(value as number)}
              min={1}
              max={5}
              marks={[
                { value: 1, label: "1" },
                { value: 3, label: "3" },
                { value: 5, label: "5" },
              ]}
              valueLabelDisplay="auto"
            />
          </Box>

          {/* Checkboxes for arrows/icons */}
          <Stack direction="row" spacing={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showBestMove}
                  onChange={(e) => setShowBestMove(e.target.checked)}
                />
              }
              label="Afficher la flèche du meilleur coup"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={showPlayerMove}
                  onChange={(e) => setShowPlayerMove(e.target.checked)}
                />
              }
              label="Afficher l'icône du coup joué"
            />
          </Stack>

          {/* Board Hue Slider with Preview */}
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography gutterBottom>
                Teinte de l'échiquier : {boardHue}
              </Typography>
              {/* Board preview squares */}
              <Stack direction="row" gap={0.5}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: lightSquareColor,
                    border: "1px solid rgba(0,0,0,0.2)",
                    borderRadius: 0.5,
                  }}
                />
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: darkSquareColor,
                    border: "1px solid rgba(0,0,0,0.2)",
                    borderRadius: 0.5,
                  }}
                />
              </Stack>
            </Stack>
            <Slider
              value={boardHue}
              onChange={(_, value) => setBoardHue(value as number)}
              min={0}
              max={360}
              marks={[
                { value: 0, label: "0" },
                { value: 180, label: "180" },
                { value: 360, label: "360" },
              ]}
              valueLabelDisplay="auto"
            />
          </Box>

          {/* Piece Set Selection with Preview */}
          <Box>
            <Stack direction="row" alignItems="center" gap={2}>
              <FormControl fullWidth>
                <InputLabel>Jeu de pièces</InputLabel>
                <Select
                  value={pieceSet}
                  label="Jeu de pièces"
                  onChange={(e) => setPieceSet(e.target.value as PieceSet)}
                >
                  {PIECE_SETS.map((set) => (
                    <MenuItem key={set} value={set}>
                      {set}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {/* Knight piece preview */}
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: darkSquareColor,
                  border: "1px solid rgba(0,0,0,0.2)",
                  borderRadius: 1,
                  flexShrink: 0,
                }}
              >
                <Box
                  component="img"
                  src={`/piece/${pieceSet}/wN.svg`}
                  alt="Knight preview"
                  sx={{
                    width: 48,
                    height: 48,
                  }}
                />
              </Box>
            </Stack>
          </Box>

          {/* Workers/Threads Slider */}
          <Box>
            <Typography gutterBottom>
              Nombre de threads : {workersNb}
            </Typography>
            <Slider
              value={workersNb}
              onChange={(_, value) => setWorkersNb(value as number)}
              min={1}
              max={12}
              marks={[
                { value: 1, label: "1" },
                { value: 6, label: "6" },
                { value: 12, label: "12" },
              ]}
              valueLabelDisplay="auto"
            />
          </Box>

          {/* Info Box */}
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: "info.main",
              color: "info.contrastText",
            }}
          >
            <Typography variant="body2">
              <Icon
                icon="mdi:information"
                width={16}
                style={{ verticalAlign: "middle", marginRight: 4 }}
              />
              L'analyse peut prendre plusieurs minutes selon le nombre de
              parties et la profondeur choisie.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          startIcon={<Icon icon="mdi:play" />}
        >
          Lancer l'analyse
        </Button>
      </DialogActions>
    </Dialog>
  );
}
