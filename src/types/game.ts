import { GameEval } from "./eval";

export interface Game {
  id: number;
  pgn: string;
  event?: string;
  site?: string;
  date?: string;
  round?: string;
  white: Player;
  black: Player;
  result?: string;
  eval?: GameEval;
  termination?: string;
  timeControl?: string;
  userColor?: "white" | "black";
  // Analysis persistence fields
  analyzed?: boolean;
  analyzedAt?: string;
  aiAnalysis?: string;
  aiSummary?: string;
  aiKeyMoments?: string;
  aiAdvice?: string;
  engineName?: string;
  engineDepth?: number;
  engineMultiPv?: number;
  boardHue?: number;
  pieceSet?: string;
  whiteAccuracy?: number;
  blackAccuracy?: number;
  gameType?: string;
  gameLevel?: string;
  openingECO?: string;
  openingName?: string;
  gameUrl?: string;
  ecoUrl?: string;
  importOrigin?: string;
  // Move quality stats - all classifications (matching DB schema)
  whiteBrilliant?: number;
  whiteSplendid?: number;
  whitePerfect?: number;
  whiteBest?: number;
  whiteExcellent?: number;
  whiteOkay?: number;
  whiteOpening?: number;
  whiteInaccuracy?: number;
  whiteMistakes?: number;
  whiteBlunders?: number;
  blackBrilliant?: number;
  blackSplendid?: number;
  blackPerfect?: number;
  blackBest?: number;
  blackExcellent?: number;
  blackOkay?: number;
  blackOpening?: number;
  blackInaccuracy?: number;
  blackMistakes?: number;
  blackBlunders?: number;
}

export interface Player {
  name: string;
  rating?: number;
  avatarUrl?: string;
  title?: string;
}

export interface LoadedGame {
  id: string;
  pgn: string;
  date?: string;
  white: Player;
  black: Player;
  result?: string;
  timeControl?: string;
  movesNb?: number;
  url?: string;
}
