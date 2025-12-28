import { formatGameToDatabase } from "@/lib/chess";
import { analyzeTactics } from "@/lib/tacticalAnalysis";
import { GameEval } from "@/types/eval";
import { Game } from "@/types/game";
import { Chess } from "chess.js";
import { useAtom } from "jotai";
import { gamesAtom, fetchGamesAtom } from "@/atoms/chess";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export const useGameDatabase = (shouldFetchGames?: boolean) => {
  const [games, setGames] = useAtom(gamesAtom);
  const [fetchGames, setFetchGames] = useAtom(fetchGamesAtom);
  const [gameFromUrl, setGameFromUrl] = useState<Game | undefined>(undefined);
  const { data: session } = useSession();

  useEffect(() => {
    if (shouldFetchGames !== undefined) {
      setFetchGames(shouldFetchGames);
    }
  }, [shouldFetchGames, setFetchGames]);

  const loadGames = useCallback(async () => {
    if (session && fetchGames) {
      try {
        const response = await fetch("/api/games");
        if (response.ok) {
          const gamesData = await response.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const formattedGames = gamesData.map((g: any) => ({
            ...g,
            white: { name: g.whiteName, rating: g.whiteRating },
            black: { name: g.blackName, rating: g.blackRating },
          }));
          setGames(formattedGames);
        }
      } catch (error) {
        console.error("Failed to load games:", error);
      }
    }
  }, [session, fetchGames, setGames]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const addGame = useCallback(
    async (game: Chess, userColor?: "white" | "black") => {
      if (!session) throw new Error("Not authenticated");

      const { white, black, ...rest } = formatGameToDatabase(game);

      // logic: explicit > inferred > default
      // We leave the heavy lifting to the server which has access to full profile (external usernames)
      // and can calculate average rating reliably.

      const gameToAdd = {
        ...rest,
        whiteName: white.name,
        whiteRating: white.rating,
        blackName: black.name,
        blackRating: black.rating,
        termination: rest.termination,
        timeControl: rest.timeControl,
        gameUrl: rest.gameUrl,
        ecoUrl: rest.ecoUrl,
        userColor,
      };

      const response = await fetch("/api/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gameToAdd),
      });

      if (!response.ok) {
        throw new Error("Failed to save game");
      }

      const savedGame = await response.json();
      loadGames();

      return savedGame.id;
    },
    [session, loadGames]
  );

  const setGameEval = useCallback(
    async (
      gameId: number,
      evaluation: GameEval,
      engineName?: string,
      engineDepth?: number,
      settings?: {
        multiPv?: number;
        showBestMove?: boolean;
        showPlayerMove?: boolean;
        boardHue?: number;
        pieceSet?: string;
      },
      gameContext?: {
        fens: string[];
        moves: string[]; // SAN moves
      }
    ) => {
      if (!session) return;

      try {
        // Extract statistics from evaluation - count all classifications separately
        const whiteStats = {
          brilliant: 0,
          splendid: 0,
          perfect: 0,
          best: 0,
          excellent: 0,
          okay: 0,
          opening: 0,
          inaccuracy: 0,
          mistakes: 0,
          blunders: 0,
        };
        const blackStats = {
          brilliant: 0,
          splendid: 0,
          perfect: 0,
          best: 0,
          excellent: 0,
          okay: 0,
          opening: 0,
          inaccuracy: 0,
          mistakes: 0,
          blunders: 0,
        };

        evaluation.positions.forEach((pos, idx) => {
          // positions[0] is White's first move, positions[1] is Black's first move, etc.
          // So: idx % 2 === 0 → White, idx % 2 === 1 → Black
          const isWhite = idx % 2 === 0;
          const stats = isWhite ? whiteStats : blackStats;
          const classification = pos.moveClassification;

          // Count each classification separately
          // Note: 'brilliant' is not a classification from the engine, only a DB field
          if (classification === "splendid") stats.splendid++;
          else if (classification === "perfect") stats.perfect++;
          else if (classification === "best") stats.best++;
          else if (classification === "excellent") stats.excellent++;
          else if (classification === "okay") stats.okay++;
          else if (classification === "opening") stats.opening++;
          else if (classification === "forced")
            stats.opening++; // Forced counts as opening
          else if (classification === "inaccuracy") stats.inaccuracy++;
          else if (classification === "mistake") stats.mistakes++;
          else if (classification === "blunder") stats.blunders++;
        });

        // Build critical moments
        const criticalMoments = evaluation.positions
          .map((pos, idx) => {
            // Determine FEN before the move
            // Determine FEN before the move
            const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
            const fenBefore = gameContext?.fens?.[idx] || startFen;
            
            const positionFen = gameContext?.fens?.[idx + 1] || "";
            const moveSan = gameContext?.moves?.[idx] || "";
            
            // Perform Tactical Analysis
            let analysisResult = {
                tactical: false,
                themes: [] as string[],
                description: "",
                descriptionEn: "",
                descriptionFr: "",
            };
            let detailedPatterns: any[] = [];
            
            if (positionFen && moveSan) {
                 const result = analyzeTactics(
                    positionFen,
                    moveSan,
                    null, // evalDiff computed later
                    undefined,
                    pos.bestMove,
                    fenBefore
                 );
                 if (result.descriptionEn) analysisResult.descriptionEn = result.descriptionEn;
                 if (result.descriptionFr) analysisResult.descriptionFr = result.descriptionFr;
                 analysisResult.tactical = result.tactical;
                 analysisResult.themes = result.themes;
                 analysisResult.description = result.description;
                 if (result.patterns) detailedPatterns = result.patterns;
                 

            }

            const type = pos.moveClassification;
            
            // Filter: Keep if Blunder/Mistake/Excellent/Best OR if Tactical Pattern detected
            if (
              type === "blunder" ||
              type === "mistake" ||
              type === "excellent" ||
              type === "best" ||
              (detailedPatterns.length > 0)
            ) {
              const prevLine = evaluation.positions[idx - 1]?.lines?.[0];
              const currLine = pos.lines?.[0];
              
              // Extract evaluations - handle multiple formats
              // evalBefore: evaluation of the position BEFORE the move was made
              // evalAfter: evaluation of the position AFTER the move was made
              
              // Try to extract from lines (standard case)
              let evalBefore: number | null = null;
              let evalAfter: number | null = null;
              
              // evalBefore from previous position's best line
              if (prevLine) {
                if (prevLine.cp !== undefined) {
                  evalBefore = prevLine.cp;
                } else if (prevLine.mate !== undefined) {
                  evalBefore = prevLine.mate > 0 ? 10000 : -10000;
                }
              } else if (idx === 0) {
                // First move - starting position is roughly equal
                evalBefore = 0;
              }
              
              // evalAfter from current position's best line  
              if (currLine) {
                if (currLine.cp !== undefined) {
                  evalAfter = currLine.cp;
                } else if (currLine.mate !== undefined) {
                  evalAfter = currLine.mate > 0 ? 10000 : -10000;
                }
              }
              
              // Calculate evaluation difference
              let evalDiff: number | null = null;
              if (evalBefore !== null && evalAfter !== null) {
                const isWhite = idx % 2 === 0;
                const rawDiff = evalAfter - evalBefore;
                evalDiff = isWhite ? rawDiff : -rawDiff;
              }

              // Determine player context
              const isWhite = idx % 2 === 0;
              const playerColor = isWhite ? "white" : "black";
              
              const game = games.find((g) => g.id === gameId) || 
                          (gameFromUrl?.id === gameId ? gameFromUrl : undefined);
              const isUserMove = game?.userColor
                ? game.userColor === playerColor
                : false;
              
              const criticalMoment = {
                ply: idx,
                fen: positionFen,
                move: moveSan,
                bestMove: pos.bestMove,
                type: type || "info", // Fallback
                evalBefore,
                evalAfter,
                evalDiff,
                playerColor,
                isUserMove,
                bestLines: pos.lines || [],
                multiPvLines: settings?.multiPv || pos.lines?.length || 1,
                
                // Tactical context
                positionContext: detailedPatterns.length > 0 ? JSON.stringify(detailedPatterns) : "", 
                tactical: analysisResult.tactical,
                themes: analysisResult.themes,
                description: analysisResult.descriptionEn || analysisResult.description, // Prefer English
                // commentaryEn/Fr reserved for AI
              };
              
              
              /*
               if (detailedPatterns.length > 0) {
                   console.log("Saving Valid Critical Moment:", criticalMoment.positionContext);
              }
              */
              
              return criticalMoment;
            }
            return null;
          })
          .filter(Boolean);

        // Build move evaluations for JSON storage
        const moveEvaluations = evaluation.positions.map((pos, idx) => {
          const line = pos.lines?.[0];
          return {
            ply: idx,
            eval: line?.cp ?? (line?.mate ? line.mate * 10000 : null),
            bestMove: pos.bestMove,
            classification: pos.moveClassification,
            evalDiff: null, // Not available in current type
          };
        });

        const response = await fetch(`/api/games/${gameId}/analysis`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            engineName,
            engineDepth,
            engineMultiPv: settings?.multiPv,
            showBestMove: settings?.showBestMove,
            showPlayerMove: settings?.showPlayerMove,
            boardHue: settings?.boardHue,
            pieceSet: settings?.pieceSet,
            whiteAccuracy: evaluation.accuracy?.white,
            blackAccuracy: evaluation.accuracy?.black,
            whiteBrilliant: whiteStats.brilliant,
            whiteSplendid: whiteStats.splendid,
            whitePerfect: whiteStats.perfect,
            whiteBest: whiteStats.best,
            whiteExcellent: whiteStats.excellent,
            whiteOkay: whiteStats.okay,
            whiteOpening: whiteStats.opening,
            whiteInaccuracy: whiteStats.inaccuracy,
            whiteMistakes: whiteStats.mistakes,
            whiteBlunders: whiteStats.blunders,
            blackBrilliant: blackStats.brilliant,
            blackSplendid: blackStats.splendid,
            blackPerfect: blackStats.perfect,
            blackBest: blackStats.best,
            blackExcellent: blackStats.excellent,
            blackOkay: blackStats.okay,
            blackOpening: blackStats.opening,
            blackInaccuracy: blackStats.inaccuracy,
            blackMistakes: blackStats.mistakes,
            blackBlunders: blackStats.blunders,
            openingECO: undefined,
            openingName: [...evaluation.positions]
              .reverse()
              .find((p) => p.opening)?.opening,
            moveEvaluations,
            criticalMoments,
            movesCount: evaluation.positions.length,
            eval: evaluation,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Failed to save analysis: ${text}`);
        } else {
          loadGames();
        }
      } catch (error) {
        console.error("Error saving analysis:", error);
      }
    },
    [session, loadGames, games, gameFromUrl]
  );

  const loadGameAnalysis = useCallback(
    async (gameId: number) => {
      if (!session) return null;

      try {
        const response = await fetch(`/api/games/${gameId}/analysis`);
        if (response.ok) {
          const data = await response.json();
          if (data.analyzed) {
            return data;
          }
        }
      } catch (error) {
        console.error("Failed to load analysis:", error);
      }
      return null;
    },
    [session]
  );

  const getGame = useCallback(
    async (gameId: number) => {
      // If games are already loaded, find in memory first
      if (games.length > 0) {
        return games.find((g) => g.id === gameId);
      }

      // Otherwise fetch from API (could add specific endpoint for single game)
      if (session) {
        try {
          const response = await fetch("/api/games");
          if (response.ok) {
            const gamesData = await response.json();
            // Apply same formatting as loadGames to include analyzed field
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const formattedGames: Game[] = gamesData.map((g: any) => ({
              ...g,
              white: { name: g.whiteName, rating: g.whiteRating },
              black: { name: g.blackName, rating: g.blackRating },
            }));
            return formattedGames.find((g) => g.id === gameId);
          }
        } catch (error) {
          console.error("Failed to load game:", error);
        }
      }
      return undefined;
    },
    [games, session]
  );

  const deleteGame = useCallback(
    async (gameId: number) => {
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(`/api/games/${gameId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete game");
      }

      loadGames();
    },
    [session, loadGames]
  );

  const updateGame = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (gameId: number, data: any) => {
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update game");
      }

      loadGames();
    },
    [session, loadGames]
  );

  const router = useRouter();
  const { gameId } = router.query;

  useEffect(() => {
    switch (typeof gameId) {
      case "string":
        const id = parseInt(gameId);
        // Avoid infinite loop: if we already have the correct game loaded, don't re-fetch/re-set
        if (gameFromUrl?.id === id) return;

        getGame(id).then((game) => {
          setGameFromUrl((prev) => {
            // Only update if the game object has actually changed (basic ID check)
            if (prev?.id === game?.id) return prev;
            return game;
          });
        });
        break;
      default:
        setGameFromUrl(undefined);
    }
  }, [gameId, getGame, gameFromUrl?.id]);

  const isReady = !!session;

  return {
    addGame,
    setGameEval,
    loadGameAnalysis,
    getGame,
    deleteGame,
    updateGame,
    games,
    isReady,
    gameFromUrl,
    isAuthenticated: !!session,
  };
};
