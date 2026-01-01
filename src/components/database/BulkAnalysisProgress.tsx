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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { useTranslations } from "next-intl";

export interface BulkAnalysisState {
  isAnalyzing: boolean;
  currentGameIndex: number;
  totalGames: number;
  currentGameProgress: number; // 0-100
  currentGameMoves?: { current: number; total: number };
  error: string | null;
  successCount?: number;
  failureCount?: number;
  failedGames?: Array<{
    id: number;
    white: string;
    black: string;
    error: string;
  }>;
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
  const t = useTranslations("Database.BulkAnalysis");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const {
    isAnalyzing,
    currentGameIndex,
    totalGames,
    currentGameProgress,
    currentGameMoves,
    error,
    successCount = 0,
    failureCount = 0,
    failedGames = [],
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

  const isComplete = !isAnalyzing && currentGameIndex === totalGames;

  // Determine dialog title icon
  let titleIcon = "mdi:loading";
  let titleIconClass = isAnalyzing ? "rotating" : "";
  if (error) {
    titleIcon = "mdi:alert-circle";
    titleIconClass = "";
  } else if (isComplete) {
    titleIcon = failureCount > 0 ? "mdi:alert" : "mdi:check-circle";
    titleIconClass = "";
  }

  // Determine dialog title text
  let titleText = t("analyzing");
  if (error) titleText = t("error_title");
  else if (isComplete)
    titleText =
      failureCount > 0 ? t("completed_with_errors") : t("analysis_complete");

  return (
    <Dialog
      open={open}
      onClose={isComplete || error ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isAnalyzing}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" gap={1}>
          <Icon
            icon={titleIcon}
            width={24}
            height={24}
            className={titleIconClass}
            color={
              error || (isComplete && failureCount > 0)
                ? "#d32f2f" // error red
                : isComplete
                  ? "#2e7d32" // success green
                  : "inherit"
            }
          />
          <Typography variant="h6">{titleText}</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Global Fatal Error Alert */}
          {error && (
            <Alert severity="error" icon={<Icon icon="mdi:alert" />}>
              {error}
            </Alert>
          )}

          {/* Progress Section (during analysis) */}
          {!error && !isComplete && (
            <>
              {/* Current Game Progress */}
              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t("analyzing_game_progress", {
                      current: currentGameIndex + 1,
                      total: totalGames,
                    })}
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
                    {t("moves_analyzed", {
                      current: currentGameMoves.current,
                      total: currentGameMoves.total,
                    })}
                  </Typography>
                )}
              </Box>

              {/* Overall Progress */}
              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t("overall_progress", {
                      current: currentGameIndex,
                      total: totalGames,
                    })}
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
            </>
          )}

          {/* Completion Summary */}
          {isComplete && !error && (
            <Box>
              <Alert
                severity={failureCount > 0 ? "warning" : "success"}
                icon={
                  <Icon
                    icon={failureCount > 0 ? "mdi:alert" : "mdi:check-circle"}
                  />
                }
                sx={{ mb: 2 }}
              >
                {t("summary_message", {
                  total: totalGames,
                  success: successCount,
                  failed: failureCount,
                })}
              </Alert>

              {/* Counts */}
              <Stack direction="row" spacing={4} justifyContent="center" mb={2}>
                <Stack alignItems="center">
                  <Typography variant="h4" color="success.main">
                    {successCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("success_count")}
                  </Typography>
                </Stack>
                <Divider orientation="vertical" flexItem />
                <Stack alignItems="center">
                  <Typography
                    variant="h4"
                    color={failureCount > 0 ? "error.main" : "text.secondary"}
                  >
                    {failureCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("failure_count")}
                  </Typography>
                </Stack>
              </Stack>

              {/* Failed Games List */}
              {failureCount > 0 && failedGames.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    {t("failed_games_list")}:
                  </Typography>
                  <Box
                    sx={{
                      maxHeight: 200,
                      overflowY: "auto",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      bgcolor: "background.paper",
                    }}
                  >
                    <List dense disablePadding>
                      {failedGames.map((fail, index) => (
                        <ListItem key={fail.id} divider>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Icon
                              icon="mdi:close-circle"
                              color="#d32f2f"
                              width={20}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${fail.white} vs ${fail.black}`}
                            secondary={fail.error}
                            primaryTypographyProps={{ variant: "body2" }}
                            secondaryTypographyProps={{
                              variant: "caption",
                              color: "error",
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Box>
              )}
            </Box>
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
                    {t("no")}
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="contained"
                    onClick={handleConfirmCancel}
                  >
                    {t("yes")}
                  </Button>
                </Stack>
              }
            >
              {t("confirm_cancel")}
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
            {t("cancel_button")}
          </Button>
        )}
        {(isComplete || error) && (
          <Button
            onClick={onClose}
            variant="contained"
            startIcon={<Icon icon="mdi:close" />}
          >
            {t("close_button")}
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
