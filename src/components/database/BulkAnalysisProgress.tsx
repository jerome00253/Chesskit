import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
  Typography,
  Stack,
  Box,
  Alert,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useState } from "react";

export interface BulkAnalysisState {
  isAnalyzing: boolean;
  currentGameIndex: number;
  totalGames: number;
  currentGameProgress: number; // 0-100
  currentGameMoves?: { current: number; total: number };
  error: string | null;
}

interface Props {
  open: boolean;
  state: BulkAnalysisState;
  onCancel: () => void;
  onClose?: () => void;
}

export default function BulkAnalysisProgress({
  open,
  state,
  onCancel,
  onClose,
}: Props) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const {
    isAnalyzing,
    currentGameIndex,
    totalGames,
    currentGameProgress,
    currentGameMoves,
    error,
  } = state;

  const overallProgress =
    totalGames > 0 ? (currentGameIndex / totalGames) * 100 : 0;

  const handleCancelClick = () => {
    if (isAnalyzing) {
      setShowCancelConfirm(true);
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelConfirm(false);
    onCancel();
  };

  const isComplete = !isAnalyzing && currentGameIndex === totalGames && !error;

  return (
    <Dialog
      open={open}
      onClose={isComplete ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isAnalyzing}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" gap={1}>
          <Icon
            icon={
              error
                ? "mdi:alert-circle"
                : isComplete
                  ? "mdi:check-circle"
                  : "mdi:loading"
            }
            width={24}
            height={24}
            className={isAnalyzing ? "rotating" : ""}
          />
          <Typography variant="h6">
            {error
              ? "Erreur d'analyse"
              : isComplete
                ? "Analyse terminée"
                : "Analyse en cours..."}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" icon={<Icon icon="mdi:alert" />}>
              {error}
            </Alert>
          )}

          {/* Current Game Progress */}
          {!error && (
            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography variant="body2" color="text.secondary">
                  Analyse de la partie {currentGameIndex + 1}/{totalGames}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {currentGameProgress.toFixed(0)}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={currentGameProgress}
                sx={{ height: 8, borderRadius: 1 }}
              />
              {currentGameMoves && (
                <Typography variant="caption" color="text.secondary" mt={0.5}>
                  Coups analysés : {currentGameMoves.current}/
                  {currentGameMoves.total}
                </Typography>
              )}
            </Box>
          )}

          {/* Overall Progress */}
          {!error && (
            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography variant="body2" color="text.secondary">
                  Parties analysées : {currentGameIndex}/{totalGames}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {overallProgress.toFixed(0)}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={overallProgress}
                sx={{ height: 8, borderRadius: 1 }}
                color="success"
              />
            </Box>
          )}

          {/* Success Message */}
          {isComplete && (
            <Alert severity="success" icon={<Icon icon="mdi:check" />}>
              {totalGames}{" "}
              {totalGames > 1 ? "parties analysées" : "partie analysée"} avec
              succès !
            </Alert>
          )}

          {/* Cancel Confirmation */}
          {showCancelConfirm && (
            <Alert
              severity="warning"
              icon={<Icon icon="mdi:alert" />}
              action={
                <Stack direction="row" gap={1}>
                  <Button
                    size="small"
                    onClick={() => setShowCancelConfirm(false)}
                  >
                    Non
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="contained"
                    onClick={handleConfirmCancel}
                  >
                    Oui
                  </Button>
                </Stack>
              }
            >
              Voulez-vous vraiment annuler l'analyse ?
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        {isAnalyzing && !showCancelConfirm && (
          <Button
            onClick={handleCancelClick}
            color="error"
            startIcon={<Icon icon="mdi:stop" />}
          >
            Annuler
          </Button>
        )}
        {(isComplete || error) && (
          <Button
            onClick={onClose}
            variant="contained"
            startIcon={<Icon icon="mdi:close" />}
          >
            Fermer
          </Button>
        )}
      </DialogActions>

      <style jsx global>{`
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .rotating {
          animation: rotate 2s linear infinite;
        }
      `}</style>
    </Dialog>
  );
}
