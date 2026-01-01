import { Grid2 as Grid, Box, Typography } from "@mui/material";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useAtomValue } from "jotai";
import { boardAtom, gameAtom, gameEvalAtom, engineMultiPvAtom } from "./states";
import TacticalCommentBubble from "@/components/analysis/TacticalCommentBubble";
import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { buildCriticalMoments } from "@/lib/criticalMomentBuilder";
import { useLocale } from "next-intl";

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

  // Get current locale
  const locale = useLocale();
  
  // Select appropriate description based on locale
  const getLocalizedDescription = (moment: any) => {
    if (!moment) return undefined;
    // Try exact locale match first
    if (locale === 'fr' && moment.descriptionFr) return moment.descriptionFr;
    if (locale === 'it' && moment.descriptionIt) return moment.descriptionIt;
    if (locale === 'pt' && moment.descriptionPt) return moment.descriptionPt;
    if (locale === 'es' && moment.descriptionEs) return moment.descriptionEs;
    if (locale === 'nl' && moment.descriptionNl) return moment.descriptionNl;
    // Fallback to EN or default
    if (moment.descriptionEn) return moment.descriptionEn;
    return moment.description;
  };

  return (
    <Grid container justifyContent="center" alignItems="center" size={12} flexDirection="column">
      <TacticalCommentBubble
        moveType={currentMoment?.type || "normal"}
        playedMoveDescription={getLocalizedDescription(currentMoment)}
        bestMoveDescription={currentMoment?.bestLineDescription}
        themes={currentMoment?.themes}
        move={currentMoment?.move}
        bestMove={(currentMoment as any)?.bestMoveSan || (currentMoment as any)?.bestMove}
      />
      
      
      {/* DEBUG TACTICS (Enabled via Profile > Preferences) */}
      {analysisSettings?.debugTactics && (
        <Box sx={{ 
          mt: 1, 
          p: 1, 
          width: "100%", 
          bgcolor: "rgba(0,0,0,0.05)", 
          borderRadius: 1,
          border: "1px dashed #ccc",
          fontSize: "0.7rem", 
          fontFamily: "monospace" 
        }}>
          <Typography variant="caption" sx={{ fontWeight: "bold", display: "block", mb: 0.5 }}>
            DEBUG TACTICS
          </Typography>
          <div><strong>Ply:</strong> {currentPly}</div>
          <div><strong>Move:</strong> {currentMoment?.move}</div>
          <div><strong>Best:</strong> {(currentMoment as any)?.bestMoveSan} ({(currentMoment as any)?.bestMove})</div>
          <div style={{ marginTop: 4, wordBreak: "break-all" }}>
            <strong>FEN Before:</strong> {board.history({ verbose: true }).pop()?.before || "Start"}
          </div>
          <div style={{ marginTop: 4, wordBreak: "break-all" }}>
            <strong>FEN After:</strong> {currentFen}
          </div>
        </Box>
      )}
    </Grid>
  );
}
