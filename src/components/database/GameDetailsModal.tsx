import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Avatar,
  Chip,
  Link,
  Divider,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { Game } from "@/types/game";
import { useTranslations } from "next-intl";

interface GameDetailsModalProps {
  open: boolean;
  onClose: () => void;
  game: Game | null;
}

export function GameDetailsModal({
  open,
  onClose,
  game,
}: GameDetailsModalProps) {
  const t = useTranslations("Database");

  if (!game) return null;

  // Determine winner
  const getWinnerInfo = () => {
    if (game.result === "1-0")
      return { winner: game.white.name, color: "white" };
    if (game.result === "0-1")
      return { winner: game.black.name, color: "black" };
    return { winner: "Nulle", color: "draw" };
  };

  const winnerInfo = getWinnerInfo();

  // Result color
  const getResultColor = () => {
    if (game.result === "1-0") return "success.main";
    if (game.result === "0-1") return "error.main";
    return "warning.main";
  };

  // Format termination with translation
  const formatTermination = (termination: string | undefined) => {
    if (!termination) return "—";

    const lowerTerm = termination.toLowerCase();
    const winner = getWinnerInfo().winner;

    if (lowerTerm.includes("checkmate") || lowerTerm.includes("mate")) {
      return t("termination.won_by_checkmate", { winner });
    } else if (
      lowerTerm.includes("resignation") ||
      lowerTerm.includes("abandon")
    ) {
      return t("termination.won_by_resignation", { winner });
    } else if (lowerTerm.includes("time") || lowerTerm.includes("timeout")) {
      return `${winner} a gagné au temps`;
    } else if (lowerTerm.includes("stalemate")) {
      return t("termination.draw_by_stalemate");
    } else if (lowerTerm.includes("insufficient")) {
      return t("termination.draw_by_insufficient_material");
    } else if (lowerTerm.includes("repetition")) {
      return t("termination.draw_by_threefold_repetition");
    } else if (lowerTerm.includes("fifty")) {
      return t("termination.draw_by_fifty_move_rule");
    }

    return termination;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          Détails de la partie
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Icon icon="mdi:close" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {/* Players Section */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            {/* White Player */}
            <Grid item xs={5}>
              <Card
                elevation={game.userColor === "white" ? 8 : 2}
                sx={{
                  bgcolor:
                    game.userColor === "white"
                      ? "primary.light"
                      : "background.paper",
                  border: game.result === "1-0" ? 3 : 0,
                  borderColor: "success.main",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ bgcolor: "grey.300", width: 56, height: 56 }}>
                      <Icon icon="mdi:chess-king" width={32} color="#000" />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {game.white.name}
                        {game.userColor === "white" && (
                          <Chip
                            label="Moi"
                            size="small"
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      {game.white.rating && (
                        <Typography variant="body2" color="text.secondary">
                          Elo: {game.white.rating}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* VS & Result */}
            <Grid item xs={2} sx={{ textAlign: "center" }}>
              <Typography
                variant="h4"
                fontWeight="bold"
                color={getResultColor()}
              >
                {game.result || "?"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                VS
              </Typography>
            </Grid>

            {/* Black Player */}
            <Grid item xs={5}>
              <Card
                elevation={game.userColor === "black" ? 8 : 2}
                sx={{
                  bgcolor:
                    game.userColor === "black"
                      ? "primary.light"
                      : "background.paper",
                  border: game.result === "0-1" ? 3 : 0,
                  borderColor: "success.main",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ bgcolor: "grey.800", width: 56, height: 56 }}>
                      <Icon icon="mdi:chess-king" width={32} color="#fff" />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {game.black.name}
                        {game.userColor === "black" && (
                          <Chip
                            label="Moi"
                            size="small"
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      {game.black.rating && (
                        <Typography variant="body2" color="text.secondary">
                          Elo: {game.black.rating}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Game Information */}
        <Grid container spacing={2}>
          {/* Event & Site */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Icon icon="mdi:trophy" width={20} color="primary" />
              <Typography variant="subtitle2" color="text.secondary">
                Événement
              </Typography>
            </Box>
            <Typography variant="body1" fontWeight="500">
              {game.event || "—"}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Icon icon="mdi:web" width={20} color="primary" />
              <Typography variant="subtitle2" color="text.secondary">
                Plateforme
              </Typography>
            </Box>
            {game.site && game.site.startsWith("http") ? (
              <Link
                href={game.site}
                target="_blank"
                rel="noopener"
                underline="hover"
              >
                <Typography variant="body1" fontWeight="500">
                  {game.site}
                </Typography>
              </Link>
            ) : (
              <Typography variant="body1" fontWeight="500">
                {game.site || "—"}
              </Typography>
            )}
          </Grid>

          {/* Date */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Icon icon="mdi:calendar" width={20} color="primary" />
              <Typography variant="subtitle2" color="text.secondary">
                Date
              </Typography>
            </Box>
            <Typography variant="body1" fontWeight="500">
              {game.date
                ? new Date(game.date).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            </Typography>
          </Grid>

          {/* Time Control */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Icon icon="mdi:clock-outline" width={20} color="primary" />
              <Typography variant="subtitle2" color="text.secondary">
                Cadence
              </Typography>
            </Box>
            <Typography variant="body1" fontWeight="500">
              {game.timeControl || "—"}
            </Typography>
          </Grid>

          {/* Opening */}
          {game.openingName && (
            <Grid item xs={12}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <Icon icon="mdi:book-open-variant" width={20} color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Ouverture
                </Typography>
              </Box>
              <Box>
                <Typography variant="body1" fontWeight="500">
                  {game.openingName}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  {game.openingECO && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      component="span"
                    >
                      {game.openingECO}
                    </Typography>
                  )}
                  {game.openingECO && game.openingName && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      component="span"
                      sx={{ mx: 0.5 }}
                    >
                      •
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    component="span"
                    sx={{ fontStyle: "italic" }}
                  >
                    {game.openingName}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          {/* Termination */}
          {game.termination && (
            <Grid item xs={12}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <Icon icon="mdi:flag-checkered" width={20} color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Fin de partie
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight="500">
                {formatTermination(game.termination)}
              </Typography>
            </Grid>
          )}

          {/* Winner */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Icon icon="mdi:medal" width={20} color="primary" />
              <Typography variant="subtitle2" color="text.secondary">
                Résultat
              </Typography>
            </Box>
            <Chip
              label={winnerInfo.winner}
              color={
                winnerInfo.color === "white"
                  ? "default"
                  : winnerInfo.color === "black"
                    ? "primary"
                    : "warning"
              }
              sx={{ fontWeight: "bold" }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Analysis Statistics Section */}
        {game.analyzed && (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Icon icon="mdi:brain" width={24} />
                Statistiques d'analyse
              </Typography>

              {/* Engine Info */}
              <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                {game.engineName && (
                  <Chip
                    icon={<Icon icon="mdi:engine" width={16} />}
                    label={game.engineName}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                {game.engineDepth && (
                  <Chip
                    icon={<Icon icon="mdi:layers" width={16} />}
                    label={`Profondeur: ${game.engineDepth}`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                )}
              </Box>

              <Grid container spacing={2}>
                {/* White Player Stats */}
                <Grid item xs={12} md={6}>
                  <Card
                    variant="outlined"
                    sx={{ bgcolor: "background.default" }}
                  >
                    <CardContent>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        gutterBottom
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Icon icon="mdi:chess-king" width={20} />
                        {game.white.name}
                      </Typography>

                      {/* Accuracy */}
                      {game.whiteAccuracy != null && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Précision
                          </Typography>
                          <Typography
                            variant="h5"
                            fontWeight="bold"
                            color="primary.main"
                          >
                            {game.whiteAccuracy.toFixed(1)}%
                          </Typography>
                        </Box>
                      )}

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Qualité des coups
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        {(game.whiteBrilliant ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              💎 Brillant
                            </Typography>
                            <Chip
                              label={game.whiteBrilliant}
                              size="small"
                              color="success"
                            />
                          </Box>
                        )}
                        {(game.whiteSplendid ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              ✨ Splendide
                            </Typography>
                            <Chip
                              label={game.whiteSplendid}
                              size="small"
                              sx={{ bgcolor: "#00bcd4" }}
                            />
                          </Box>
                        )}
                        {(game.whitePerfect ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              🔵 Seul bon
                            </Typography>
                            <Chip
                              label={game.whitePerfect}
                              size="small"
                              sx={{ bgcolor: "#2196f3" }}
                            />
                          </Box>
                        )}
                        {(game.whiteBest ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              ⭐ Meilleur
                            </Typography>
                            <Chip
                              label={game.whiteBest}
                              size="small"
                              sx={{ bgcolor: "#4caf50" }}
                            />
                          </Box>
                        )}
                        {(game.whiteExcellent ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              ✅ Excellent
                            </Typography>
                            <Chip
                              label={game.whiteExcellent}
                              size="small"
                              sx={{ bgcolor: "#8bc34a" }}
                            />
                          </Box>
                        )}
                        {(game.whiteOkay ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              👍 Correct
                            </Typography>
                            <Chip
                              label={game.whiteOkay}
                              size="small"
                              sx={{ bgcolor: "#cddc39" }}
                            />
                          </Box>
                        )}
                        {(game.whiteOpening ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              📖 Ouverture
                            </Typography>
                            <Chip
                              label={game.whiteOpening}
                              size="small"
                              sx={{ bgcolor: "#dbac86" }}
                            />
                          </Box>
                        )}
                        {(game.whiteInaccuracy ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              ⚠️ Imprécision
                            </Typography>
                            <Chip
                              label={game.whiteInaccuracy}
                              size="small"
                              sx={{ bgcolor: "#f2be1f" }}
                            />
                          </Box>
                        )}
                        {(game.whiteMistakes ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">❌ Erreur</Typography>
                            <Chip
                              label={game.whiteMistakes}
                              size="small"
                              sx={{ bgcolor: "#ff9800" }}
                            />
                          </Box>
                        )}
                        {(game.whiteBlunders ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">💥 Gaffe</Typography>
                            <Chip
                              label={game.whiteBlunders}
                              size="small"
                              color="error"
                            />
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Black Player Stats */}
                <Grid item xs={12} md={6}>
                  <Card
                    variant="outlined"
                    sx={{ bgcolor: "background.default" }}
                  >
                    <CardContent>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        gutterBottom
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Icon icon="mdi:chess-king" width={20} />
                        {game.black.name}
                      </Typography>

                      {/* Accuracy */}
                      {game.blackAccuracy != null && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Précision
                          </Typography>
                          <Typography
                            variant="h5"
                            fontWeight="bold"
                            color="primary.main"
                          >
                            {game.blackAccuracy.toFixed(1)}%
                          </Typography>
                        </Box>
                      )}

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Qualité des coups
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        {(game.blackBrilliant ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              💎 Brillant
                            </Typography>
                            <Chip
                              label={game.blackBrilliant}
                              size="small"
                              color="success"
                            />
                          </Box>
                        )}
                        {(game.blackSplendid ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              ✨ Splendide
                            </Typography>
                            <Chip
                              label={game.blackSplendid}
                              size="small"
                              sx={{ bgcolor: "#00bcd4" }}
                            />
                          </Box>
                        )}
                        {(game.blackPerfect ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              🔵 Seul bon
                            </Typography>
                            <Chip
                              label={game.blackPerfect}
                              size="small"
                              sx={{ bgcolor: "#2196f3" }}
                            />
                          </Box>
                        )}
                        {(game.blackBest ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              ⭐ Meilleur
                            </Typography>
                            <Chip
                              label={game.blackBest}
                              size="small"
                              sx={{ bgcolor: "#4caf50" }}
                            />
                          </Box>
                        )}
                        {(game.blackExcellent ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              ✅ Excellent
                            </Typography>
                            <Chip
                              label={game.blackExcellent}
                              size="small"
                              sx={{ bgcolor: "#8bc34a" }}
                            />
                          </Box>
                        )}
                        {(game.blackOkay ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              👍 Correct
                            </Typography>
                            <Chip
                              label={game.blackOkay}
                              size="small"
                              sx={{ bgcolor: "#cddc39" }}
                            />
                          </Box>
                        )}
                        {(game.blackOpening ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              📖 Ouverture
                            </Typography>
                            <Chip
                              label={game.blackOpening}
                              size="small"
                              sx={{ bgcolor: "#dbac86" }}
                            />
                          </Box>
                        )}
                        {(game.blackInaccuracy ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              ⚠️ Imprécision
                            </Typography>
                            <Chip
                              label={game.blackInaccuracy}
                              size="small"
                              sx={{ bgcolor: "#f2be1f" }}
                            />
                          </Box>
                        )}
                        {(game.blackMistakes ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">❌ Erreur</Typography>
                            <Chip
                              label={game.blackMistakes}
                              size="small"
                              sx={{ bgcolor: "#ff9800" }}
                            />
                          </Box>
                        )}
                        {(game.blackBlunders ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">💥 Gaffe</Typography>
                            <Chip
                              label={game.blackBlunders}
                              size="small"
                              color="error"
                            />
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />
          </>
        )}

        {/* Links */}
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Liens
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {game.gameUrl && (
              <Link
                href={game.gameUrl}
                target="_blank"
                rel="noopener"
                underline="hover"
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Icon icon="mdi:open-in-new" width={18} />
                  <Typography variant="body2">
                    Voir la partie en ligne
                  </Typography>
                </Box>
              </Link>
            )}
            {game.ecoUrl && (
              <Link
                href={game.ecoUrl}
                target="_blank"
                rel="noopener"
                underline="hover"
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Icon icon="mdi:information-outline" width={18} />
                  <Typography variant="body2">Info sur l'ouverture</Typography>
                </Box>
              </Link>
            )}
            {!game.gameUrl && !game.ecoUrl && (
              <Typography variant="body2" color="text.secondary">
                Aucun lien disponible
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
