import { Chess } from "chess.js";
import { PrimitiveAtom, useAtomValue } from "jotai";
import { useGameDatabase } from "./useGameDatabase";
import { useQuery } from "@tanstack/react-query";
import { getChessComUserAvatar } from "@/lib/chessCom";
import { Player } from "@/types/game";

export const usePlayersData = (
  gameAtom: PrimitiveAtom<Chess>
): { white: Player; black: Player } => {
  const game = useAtomValue(gameAtom);
  const { gameFromUrl } = useGameDatabase();
  const headers = game.getHeaders();

  const headersWhiteName =
    headers.White && headers.White !== "?" ? headers.White : undefined;
  const headersBlackName =
    headers.Black && headers.Black !== "?" ? headers.Black : undefined;

  // Pour l'affichage : prioriser le nom modifié dans la base de données
  const whiteName = gameFromUrl?.white?.name || headersWhiteName || "White";
  const blackName = gameFromUrl?.black?.name || headersBlackName || "Black";

  // Pour les avatars : TOUJOURS utiliser le nom original du PGN
  // Cela garantit que l'avatar correspond au username Chess.com/Lichess original,
  // même si l'utilisateur a personnalisé le nom affiché dans l'application
  const whiteAvatarName = headersWhiteName || gameFromUrl?.white?.name || "White";
  const blackAvatarName = headersBlackName || gameFromUrl?.black?.name || "Black";

  const whiteElo =
    gameFromUrl?.white?.rating || Number(headers.WhiteElo) || undefined;
  const blackElo =
    gameFromUrl?.black?.rating || Number(headers.BlackElo) || undefined;

  const siteHeader = gameFromUrl?.site || headers.Site || "unknown";
  const isChessCom = siteHeader.toLowerCase().includes("chess.com");

  const whiteAvatarUrl = usePlayerAvatarUrl(
    whiteAvatarName,  // Utilise le nom original du PGN pour l'avatar
    isChessCom && !!whiteAvatarName && whiteAvatarName !== "White"
  );

  const blackAvatarUrl = usePlayerAvatarUrl(
    blackAvatarName,  // Utilise le nom original du PGN pour l'avatar
    isChessCom && !!blackAvatarName && blackAvatarName !== "Black"
  );

  return {
    white: {
      name: whiteName,
      rating: whiteElo,
      avatarUrl: whiteAvatarUrl ?? undefined,
    },
    black: {
      name: blackName,
      rating: blackElo,
      avatarUrl: blackAvatarUrl ?? undefined,
    },
  };
};

const usePlayerAvatarUrl = (
  playerName: string,
  enabled: boolean
): string | null | undefined => {
  const { data: avatarUrl } = useQuery({
    queryKey: ["CCAvatar", playerName],
    enabled,
    queryFn: () => getChessComUserAvatar(playerName),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 1 day
  });

  return avatarUrl;
};
