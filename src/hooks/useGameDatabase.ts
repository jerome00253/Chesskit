import { formatGameToDatabase } from "@/lib/chess";
import { GameEval } from "@/types/eval";
import { Game } from "@/types/game";
import { Chess } from "chess.js";
import { atom, useAtom } from "jotai";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const gamesAtom = atom<Game[]>([]);
const fetchGamesAtom = atom<boolean>(false);

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
    async (game: Chess) => {
      if (!session) throw new Error("Not authenticated");

      const gameToAdd = formatGameToDatabase(game);

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

  const setGameEval = useCallback(async (_: number, evaluation: GameEval) => {
    // Evaluation update is not yet implemented in API, keeping local updates for now
    // ideally this should call a PUT/PATCH endpoint
    console.log("Evaluation update not persisted to DB:", evaluation);
  }, []);

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
            const gamesData: Game[] = await response.json();
            return gamesData.find((g) => g.id === gameId);
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
        getGame(parseInt(gameId)).then((game) => {
          setGameFromUrl(game);
        });
        break;
      default:
        setGameFromUrl(undefined);
    }
  }, [gameId, setGameFromUrl, getGame]);

  const isReady = !!session;

  return {
    addGame,
    setGameEval,
    getGame,
    deleteGame,
    updateGame,
    games,
    isReady,
    gameFromUrl,
    isAuthenticated: !!session,
  };
};
