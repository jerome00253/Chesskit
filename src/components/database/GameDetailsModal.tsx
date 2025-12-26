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

interface GameDetailsModalProps {
  open: boolean;
  onClose: () => void;
  game: Game | null;
}

export function GameDetailsModal({ open, onClose, game }: GameDetailsModalProps) {
  if (!game) return null;

  // Determine winner
  const getWinnerInfo = () => {
    if (game.result === "1-0") return { winner: game.white.name, color: "white" };
    if (game.result === "0-1") return { winner: game.black.name, color: "black" };
    return { winner: "Nulle", color: "draw" };
  };

  const winnerInfo = getWinnerInfo();

  // Result color
  const getResultColor = () => {
    if (game.result === "1-0") return "success.main";
    if (game.result === "0-1") return "error.main";
    return "warning.main";
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
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
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
                  bgcolor: game.userColor === "white" ? "primary.light" : "background.paper",
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
                          <Chip label="Moi" size="small" color="primary" sx={{ ml: 1 }} />
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
              <Typography variant="h4" fontWeight="bold" color={getResultColor()}>
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
                  bgcolor: game.userColor === "black" ? "primary.light" : "background.paper",
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
                          <Chip label="Moi" size="small" color="primary" sx={{ ml: 1 }} />
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
              <Link href={game.site} target="_blank" rel="noopener" underline="hover">
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
              {game.date || "—"}
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Icon icon="mdi:book-open-variant" width={20} color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Ouverture
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body1" fontWeight="500">
                  {game.openingName}
                </Typography>
                {game.openingECO && (
                  <Chip label={game.openingECO} size="small" color="secondary" />
                )}
              </Box>
            </Grid>
          )}

          {/* Termination */}
          {game.termination && (
            <Grid item xs={12}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Icon icon="mdi:flag-checkered" width={20} color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Fin de partie
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight="500">
                {game.termination}
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
              color={winnerInfo.color === "white" ? "default" : winnerInfo.color === "black" ? "primary" : "warning"}
              sx={{ fontWeight: "bold" }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Links */}
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Liens
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {game.gameUrl && (
              <Link href={game.gameUrl} target="_blank" rel="noopener" underline="hover">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Icon icon="mdi:open-in-new" width={18} />
                  <Typography variant="body2">Voir la partie en ligne</Typography>
                </Box>
              </Link>
            )}
            {game.ecoUrl && (
              <Link href={game.ecoUrl} target="_blank" rel="noopener" underline="hover">
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
