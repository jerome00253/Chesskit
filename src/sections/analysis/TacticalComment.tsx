import { Grid2 as Grid, Box, Typography, Button } from "@mui/material";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useAtom, useAtomValue } from "jotai";
import { boardAtom, gameAtom, gameEvalAtom, engineMultiPvAtom, explorationModeAtom, deviationPointPlyAtom } from "./states";
import TacticalCommentBubble from "@/components/analysis/TacticalCommentBubble";
import { useSession } from "next-auth/react";
import { useMemo, useState, useEffect } from "react";
import { buildCriticalMoments, CriticalMoment } from "@/lib/criticalMomentBuilder";
import { Chess } from "chess.js";
import { useIntl } from "react-intl";
import { analyzeTacticalPatterns } from "@/lib/tactical";
import { usePlayersData } from "@/hooks/usePlayersData";
import ReplyIcon from '@mui/icons-material/Reply';

export default function TacticalComment() {
  const { gameFromUrl, saveManualAnalysis } = useGameDatabase();
  const board = useAtomValue(boardAtom);
  const game = useAtomValue(gameAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const multiPv = useAtomValue(engineMultiPvAtom);
  
  // Exploration mode tracking
  const [isExploring, setIsExploring] = useAtom(explorationModeAtom);
  const [deviationPly, setDeviationPly] = useAtom(deviationPointPlyAtom);
  
  const { data: session } = useSession();
  const analysisSettings = (session?.user as any)?.analysisSettings;
  const showComments = true;
  
  const { white: whitePlayer, black: blackPlayer } = usePlayersData(gameAtom);
  const intl = useIntl();

  // Random opening phrase
  const [openingPhraseKey, setOpeningPhraseKey] = useState<string>("");

  useEffect(() => {
    const randomNum = Math.floor(Math.random() * 5) + 1;
    setOpeningPhraseKey(`opening.phrase${randomNum}`);
  }, []);
  
  // State to store manually triggered analyses
  const [manualMoments, setManualMoments] = useState<Record<number, CriticalMoment>>({});

  // Compute critical moments on the fly if not provided by DB game
  const computedCriticalMoments = useMemo(() => {
    if (gameFromUrl?.criticalMoments && gameFromUrl.criticalMoments.length > 0) {
      return gameFromUrl.criticalMoments;
    }

    if (!gameEval || !game) return [];

    const history = game.history({ verbose: true });
    
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
      userColor: undefined,
      multiPv,
    });
  }, [gameFromUrl, gameEval, game, multiPv]);

  if (!showComments) return null;

  const currentPly = board.history().length;
  const currentFen = board.fen();
  
  // EXPLORATION MODE DETECTION
  useEffect(() => {
    const gameHistory = game.history({ verbose: true });
    
    if (currentPly === 0) {
      if (isExploring) {
        setIsExploring(false);
        setDeviationPly(null);
      }
      return;
    }
    
    // Get expected FEN at this ply in main game
    const expectedMove = gameHistory[currentPly - 1];
    const expectedFen = expectedMove?.after;
    
    if (expectedFen && currentFen !== expectedFen) {
      // User is exploring a variation!
      if (!isExploring) {
        setDeviationPly(currentPly - 1);
        setIsExploring(true);
      }
    } else if (isExploring && expectedFen === currentFen) {
      // Back to main game
      setIsExploring(false);
      setDeviationPly(null);
    }
  }, [currentPly, currentFen, game, isExploring, setIsExploring, setDeviationPly]);

  // Handler to return to main game
  const handleBackToGame = () => {
    if (deviationPly !== null) {
      // Reset board to deviation point
      const tempGame = new Chess();
      const history = game.history({ verbose: true });
      
      for (let i = 0; i < deviationPly; i++) {
        const move = history[i];
        if (move) {
          tempGame.move({ from: move.from, to: move.to, promotion: move.promotion });
        }
      }
      
      // This will trigger board update through atoms
      board.load(tempGame.fen());
      setIsExploring(false);
      setDeviationPly(null);
    }
  };

  // If exploring, show back-to-game button instead of coach
  if (isExploring) {
    return (
      <Grid container justifyContent="center" alignItems="center" size={12} flexDirection="column">
        <Button
          variant="outlined"
          color="primary"
          startIcon={<ReplyIcon />}
          onClick={handleBackToGame}
          sx={{ mt: 2 }}
        >
          {intl.formatMessage({ id: "Tactical.actions.back_to_game", defaultMessage: "Back to game" })}
        </Button>
      </Grid>
    );
  }

  // Normal coach rendering (rest of existing code)
  let currentMoment = manualMoments[currentPly] || computedCriticalMoments.find(
    (m: any) => m.fen === currentFen || m.ply === currentPly
  );
  
  const lastMove = board.history({ verbose: true }).pop();

  const handleManualAnalysis = async () => {
     try {
        if (!lastMove) return;
        
        const fenBefore = lastMove.before;
        const fenAfter = lastMove.after;
        const moveSan = lastMove.san;
        
        let evalBefore = 0;
        let evalAfter = 0;
        
        const result = analyzeTacticalPatterns(fenBefore, moveSan, fenAfter, evalBefore, evalAfter);
        
        // Also analyze the best move if available
        let bestMoveResult = { description: "", themes: [] as string[] };
        let bestMoveSan = "";
        let bestMoveUci = "";
        
        if (gameEval && gameEval.positions && gameEval.positions[currentPly - 1]) {
           const positionEval = gameEval.positions[currentPly - 1];
           bestMoveUci = positionEval.bestMove || "";
           
           if (bestMoveUci) {
              try {
                 const tempChess = new Chess(fenBefore);
                 const from = bestMoveUci.substring(0, 2);
                 const to = bestMoveUci.substring(2, 4);
                 const promotion = bestMoveUci.length > 4 ? bestMoveUci[4] : undefined;
                 const moveResult = tempChess.move({ from, to, promotion });
                 
                 if (moveResult) {
                    bestMoveSan = moveResult.san;
                    const fenAfterBestMove = tempChess.fen();
                    bestMoveResult = analyzeTacticalPatterns(fenBefore, bestMoveSan, fenAfterBestMove);
                 }
              } catch (e) {
                 // Silent fail
              }
           }
        }

        // Always create a moment
        let description = result.description;
        if (!description) {
           const playerName = lastMove.color === 'w' 
              ? (whitePlayer?.name || "White") 
              : (blackPlayer?.name || "Black");
           
           description = JSON.stringify({
               key: "Tactical.descriptions.simple_move",
               params: {
                   player: lastMove.color === 'w' ? "Tactical.pieces.white" : "Tactical.pieces.black",
                   name: playerName,
                   move: moveSan
               }
           });
        }
        
        const newMoment: CriticalMoment = {
            ply: currentPly,
            fen: currentFen,
            move: moveSan,
            description: description,
            themes: result.themes || [],
            tactical: result.isTactical,
            type: result.isTactical ? 'info' : 'normal',
            bestLines: [],
            multiPvLines: 1,
            positionContext: "",
            bestMove: bestMoveUci,
            bestMoveSan: bestMoveSan,
            bestLineDescription: bestMoveResult.description || "",
            bestLineTheme: bestMoveResult.themes || [],
            bestLinePositionContext: "",
            globalDescription: description,
            debugInfo: result.debugInfo,
            evalBefore: 0,
            evalAfter: 0,
            evalDiff: 0,
            playerColor: lastMove.color === 'w' ? 'white' : 'black',
            isUserMove: true
        };
        
        setManualMoments(prev => ({
            ...prev,
            [currentPly]: newMoment
        }));

        if (gameFromUrl && saveManualAnalysis) {
            const existingMoments = (gameFromUrl.criticalMoments || []) as unknown as CriticalMoment[];
            const otherMoments = existingMoments.filter(m => m.ply !== currentPly);
            const allMoments = [...otherMoments, newMoment].sort((a, b) => a.ply - b.ply);
            
            await saveManualAnalysis(gameFromUrl.id, allMoments);
        }
     } catch (error) {
        console.error("Manual analysis error:", error);
     }
  };

  // If no critical moment, create default
  let isDefault = false;
  
  if (currentPly === 0 && !currentMoment) {
     if (openingPhraseKey) {
        currentMoment = {
            ply: 0,
            fen: currentFen,
            move: "",
            description: JSON.stringify({
                key: `Tactical.${openingPhraseKey}`,
                params: {}
            }),
            type: 'opening',
            tactical: false,
            themes: [],
            bestLines: [],
            multiPvLines: 1,
            positionContext: "",
            bestLineDescription: "",
            bestLineTheme: [],
            bestLinePositionContext: "",
            globalDescription: "",
            playerColor: 'white',
            isUserMove: false,
            evalBefore: 0,
            evalAfter: 0,
            evalDiff: 0
        } as unknown as CriticalMoment;
     }
  }
  else if (!currentMoment && lastMove) {
     isDefault = true;
     
     const playerName = lastMove.color === 'w' 
        ? (whitePlayer?.name || "White") 
        : (blackPlayer?.name || "Black");

     currentMoment = {
        ply: currentPly,
        fen: currentFen,
        move: lastMove.san,
        description: JSON.stringify({
            key: "Tactical.descriptions.simple_move",
            params: {
                player: lastMove.color === 'w' ? "Tactical.pieces.white" : "Tactical.pieces.black",
                name: playerName,
                move: lastMove.san
            }
        }),
        type: 'normal',
        tactical: false,
        themes: [],
        bestLines: [],
        multiPvLines: 1,
        positionContext: "",
        bestLineDescription: "",
        bestLineTheme: [],
        bestLinePositionContext: "",
        globalDescription: "",
        playerColor: lastMove.color === 'w' ? 'white' : 'black',
        isUserMove: true,
        evalBefore: 0,
        evalAfter: 0,
        evalDiff: 0
     } as unknown as CriticalMoment; 
  }

  // Check if simple move (allows re-analysis)
  let isSimpleMove = false;
  if (currentMoment?.description) {
    try {
      const parsed = JSON.parse(currentMoment.description);
      if (parsed.key === "Tactical.descriptions.simple_move") {
        isSimpleMove = true;
      }
    } catch (e) {
      // Not JSON
    }
  }

  return (
    <Grid container justifyContent="center" alignItems="center" size={12} flexDirection="column">
      {(currentPly >= 0) && (
        <TacticalCommentBubble
          moveType={currentMoment?.type || "normal"}
          playedMoveDescription={currentMoment?.description}
          bestMoveDescription={currentMoment?.bestLineDescription}
          themes={currentMoment?.themes}
          bestMoveThemes={currentMoment?.bestLineTheme}
          move={currentMoment?.move}
          bestMove={(currentMoment as any)?.bestMoveSan || (currentMoment as any)?.bestMove}
          onAnalyze={(isDefault || isSimpleMove) ? handleManualAnalysis : undefined}
        />
      )}
      
      {/* Debug section unchanged */}
      {analysisSettings?.debugTactics && (
        <Box sx={{ 
          mt: 1, 
          p: 1.5, 
          width: "100%", 
          bgcolor: "rgba(0,0,0,0.05)", 
          borderRadius: 1,
          border: "1px dashed #ccc",
          fontSize: "0.7rem", 
          fontFamily: "monospace",
          display: "flex",
          flexDirection: "column",
          gap: 0.5
        }}>
          <Typography variant="caption" sx={{ fontWeight: "bold", display: "block", color: "primary.main" }}>
            DEBUG TACTICS {currentMoment ? "(Found)" : "(Not Found)"}
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 0.5 }}>
            <strong>Ply:</strong> <span>{currentPly}</span>
            <strong>Move:</strong> <span>{currentMoment?.move}</span>
            <strong>Best:</strong> <span>{(currentMoment as any)?.bestMoveSan} ({(currentMoment as any)?.bestMove})</span>
            
            <div style={{gridColumn: '1 / -1', height: 1, background: '#ddd', margin: '4px 0'}} />
            
            <strong>Played Desc:</strong> 
            <span style={{ wordBreak: 'break-all', color: currentMoment?.description ? 'green' : 'red' }}>
              {currentMoment?.description || 'NONE'}
            </span>
            
            <strong>Played Themes:</strong>
            <span style={{ color: currentMoment?.themes && currentMoment.themes.length > 0 ? 'green' : 'orange' }}>
              {currentMoment?.themes && currentMoment.themes.length > 0 ? currentMoment.themes.join(', ') : 'NONE'}
            </span>
            
            <div style={{gridColumn: '1 / -1', height: 1, background: '#ddd', margin: '4px 0'}} />
            
            <strong>Best Desc:</strong>
            <span style={{ wordBreak: 'break-all', color: currentMoment?.bestLineDescription ? 'green' : 'red' }}>
              {currentMoment?.bestLineDescription || 'NONE'}
            </span>
            
            <strong>Best Themes:</strong>
            <span style={{ color: currentMoment?.bestLineTheme && currentMoment.bestLineTheme.length > 0 ? 'green' : 'orange' }}>
              {currentMoment?.bestLineTheme && currentMoment.bestLineTheme.length > 0 ? currentMoment.bestLineTheme.join(', ') : 'NONE'}
            </span>
            
            <div style={{gridColumn: '1 / -1', height: 1, background: '#ddd', margin: '4px 0'}} />
            
            <strong>Type:</strong> <span>{currentMoment?.type}</span>
            <strong>Eval Before:</strong> <span>{currentMoment?.evalBefore}</span>
            <strong>Eval After:</strong> <span>{currentMoment?.evalAfter}</span>
            <strong>Eval Diff:</strong> <span style={{ color: (currentMoment?.evalDiff || 0) < -100 ? 'red' : 'inherit' }}>
              {currentMoment?.evalDiff}
            </span>
            
            <div style={{gridColumn: '1 / -1', height: 1, background: '#ddd', margin: '4px 0'}} />
            
            <strong>FEN Before:</strong>
            <span style={{ wordBreak: 'break-all', fontSize: '0.6rem' }}>{lastMove?.before || 'N/A'}</span>
            
            <strong>FEN After:</strong>
            <span style={{ wordBreak: 'break-all', fontSize: '0.6rem' }}>{currentFen}</span>
          </Box>
        </Box>
      )}
    </Grid>
  );
}
