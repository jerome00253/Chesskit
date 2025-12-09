import { Grid2 as Grid, IconButton, Tooltip, Snackbar } from "@mui/material";
import { Icon } from "@iconify/react";
import { useAtomValue } from "jotai";
import { boardAtom, gameAtom } from "../states";
import { useChessActions } from "@/hooks/useChessActions";
import FlipBoardButton from "./flipBoardButton";
import NextMoveButton from "./nextMoveButton";
import GoToLastPositionButton from "./goToLastPositionButton";
import SaveButton from "./saveButton";
import { useEffect, useState } from "react";

export default function PanelToolBar() {
  const board = useAtomValue(boardAtom);
  const { resetToStartingPosition: resetBoard, undoMove: undoBoardMove } =
    useChessActions(boardAtom);

  const boardHistory = board.history();
  const game = useAtomValue(gameAtom);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (boardHistory.length === 0) return;
      if (e.key === "ArrowLeft") {
        undoBoardMove();
      } else if (e.key === "ArrowDown") {
        resetBoard();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [undoBoardMove, boardHistory, resetBoard, board]);

  const handleCopyPgn = async () => {
    try {
      const pgn = game.pgn();

      if (!navigator.clipboard) {
        // Fallback pour les navigateurs qui ne supportent pas l'API Clipboard
        const textArea = document.createElement("textarea");
        textArea.value = pgn;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        // eslint-disable-next-line deprecation/deprecation
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setSnackbarMessage("PGN copied to clipboard!");
        setSnackbarOpen(true);
        return;
      }

      await navigator.clipboard.writeText(pgn);
      setSnackbarMessage("PGN copied to clipboard!");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Failed to copy PGN:", error);
      setSnackbarMessage("Failed to copy PGN");
      setSnackbarOpen(true);
    }
  };

  return (
    <>
      <Grid container justifyContent="center" alignItems="center" size={12}>
        <FlipBoardButton />

        <Tooltip title="Reset board">
          <Grid>
            <IconButton
              onClick={() => resetBoard()}
              disabled={boardHistory.length === 0}
              sx={{ paddingX: 1.2, paddingY: 0.5 }}
            >
              <Icon icon="ri:skip-back-line" />
            </IconButton>
          </Grid>
        </Tooltip>

        <Tooltip title="Go to previous move">
          <Grid>
            <IconButton
              onClick={() => undoBoardMove()}
              disabled={boardHistory.length === 0}
              sx={{ paddingX: 1.2, paddingY: 0.5 }}
            >
              <Icon icon="ri:arrow-left-s-line" height={30} />
            </IconButton>
          </Grid>
        </Tooltip>

        <NextMoveButton />

        <GoToLastPositionButton />

        <Tooltip title="Copy pgn">
          <Grid aria-label="Copy pgn">
            <IconButton
              disabled={game.history().length === 0}
              onClick={handleCopyPgn}
              sx={{ paddingX: 1.2, paddingY: 0.5 }}
            >
              <Icon icon="ri:clipboard-line" />
            </IconButton>
          </Grid>
        </Tooltip>

        <SaveButton />
      </Grid>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </>
  );
}
