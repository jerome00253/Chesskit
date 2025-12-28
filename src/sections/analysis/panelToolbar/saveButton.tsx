import { useGameDatabase } from "@/hooks/useGameDatabase";
import { Icon } from "@iconify/react";
import { Grid2 as Grid, IconButton, Tooltip } from "@mui/material";
import { useAtomValue } from "jotai";
import { useRouter } from "next/router";
import { boardAtom, gameAtom, gameEvalAtom } from "../states";
import { getGameToSave, getEvaluateGameParams } from "@/lib/chess";
import { useTranslations } from "next-intl";

export default function SaveButton() {
  const t = useTranslations("Analysis");
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const { addGame, setGameEval, gameFromUrl } = useGameDatabase();
  const router = useRouter();

  const enableSave =
    !gameFromUrl && (board.history().length || game.history().length);

  const handleSave = async () => {
    if (!enableSave) return;

    const gameToSave = getGameToSave(game, board);
    const params = getEvaluateGameParams(gameToSave);

    const gameId = await addGame(gameToSave);
    if (gameEval) {
      await setGameEval(gameId, gameEval, undefined, undefined, undefined, {
         fens: params.fens,
         moves: params.sanMoves
      });
    }

    // Use asPath to avoid '[locale]' placeholders in pathname
    const currentPath = router.asPath.split("?")[0];
    router.replace(
      {
        query: { gameId: gameId },
        pathname: currentPath,
      },
      undefined,
      { shallow: true, scroll: false }
    );
  };

  return (
    <>
      {gameFromUrl ? (
        <Tooltip title={t("saved_tooltip")}>
          <Grid>
            <IconButton disabled={true} sx={{ paddingX: 1.2, paddingY: 0.5 }}>
              <Icon icon="ri:folder-check-line" />
            </IconButton>
          </Grid>
        </Tooltip>
      ) : (
        <Tooltip title={t("save_tooltip")}>
          <Grid>
            <IconButton
              onClick={handleSave}
              disabled={!enableSave}
              sx={{ paddingX: 1.2, paddingY: 0.5 }}
            >
              <Icon icon="ri:save-3-line" />
            </IconButton>
          </Grid>
        </Tooltip>
      )}
    </>
  );
}
