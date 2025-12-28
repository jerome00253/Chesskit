import LoadGameButton from "../../loadGame/loadGameButton";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useChessActions } from "@/hooks/useChessActions";
import {
  boardAtom,
  boardOrientationAtom,
  evaluationProgressAtom,
  gameAtom,
  gameEvalAtom,
  engineNameAtom,
  engineDepthAtom,
  engineMultiPvAtom,
  loadedGameMetadataAtom,
} from "../states";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Chess } from "chess.js";
import { useRouter } from "next/router";
import { GameEval } from "@/types/eval";
import { fetchLichessGame } from "@/lib/lichess";
import { useTranslations } from "next-intl";
import { EngineName } from "@/types/enums";
import { boardHueAtom, pieceSetAtom } from "@/components/board/states";

export default function LoadGame() {
  const router = useRouter();
  const tAnalysis = useTranslations("Analysis");
  const tDatabase = useTranslations("Database");
  const game = useAtomValue(gameAtom);
  const { setPgn: setGamePgn } = useChessActions(gameAtom);
  const { resetToStartingPosition: resetBoard, goToMove } = useChessActions(boardAtom);
  const { gameFromUrl } = useGameDatabase();
  const [, setEval] = useAtom(gameEvalAtom);
  const [, setBoardOrientation] = useAtom(boardOrientationAtom);
  const [, setEngineName] = useAtom(engineNameAtom);
  const [, setEngineDepth] = useAtom(engineDepthAtom);
  const [, setEngineMultiPv] = useAtom(engineMultiPvAtom);
  const [, setBoardHue] = useAtom(boardHueAtom);
  const [, setPieceSet] = useAtom(pieceSetAtom);
  const setLoadedGameMetadata = useSetAtom(loadedGameMetadataAtom);
  const evaluationProgress = useAtomValue(evaluationProgressAtom);

  const joinedGameHistory = useMemo(() => game.history().join(), [game]);
  
  // Track if we've already navigated to the move from URL to avoid infinite loop
  const moveNavigatedRef = useRef<string | null>(null);

  const resetAndSetGamePgn = useCallback(
    (pgn: string, orientation?: boolean, gameEval?: GameEval) => {
      const gameFromPgn = new Chess();
      gameFromPgn.loadPgn(pgn);
      if (joinedGameHistory === gameFromPgn.history().join()) return;

      resetBoard(pgn);
      setEval(gameEval);
      setGamePgn(pgn);
      setBoardOrientation(orientation ?? true);
    },
    [joinedGameHistory, resetBoard, setGamePgn, setEval, setBoardOrientation]
  );

    const { lichessGameId, orientation: orientationParam, move: moveParam } = router.query;
  
    // When game from DB loads, store its metadata
    useEffect(() => {
      if (gameFromUrl?.analyzed) {
        setLoadedGameMetadata({
          gameId: gameFromUrl.id,
          engineName: gameFromUrl.engineName,
          engineDepth: gameFromUrl.engineDepth,
          engineMultiPv: gameFromUrl.engineMultiPv,
          boardHue: gameFromUrl.boardHue,
          pieceSet: gameFromUrl.pieceSet,
        });
      } else {
        // Always clear if not an analyzed game (includes undefined/null gameFromUrl)
        setLoadedGameMetadata(null);
      }
    }, [gameFromUrl, setLoadedGameMetadata]);
  
    // Restore settings from metadata atom
    const loadedMetadata = useAtomValue(loadedGameMetadataAtom);
    useEffect(() => {
      if (loadedMetadata) {
        // Write to localStorage AND set atoms
        if (loadedMetadata.engineName) {
          localStorage.setItem(
            "engine-name",
            JSON.stringify(loadedMetadata.engineName)
          );
          setEngineName(loadedMetadata.engineName as EngineName);
        }
        if (loadedMetadata.engineDepth !== undefined) {
          localStorage.setItem(
            "engine-depth",
            JSON.stringify(loadedMetadata.engineDepth)
          );
          setEngineDepth(loadedMetadata.engineDepth);
        }
        if (loadedMetadata.engineMultiPv !== undefined) {
          localStorage.setItem(
            "engine-multi-pv",
            JSON.stringify(loadedMetadata.engineMultiPv)
          );
          setEngineMultiPv(loadedMetadata.engineMultiPv);
        }
        if (loadedMetadata.boardHue !== undefined) {
          localStorage.setItem(
            "boardHue",
            JSON.stringify(loadedMetadata.boardHue)
          );
          setBoardHue(loadedMetadata.boardHue);
        }
        if (loadedMetadata.pieceSet) {
          localStorage.setItem(
            "pieceSet",
            JSON.stringify(loadedMetadata.pieceSet)
          );
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setPieceSet(loadedMetadata.pieceSet as any);
        }
      }
    }, [
      loadedMetadata,
      setEngineName,
      setEngineDepth,
      setEngineMultiPv,
      setBoardHue,
      setPieceSet,
    ]);
  
    useEffect(() => {
      const handleLichess = async (id: string) => {
        const res = await fetchLichessGame(id);
        if (typeof res === "string") {
          resetAndSetGamePgn(res, orientationParam !== "black");
        }
      };
  
      if (gameFromUrl) {
        const orientation = !(
          gameFromUrl.site === "Chesskit.org" && gameFromUrl.black.name === "You"
        );
  
        // Engine settings are now restored in useLayoutEffect above
        resetAndSetGamePgn(gameFromUrl.pgn, orientation, gameFromUrl.eval);

        // Handle move navigation if 'move' param is present
        if (moveParam && typeof moveParam === "string" && moveNavigatedRef.current !== moveParam) {
            const tempGame = new Chess();
            tempGame.loadPgn(gameFromUrl.pgn);
            const history = tempGame.history();
            const moveIndex = history.indexOf(moveParam);
            if (moveIndex !== -1) {
                // Mark this move as navigated
                moveNavigatedRef.current = moveParam;
                
                setTimeout(() => {
                    goToMove(moveIndex + 1, tempGame);
                    
                    // Clear the move param from URL to allow free navigation
                    const currentPath = router.asPath.split("?")[0];
                    router.replace(
                        {
                            pathname: currentPath,
                            query: { gameId: router.query.gameId } // Keep gameId, remove move
                        },
                        undefined,
                        { shallow: true, scroll: false }
                    );
                }, 100);
            }
        }

      } else if (typeof lichessGameId === "string" && !!lichessGameId) {
        handleLichess(lichessGameId);
      }
    }, [gameFromUrl, lichessGameId, orientationParam, moveParam, resetAndSetGamePgn, goToMove]);

  useEffect(() => {
    const eventHandler = (event: MessageEvent) => {
      try {
        if (!event?.data?.pgn) return;
        const { pgn, orientation } = event.data as {
          pgn: string;
          orientation?: "white" | "black";
        };
        resetAndSetGamePgn(pgn, orientation !== "black");
      } catch (error) {
        console.error("Error processing message event:", error);
      }
    };
    window.addEventListener("message", eventHandler);

    return () => {
      window.removeEventListener("message", eventHandler);
    };
  }, [resetAndSetGamePgn]);

  const isGameLoaded =
    gameFromUrl !== undefined ||
    (!!game.getHeaders().White && game.getHeaders().White !== "?") ||
    game.history().length > 0;

  if (evaluationProgress) return null;

  return (
    <LoadGameButton
      label={
        isGameLoaded ? tAnalysis("load_another_game") : tDatabase("load_game")
      }
      size="small"
      setGame={async (game) => {
        // Use asPath to avoid '[locale]' placeholders in pathname
        const currentPath = router.asPath.split("?")[0];
        await router.replace(
          {
            query: {},
            pathname: currentPath,
          },
          undefined,
          { shallow: true, scroll: false }
        );
        resetAndSetGamePgn(game.pgn());
      }}
    />
  );
}
