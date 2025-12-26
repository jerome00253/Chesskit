import { Grid2 as Grid, Typography, Chip } from "@mui/material";
import { Icon } from "@iconify/react";
import {
  DataGrid,
  GridColDef,
  GridLocaleText,
  GRID_DEFAULT_LOCALE_TEXT,
  GridActionsCellItem,
  GridRowId,
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
import { Game } from "@/types/game";
import { useSession } from "next-auth/react";

export { getStaticPaths, getStaticProps };

type GameFilter = "all" | "my" | "reference";

export default function GameDatabase() {
  const t = useTranslations("Database");
  const { data: session } = useSession();
  const { games, deleteGame, updateGame } = useGameDatabase(true);
  const router = useRouter();
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [gameFilter, setGameFilter] = useState<GameFilter>("all");

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

  const handleDeleteGameRow = useCallback(
    (id: GridRowId) => async () => {
      if (typeof id !== "number") {
        throw new Error("Unable to remove game");
      }
      await deleteGame(id);
    },
    [deleteGame]
  );

  const handleCopyGameRow = useCallback(
    (id: GridRowId) => async () => {
      if (typeof id !== "number") {
        throw new Error("Unable to copy game");
      }

      const game = gamesRef.current.find((g) => g.id === id);
      if (!game) {
        throw new Error("Game not found");
      }

      await navigator.clipboard?.writeText?.(game.pgn);
    },
    []
  );

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "event",
        headerName: t("columns.event"),
        width: 150,
      },
      {
        field: "site",
        headerName: t("columns.site"),
        width: 150,
      },
      {
        field: "date",
        headerName: t("columns.date"),
        width: 150,
      },
      {
        field: "round",
        headerName: t("columns.round"),
        headerAlign: "center",
        align: "center",
        width: 150,
      },
      {
        field: "whiteLabel",
        headerName: t("columns.white"),
        width: 200,
        headerAlign: "center",
        align: "center",
        valueGetter: (_, row) => {
          const meSuffix = row.userColor === "white" ? ` ${t("me")}` : "";
          return `${row.white.name ?? "Unknown"}${meSuffix} (${row.white.rating ?? "?"})`;
        },
      },
      {
        field: "result",
        headerName: t("columns.result"),
        headerAlign: "center",
        align: "center",
        width: 100,
      },
      {
        field: "blackLabel",
        headerName: t("columns.black"),
        width: 200,
        headerAlign: "center",
        align: "center",
        valueGetter: (_, row) => {
          const meSuffix = row.userColor === "black" ? ` ${t("me")}` : "";
          return `${row.black.name ?? "Unknown"}${meSuffix} (${row.black.rating ?? "?"})`;
        },
      },
      {
        field: "eval",
        headerName: t("columns.evaluation"),
        type: "boolean",
        headerAlign: "center",
        align: "center",
        width: 100,
        valueGetter: (_, row) => !!row.eval,
      },
      {
        field: "openEvaluation",
        type: "actions",
        headerName: t("columns.analyze"),
        width: 100,
        cellClassName: "actions",
        getActions: ({ id }) => {
          return [
            <GridActionsCellItem
              icon={
                <Icon icon="streamline:magnifying-glass-solid" width="20px" />
              }
              label={t("columns.analyze")}
              onClick={() => {
                const locale = router.query.locale || "en";
                router.push({ pathname: `/${locale}/analysis`, query: { gameId: id } });
              }}
              color="inherit"
              key={`${id}-open-eval-button`}
            />,
          ];
        },
      },
      {
        field: "edit",
        type: "actions",
        headerName: "Edit",
        width: 100,
        cellClassName: "actions",
        getActions: ({ id }) => {
          return [
            <GridActionsCellItem
              icon={<Icon icon="mdi:pencil" color={green[500]} width="20px" />}
              label="Edit"
              onClick={() => {
                const game = gamesRef.current.find((g) => g.id === id);
                if (game) setEditingGame(game);
              }}
              color="inherit"
              key={`${id}-edit-button`}
            />,
          ];
        },
      },
      {
        field: "delete",
        type: "actions",
        headerName: t("columns.delete"),
        width: 100,
        cellClassName: "actions",
        getActions: ({ id }) => {
          return [
            <GridActionsCellItem
              icon={
                <Icon icon="mdi:delete-outline" color={red[400]} width="20px" />
              }
              label={t("columns.delete")}
              onClick={handleDeleteGameRow(id)}
              color="inherit"
              key={`${id}-delete-button`}
            />,
          ];
        },
      },
      {
        field: "copy pgn",
        type: "actions",
        headerName: t("columns.copy_pgn"),
        width: 100,
        cellClassName: "actions",
        getActions: ({ id }) => {
          return [
            <GridActionsCellItem
              icon={
                <Icon icon="ri:clipboard-line" color={blue[400]} width="20px" />
              }
              label={t("columns.copy_pgn")}
              onClick={handleCopyGameRow(id)}
              color="inherit"
              key={`${id}-copy-button`}
            />,
          ];
        },
      },
    ],
    [handleDeleteGameRow, handleCopyGameRow, router, t]
  );

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      gap={4}
      marginTop={6}
    >
      <PageTitle title={t("title")} />

      <Grid container justifyContent="center" alignItems="center" size={12}>
        <LoadGameButton />
      </Grid>

      <EditGameDialog
        open={!!editingGame}
        game={editingGame}
        onClose={() => setEditingGame(null)}
        onSave={async (id, data) => {
          await updateGame(id, data);
        }}
      />

      {/* Filter Chips */}
      {session?.user?.name && (
        <Grid container justifyContent="center" alignItems="center" size={12} gap={2}>
          <Chip
            label={`${t("filter_all")}: ${gameCounts.all}`}
            onClick={() => setGameFilter("all")}
            color={gameFilter === "all" ? "primary" : "default"}
            variant={gameFilter === "all" ? "filled" : "outlined"}
          />
          <Chip
            label={`${t("filter_my_games")}: ${gameCounts.my}`}
            onClick={() => setGameFilter("my")}
            color={gameFilter === "my" ? "primary" : "default"}
            variant={gameFilter === "my" ? "filled" : "outlined"}
          />
          <Chip
            label={`${t("filter_reference")}: ${gameCounts.reference}`}
            onClick={() => setGameFilter("reference")}
            color={gameFilter === "reference" ? "primary" : "default"}
            variant={gameFilter === "reference" ? "filled" : "outlined"}
          />
        </Grid>
      )}

      <Grid container justifyContent="center" alignItems="center" size={12}>
        <Typography variant="subtitle2">
          {gameFilter === "all"
            ? t("games_count", { count: games.length })
            : gameFilter === "my"
              ? t("my_games_count", { count: gameCounts.my })
              : t("reference_games_count", { count: gameCounts.reference })}
        </Typography>
      </Grid>

      <Grid maxWidth="100%" minWidth="50px">
        <DataGrid
          aria-label="Games list"
          rows={filteredGames}
          columns={columns}
          getRowId={(row) => row.id}
          disableColumnMenu
          pagination
          paginationMode="client"
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 },
            },
            sorting: {
              sortModel: [
                {
                  field: "date",
                  sort: "desc",
                },
              ],
            },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          localeText={gridLocaleText}
        />
      </Grid>
    </Grid>
  );
}
