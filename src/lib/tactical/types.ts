export type TacticalTheme =
  | "Fork"
  | "Pin"
  | "Skewer"
  | "DiscoveredAttack"
  | "DiscoveredCheck"
  | "DoubleCheck"
  | "BackRankMate"
  | "HangingPiece"
  | "Deflection"
  | "Decoy"
  | "XRay"
  | "Overloaded"
  | "Promotion"
  | "Zugzwang"
  | "Checkmate"
  | "Check"
  | "Stalemate"
  | "Capture"
  | "MaterialLoss"
  | "Blunder"
  | "Brilliant";

export interface TacticalPattern {
  theme: TacticalTheme;
  squares: string[]; // Key squares involved (e.g., pinned piece, pinning piece, king)
  description?: string; // Optional specific description
}

export interface TacticalAnalysisResult {
  isTactical: boolean;
  themes: TacticalTheme[];
  patterns: TacticalPattern[];
  description: string;
  descriptionEn?: string;
  descriptionFr?: string;
}
