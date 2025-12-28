import {
  Typography,
  Chip,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Checkbox,
  Toolbar,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
} from "@mui/material";
import { Icon } from "@iconify/react";
import {
  DataGrid,
  GridColDef,
  GridLocaleText,
  GRID_DEFAULT_LOCALE_TEXT,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
  getMoveCount,
  formatDuration,
  estimateGameDuration,
  getGameTypeLabel,
} from "@/lib/statsHelpers";
import {
  classifyGameType,
  DEFAULT_TIME_SETTINGS,
} from "@/lib/gameClassification";
import BulkAnalysisDialog, {
  BulkAnalysisSettings,
} from "@/components/database/BulkAnalysisDialog";
import BulkAnalysisProgress from "@/components/database/BulkAnalysisProgress";
import { useBulkAnalysis } from "@/hooks/useBulkAnalysis";

export { getStaticPaths, getStaticProps };

type GameFilter = "all" | "my" | "reference";

export default function GameDatabase() {
  const t = useTranslations("Database");
  const { data: session } = useSession();

  // Get user settings for dynamic classification obtained from session
  const timeSettings = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (session?.user as any)?.timeSettings || DEFAULT_TIME_SETTINGS;
  }, [session]);

  const { games, deleteGame, updateGame } = useGameDatabase(true);
  const router = useRouter();
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [gameFilter, setGameFilter] = useState<GameFilter>("all");

  // Advanced filters
  const [analysisFilter, setAnalysisFilter] = useState<
    "all" | "analyzed" | "not_analyzed"
  >("all");
  const [resultFilter, setResultFilter] = useState<
    "all" | "white_win" | "black_win" | "draw"
  >("all");
  const [myResultFilter, setMyResultFilter] = useState<
    "all" | "win" | "loss" | "draw"
  >("all");
  const [gameTypeFilter, setGameTypeFilter] = useState<
    "all" | "Bullet" | "Blitz" | "Rapid" | "Classical"
  >("all");
  const [sourceFilter, setSourceFilter] = useState<
    "all" | "chesscom" | "lichess" | "other"
  >("all");

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Actions menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuGameId, setMenuGameId] = useState<number | null>(null);

  // Details modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedGameForDetails, setSelectedGameForDetails] =
    useState<Game | null>(null);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<"single" | "bulk">("single");

  // Bulk analysis state
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const {
    state: analysisState,
    analyzeGames,
    cancelAnalysis,
    resetState,
  } = useBulkAnalysis();

  const gridLocaleText: GridLocaleText = useMemo(
    () => ({
      ...GRID_DEFAULT_LOCALE_TEXT,
      noRowsLabel: t("no_games_found"),
    }),
    [t, timeSettings]
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
    let result = games;

    // 1. Owner Filter (My Games / Reference)
    if (session?.user?.name && gameFilter !== "all") {
      const userName = session.user.name;
      if (gameFilter === "my") {
        result = result.filter(
          (game) =>
            game.userColor === "white" ||
            game.userColor === "black" ||
            game.white.name === userName ||
            game.black.name === userName
        );
      } else if (gameFilter === "reference") {
        result = result.filter(
          (game) =>
            game.userColor !== "white" &&
            game.userColor !== "black" &&
            game.white.name !== userName &&
            game.black.name !== userName
        );
      }
    }

    // 2. Analysis Filter
    if (analysisFilter !== "all") {
      result = result.filter((g) =>
        analysisFilter === "analyzed" ? g.analyzed : !g.analyzed
      );
    }

    // 3. Result Filter
    if (resultFilter !== "all") {
      result = result.filter((g) => {
        if (resultFilter === "draw") return g.result === "1/2-1/2";
        if (resultFilter === "white_win") return g.result === "1-0";
        if (resultFilter === "black_win") return g.result === "0-1";
        return true;
      });
    }

    // 4. Source Filter
    if (sourceFilter !== "all") {
      result = result.filter((g) => {
        const origin = (g.importOrigin || "").toLowerCase();
        const sourceStr = (g.gameUrl || g.site || "").toLowerCase();

        if (sourceFilter === "lichess")
          return origin === "lichess" || sourceStr.includes("lichess");
        if (sourceFilter === "chesscom")
          return origin === "chesscom" || sourceStr.includes("chess.com");
        if (sourceFilter === "other")
          return (
            origin !== "lichess" &&
            origin !== "chesscom" &&
            !sourceStr.includes("lichess") &&
            !sourceStr.includes("chess.com")
          );
        return true;
      });
    }

    // 5. My Result Filter
    if (myResultFilter !== "all" && session?.user?.name) {
      const userName = session.user.name;
      result = result.filter((g) => {
        // Determine user color
        let isWhite = g.userColor === "white";
        // If userColor not set, try matching name (fallback)
        if (!g.userColor) {
          if (g.white.name === userName) isWhite = true;
          else if (g.black.name === userName) isWhite = false;
          else return false; // User not player
        } else {
          // Verify the user is actually the one specified by userColor or by name match
          // If userColor says white, but white name isn't user, we trust metadata?
          // Let's stick to name check for safety if possible, or trust userColor.
          // Logic: if user not found as player, we exclude.
          const isPlayer =
            g.white.name === userName ||
            g.black.name === userName ||
            g.userColor === "white" ||
            g.userColor === "black";
          if (!isPlayer) return false;

          // Refine isWhite based on name if available
          if (g.white.name === userName) isWhite = true;
          else if (g.black.name === userName) isWhite = false;
        }

        if (myResultFilter === "draw") return g.result === "1/2-1/2";

        const whiteWon = g.result === "1-0";
        const blackWon = g.result === "0-1";

        if (myResultFilter === "win") {
          return (isWhite && whiteWon) || (!isWhite && blackWon);
        }
        if (myResultFilter === "loss") {
          return (isWhite && blackWon) || (!isWhite && whiteWon);
        }
        return true;
      });
    }

    // 6. Game Type Filter (New)
    if (gameTypeFilter !== "all") {
      result = result.filter((g) => {
        let type = g.gameType;
        if (!type && g.timeControl) {
          type = classifyGameType(g.timeControl, timeSettings);
        }
        return type === gameTypeFilter;
      });
    }

    return result;
  }, [
    games,
    gameFilter,
    session,
    analysisFilter,
    resultFilter,
    sourceFilter,
    myResultFilter,
    gameTypeFilter,
    timeSettings,
  ]);

  // Stabilize games access for callbacks
  const gamesRef = useRef(games);
  useEffect(() => {
    gamesRef.current = games;
  }, [games]);

  // Multi-select handlers
  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === filteredGames.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredGames.map((g) => g.id));
    }
  }, [selectedIds.length, filteredGames]);

  const handleToggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  // Actions menu handlers
  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setMenuGameId(null);
  }, []);

  const handleMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>, id: number) => {
      setAnchorEl(event.currentTarget);
      setMenuGameId(id);
    },
    []
  );

  const handleAnalyze = useCallback(
    (game: any) => {
      const locale = router.query.locale || "en";
      router.push(`/${locale}/analysis?gameId=${game.id}`);
      handleMenuClose();
    },
    [router, handleMenuClose]
  );

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
    const gamesToExport = gamesRef.current.filter((g) =>
      gameIds.includes(g.id)
    );
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

  // Bulk analysis handlers
  const handleBulkAnalyze = () => {
    setAnalysisDialogOpen(true);
  };

  const handleAnalysisConfirm = (settings: BulkAnalysisSettings) => {
    setAnalysisDialogOpen(false);
    analyzeGames(selectedIds, settings);
  };

  const handleAnalysisClose = () => {
    resetState();
    // Refresh the page to show updated games
    window.location.reload();
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
              selectedIds.length > 0 &&
              selectedIds.length < filteredGames.length
            }
            checked={
              selectedIds.length === filteredGames.length &&
              filteredGames.length > 0
            }
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
        field: "importOrigin",
        headerName: "",
        width: 40,
        minWidth: 40,
        maxWidth: 40,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams) => {
          const origin = (params.row.importOrigin || "").toLowerCase();
          const sourceStr = (
            params.row.gameUrl ||
            params.row.site ||
            ""
          ).toLowerCase();

          let icon = "mdi:chess-pawn";
          let color = "text.secondary";
          let tooltip = t("filters.other");

          if (origin === "lichess" || sourceStr.includes("lichess")) {
            icon = "simple-icons:lichess";
            // Lichess color (white/black usually, but light grey looks good on dark, dark on light)
            color = "inherit";
            tooltip = "Lichess";
          } else if (origin === "chesscom" || sourceStr.includes("chess.com")) {
            icon = "simple-icons:chessdotcom";
            color = "#7FA650"; // Chess.com green
            tooltip = "Chess.com";
          }

          return (
            <Tooltip title={tooltip}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  opacity: 0.8,
                }}
              >
                {origin === "lichess" || sourceStr.includes("lichess") ? (
                  <img
                    src="/icons/lichess.svg"
                    alt="Lichess"
                    width="16"
                    height="16"
                    style={{ filter: "brightness(0.9)" }}
                  />
                ) : origin === "chesscom" || sourceStr.includes("chess.com") ? (
                  <img
                    src="/icons/chesscom.svg"
                    alt="Chess.com"
                    width="16"
                    height="16"
                    style={{ filter: "brightness(0.9)" }}
                  /> // Chess.com icon is usually green, svg is monochrome, might need colored fill if svg has currentColor
                ) : (
                  <Icon
                    icon={icon}
                    width="18"
                    height="18"
                    color={color === "inherit" ? undefined : color}
                  />
                )}
              </Box>
            </Tooltip>
          );
        },
      },
      {
        field: "date",
        headerName: t("columns.date"),
        flex: 0.8,
        minWidth: 90,
        align: "center",
        headerAlign: "center",
        valueGetter: (_, row) => {
          if (!row.date) return "—";
          const date = new Date(row.date);
          if (isNaN(date.getTime())) return "—";
          const day = String(date.getDate()).padStart(2, "0");
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        },
      },
      {
        field: "gameType",
        headerName: t("columns.type"),
        flex: 0.7,
        minWidth: 80,
        align: "center",
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams) => {
          let label = "—";
          // Dynamic classification based on timeSettings
          if (params.row.timeControl) {
            const type = classifyGameType(params.row.timeControl, timeSettings);
            label = getGameTypeLabel(type);
          }
          // Fallback if no timeControl but gameType exists (from DB)
          else if (params.row.gameType) {
            label = params.row.gameType;
          }

          // Determine user's accuracy
          let userAccuracy: number | undefined;
          const isWhiteUser = params.row.userColor === "white";
          const isBlackUser = params.row.userColor === "black";

          // If userColor isn't set, try matching by name
          if (!isWhiteUser && !isBlackUser && session?.user?.name) {
            const userName = session.user.name;
            if (params.row.white.name === userName) {
              userAccuracy = params.row.whiteAccuracy;
            } else if (params.row.black.name === userName) {
              userAccuracy = params.row.blackAccuracy;
            }
          } else {
            userAccuracy = isWhiteUser
              ? params.row.whiteAccuracy
              : isBlackUser
                ? params.row.blackAccuracy
                : undefined;
          }

          return (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: 0.5,
                py: 0.5,
              }}
            >
              <Chip
                label={label}
                size="small"
                color="default"
                variant="outlined"
                sx={{
                  fontSize: "0.65rem",
                  height: 18,
                  "& .MuiChip-label": { px: 0.75 },
                }}
              />
              {userAccuracy != null && typeof userAccuracy === "number" && (
                <Chip
                  label={`${userAccuracy.toFixed(1)}%`}
                  size="small"
                  color="info"
                  variant="filled"
                  sx={{
                    fontSize: "0.65rem",
                    height: 18,
                    "& .MuiChip-label": { px: 0.75 },
                  }}
                />
              )}
            </Box>
          );
        },
      },
      {
        field: "players",
        headerName: t("columns.players"),
        flex: 1.5,
        minWidth: 180,
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams) => {
          const isWhiteUser = params.row.userColor === "white";
          const isBlackUser = params.row.userColor === "black";

          const whiteElo = params.row.white.rating
            ? ` (${params.row.white.rating})`
            : "";
          const blackElo = params.row.black.rating
            ? ` (${params.row.black.rating})`
            : "";

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
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                py: 0.5,
              }}
            >
              {/* White player line */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Chip
                  icon={
                    isWhiteUser ? (
                      <Icon icon="mdi:account" width={12} />
                    ) : undefined
                  }
                  label={`${params.row.white.name}${whiteElo}`}
                  size="small"
                  variant="filled"
                  color={whiteColor}
                  sx={{
                    fontSize: "0.7rem",
                    height: 20,
                    "& .MuiChip-label": { px: 1 },
                  }}
                />
              </Box>
              {/* Black player line (indented) */}
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 0.5, pl: 4 }}
              >
                <Chip
                  icon={
                    isBlackUser ? (
                      <Icon icon="mdi:account" width={12} />
                    ) : undefined
                  }
                  label={`${params.row.black.name}${blackElo}`}
                  size="small"
                  variant="filled"
                  color={blackColor}
                  sx={{
                    fontSize: "0.7rem",
                    height: 20,
                    "& .MuiChip-label": { px: 1 },
                  }}
                />
              </Box>
            </Box>
          );
        },
      },

      {
        field: "moves",
        headerName: t("columns.moves"),
        flex: 0.5,
        minWidth: 60,
        align: "center",
        headerAlign: "center",
        valueGetter: (_, row) => getMoveCount(row.pgn),
      },
      {
        field: "duration",
        headerName: t("columns.duration"),
        flex: 0.9,
        minWidth: 95,
        align: "center",
        headerAlign: "center",
        valueGetter: (_, row) => {
          // Use initialTime and increment if available
          if (row.initialTime !== null && row.initialTime !== undefined) {
            const minutes = Math.floor(row.initialTime / 60);
            const incrementText = row.increment ? ` (+${row.increment})` : "";
            return `${minutes}min${incrementText}`;
          }
          // Fallback to estimated duration
          const seconds = estimateGameDuration(row);
          return formatDuration(seconds);
        },
      },
      {
        field: "analysis",
        headerName: t("columns.analysis"),
        flex: 1.2,
        minWidth: 140,
        align: "center",
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams) => {
          if (!params.row.analyzed || !params.row.engineName) {
            return (
              <Typography variant="body2" color="text.secondary">
                —
              </Typography>
            );
          }

          // Extract version from engine name (e.g., "Stockfish 17" -> "V17")
          const versionMatch = params.row.engineName.match(/(\d+)/);
          const version = versionMatch
            ? `V${versionMatch[1]}`
            : params.row.engineName;

          // Check if it's a lite version
          const isLite = params.row.engineName.toLowerCase().includes("lite");
          const versionLabel = isLite ? `${version} Lite` : version;

          return (
            <Box
              sx={{
                display: "flex",
                gap: 0.5,
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Chip
                label={versionLabel}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: "0.7rem", height: 20 }}
              />
              {params.row.engineDepth && (
                <Chip
                  label={`${params.row.engineDepth}`}
                  size="small"
                  color="secondary"
                  variant="filled"
                  sx={{ fontSize: "0.7rem", height: 20 }}
                />
              )}
            </Box>
          );
        },
      },
      {
        field: "opening",
        headerName: t("columns.opening"),
        flex: 1.5,
        minWidth: 150,
        align: "center",
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams) => {
          if (!params.row.openingName) {
            return (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "0.7rem" }}
              >
                —
              </Typography>
            );
          }

          const parts = params.row.openingName.split(": ");
          const mainName = parts[0];
          const variation = parts.slice(1).join(": ");

          return (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                lineHeight: 1,
                py: 0.5,
              }}
            >
              <Typography
                variant="caption"
                align="center"
                sx={{
                  fontSize: "0.65rem",
                  fontWeight: variation ? 600 : 400,
                  lineHeight: 1,
                  maxWidth: "100%",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {mainName}
              </Typography>
              {variation && (
                <Typography
                  variant="caption"
                  align="center"
                  sx={{
                    fontSize: "0.65rem",
                    lineHeight: 1,
                    opacity: 0.8,
                    maxWidth: "100%",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {variation}
                </Typography>
              )}
            </Box>
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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
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
          <Box
            sx={{
              display: "flex",
              gap: 0.5,
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <IconButton
              size="small"
              onClick={() => {
                setSelectedGameForDetails(params.row);
                setDetailsModalOpen(true);
              }}
              title={t("action_menu.view_details")}
              sx={{ color: "#1976d2" }}
            >
              <Icon icon="mdi:eye" width={18} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleAnalyze(params.row)}
              title={t("action_menu.analyze")}
              sx={{ color: params.row.analyzed ? "#4caf50" : "#9e9e9e" }}
            >
              <Icon icon="mdi:chart-line" width={18} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setEditingGame(params.row)}
              title={t("action_menu.edit")}
              sx={{ color: "#ff9800" }}
            >
              <Icon icon="mdi:pencil" width={18} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => {
                setMenuGameId(params.row.id);
                setDeleteDialogOpen(true);
              }}
              title={t("action_menu.delete")}
              sx={{ color: "#f44336" }}
            >
              <Icon icon="mdi:delete" width={18} />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => handleMenuOpen(e, params.row.id)}
              title={t("global_actions.export_all")}
              sx={{ color: "#9c27b0" }}
            >
              <Icon icon="mdi:download" width={18} />
            </IconButton>
          </Box>
        ),
      },
    ],
    [
      t,
      selectedIds,
      filteredGames,
      handleSelectAll,
      handleToggleSelect,
      handleAnalyze,
      handleMenuOpen,
      timeSettings,
    ]
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

      {/* Advanced Filters */}
      <Box sx={{ mb: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{t("filters.analysis_status")}</InputLabel>
          <Select
            value={analysisFilter}
            label={t("filters.analysis_status")}
            onChange={(e) =>
              setAnalysisFilter(
                e.target.value as "all" | "analyzed" | "not_analyzed"
              )
            }
          >
            <MenuItem value="all">{t("filters.all")}</MenuItem>
            <MenuItem value="analyzed">{t("filters.analyzed")}</MenuItem>
            <MenuItem value="not_analyzed">
              {t("filters.not_analyzed")}
            </MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{t("filters.result")}</InputLabel>
          <Select
            value={resultFilter}
            label={t("filters.result")}
            onChange={(e) =>
              setResultFilter(
                e.target.value as "all" | "white_win" | "black_win" | "draw"
              )
            }
          >
            <MenuItem value="all">{t("filters.all")}</MenuItem>
            <MenuItem value="white_win">{t("filters.white_win")}</MenuItem>
            <MenuItem value="black_win">{t("filters.black_win")}</MenuItem>
            <MenuItem value="draw">{t("filters.draw")}</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{t("filters.game_type")}</InputLabel>
          <Select
            value={gameTypeFilter}
            label={t("filters.game_type")}
            onChange={(e) =>
              setGameTypeFilter(
                e.target.value as
                  | "all"
                  | "Bullet"
                  | "Blitz"
                  | "Rapid"
                  | "Classical"
              )
            }
          >
            <MenuItem value="all">{t("filters.all")}</MenuItem>
            <MenuItem value="Bullet">{t("filters.bullet")}</MenuItem>
            <MenuItem value="Blitz">{t("filters.blitz")}</MenuItem>
            <MenuItem value="Rapid">{t("filters.rapid")}</MenuItem>
            <MenuItem value="Classical">{t("filters.classical")}</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{t("filters.source")}</InputLabel>
          <Select
            value={sourceFilter}
            label={t("filters.source")}
            onChange={(e) => setSourceFilter(e.target.value as any)}
          >
            <MenuItem value="all">{t("filters.all")}</MenuItem>
            <MenuItem value="lichess">{t("filters.lichess")}</MenuItem>
            <MenuItem value="chesscom">{t("filters.chesscom")}</MenuItem>
            <MenuItem value="other">{t("filters.other")}</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{t("filters.my_result")}</InputLabel>
          <Select
            value={myResultFilter}
            label={t("filters.my_result")}
            onChange={(e) => setMyResultFilter(e.target.value as any)}
          >
            <MenuItem value="all">{t("filters.all")}</MenuItem>
            <MenuItem value="win">{t("filters.win")}</MenuItem>
            <MenuItem value="loss">{t("filters.loss")}</MenuItem>
            <MenuItem value="draw">{t("filters.draw")}</MenuItem>
          </Select>
        </FormControl>
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
            {t("bulk_actions.selected", { count: selectedIds.length })}
          </Typography>
          <Button
            startIcon={<Icon icon="mdi:download" />}
            onClick={handleExportSelected}
            variant="contained"
            size="small"
          >
            {t("bulk_actions.export_pgn")}
          </Button>
          <Button
            startIcon={<Icon icon="mdi:brain" />}
            onClick={handleBulkAnalyze}
            variant="contained"
            size="small"
            color="success"
          >
            {t("bulk_actions.analyze")}
          </Button>
          <Button
            startIcon={<Icon icon="mdi:delete" />}
            onClick={handleBulkDelete}
            color="error"
            variant="contained"
            size="small"
          >
            {t("bulk_actions.delete")}
          </Button>
          <Button onClick={() => setSelectedIds([])} size="small">
            {t("bulk_actions.cancel")}
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
          {t("global_actions.export_all")}
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
          width: "100%",
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "action.hover",
          },
          // Hide scrollbar but keep functionality
          "& .MuiDataGrid-scrollbar": {
            display: "none",
          },
          "& ::-webkit-scrollbar": {
            display: "none",
          },
          scrollbarWidth: "none",
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
          {t("action_menu.copy_pgn")}
        </MenuItem>
        <MenuItem onClick={handleExportSinglePGN}>
          <Icon icon="mdi:download" style={{ marginRight: 8 }} />
          {t("action_menu.export_pgn")}
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>{t("confirm_delete.title")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget === "single"
              ? t("confirm_delete.single")
              : t("confirm_delete.bulk", { count: selectedIds.length })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t("confirm_delete.cancel")}
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            {t("confirm_delete.confirm")}
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

      {/* Bulk Analysis Dialogs */}
      <BulkAnalysisDialog
        open={analysisDialogOpen}
        gameCount={selectedIds.length}
        onClose={() => setAnalysisDialogOpen(false)}
        onConfirm={handleAnalysisConfirm}
      />

      <BulkAnalysisProgress
        open={
          analysisState.isAnalyzing ||
          (!analysisState.isAnalyzing && analysisState.currentGameIndex > 0) ||
          !!analysisState.error
        }
        state={analysisState}
        onCancel={cancelAnalysis}
        onClose={handleAnalysisClose}
      />
    </Box>
  );
}
