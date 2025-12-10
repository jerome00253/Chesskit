import { Grid2 as Grid, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import {
  DataGrid,
  GridColDef,
  GridLocaleText,
  GRID_DEFAULT_LOCALE_TEXT,
  GridActionsCellItem,
  GridRowId,
} from "@mui/x-data-grid";
import { useCallback, useMemo, useState } from "react";
import { blue, red, green } from "@mui/material/colors";
import LoadGameButton from "@/sections/loadGame/loadGameButton";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useRouter } from "next/router";
import { PageTitle } from "@/components/pageTitle";
import { getStaticPaths, getStaticProps } from "@/lib/i18n";
import { useTranslations } from "next-intl";
import { EditGameDialog } from "@/components/database/EditGameDialog";
import { Game } from "@/types/game";

export { getStaticPaths, getStaticProps };

export default function GameDatabase() {
  const t = useTranslations("Database");
  const { games, deleteGame, updateGame } = useGameDatabase(true);
  const router = useRouter();
  const [editingGame, setEditingGame] = useState<Game | null>(null);

  const gridLocaleText: GridLocaleText = useMemo(
    () => ({
      ...GRID_DEFAULT_LOCALE_TEXT,
      noRowsLabel: t("no_games_found"),
    }),
    [t]
  );

  console.log(games);

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

      // Trouver le jeu par son ID
      const game = games.find((g) => g.id === id);
      if (!game) {
        throw new Error("Game not found");
      }

      await navigator.clipboard?.writeText?.(game.pgn);
    },
    [games]
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
        valueGetter: (_, row) =>
          `${row.white.name ?? "Unknown"} (${row.white.rating ?? "?"})`,
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
        valueGetter: (_, row) =>
          `${row.black.name ?? "Unknown"} (${row.black.rating ?? "?"})`,
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
                // Ensure we keep the locale
                const locale = router.query.locale || "en";
                router.push({ pathname: `/${locale}/`, query: { gameId: id } });
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
        headerName: "Edit", // TODO: Add translation
        width: 100,
        cellClassName: "actions",
        getActions: ({ id }) => {
          return [
            <GridActionsCellItem
              icon={<Icon icon="mdi:pencil" color={green[500]} width="20px" />}
              label="Edit"
              onClick={() => {
                const game = games.find((g) => g.id === id);
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
    [handleDeleteGameRow, handleCopyGameRow, router, t, games]
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
      <Grid container justifyContent="center" alignItems="center" size={12}>
        <Typography variant="subtitle2">
          {t("games_count", { count: games.length })}
        </Typography>
      </Grid>

      <Grid maxWidth="100%" minWidth="50px">
        <DataGrid
          aria-label="Games list"
          rows={games}
          columns={columns}
          disableColumnMenu
          hideFooter={true}
          localeText={gridLocaleText}
          initialState={{
            sorting: {
              sortModel: [
                {
                  field: "date",
                  sort: "desc",
                },
              ],
            },
          }}
        />
      </Grid>
    </Grid>
  );
}
