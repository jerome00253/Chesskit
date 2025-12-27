export interface AnalysisSettings {
  engineName: string;        // "stockfish_17_lite"
  depth: number;             // 1-20
  multiPv: number;           // 1-5 (nombre de variantes)
  showBestMove: boolean;     // Afficher flèche meilleur coup
  showPlayerMove: boolean;   // Afficher icône coup joué
  boardHue: number;          // 0-360 (teinte HSL)
  pieceSet: string;          // "cburnett", "merida", etc.
  threads: number;           // 1-12
}

export const DEFAULT_ANALYSIS_SETTINGS: AnalysisSettings = {
  engineName: "stockfish_17_lite",
  depth: 5,
  multiPv: 3,
  showBestMove: true,
  showPlayerMove: true,
  boardHue: 0,
  pieceSet: "cburnett",
  threads: 6,
};

// Available Stockfish engines
export const AVAILABLE_ENGINES = [
  { value: "stockfish_17", label: "Stockfish 17" },
  { value: "stockfish_17_lite", label: "Stockfish 17 Lite" },
  { value: "stockfish_16_1", label: "Stockfish 16.1" },
  { value: "stockfish_16_1_lite", label: "Stockfish 16.1 Lite" },
  { value: "stockfish_16_nnue", label: "Stockfish 16 NNUE" },
  { value: "stockfish_16", label: "Stockfish 16" },
  { value: "stockfish_11", label: "Stockfish 11" },
];

// Available piece sets
export const AVAILABLE_PIECE_SETS = [
  { value: "cburnett", label: "Classic (CBurnett)" },
  { value: "merida", label: "Merida" },
  { value: "alpha", label: "Alpha" },
  { value: "anarcandy", label: "Anarcandy" },
  { value: "caliente", label: "Caliente" },
  { value: "california", label: "California" },
  { value: "cardinal", label: "Cardinal" },
  { value: "celtic", label: "Celtic" },
  { value: "chess7", label: "Chess7" },
  { value: "chessnut", label: "Chessnut" },
  { value: "chicago", label: "Chicago" },
  { value: "companion", label: "Companion" },
  { value: "cooke", label: "Cooke" },
  { value: "dubrovny", label: "Dubrovny" },
  { value: "fantasy", label: "Fantasy" },
  { value: "firi", label: "Firi" },
  { value: "fresca", label: "Fresca" },
  { value: "gioco", label: "Gioco" },
  { value: "governor", label: "Governor" },
  { value: "horsey", label: "Horsey" },
  { value: "icpieces", label: "IC Pieces" },
  { value: "iowa", label: "Iowa" },
  { value: "kiwen-suwi", label: "Kiwen Suwi" },
  { value: "kosal", label: "Kosal" },
  { value: "leipzig", label: "Leipzig" },
  { value: "letter", label: "Letter" },
  { value: "maestro", label: "Maestro" },
  { value: "monarchy", label: "Monarchy" },
  { value: "mpchess", label: "MP Chess" },
  { value: "oslo", label: "Oslo" },
  { value: "pirouetti", label: "Pirouetti" },
  { value: "pixel", label: "Pixel" },
  { value: "reillycraig", label: "Reilly Craig" },
  { value: "rhosgfx", label: "Rhos GFX" },
  { value: "riohacha", label: "Riohacha" },
  { value: "shapes", label: "Shapes" },
  { value: "spatial", label: "Spatial" },
  { value: "staunty", label: "Staunty" },
  { value: "symmetric", label: "Symmetric" },
  { value: "tatiana", label: "Tatiana" },
  { value: "xkcd", label: "XKCD" },
];
