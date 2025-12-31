import { Grid2 as Grid } from "@mui/material";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useAtomValue } from "jotai";
import { boardAtom } from "./states";
import TacticalCommentBubble from "@/components/analysis/TacticalCommentBubble";
import { useSession } from "next-auth/react";

export default function TacticalComment() {
  const { gameFromUrl } = useGameDatabase();
  const board = useAtomValue(boardAtom);
  const { data: session } = useSession();
  const analysisSettings = (session?.user as any)?.analysisSettings;
  const showComments = analysisSettings?.showComments !== false;

  // Logic to display Critical Moment description
  const currentPly = board.history().length;
  const currentMoment = gameFromUrl?.criticalMoments?.find(
    (m: any) => m.ply === currentPly
  );

  if (!currentMoment || !showComments) return null;

  return (
    <Grid container justifyContent="center" alignItems="center" size={12}>
      <TacticalCommentBubble
        moveType={currentMoment.type}
        playedMoveDescription={currentMoment.description}
        bestMoveDescription={currentMoment.bestLineDescription}
        themes={currentMoment.themes}
        move={currentMoment.move}
        bestMove={(currentMoment as any).bestMoveSan || (currentMoment as any).bestMove}
      />
    </Grid>
  );
}
