import { useAtomValue } from "jotai";
import {
  boardAtom,
  boardOrientationAtom,
  currentPositionAtom,
  gameAtom,
  showBestMoveArrowAtom,
  showPlayerMoveIconAtom,
} from "../states";
import { useMemo } from "react";
import { useScreenSize } from "@/hooks/useScreenSize";
import { Color } from "@/types/enums";
import Board from "@/components/board";
import { usePlayersData } from "@/hooks/usePlayersData";
import TacticalComment from "../TacticalComment";
import { Box } from "@mui/material";

export default function BoardContainer() {
  const screenSize = useScreenSize();
  const boardOrientation = useAtomValue(boardOrientationAtom);
  const showBestMoveArrow = useAtomValue(showBestMoveArrowAtom);
  const { white, black } = usePlayersData(gameAtom);

  const boardSize = useMemo(() => {
    const width = screenSize.width;
    const height = screenSize.height;
    const commentHeight = 120;
    const gap = 8; // gap of 1 in theme units ≈ 8px

    // 1200 is the lg layout breakpoint
    if (window?.innerWidth < 1200) {
      return Math.min(width - 15, height - 150 - commentHeight - gap);
    }

    return Math.min(width - 700, height * 0.92 - commentHeight - gap);
  }, [screenSize]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        width: boardSize,
      }}
    >
      <Board
        id="AnalysisBoard"
        boardSize={boardSize}
        canPlay={true}
        gameAtom={boardAtom}
        whitePlayer={white}
        blackPlayer={black}
        boardOrientation={boardOrientation ? Color.White : Color.Black}
        currentPositionAtom={currentPositionAtom}
        showBestMoveArrow={showBestMoveArrow}
        showPlayerMoveIconAtom={showPlayerMoveIconAtom}
        showEvaluationBar={true}
      />
      <TacticalComment />
    </Box>
  );
}
