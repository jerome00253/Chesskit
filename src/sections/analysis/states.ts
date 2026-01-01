import { DEFAULT_ENGINE } from "@/constants";
import { getRecommendedWorkersNb } from "@/lib/engine/worker";
import { EngineName } from "@/types/enums";
import { CurrentPosition, GameEval, SavedEvals } from "@/types/eval";
import { Chess } from "chess.js";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const gameEvalAtom = atom<GameEval | undefined>(undefined);
export const gameAtom = atom(new Chess());
export const boardAtom = atom(new Chess());
export const currentPositionAtom = atom<CurrentPosition>({});

export const boardOrientationAtom = atomWithStorage("boardOrientation", true);
export const showBestMoveArrowAtom = atomWithStorage(
  "show-arrow-best-move",
  true
);
export const showPlayerMoveIconAtom = atomWithStorage(
  "show-icon-player-move",
  true
);

export const engineNameAtom = atomWithStorage<EngineName>(
  "engine-name",
  DEFAULT_ENGINE
);
export const engineDepthAtom = atomWithStorage("engine-depth", 14);
export const engineMultiPvAtom = atomWithStorage("engine-multi-pv", 3);
export const engineWorkersNbAtom = atomWithStorage(
  "engineWorkersNb",
  getRecommendedWorkersNb()
);
export const evaluationProgressAtom = atom(0);

export const savedEvalsAtom = atom<SavedEvals>({});
export const debugStatusAtom = atom<string>("Init");

// Atom to track currently loaded game from database
export const loadedGameMetadataAtom = atom<{
  gameId?: number;
  engineName?: string;
  engineDepth?: number;
  engineMultiPv?: number;
  boardHue?: number;
  pieceSet?: string;
} | null>(null);

export const areAnalysisSettingsLoadedAtom = atom(false);

// Variation exploration tracking
export const explorationModeAtom = atom<boolean>(false);
export const deviationPointPlyAtom = atom<number | null>(null); // Ply where user deviated from main game

