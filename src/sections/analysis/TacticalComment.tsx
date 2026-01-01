import { Grid2 as Grid, Box, Typography, Button } from "@mui/material";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { boardAtom, gameAtom, gameEvalAtom, engineMultiPvAtom, explorationModeAtom, deviationPointPlyAtom } from "./states";
import TacticalCommentBubble from "@/components/analysis/TacticalCommentBubble";
import { useSession } from "next-auth/react";
import { useMemo, useState, useEffect } from "react";
import { buildCriticalMoments, CriticalMoment } from "@/lib/criticalMomentBuilder";
import { Chess } from "chess.js";

import { analyzeTacticalPatterns } from "@/lib/tactical";
import { usePlayersData } from "@/hooks/usePlayersData";

export default function TacticalComment() {
  const { gameFromUrl, saveManualAnalysis } = useGameDatabase();
  const board = useAtomValue(boardAtom);
  const game = useAtomValue(gameAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const multiPv = useAtomValue(engineMultiPvAtom);
  
  const { data: session } = useSession();
  const analysisSettings = (session?.user as any)?.analysisSettings;
  const showComments = true; // FORCE SHOW FOR DEBUG: analysisSettings?.showComments !== false;
  
  // Exploration mode tracking
  const [isExploring, setIsExploring] = useAtom(explorationModeAtom);
  const [deviationPly, setDeviationPly] = useAtom(deviationPointPlyAtom);
  
  const { white: whitePlayer, black: blackPlayer } = usePlayersData(gameAtom);

  // Random opening phrase
  const [openingPhraseKey, setOpeningPhraseKey] = useState<string>("");

  useEffect(() => {
    // Select random phrase 1-5
    const randomNum = Math.floor(Math.random() * 5) + 1;
    setOpeningPhraseKey(`opening.phrase${randomNum}`);
  }, []);
  
  // State to store manually triggered analyses
  const [manualMoments, setManualMoments] = useState<Record<number, CriticalMoment>>({});

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
  
  console.log("TacticalComment Render:", { currentPly, currentFen, showComments, manualMomentsCount: Object.keys(manualMoments).length });

  // Prefer manual moment if it exists for this ply
  let currentMoment = manualMoments[currentPly] || computedCriticalMoments.find(
    (m: any) => m.fen === currentFen || m.ply === currentPly
  );
  
  const lastMove = board.history({ verbose: true }).pop();
  
  console.log("Current Moment before default:", currentMoment);
  console.log("Last Move:", lastMove);

  const handleManualAnalysis = async () => {
     try {
        if (!lastMove) {
            return;
        }
        
        const fenBefore = lastMove.before;
        const fenAfter = lastMove.after;
        const moveSan = lastMove.san;
        
        // Retrieve current evaluation context if available
        let evalBefore = 0;
        let evalAfter = 0;
        
        const result = analyzeTacticalPatterns(fenBefore, moveSan, fenAfter, evalBefore, evalAfter);
        
        // Also analyze the best move if available from gameEval
        let bestMoveResult = { description: "", themes: [] as string[] };
        let bestMoveSan = "";
        let bestMoveUci = "";
        
        if (gameEval && gameEval.positions && gameEval.positions[currentPly - 1]) {
           const positionEval = gameEval.positions[currentPly - 1];
           bestMoveUci = positionEval.bestMove || "";
           
           if (bestMoveUci) {
              console.log("🎯 [Manual Analysis] Found best move:", bestMoveUci);
              try {
                 // Simulate best move using chess.js
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
                 console.warn("⚠️ [Manual Analysis] Could not analyze best move:", e);
              }
           }
        }

        // Always create a moment, even if no tactics are found
        // If no description from tactical analysis, create a simple move description
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
        
        // 1. Optimistic Update
        setManualMoments(prev => ({
            ...prev,
            [currentPly]: newMoment
        }));

        // 2. Persist to Database if this is a saved game
        if (gameFromUrl && saveManualAnalysis) {
            // We take all existing moments EXCEPT the one for the current ply (if any), and append the new one
            // Cast to ensure type compatibility with the fuller CriticalMoment type
            const existingMoments = (gameFromUrl.criticalMoments || []) as unknown as CriticalMoment[];
            const otherMoments = existingMoments.filter(m => m.ply !== currentPly);
            
            // Note: We don't automatically merge other manualMoments from local state 
            // because they might already be saved or might conflict. 
            // We focus on saving the CURRENT manual analysis action.
            const allMoments = [...otherMoments, newMoment].sort((a, b) => a.ply - b.ply);
            
            await saveManualAnalysis(gameFromUrl.id, allMoments);
        }
     } catch (error) {
        console.error("Manual analysis error:", error);
     }
  };

  // If no critical moment, create a default "Player plays Move" moment
  let isDefault = false;
  
  // CASE 1: Start of Game (Ply 0)
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
            type: 'opening', // Use opening icon
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
  // CASE 2: No special moment found for this move -> Default description
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

  // Ensure we render for Ply 0 now
  // if (!currentMoment && currentPly === 0) return null; 

  return (
    <Grid container justifyContent="center" alignItems="center" size={12} flexDirection="column">
      {(currentPly >= 0) && ( // Allow Ply 0
        <TacticalCommentBubble
          moveType={currentMoment?.type || "normal"}
          playedMoveDescription={currentMoment?.description}
          bestMoveDescription={currentMoment?.bestLineDescription}
          themes={currentMoment?.themes}
          bestMoveThemes={currentMoment?.bestLineTheme}
          move={currentMoment?.move}
          bestMove={(currentMoment as any)?.bestMoveSan || (currentMoment as any)?.bestMove}
          onAnalyze={isDefault ? handleManualAnalysis : undefined}
        />
      )}
      
      
      {/* DEBUG TACTICS (Enabled via Profile > Preferences) */}
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
              {currentMoment?.description || "NONE"}
            </span>
            
            <strong>Played Themes:</strong>
            <span>{currentMoment?.themes?.join(', ') || "NONE"}</span>

            <strong>Best Desc:</strong> 
            <span style={{ wordBreak: 'break-all', color: currentMoment?.bestLineDescription ? 'green' : 'orange' }}>
              {currentMoment?.bestLineDescription || "NONE"}
            </span>

            <strong>Best Themes:</strong>
            <span>{Array.isArray((currentMoment as any)?.bestLineTheme) ? (currentMoment as any)?.bestLineTheme.join(', ') : "NONE"}</span>
            
            <div style={{gridColumn: '1 / -1', height: 1, background: '#ddd', margin: '4px 0'}} />

            <strong>Type:</strong> <span>{currentMoment?.type || "N/A"}</span>
            <strong>Eval Before:</strong> <span>{(currentMoment as any)?.evalBefore !== undefined ? (currentMoment as any).evalBefore : "N/A"}</span>
            <strong>Eval After:</strong> <span>{(currentMoment as any)?.evalAfter !== undefined ? (currentMoment as any).evalAfter : "N/A"}</span>
            <strong>Eval Diff:</strong> <span>{(currentMoment as any)?.evalDiff !== undefined ? (currentMoment as any).evalDiff : "N/A"}</span>
            
            <div style={{gridColumn: '1 / -1', height: 1, background: '#ddd', margin: '4px 0'}} />
            
            {(currentMoment as any)?.debugInfo && (
              <>
                 <strong>Found Patterns:</strong>
                 <span>{(currentMoment as any).debugInfo.rawPatterns?.length || 0}</span>
                 
                 {(currentMoment as any).debugInfo.rawPatterns?.map((p: any, i: number) => (
                    <span key={i} style={{ gridColumn: '1 / -1', fontSize: '0.65rem' }}>
                      - {p.theme} ({p.squares?.join(', ')}) {p.gain ? `Gain: ${p.gain}` : ''}
                    </span>
                 ))}
                 
                 <strong>Refuted:</strong>
                 <span>{(currentMoment as any).debugInfo.refutedPatterns?.length || 0}</span>
                 
                 {(currentMoment as any).debugInfo.refutedPatterns?.map((p: any, i: number) => (
                    <span key={`refuted-${i}`} style={{ gridColumn: '1 / -1', fontSize: '0.65rem', color: 'red' }}>
                      - {p.pattern.theme} ({p.reason})
                    </span>
                 ))}

                 <strong>Validated:</strong>
                 <span>{(currentMoment as any).debugInfo.validatedPatterns?.length || 0}</span>
                 
                 <div style={{gridColumn: '1 / -1', height: 1, background: '#ddd', margin: '4px 0'}} />
              </>
            )}
            
            <strong>FEN Before:</strong> 
            <span style={{ wordBreak: 'break-all', fontSize: '0.65rem' }}>
              {board.history({ verbose: true }).pop()?.before || "Start"}
            </span>
            
            <strong>FEN After:</strong> 
            <span style={{ wordBreak: 'break-all', fontSize: '0.65rem' }}>
              {currentFen}
            </span>
          </Box>
        </Box>
      )}
    </Grid>
  );
}
