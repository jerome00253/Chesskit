import {
  Grid2 as Grid,
  Typography,
  Chip,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Checkbox,
  Toolbar,
} from "@mui/material";
import { Icon } from "@iconify/react";
import {
  DataGrid,
  GridColDef,
  GridLocaleText,
  GRID_DEFAULT_LOCALE_TEXT,
  GridRowId,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { blue, red, green } from "@mui/material/colors";
import LoadGameButton from "@/sections/loadGame/loadGameButton";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useRouter } from "next/router";
import { PageTitle } from "@/components/pageTitle";
import { getStaticPaths, getStaticProps } from "@/lib/i18n";
import { useTranslations } from "next-intl";
import { EditGameDialog } from "@/components/database/EditGameDialog";
import { GameDetailsModal } from "@/components/database/GameDetailsModal";
import { Game } from "@/types/game";
import { useSession } from "next-auth/react";
import {
  parseTimeControl,
  getMoveCount,
  formatDuration,
  estimateGameDuration,
  getGameTypeLabel,
} from "@/lib/statsHelpers";

export { getStaticPaths, getStaticProps };

type GameFilter = "all" | "my" | "reference";

export default function GameDatabase() {
  const t = useTranslations("Database");
  const { data: session } = useSession();
  const { games, deleteGame, updateGame } = useGameDatabase(true);
  const router = useRouter();
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [gameFilter, setGameFilter] = useState<GameFilter>("all");
  
  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Actions menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuGameId, setMenuGameId] = useState<number | null>(null);
  
  // Details modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedGameForDetails, setSelectedGameForDetails] = useState<Game | null>(null);
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<"single" | "bulk">("single");

  const gridLocaleText: GridLocaleText = useMemo(
    () => ({
      ...GRID_DEFAULT_LOCALE_TEXT,
      noRowsLabel: t("no_games_found"),
    }),
    [t]
  );

  // Calculate game counts
  const gameCounts = useMemo(() => {
    if (!session?.user?.name) {
      return { my: 0, reference: 0, all: games.length };
    }

    const userName = session.user.name;
    const myGames = games.filter(
      (g) =>
        g.userColor === "white" ||
        g.userColor === "black" ||
        g.white.name === userName ||
        g.black.name === userName
    );

    return {
      my: myGames.length,
      reference: games.length - myGames.length,
      all: games.length,
    };
  }, [games, session]);

  // Filter games based on selected filter
  const filteredGames = useMemo(() => {
    if (!session?.user?.name || gameFilter === "all") {
      return games;
    }

    const userName = session.user.name;

    if (gameFilter === "my") {
      return games.filter(
        (game) =>
          game.userColor === "white" ||
          game.userColor === "black" ||
          game.white.name === userName ||
          game.black.name === userName
      );
    } else if (gameFilter === "reference") {
      return games.filter(
        (game) =>
          game.userColor !== "white" &&
          game.userColor !== "black" &&
          game.white.name !== userName &&
          game.black.name !== userName
      );
    }

    return games;
  }, [games, gameFilter, session]);

  // Stabilize games access for callbacks
  const gamesRef = useRef(games);
  useEffect(() => {
    gamesRef.current = games;
  }, [games]);

  // Multi-select handlers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredGames.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredGames.map((g) => g.id));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Actions menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, id: number) => {
    setAnchorEl(event.currentTarget);
    setMenuGameId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuGameId(null);
  };

  const handleAnalyze = (game: any) => {
    const locale = router.locale || "fr";
    router.push(`/${locale}/analysis?gameId=${game.id}`);
    handleMenuClose();
  };

  const handleEdit = () => {
    if (menuGameId !== null) {
      const game = gamesRef.current.find((g) => g.id === menuGameId);
      if (game) {
        setEditingGame(game);
      }
    }
    handleMenuClose();
  };

  const handleCopyPGN = async () => {
    if (menuGameId !== null) {
      const game = gamesRef.current.find((g) => g.id === menuGameId);
      if (game) {
        await navigator.clipboard?.writeText?.(game.pgn);
      }
    }
    handleMenuClose();
  };

  const handleExportSinglePGN = () => {
    if (menuGameId !== null) {
      handleExportPGN([menuGameId]);
    }
    handleMenuClose();
  };

  const handleDeleteSingle = () => {
    setDeleteTarget("single");
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  // Bulk actions handlers
  const handleBulkDelete = () => {
    setDeleteTarget("bulk");
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTarget === "single" && menuGameId !== null) {
      await deleteGame(menuGameId);
    } else if (deleteTarget === "bulk" && selectedIds.length > 0) {
      try {
        const response = await fetch("/api/games/bulk", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameIds: selectedIds }),
        });

        if (response.ok) {
          // Refresh games list
          window.location.reload();
        }
      } catch (error) {
        console.error("Bulk delete failed:", error);
      }
    }
    setDeleteDialogOpen(false);
    setSelectedIds([]);
  };

  // Export PGN handlers
  const handleExportPGN = (gameIds: number[]) => {
    const gamesToExport = gamesRef.current.filter((g) => gameIds.includes(g.id));
    const pgns = gamesToExport.map((g) => g.pgn).join("\n\n");
    const blob = new Blob([pgns], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chess-games-${new Date().toISOString().split("T")[0]}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    handleExportPGN(filteredGames.map((g) => g.id));
  };

  const handleExportSelected = () => {
    handleExportPGN(selectedIds);
  };

  // Column definitions
  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "select",
        headerName: "",
        width: 80,
        sortable: false,
        disableColumnMenu: true,
        renderHeader: () => (
          <Checkbox
            indeterminate={
              selectedIds.length > 0 && selectedIds.length < filteredGames.length
            }
            checked={selectedIds.length === filteredGames.length && filteredGames.length > 0}
            onChange={handleSelectAll}
          />
        ),
        renderCell: (params: GridRenderCellParams) => (
          <Checkbox
            checked={selectedIds.includes(params.row.id)}
            onChange={() => handleToggleSelect(params.row.id)}
          />
        ),
      },
      {
        field: "date",
        headerName: t("columns.date"),
        flex: 0.8,
        minWidth: 90,
        valueGetter: (_, row) => {
          if (!row.date) return "—";
          const date = new Date(row.date);
          if (isNaN(date.getTime())) return "—";
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        },
      },
      {
        field: "gameType",
        headerName: "Type",
        flex: 0.7,
        minWidth: 80,
        valueGetter: (_, row) => {
          const timeControl = parseTimeControl(row.pgn);
          return getGameTypeLabel(timeControl.type);
        },
      },
      {
        field: "players",
        headerName: "Joueurs",
        flex: 1.8,
        minWidth: 220,
        renderCell: (params: GridRenderCellParams) => {
          const isWhiteUser = params.row.userColor === "white";
          const isBlackUser = params.row.userColor === "black";
          
          const whiteElo = params.row.white.rating ? ` (${params.row.white.rating})` : '';
          const blackElo = params.row.black.rating ? ` (${params.row.black.rating})` : '';
          
          // Determine winner/loser/draw colors
          const getPlayerColor = (isWhite: boolean) => {
            const result = params.row.result;
            if (result === "1/2-1/2") return "warning"; // Draw - orange
            if (result === "1-0") return isWhite ? "success" : "error"; // White won
            if (result === "0-1") return isWhite ? "error" : "success"; // Black won
            return "default";
          };
          
          const whiteColor = getPlayerColor(true);
          const blackColor = getPlayerColor(false);
          
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, py: 0.5 }}>
              {/* White player line */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Chip
                  icon={isWhiteUser ? <Icon icon="mdi:account" width={12} /> : undefined}
                  label={`${params.row.white.name}${whiteElo}`}
                  size="small"
                  variant="filled"
                  color={whiteColor}
                  sx={{ fontSize: '0.7rem', height: 20, '& .MuiChip-label': { px: 1 } }}
                />
              </Box>
              {/* Black player line (indented) */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, pl: 4 }}>
                <Chip
                  icon={isBlackUser ? <Icon icon="mdi:account" width={12} /> : undefined}
                  label={`${params.row.black.name}${blackElo}`}
                  size="small"
                  variant="filled"
                  color={blackColor}
                  sx={{ fontSize: '0.7rem', height: 20, '& .MuiChip-label': { px: 1 } }}
                />
              </Box>
            </Box>
          );
        },
      },

      {
        field: "moves",
        headerName: "Coups",
        flex: 0.5,
        minWidth: 60,
        align: "center",
        headerAlign: "center",
        valueGetter: (_, row) => getMoveCount(row.pgn),
      },
      {
        field: "duration",
        headerName: "Durée",
        flex: 0.9,
        minWidth: 95,
        valueGetter: (_, row) => {
          // Use initialTime and increment if available
          if (row.initialTime !== null && row.initialTime !== undefined) {
            const minutes = Math.floor(row.initialTime / 60);
            const incrementText = row.increment ? ` (+${row.increment})` : '';
            return `${minutes}min${incrementText}`;
          }
          // Fallback to estimated duration
          const seconds = estimateGameDuration(row);
          return formatDuration(seconds);
        },
      },
      {
        field: "analysis",
        headerName: "Analyse",
        flex: 1.2,
        minWidth: 140,
        align: "center",
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams) => {
          if (!params.row.analyzed || !params.row.engineName) {
            return <Typography variant="body2" color="text.secondary">—</Typography>;
          }
          
          // Extract version from engine name (e.g., "Stockfish 17" -> "V17")
          const versionMatch = params.row.engineName.match(/(\d+)/);
          const version = versionMatch ? `V${versionMatch[1]}` : params.row.engineName;
          
          // Check if it's a lite version
          const isLite = params.row.engineName.toLowerCase().includes('lite');
          const versionLabel = isLite ? `${version} Lite` : version;
          
          return (
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", justifyContent: "center", height: '100%' }}>
              <Chip 
                label={versionLabel} 
                size="small" 
                color="primary" 
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
              {params.row.engineDepth && (
                <Chip 
                  label={`${params.row.engineDepth}`}
                  size="small" 
                  color="secondary" 
                  variant="filled"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}
            </Box>
          );
        },
      },
      {
        field: "opening",
        headerName: "Ouverture",
        flex: 1.5,
        minWidth: 150,
        align: "center",
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams) => {
          if (!params.row.openingECO && !params.row.openingName) {
            return <Typography variant="body2" color="text.secondary">—</Typography>;
          }
          
          return (
            <Chip 
              label={
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 0.3 }}>
                  {params.row.openingECO && (
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, lineHeight: 1.2 }}>
                      {params.row.openingECO}
                    </Typography>
                  )}
                  {params.row.openingName && (
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', lineHeight: 1.2, opacity: 0.8 }}>
                      {params.row.openingName.length > 20 
                        ? `${params.row.openingName.substring(0, 18)}...`
                        : params.row.openingName
                      }
                    </Typography>
                  )}
                </Box>
              }
              size="small"
              variant="outlined"
              color="default"
              sx={{ 
                fontSize: '0.7rem', 
                height: 'auto',
                minHeight: 28,
                '& .MuiChip-label': {
                  px: 1,
                  py: 0.5
                }
              }}
            />
          );
        },
      },
      {
        field: "result",
        headerName: t("columns.result"),
        headerAlign: "center",
        align: "center",
        flex: 0.7,
        minWidth: 75,
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
              {params.row.result}
            </Typography>
          </Box>
        ),
      },
      {
        field: "actions",
        headerName: "",
        width: 170,
        sortable: false,
        disableColumnMenu: true,
        align: "center",
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center", alignItems: "center", height: "100%" }}>
            <IconButton
              size="small"
              onClick={() => {
                setSelectedGameForDetails(params.row);
                setDetailsModalOpen(true);
              }}
              title="Voir détails"
              sx={{ color: '#1976d2' }}
            >
              <Icon icon="mdi:eye" width={18} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleAnalyze(params.row)}
              title="Analyser"
              sx={{ color: params.row.analyzed ? '#4caf50' : '#9e9e9e' }}
            >
              <Icon icon="mdi:chart-line" width={18} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setEditingGame(params.row)}
              title="Éditer"
              sx={{ color: '#ff9800' }}
            >
              <Icon icon="mdi:pencil" width={18} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => {
                setMenuGameId(params.row.id);
                setDeleteDialogOpen(true);
              }}
              title="Supprimer"
              sx={{ color: '#f44336' }}
            >
              <Icon icon="mdi:delete" width={18} />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => handleMenuOpen(e, params.row.id)}
              title="Exporter"
              sx={{ color: '#9c27b0' }}
            >
              <Icon icon="mdi:download" width={18} />
            </IconButton>
          </Box>
        ),
      },
    ],
    [t, selectedIds, filteredGames]
  );

  return (
    <Box sx={{ p: 3 }}>
      <PageTitle title={t("title")} />

      {/* Filter Chips */}
      <Box sx={{ mb: 2, display: "flex", gap: 1 }}>
        <Chip
          label={`${t("filter_all")} (${gameCounts.all})`}
          onClick={() => setGameFilter("all")}
          color={gameFilter === "all" ? "primary" : "default"}
        />
        <Chip
          label={`${t("filter_my_games")} (${gameCounts.my})`}
          onClick={() => setGameFilter("my")}
          color={gameFilter === "my" ? "primary" : "default"}
        />
        <Chip
          label={`${t("filter_reference")} (${gameCounts.reference})`}
          onClick={() => setGameFilter("reference")}
          color={gameFilter === "reference" ? "primary" : "default"}
        />
      </Box>

      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <Toolbar
          sx={{
            mb: 2,
            bgcolor: "primary.light",
            borderRadius: 1,
            display: "flex",
            gap: 2,
          }}
        >
          <Typography variant="subtitle1" sx={{ flex: 1 }}>
            {selectedIds.length} partie(s) sélectionnée(s)
          </Typography>
          <Button
            startIcon={<Icon icon="mdi:download" />}
            onClick={handleExportSelected}
            variant="contained"
            size="small"
          >
            Exporter PGN
          </Button>
          <Button
            startIcon={<Icon icon="mdi:delete" />}
            onClick={handleBulkDelete}
            color="error"
            variant="contained"
            size="small"
          >
            Supprimer
          </Button>
          <Button onClick={() => setSelectedIds([])} size="small">
            Annuler
          </Button>
        </Toolbar>
      )}

      {/* Global Actions */}
      <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
        <LoadGameButton />
        <Button
          variant="outlined"
          startIcon={<Icon icon="mdi:download" />}
          onClick={handleExportAll}
        >
          Exporter tout (PGN)
        </Button>
      </Box>

      {/* DataGrid */}
      <DataGrid
        rows={filteredGames}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 25 },
          },
        }}
        pageSizeOptions={[25, 50, 100]}
        localeText={gridLocaleText}
        disableRowSelectionOnClick
        sx={{ 
          height: 650,
          width: '100%',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'action.hover',
          }
        }}
      />

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleCopyPGN}>
          <Icon icon="mdi:content-copy" style={{ marginRight: 8 }} />
          Copier PGN
        </MenuItem>
        <MenuItem onClick={handleExportSinglePGN}>
          <Icon icon="mdi:download" style={{ marginRight: 8 }} />
          Exporter PGN
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget === "single"
              ? "Êtes-vous sûr de vouloir supprimer cette partie ?"
              : `Êtes-vous sûr de vouloir supprimer ${selectedIds.length} partie(s) ?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Game Dialog */}
      {editingGame && (
        <EditGameDialog
          open={true}
          game={editingGame}
          onClose={() => setEditingGame(null)}
          onSave={updateGame}
        />
      )}

      {/* Game Details Modal */}
      <GameDetailsModal
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedGameForDetails(null);
        }}
        game={selectedGameForDetails}
      />
    </Box>
  );
}
