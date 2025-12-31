import { Grid2 as Grid } from "@mui/material";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useAtomValue } from "jotai";
import { boardAtom, gameAtom, gameEvalAtom, engineMultiPvAtom } from "./states";
import TacticalCommentBubble from "@/components/analysis/TacticalCommentBubble";
import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { buildCriticalMoments } from "@/lib/criticalMomentBuilder";

export default function TacticalComment() {
  const { gameFromUrl } = useGameDatabase();
  const board = useAtomValue(boardAtom);
  const game = useAtomValue(gameAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const multiPv = useAtomValue(engineMultiPvAtom);
  
  const { data: session } = useSession();
  const analysisSettings = (session?.user as any)?.analysisSettings;
  const showComments = analysisSettings?.showComments !== false;

  // Compute critical moments on the fly if not provided by DB game
  const computedCriticalMoments = useMemo(() => {
    // If we have critical moments from the database game, use them
    if (gameFromUrl?.criticalMoments && gameFromUrl.criticalMoments.length > 0) {
      return gameFromUrl.criticalMoments;
    }

    // Otherwise, try to build them from the current evaluation
    if (!gameEval || !game) return [];

    const history = game.history({ verbose: true });
    
    // We need fens array. fens[0] = start, fens[i+1] = after move i
    const fens = [
      history[0]?.before || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      ...history.map((m) => m.after)
    ];
    const moves = history.map((m) => m.san);
    const uciMoves = history.map((m) => m.from + m.to + (m.promotion || ""));

    return buildCriticalMoments({
      positions: gameEval.positions,
      fens,
      moves,
      uciMoves,
      userColor: undefined, // Unknown user color for imported game
      multiPv,
    });
  }, [gameFromUrl, gameEval, game, multiPv]);

  if (!showComments) return null;

  // Logic to display Critical Moment description
  const currentPly = board.history().length;
  // Use FEN matching for more robustness (especially for imported games)
  // Fallback to Ply if FEN match fails
  const currentFen = board.fen();
  
  const currentMoment = computedCriticalMoments.find(
    (m: any) => m.fen === currentFen || m.ply === currentPly
  );


  return (
    <Grid container justifyContent="center" alignItems="center" size={12}>
      <TacticalCommentBubble
        moveType={currentMoment?.type || "normal"}
        playedMoveDescription={currentMoment?.description}
        bestMoveDescription={currentMoment?.bestLineDescription}
        themes={currentMoment?.themes}
        move={currentMoment?.move}
        bestMove={(currentMoment as any)?.bestMoveSan || (currentMoment as any)?.bestMove}
      />
    </Grid>
  );
}
