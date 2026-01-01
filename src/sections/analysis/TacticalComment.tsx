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
  
  // Fallback translation for legacy DB descriptions (without descriptionFr/En fields)
  const translateLegacyDescription = (text: string, targetLocale: string): string => {
    if (!text) return text;
    
    // Translation map for common tactical descriptions
    const translations: Record<string, Record<string, string>> = {
      'Critical error': {
        fr: 'Erreur critique',
        it: 'Errore critico',
        pt: 'Erro crítico',
        es: 'Error crítico',
        nl: 'Kritieke fout',
      },
      'You lose about': {
        fr: 'Vous perdez environ',
        it: 'Perdi circa',
        pt: 'Você perde cerca de',
        es: 'Pierdes aproximadamente',
        nl: 'Je verliest ongeveer',
      },
      'evaluation points': {
        fr: "points d'évaluation",
        it: 'punti di valutazione',
        pt: 'pontos de avaliação',
        es: 'puntos de evaluación',
        nl: 'evaluatiepunten',
      },
      'Stockfish preferred': {
        fr: 'Stockfish préférait',
        it: 'Stockfish preferiva',
        pt: 'Stockfish preferia',
        es: 'Stockfish prefería',
        nl: 'Stockfish verkoos',
      },
      'Game ended by checkmate': {
        fr: 'Partie terminée par échec et mat',
        it: 'Partita terminata con scacco matto',
        pt: 'Jogo terminado por xeque-mate',
        es: 'Juego terminado por jaque mate',
        nl: 'Spel beëindigd door schaakmat',
      },
      'A brilliant move': {
        fr: 'Un coup brillant',
        it: 'Una mossa brillante',
        pt: 'Um lance brilhante',
        es: 'Un movimiento brillante',
        nl: 'Een briljante zet',
      },
      'A check forcing the king to react': {
        fr: 'Un échec qui force le roi à réagir',
        it: 'Uno scacco che costringe il re a reagire',
        pt: 'Um xeque que força o rei a reagir',
        es: 'Un jaque que obliga al rey a reaccionar',
        nl: 'Een schaak dat de koning dwingt te reageren',
      },
    };
    
    let translated = text;
    
    // Replace known phrases
    for (const [english, localeMap] of Object.entries(translations)) {
      if (text.includes(english) && localeMap[targetLocale]) {
        translated = translated.replace(english, localeMap[targetLocale]);
      }
    }
    
    return translated;
  };
  
  // Select appropriate description based on locale
  const getLocalizedDescription = (moment: any) => {
    if (!moment) return undefined;
    
    // DEBUG: Log to understand what's happening
    console.log('[TacticalComment] Locale:', locale);
    console.log('[TacticalComment] Moment fields:', {
      description: moment.description?.substring(0, 50),
      descriptionEn: moment.descriptionEn?.substring(0, 50),
      descriptionFr: moment.descriptionFr?.substring(0, 50),
    });
    
    // Try exact locale match first (new DB entries)
    if (locale === 'fr' && moment.descriptionFr) return moment.descriptionFr;
    if (locale === 'it' && moment.descriptionIt) return moment.descriptionIt;
    if (locale === 'pt' && moment.descriptionPt) return moment.descriptionPt;
    if (locale === 'es' && moment.descriptionEs) return moment.descriptionEs;
    if (locale === 'nl' && moment.descriptionNl) return moment.descriptionNl;
    
    // Fallback: translate legacy description on-the-fly
    if (moment.description && locale !== 'en') {
      const translated = translateLegacyDescription(moment.description, locale);
      console.log('[TacticalComment] Legacy translation:', { original: moment.description, translated });
      return translated;
    }
    
    // Final fallback to EN or default
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
